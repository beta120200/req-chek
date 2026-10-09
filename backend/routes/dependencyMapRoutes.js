import express from 'express';
import { loadContext } from '../lib/catalog.js';
import { evaluateService } from '../lib/readiness.js';

const router = express.Router();

// GET /api/dependency-map
// Returns { nodes, options }. Node keys are namespaced ("option:<id>", "doc:<id>")
// because option ids and document ids can be equal (e.g. "psa", "national-id").
router.get('/', async (req, res) => {
  try {
    const ctx = await loadContext(req);
    const service = ctx.activeService;
    if (!service) {
      return res.status(404).json({ error: 'You have not added a service yet', code: 'no_service' });
    }

    const nodes = {
      root: {
        title: service.name,
        subtitle: service.office,
        status: 'neutral',
        body: service.description || 'No description available.',
      },
    };

    const requirement = service.requirement;
    if (!requirement) {
      nodes.requirement = {
        title: 'No requirement defined',
        subtitle: 'Not yet satisfied',
        status: 'missing',
        body: 'This service does not have a defined requirement.',
      };
      return res.json({ nodes, options: [] });
    }

    const evaluation = evaluateService(service, ctx.documents, ctx.libraryMap);

    nodes.requirement = {
      title: requirement.name,
      subtitle: evaluation.satisfied ? 'Satisfied' : 'Not yet satisfied',
      status: evaluation.satisfied ? 'satisfied' : 'missing',
      body: requirement.why || 'No description available.',
    };

    const options = [];
    for (const option of requirement.options) {
      const path = evaluation.paths.find((p) => p.option.id === option.id);
      const optionKey = `option:${option.id}`;
      const isBest = evaluation.bestPath?.option.id === option.id;

      nodes[optionKey] = {
        title: option.name,
        subtitle: path?.satisfied
          ? 'You have this'
          : option.dependsOn ? 'Needs a prerequisite first' : 'No prerequisite needed',
        status: evaluation.satisfied
          ? 'not-needed'
          : path?.satisfied ? 'satisfied' : isBest ? 'warning' : 'missing',
        body: `${option.note || ''} Source: ${ctx.libraryMap[option.docId]?.source || 'Unknown'}.`.trim(),
      };

      let prerequisiteKey = null;
      if (option.dependsOn) {
        prerequisiteKey = `doc:${option.dependsOn}`;
        const docType = ctx.libraryMap[option.dependsOn] ?? { name: 'Unknown', source: 'Unknown' };
        const held = !!ctx.documents[option.dependsOn]?.held;
        // The same prerequisite can serve several options; the first one names it.
        if (!nodes[prerequisiteKey]) {
          nodes[prerequisiteKey] = {
            title: docType.name,
            subtitle: held ? 'You have this' : `Prerequisite for ${option.name}`,
            status: evaluation.satisfied ? 'not-needed' : held ? 'satisfied' : 'missing',
            body: `Required before you can apply for ${option.name}. Source: ${docType.source}.`,
          };
        }
      }
      options.push({ key: optionKey, prerequisiteKey });
    }

    res.json({ nodes, options });
  } catch (err) {
    console.error('Error in dependency map route:', err);
    res.status(500).json({ error: 'Failed to load dependency map' });
  }
});

export default router;
