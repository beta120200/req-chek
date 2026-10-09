import express from 'express';
import { loadContext } from '../lib/catalog.js';
import { evaluateService } from '../lib/readiness.js';

const router = express.Router();

// GET /api/preparation - ordered steps toward the recommended path of the active service
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const service = ctx.activeService;
    if (!service) {
      return res.status(404).json({ error: 'You have not added a service yet', code: 'no_service' });
    }

    const { satisfied, bestPath } = evaluateService(service, ctx.documents, ctx.libraryMap);
    if (!bestPath) return res.json([]);

    const steps = bestPath.steps.map((step, i) => ({
      id: step.docId,
      title: step.held
        ? `${step.name} on hand`
        : step.role === 'prerequisite'
          ? `Obtain ${step.name}`
          : `Apply for ${step.name}`,
      detail: step.held
        ? step.status === 'expiring'
          ? 'On hand, but expiring soon — consider renewing.'
          : 'Already recorded in your document inventory.'
        : ctx.libraryMap[step.docId]?.source
          ? `Source: ${ctx.libraryMap[step.docId].source}`
          : '',
      done: step.held,
      warning: step.status === 'expiring',
      order: i + 1,
    }));

    steps.push({
      id: 'apply',
      title: `Apply for ${service.name} at ${service.office}`,
      detail: satisfied
        ? 'Your requirement is satisfied — you can go in now.'
        : 'Available once your requirement is satisfied.',
      done: false,
      warning: false,
      order: steps.length + 1,
    });

    res.json(steps);
  } catch (err) {
    console.error('Error in preparation route:', err);
    res.status(500).json({ error: 'Failed to load preparation route' });
  }
});

export default router;
