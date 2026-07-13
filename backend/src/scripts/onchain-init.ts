/**
 * One-time on-chain bootstrap: initialize the registry and register the seed
 * civic projects with their official claims. Run AFTER `anchor deploy`.
 *
 *   CIVIC_PROGRAM_ID=<deployed id> \
 *   CIVIC_RELAYER_KEY=~/.config/solana/id.json \
 *   SOLANA_RPC_URL=https://api.devnet.solana.com \
 *   npx tsx src/scripts/onchain-init.ts
 */
import { readFileSync } from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { CivicRecordClient } from '../onchain/civic-client.js';
import { CIVIC_PROJECTS } from '../data/civic-projects.seed.js';

function loadKeypair(path: string): Keypair {
  const raw = JSON.parse(readFileSync(path.replace(/^~/, process.env.HOME ?? ''), 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

const programId = process.env.CIVIC_PROGRAM_ID;
const keyPath = process.env.CIVIC_RELAYER_KEY ?? '~/.config/solana/id.json';
const rpc = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';

if (!programId) {
  console.error('Set CIVIC_PROGRAM_ID to the deployed program id.');
  process.exit(1);
}

const connection = new Connection(rpc, 'confirmed');
const payer = loadKeypair(keyPath);
const client = new CivicRecordClient(connection, payer, new PublicKey(programId));

console.log(`registry: ${client.registryPda().toBase58()}`);

try {
  const sig = await client.initialize();
  console.log(`✓ registry initialized (${sig})`);
} catch (err) {
  console.log(`• registry init skipped (${(err as Error).message.slice(0, 80)})`);
}

for (const p of CIVIC_PROJECTS) {
  try {
    const sig = await client.registerProject(p.id, p.name, p.category, p.officialClaim);
    console.log(`✓ registered #${p.id} ${p.name} (${sig})`);
  } catch (err) {
    console.log(`• #${p.id} ${p.name} skipped (${(err as Error).message.slice(0, 80)})`);
  }
}

console.log('done.');
process.exit(0);
