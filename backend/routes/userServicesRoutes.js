import express from 'express';
import { supabase } from '../config/supabase.js';
import { fetchUserServices, resolveActiveServiceId, setActiveService } from '../lib/catalog.js';
import { logActivity } from '../lib/activity.js';

const router = express.Router();

// PUT /api/user-services/:serviceId/active - switch the active service
router.put('/:serviceId/active', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const userServices = await fetchUserServices(req.user.id);
    if (!userServices.some((us) => us.service_id === serviceId)) {
      return res.status(404).json({ error: 'You are not tracking that service' });
    }
    await setActiveService(req.user.id, serviceId);
    res.json({ success: true, activeServiceId: serviceId });
  } catch (err) {
    console.error('Error switching active service:', err);
    res.status(500).json({ error: 'Failed to switch service' });
  }
});

// DELETE /api/user-services/:serviceId - stop tracking a service
router.delete('/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { error } = await supabase
      .from('user_services')
      .delete()
      .eq('user_id', req.user.id)
      .eq('service_id', serviceId);
    if (error) {
      console.error('Error removing service:', error);
      return res.status(500).json({ error: 'Failed to remove service' });
    }

    // If the active one was removed, promote the newest remaining service.
    const remaining = await fetchUserServices(req.user.id);
    const nextActive = resolveActiveServiceId(remaining);
    if (nextActive && !remaining.some((us) => us.is_active)) await setActiveService(req.user.id, nextActive);

    await logActivity(req.user.id, 'A service was removed from your dashboard');
    res.json({ success: true, activeServiceId: nextActive });
  } catch (err) {
    console.error('Error removing service:', err);
    res.status(500).json({ error: 'Failed to remove service' });
  }
});

export default router;
