import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as anchor from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';
import type { CivicCategory } from '../types/civic.js';

/**
 * Backend client for the `civic_record` Anchor program. Anchors civic opinions
 * on-chain: registers tracked projects, updates official claims, and submits
 * sybil-resistant citizen opinions keyed by a zk `nullifier`.
 *
 * The IDL is produced by `anchor build` at program/target/idl/civic_record.json.
 * Until the program is built+deployed this client throws a clear error, so the
 * agent can run off-chain (milestone 1) without it.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const IDL_PATH = resolve(__dirname, '../../../program/target/idl/civic_record.json');

function loadIdl(): anchor.Idl {
  try {
    return JSON.parse(readFileSync(IDL_PATH, 'utf8')) as anchor.Idl;
  } catch {
    throw new Error(
      `civic_record IDL not found at ${IDL_PATH}. Run \`cd program && anchor build\` first.`,
    );
  }
}

function u32le(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0, 0);
  return b;
}

export interface OpinionInput {
  projectId: number;
  /** 32-byte unlinkable identity tag from the zk verifier (milestone 3). */
  nullifier: Uint8Array;
  /** -100..100 */
  sentiment: number;
  /** 0..100 */
  confidence: number;
  /** 32-byte hash of the off-chain justification (IPFS/Arweave cid), or zeros. */
  noteHash?: Uint8Array;
}

export class CivicRecordClient {
  readonly program: anchor.Program;
  readonly programId: PublicKey;
  readonly connection: Connection;
  private readonly payer: Keypair;

  constructor(connection: Connection, payer: Keypair, programId: PublicKey) {
    this.connection = connection;
    this.payer = payer;
    this.programId = programId;
    const wallet = new anchor.Wallet(payer);
    const provider = new anchor.AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });
    const idl = loadIdl();
    // anchor >=0.30 reads the address from the IDL metadata; programId is passed
    // for clarity and PDA derivation.
    this.program = new anchor.Program(idl, provider);
  }

  // ── PDAs ──────────────────────────────────────────────────────────────────
  registryPda(): PublicKey {
    return PublicKey.findProgramAddressSync([Buffer.from('registry')], this.programId)[0];
  }
  projectPda(projectId: number): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('project'), u32le(projectId)],
      this.programId,
    )[0];
  }
  voicePda(projectId: number, nullifier: Uint8Array): PublicKey {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('voice'), u32le(projectId), Buffer.from(nullifier)],
      this.programId,
    )[0];
  }

  // ── Instructions ────────────────────────────────────────────────────────────
  async initialize(): Promise<string> {
    return this.program.methods
      .initialize()
      .accounts({
        registry: this.registryPda(),
        authority: this.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async registerProject(
    projectId: number,
    name: string,
    category: CivicCategory,
    officialClaim: string,
  ): Promise<string> {
    return this.program.methods
      .registerProject(projectId, name, category, officialClaim)
      .accounts({
        registry: this.registryPda(),
        project: this.projectPda(projectId),
        authority: this.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  async updateClaim(projectId: number, officialClaim: string): Promise<string> {
    return this.program.methods
      .updateClaim(officialClaim)
      .accounts({
        project: this.projectPda(projectId),
        authority: this.payer.publicKey,
      })
      .rpc();
  }

  /**
   * Submit one civic opinion. Re-using a nullifier on the same project throws
   * (the CitizenVoice PDA already exists) — this IS the anti-sybil guarantee.
   */
  async submitOpinion(input: OpinionInput): Promise<string> {
    const nullifier = Array.from(input.nullifier);
    const noteHash = Array.from(input.noteHash ?? new Uint8Array(32));
    if (nullifier.length !== 32) throw new Error('nullifier must be 32 bytes');
    if (noteHash.length !== 32) throw new Error('noteHash must be 32 bytes');

    return this.program.methods
      .submitOpinion(nullifier, input.sentiment, input.confidence, noteHash)
      .accounts({
        project: this.projectPda(input.projectId),
        voice: this.voicePda(input.projectId, input.nullifier),
        payer: this.payer.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  /** Read a project's on-chain aggregate (opinion_count, net_sentiment, claim). */
  async fetchProject(projectId: number): Promise<any> {
    return (this.program.account as any).project.fetch(this.projectPda(projectId));
  }
}
