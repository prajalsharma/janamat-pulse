import { Router } from 'express';
import { civicAgent } from '../agent/civic-agent.js';
import { civicOpinionService } from '../services/civic-opinion.js';
import { CIVIC_PROJECTS } from '../data/civic-projects.seed.js';
import { topHeadlinesByProject } from '../services/news.js';
import { config } from '../config/index.js';

/**
 * Janamat Pulse civic API. Read the live pulse, the tracked projects, force a
 * cycle, and submit a zk-verified citizen opinion.
 */
export const civicApi = Router();

civicApi.get('/civic/health', (_req, res) => {
  res.json({ ok: true, onChain: config.onchain.enabled, engine: civicAgent.engine });
});

civicApi.get('/civic/projects', (_req, res) => {
  res.json(
    CIVIC_PROJECTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      region: p.region,
      officialClaim: p.officialClaim,
    })),
  );
});

/** Latest civic pulse snapshot (sentiment + accountability flags + headlines). */
civicApi.get('/civic/pulse', (_req, res) => {
  res.json(civicAgent.latest ?? { at: null, items: [], flags: [], projects: [], headlines: [] });
});

/**
 * Top 3–4 recent, real headlines per tracked project (newest first, deduped,
 * within the recency window). Computed fresh from stored news, so it works even
 * before the first agent tick has produced a snapshot.
 */
civicApi.get('/civic/headlines', (_req, res) => {
  res.json({ at: Date.now(), headlines: topHeadlinesByProject() });
});

/** Force one civic cycle (manual trigger). */
civicApi.post('/civic/tick', async (_req, res, next) => {
  try {
    res.json(await civicAgent.runOnce());
  } catch (err) {
    next(err);
  }
});

/**
 * Submit a zk-verified citizen opinion. Body:
 *   { projectId, sentiment, confidence, proof: { scheme, payload, scope }, noteHashHex? }
 * Returns the derived nullifier and (if a program is configured) the on-chain tx.
 */
civicApi.post('/civic/opinion', async (req, res, next) => {
  try {
    const { projectId, sentiment, confidence, proof, noteHashHex } = req.body ?? {};
    if (typeof projectId !== 'number' || !proof) {
      res.status(400).json({ error: 'projectId (number) and proof are required' });
      return;
    }
    const result = await civicOpinionService.submit({
      projectId,
      sentiment,
      confidence,
      proof,
      noteHashHex,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
