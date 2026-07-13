/**
 * Smoke test: run ONE civic cycle end-to-end (news → civic sentiment →
 * accountability flags) and print the snapshot. Uses the heuristic scorer when
 * no ANTHROPIC_API_KEY is set, so it runs keyless. Live Nepali feeds are tried;
 * on failure it falls back to simulated civic headlines.
 */
import { civicAgent } from '../agent/civic-agent.js';

const snap = await civicAgent.runOnce();

console.log('\n=== CIVIC PULSE SNAPSHOT ===');
console.log(`engine: ${snap.engine}  |  usingSimulated: ${snap.usingSimulated}  |  scored items: ${snap.items.length}`);

console.log('\n--- scored discourse (attributed) ---');
for (const it of snap.items) {
  console.log(
    `  project#${it.projectId} [${it.stance}] sentiment=${it.sentiment} conf=${it.confidence} :: ${it.rationale}`,
  );
}

console.log('\n--- accountability flags ---');
for (const f of snap.flags) {
  const proj = snap.projects.find((p) => p.id === f.projectId);
  console.log(`  ${f.flagged ? '🚩' : '  '} ${proj?.name}`);
  console.log(`     publicSentiment=${f.publicSentiment} gap=${f.gap} sample=${f.sampleSize}`);
  console.log(`     ${f.summary}`);
}

console.log('\n=== OK ===');
process.exit(0);
