import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { assert } from 'chai';
import { randomBytes } from 'crypto';

/**
 * civic_record program tests. Proves:
 *  - registry init
 *  - project registration with an official claim
 *  - opinion submission updates aggregates + records a CitizenVoice
 *  - the SAME nullifier cannot vote twice on a project (sybil resistance)
 */
describe('civic_record', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.civicRecord as Program;
  const authority = provider.wallet.publicKey;

  const PROJECT_ID = 1;
  const u32le = (n: number) => {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n >>> 0, 0);
    return b;
  };
  const registryPda = () =>
    PublicKey.findProgramAddressSync([Buffer.from('registry')], program.programId)[0];
  const projectPda = (id: number) =>
    PublicKey.findProgramAddressSync([Buffer.from('project'), u32le(id)], program.programId)[0];
  const voicePda = (id: number, nul: Buffer) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from('voice'), u32le(id), nul],
      program.programId,
    )[0];

  it('initializes the registry', async () => {
    await program.methods
      .initialize()
      .accounts({ registry: registryPda(), authority, systemProgram: SystemProgram.programId })
      .rpc();
    const reg: any = await (program.account as any).registry.fetch(registryPda());
    assert.equal(reg.projectCount, 0);
  });

  it('registers a tracked project', async () => {
    await program.methods
      .registerProject(PROJECT_ID, 'Melamchi Water Supply Project', 1, 'Water is being delivered on schedule.')
      .accounts({
        registry: registryPda(),
        project: projectPda(PROJECT_ID),
        authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const p: any = await (program.account as any).project.fetch(projectPda(PROJECT_ID));
    assert.equal(p.id, PROJECT_ID);
    assert.equal(p.opinionCount.toNumber(), 0);
    assert.equal(p.name, 'Melamchi Water Supply Project');
  });

  it('records a civic opinion and updates aggregates', async () => {
    const nullifier = randomBytes(32);
    await program.methods
      .submitOpinion([...nullifier], -67, 50, [...Buffer.alloc(32)])
      .accounts({
        project: projectPda(PROJECT_ID),
        voice: voicePda(PROJECT_ID, nullifier),
        payer: authority,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const p: any = await (program.account as any).project.fetch(projectPda(PROJECT_ID));
    assert.equal(p.opinionCount.toNumber(), 1);
    assert.equal(p.netSentiment.toNumber(), -67);
  });

  it('rejects the same nullifier voting twice (sybil resistance)', async () => {
    const nullifier = randomBytes(32);
    const submit = () =>
      program.methods
        .submitOpinion([...nullifier], -40, 80, [...Buffer.alloc(32)])
        .accounts({
          project: projectPda(PROJECT_ID),
          voice: voicePda(PROJECT_ID, nullifier),
          payer: authority,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

    await submit(); // first vote ok
    let threw = false;
    try {
      await submit(); // same nullifier again → PDA already exists
    } catch {
      threw = true;
    }
    assert.isTrue(threw, 'expected duplicate nullifier to be rejected');
  });
});
