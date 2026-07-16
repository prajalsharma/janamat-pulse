import { readFileSync } from 'node:fs';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { CivicRecordClient } from '../onchain/civic-client.js';
import { buildIdentityVerifier, type IdentityProof } from '../zk/verifier.js';
import { CIVIC_PROJECTS } from '../data/civic-projects.seed.js';

/**
 * Submitting a citizen opinion, end to end:
 *   zk proof → verify (off-chain) → derive nullifier → anchor on-chain.
 *
 * When no program is configured (CIVIC_PROGRAM_ID unset) it runs in "dry" mode:
 * it still verifies the proof and derives the real nullifier, it just does not
 * broadcast — so the flow is exercisable before deploy.
 */

export interface OpinionRequest {
  projectId: number;
  proof: IdentityProof;
  /** -100..100 */
  sentiment: number;
  /** 0..100 */
  confidence: number;
  /** 32-byte hex of an off-chain justification hash (optional) */
  noteHashHex?: string;
}

export interface OpinionResult {
  ok: true;
  projectId: number;
  /** hex of the derived nullifier (safe to expose; unlinkable) */
  nullifier: string;
  onChain: boolean;
  signature: string | null;
  voicePda: string | null;
}

function toHex(b: Uint8Array): string {
  return Buffer.from(b).toString('hex');
}

function hexToBytes(hex: string, len: number): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(len);
  const buf = Buffer.from(clean, 'hex');
  out.set(buf.subarray(0, len));
  return out;
}

function loadRelayer(): Keypair {
  const val = config.onchain.relayerKey.trim();
  // Accept the key inline as a secret-key JSON array (set as an env var on a
  // host that has no keypair file), e.g. CIVIC_RELAYER_KEY=[12,34,...].
  // Otherwise treat it as a file path (local dev, e.g. ~/.config/solana/id.json).
  const raw: number[] = val.startsWith('[')
    ? JSON.parse(val)
    : JSON.parse(readFileSync(val.replace(/^~/, process.env.HOME ?? ''), 'utf8'));
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export class CivicOpinionService {
  private readonly verifier = buildIdentityVerifier();
  private client: CivicRecordClient | null = null;

  private onchainClient(): CivicRecordClient | null {
    if (!config.onchain.enabled) return null;
    if (this.client) return this.client;
    const connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.client = new CivicRecordClient(
      connection,
      loadRelayer(),
      new PublicKey(config.onchain.programId),
    );
    return this.client;
  }

  async submit(req: OpinionRequest): Promise<OpinionResult> {
    if (!CIVIC_PROJECTS.some((p) => p.id === req.projectId)) {
      throw new Error(`unknown projectId ${req.projectId}`);
    }
    if (!Number.isInteger(req.sentiment) || req.sentiment < -100 || req.sentiment > 100) {
      throw new Error('sentiment must be an integer in -100..100');
    }
    if (!Number.isInteger(req.confidence) || req.confidence < 0 || req.confidence > 100) {
      throw new Error('confidence must be an integer in 0..100');
    }

    // 1. Verify the zk identity proof and derive the per-project nullifier.
    const { nullifier } = await this.verifier.verifyForProject(req.proof, req.projectId);
    const noteHash = req.noteHashHex ? hexToBytes(req.noteHashHex, 32) : new Uint8Array(32);

    // 2. Anchor on-chain if configured.
    const client = this.onchainClient();
    if (!client) {
      logger.info({ projectId: req.projectId }, 'opinion verified (dry: no program configured)');
      return {
        ok: true,
        projectId: req.projectId,
        nullifier: toHex(nullifier),
        onChain: false,
        signature: null,
        voicePda: null,
      };
    }

    const signature = await client.submitOpinion({
      projectId: req.projectId,
      nullifier,
      sentiment: req.sentiment,
      confidence: req.confidence,
      noteHash,
    });
    const voicePda = client.voicePda(req.projectId, nullifier).toBase58();
    logger.info({ projectId: req.projectId, signature }, 'opinion anchored on-chain');

    return {
      ok: true,
      projectId: req.projectId,
      nullifier: toHex(nullifier),
      onChain: true,
      signature,
      voicePda,
    };
  }
}

export const civicOpinionService = new CivicOpinionService();
