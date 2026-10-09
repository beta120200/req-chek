import express from 'express';
import { loadContext } from '../lib/catalog.js';
import { documentStatus, evaluateService } from '../lib/readiness.js';

const router = express.Router();

const DOC_STATUS_TO_PILL = { valid: 'satisfied', expiring: 'warning', expired: 'missing', 'not-held': 'missing' };
const docNote = (doc) => (doc.expirable ? 'This document type can expire.' : 'This document type does not expire.');

// GET /api/requirements-directory - the active service's requirement + documents (all documents if none yet)
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const service = ctx.activeService;
    const entries = [];

    if (service?.requirement) {
      const requirement = service.requirement;
      const evaluation = evaluateService(service, ctx.documents, ctx.libraryMap);
      entries.push({
        kind: 'requirement',
        name: requirement.name,
        source: requirement.source,
        lastVerified: requirement.lastVerified,
        note: requirement.why,
        status: evaluation.satisfied ? 'satisfied' : 'missing',
      });

      const docIds = new Set();
      for (const o of requirement.options) {
        docIds.add(o.docId);
        if (o.dependsOn) docIds.add(o.dependsOn);
      }
      for (const docId of docIds) {
        const doc = ctx.libraryMap[docId];
        if (!doc) continue;
        entries.push({
          kind: 'document', docId, name: doc.name, source: doc.source, lastVerified: requirement.lastVerified,
          note: docNote(doc), status: DOC_STATUS_TO_PILL[documentStatus(ctx.documents, docId)],
        });
      }
      return res.json(entries);
    }

    for (const doc of ctx.library) {
      entries.push({
        kind: 'document', docId: doc.id, name: doc.name, source: doc.source, lastVerified: null,
        note: docNote(doc), status: DOC_STATUS_TO_PILL[documentStatus(ctx.documents, doc.id)],
      });
    }
    res.json(entries);
  } catch (err) {
    console.error('Error in requirements directory route:', err);
    res.status(500).json({ error: 'Failed to load requirements directory' });
  }
});

export default router;