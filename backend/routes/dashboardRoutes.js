import express from 'express';
import { loadContext, withReadiness } from '../lib/catalog.js';
import { evaluateService, serializePath } from '../lib/readiness.js';
import { fetchActivity } from '../lib/activity.js';

const router = express.Router();

// GET /api/dashboard - works for members (database) and guests (X-Guest-Context)
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const selectedServices = ctx.selectedServices.map((s) => withReadiness(s, ctx.documents, ctx.libraryMap));

    let active = null;
    if (ctx.activeService) {
      const evaluation = evaluateService(ctx.activeService, ctx.documents, ctx.libraryMap);
      active = {
        service: ctx.activeService,
        readiness: { satisfied: evaluation.satisfied, percent: evaluation.percent, word: evaluation.word },
        paths: evaluation.paths.map(serializePath),
      };
    }

    res.json({
      services: ctx.catalog,
      selectedServices,
      activeServiceId: ctx.activeServiceId,
      active,
      stats: { documentsHeld: Object.values(ctx.documents).filter((d) => d.held).length },
      activity: req.user ? await fetchActivity(req.user.id) : ctx.activity,
    });
  } catch (err) {
    console.error('Error in dashboard route:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default router;