import express from 'express';
import { loadContext, withReadiness } from '../lib/catalog.js';

const router = express.Router();

// GET /api/check-readiness - the user's tracked services, each with a readiness summary
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req); 
    res.json({
      activeServiceId: ctx.activeServiceId,
      selectedServices: ctx.selectedServices.map((s) => withReadiness(s, ctx.documents, ctx.libraryMap)),
    });
  } catch (err) {
    console.error('Error in check-readiness route:', err);
    res.status(500).json({ error: 'Failed to load readiness data' });
  }
});

export default router;
