import { supabase } from '../config/supabase.js';
import { evaluateService } from './readiness.js';
import { isISODate } from './dates.js';

function unwrap({ data, error }, what) {
  if (error) {
    const err = new Error(`Failed to load ${what}: ${error.message}`);
    err.cause = error;
    throw err;
  }
  return data;
}

/** @returns {Promise<Array<{id:string,name:string,source:string,expirable:boolean}>>} */
export async function fetchLibrary() {
  const rows = unwrap(
    await supabase.from('document_library').select('id, name, source, expirable').order('name'),
    'document library',
  );
  return rows;
}

/**
 * All services, each with its (first) requirement and that requirement's options.
 * The schema allows several requirements per service; the app models one, so the
 * oldest one wins.
 */
export async function fetchCatalog() {
  const [services, requirements, options] = await Promise.all([
    supabase.from('services').select('id, name, tagline, description, office').order('name'),
    supabase
      .from('service_requirements')
      .select('id, service_id, name, source, last_verified, why, requirement_type, min_count, created_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('requirement_options')
      .select('id, requirement_id, doc_id, name, depends_on_doc_id, note, created_at')
      .order('created_at', { ascending: true }),
  ]);

  const serviceRows = unwrap(services, 'services');
  const requirementRows = unwrap(requirements, 'service requirements');
  const optionRows = unwrap(options, 'requirement options');

  const optionsByRequirement = new Map();
  for (const o of optionRows) {
    if (!optionsByRequirement.has(o.requirement_id)) optionsByRequirement.set(o.requirement_id, []);
    optionsByRequirement.get(o.requirement_id).push({
      id: o.id,
      docId: o.doc_id,
      name: o.name,
      dependsOn: o.depends_on_doc_id || null,
      note: o.note || '',
    });
  }

  // Requirements belong to a service through service_id (NOT through their own id).
  const requirementByService = new Map();
  for (const r of requirementRows) {
    if (requirementByService.has(r.service_id)) continue;
    requirementByService.set(r.service_id, {
      id: r.id,
      name: r.name,
      source: r.source,
      lastVerified: r.last_verified,
      why: r.why,
      type: r.requirement_type,
      minCount: r.min_count ?? 1,
      options: optionsByRequirement.get(r.id) || [],
    });
  }

  return serviceRows.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline || '',
    description: s.description || '',
    office: s.office || '',
    requirement: requirementByService.get(s.id) || null,
  }));
}

/** @returns {Promise<Record<string, {held:boolean,issueDate:string|null,expiryDate:string|null,notes:string}>>} */
export async function fetchUserDocuments(userId) {
  const rows = unwrap(
    await supabase
      .from('user_documents')
      .select('document_id, held, issue_date, expiry_date, notes')
      .eq('user_id', userId),
    'your documents',
  );
  const documents = {};
  for (const d of rows) {
    documents[d.document_id] = {
      held: d.held,
      issueDate: d.issue_date,
      expiryDate: d.expiry_date,
      notes: d.notes || '',
    };
  }
  return documents;
}

/** User's tracked services, oldest first. */
export async function fetchUserServices(userId) {
  return unwrap(
    await supabase
      .from('user_services')
      .select('service_id, is_active, added_at')
      .eq('user_id', userId)
      .order('added_at', { ascending: true }),
    'your services',
  );
}

/** The active service id: the newest row flagged active, else the newest row, else null. */
export function resolveActiveServiceId(userServices) {
  if (userServices.length === 0) return null;
  const active = [...userServices].reverse().find((s) => s.is_active);
  return (active || userServices[userServices.length - 1]).service_id;
}

/** Makes `serviceId` the user's only active service, adding it to their list if needed. */
export async function setActiveService(userId, serviceId) {
  unwrap(
    await supabase.from('user_services').update({ is_active: false }).eq('user_id', userId),
    'services',
  );
  unwrap(
    await supabase
      .from('user_services')
      .upsert({ user_id: userId, service_id: serviceId, is_active: true }, { onConflict: 'user_id,service_id' }),
    'services',
  );
}

/**
 * Everything most routes need for one signed-in user, loaded in parallel.
 * `activeService` is null until the user has added a service.
 */
export async function loadUserContext(userId) {
  const [library, catalog, documents, userServices] = await Promise.all([
    fetchLibrary(),
    fetchCatalog(),
    fetchUserDocuments(userId),
    fetchUserServices(userId),
  ]);

  const libraryMap = Object.fromEntries(library.map((d) => [d.id, d]));
  const catalogMap = Object.fromEntries(catalog.map((s) => [s.id, s]));
  const selectedServices = userServices.map((us) => catalogMap[us.service_id]).filter(Boolean);
  const activeServiceId = resolveActiveServiceId(userServices);
  const activeService = (activeServiceId && catalogMap[activeServiceId]) || null;

  return { library, libraryMap, catalog, catalogMap, documents, userServices, selectedServices, activeServiceId, activeService };
}

/** A catalog service plus its readiness summary for these documents. */
export function withReadiness(service, documents, libraryMap) {
  const r = evaluateService(service, documents, libraryMap);
  return { ...service, readiness: { satisfied: r.satisfied, percent: r.percent, word: r.word } };
}

/** Signed-in user -> database. Guest -> the data the browser sent in X-Guest-Context. */
export async function loadContext(req) {
  if (req.user) return loadUserContext(req.user.id);
  return loadGuestContext(req.guest);
}

export async function loadGuestContext(guest) {
  const [library, catalog] = await Promise.all([fetchLibrary(), fetchCatalog()]);
  const libraryMap = Object.fromEntries(library.map((d) => [d.id, d]));
  const catalogMap = Object.fromEntries(catalog.map((s) => [s.id, s]));

  // The guest data is untrusted input: keep only known ids and valid dates.
  const documents = {};
  const rawDocs = guest && typeof guest.documents === 'object' && guest.documents ? guest.documents : {};
  for (const [docId, d] of Object.entries(rawDocs)) {
    if (!libraryMap[docId] || !d || typeof d !== 'object') continue;
    documents[docId] = {
      held: d.held === true,
      issueDate: isISODate(d.issueDate) ? d.issueDate : null,
      expiryDate: isISODate(d.expiryDate) ? d.expiryDate : null,
      notes: '',
    };
  }

  const ids = Array.isArray(guest?.services)
    ? guest.services.filter((id, i, a) => typeof id === 'string' && catalogMap[id] && a.indexOf(id) === i)
    : [];
  const userServices = ids.map((id) => ({ service_id: id, is_active: id === guest?.activeServiceId, added_at: null }));
  const selectedServices = ids.map((id) => catalogMap[id]);
  const activeServiceId = resolveActiveServiceId(userServices);
  const activeService = (activeServiceId && catalogMap[activeServiceId]) || null;

  const activity = (Array.isArray(guest?.activity) ? guest.activity : [])
    .filter((a) => a && typeof a.title === 'string')
    .slice(0, 8)
    .map((a, i) => ({
      id: String(a.id ?? i),
      title: a.title.slice(0, 255),
      createdAt: typeof a.createdAt === 'string' ? a.createdAt : null,
    }));

  return { library, libraryMap, catalog, catalogMap, documents, userServices, selectedServices, activeServiceId, activeService, activity };
}
