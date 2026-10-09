import express from 'express';
import { supabase } from '../config/supabase.js';
import { loadContext, setActiveService } from '../lib/catalog.js';
import { logActivity } from '../lib/activity.js';

const router = express.Router();

// GET /api/add-service - services the user has not added yet
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const added = new Set(ctx.userServices.map((us) => us.service_id));
    const services = ctx.catalog
      .filter((s) => !added.has(s.id))
      .map(({ id, name, tagline, description, office }) => ({ id, name, tagline: tagline || description, description, office }));
    res.json({ services });
  } catch (err) {
    console.error('Error in add service GET route:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST /api/add-service  { serviceId } - track a service and make it the active one
router.post('/', async (req, res) => {
  try {
    const { serviceId } = req.body ?? {};
    if (typeof serviceId !== 'string' || !serviceId) {
      return res.status(400).json({ error: 'serviceId is required' });
    }

    const { data: service, error } = await supabase
      .from('services')
      .select('id, name')
      .eq('id', serviceId)
      .maybeSingle();
    if (error) {
      console.error('Error looking up service:', error);
      return res.status(500).json({ error: 'Failed to add service' });
    }
    if (!service) return res.status(404).json({ error: 'Service not found' });

    await setActiveService(req.user.id, serviceId);
    await logActivity(req.user.id, `${service.name} added to your dashboard`);
    res.status(201).json({ success: true, activeServiceId: serviceId });
  } catch (err) {
    console.error('Error in add service POST route:', err);
    res.status(500).json({ error: 'Failed to add service' });
  }
});

export default router;
