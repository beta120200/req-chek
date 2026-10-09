import express from 'express';
import { loadContext } from '../lib/catalog.js';
import { evaluateService, serializePath } from '../lib/readiness.js';

const router = express.Router();

// GET /api/assessment - full breakdown for the user's active service
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const service = ctx.activeService;
    if (!service) {
      return res.status(404).json({ error: 'You have not added a service yet', code: 'no_service' });
    }

    const evaluation = evaluateService(service, ctx.documents, ctx.libraryMap);
    const { requirement, ...serviceInfo } = service;

    res.json({
      service: serviceInfo,
      requirement: requirement
        ? {
            id: requirement.id,
            name: requirement.name,
            source: requirement.source,
            lastVerified: requirement.lastVerified,
            why: requirement.why,
            type: requirement.type,
            minCount: requirement.minCount,
          }
        : null,
      evaluation: {
        satisfied: evaluation.satisfied,
        bestPath: evaluation.bestPath ? serializePath(evaluation.bestPath) : null,
        paths: evaluation.paths.map(serializePath),
      },
      percent: evaluation.percent,
      word: evaluation.word,
    });
  } catch (err) {
    console.error('Error in assessment route:', err);
    res.status(500).json({ error: 'Failed to load assessment' });
  }
});

export default router;
