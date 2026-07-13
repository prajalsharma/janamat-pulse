/**
 * End-to-end: submit a zk-verified civic opinion through the backend
 * (dev proof → nullifier → on-chain), then read the on-chain aggregate back.
 * Requires a running validator with the program deployed + projects registered:
 *   SOLANA_RPC_URL, CIVIC_PROGRAM_ID, CIVIC_RELAYER_KEY set.
 */
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { readFileSync } from 'node:fs';
import { civicOpinionService } from '../services/civic-opinion.js';
import { CivicRecordClient } from '../onchain/civic-client.js';
import { projectScope } from '../zk/verifier.js';

const PROJECT_ID = 2; // Pokhara International Airport

const before = await read();
console.log(`before: opinion_count=${before.opinionCount} net_sentiment=${before.netSentiment}`);

const result = await civicOpinionService.submit({
  projectId: PROJECT_ID,
  sentiment: -55,
  confidence: 70,
  proof: { scheme: 'dev', payload: `citizen-${Date.now()}`, scope: projectScope(PROJECT_ID) },
});
console.log('submit result:', JSON.stringify(result));

const after = await read();
console.log(`after:  opinion_count=${after.opinionCount} net_sentiment=${after.netSentiment}`);

const ok =
  result.onChain &&
  after.opinionCount === before.opinionCount + 1 &&
  after.netSentiment === before.netSentiment - 55;
console.log(`\n=== ${ok ? 'OK — opinion anchored + aggregate updated on-chain' : 'FAIL'} ===`);
process.exit(ok ? 0 : 1);

async function read(): Promise<{ opinionCount: number; netSentiment: number }> {
  const conn = new Connection(process.env.SOLANA_RPC_URL!, 'confirmed');
  const key = JSON.parse(readFileSync(process.env.CIVIC_RELAYER_KEY!.replace(/^~/, process.env.HOME ?? ''), 'utf8'));
  const client = new CivicRecordClient(conn, Keypair.fromSecretKey(Uint8Array.from(key)), new PublicKey(process.env.CIVIC_PROGRAM_ID!));
  const p = await client.fetchProject(PROJECT_ID);
  return { opinionCount: Number(p.opinionCount), netSentiment: Number(p.netSentiment) };
}
