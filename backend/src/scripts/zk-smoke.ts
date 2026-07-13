/**
 * Smoke test for the zk identity → nullifier flow (off-chain, no program needed).
 * Proves:
 *  - a verified identity derives a deterministic per-project nullifier
 *  - the SAME human + SAME project → SAME nullifier (double-vote would collide)
 *  - the SAME human + DIFFERENT project → DIFFERENT nullifier (can vote per project)
 *  - a scope mismatch is rejected
 */
import { buildIdentityVerifier, projectScope } from '../zk/verifier.js';
import { civicOpinionService } from '../services/civic-opinion.js';

const verifier = buildIdentityVerifier();
const human = 'citizen-abc-123'; // stands in for a real zk unique identifier

const a = await verifier.verifyForProject(
  { scheme: 'dev', payload: human, scope: projectScope(1) },
  1,
);
const b = await verifier.verifyForProject(
  { scheme: 'dev', payload: human, scope: projectScope(1) },
  1,
);
const c = await verifier.verifyForProject(
  { scheme: 'dev', payload: human, scope: projectScope(2) },
  2,
);

const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');
console.log('project#1 nullifier (run 1):', hex(a.nullifier));
console.log('project#1 nullifier (run 2):', hex(b.nullifier));
console.log('project#2 nullifier      :', hex(c.nullifier));

const sameProjectStable = hex(a.nullifier) === hex(b.nullifier);
const perProjectDistinct = hex(a.nullifier) !== hex(c.nullifier);
console.log('\nsame human+project → same nullifier :', sameProjectStable);
console.log('same human, diff project → distinct :', perProjectDistinct);

let scopeRejected = false;
try {
  await verifier.verifyForProject({ scheme: 'dev', payload: human, scope: 'wrong' }, 1);
} catch {
  scopeRejected = true;
}
console.log('scope mismatch rejected              :', scopeRejected);

// Full opinion submit (dry mode — no program configured).
const result = await civicOpinionService.submit({
  projectId: 1,
  sentiment: -67,
  confidence: 50,
  proof: { scheme: 'dev', payload: human, scope: projectScope(1) },
});
console.log('\nopinion submit (dry):', JSON.stringify(result));

const ok = sameProjectStable && perProjectDistinct && scopeRejected && result.ok;
console.log(`\n=== ${ok ? 'OK' : 'FAIL'} ===`);
process.exit(ok ? 0 : 1);
