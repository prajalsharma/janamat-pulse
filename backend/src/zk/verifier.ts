import { createHash } from 'node:crypto';

/**
 * ZK identity → nullifier. Janamat Pulse enforces one verified human = one civic
 * voice without learning who the human is. A zk identity proof (zkPassport /
 * Self Protocol) attests "a distinct real person" and yields a stable, private
 * unique identifier. From that we derive a per-scope **nullifier**: an unlinkable
 * 32-byte tag the on-chain program uses to reject double-voting.
 *
 * MVP (this file): the proof is verified OFF-CHAIN by a pluggable adapter, and
 * only the nullifier is written on-chain. See docs — full on-chain proof
 * verification is the documented stretch.
 */

export interface IdentityProof {
  /** which proving system produced this */
  scheme: 'zkpassport' | 'self' | 'dev';
  /** opaque proof payload passed to the adapter's verifier */
  payload: unknown;
  /** the scope the proof was generated against (must match server scope) */
  scope: string;
}

export interface VerifiedIdentity {
  /**
   * Stable, privacy-preserving unique identifier for this human within the
   * proof's scope. NOT a real-world identity — it cannot be reversed to a name
   * or passport number. Same human + same scope → same value.
   */
  uniqueId: string;
  scheme: IdentityProof['scheme'];
  /** optional non-identifying attributes the proof disclosed (e.g. nationality) */
  attributes?: Record<string, string>;
}

/** Adapter contract — one implementation per proving system. */
export interface VerifierAdapter {
  readonly scheme: IdentityProof['scheme'];
  verify(proof: IdentityProof): Promise<VerifiedIdentity>;
}

/**
 * Derive the on-chain nullifier: sha256(scheme || uniqueId || scope) truncated
 * to 32 bytes. Scoping by project means a citizen may weigh in once PER project.
 * Deterministic, unlinkable across scopes, and never reveals the identity.
 */
export function deriveNullifier(identity: VerifiedIdentity, scope: string): Uint8Array {
  const h = createHash('sha256');
  h.update(identity.scheme);
  h.update('\0');
  h.update(identity.uniqueId);
  h.update('\0');
  h.update(scope);
  return new Uint8Array(h.digest()); // 32 bytes
}

/** Per-project scope string used both client- and server-side. */
export function projectScope(projectId: number): string {
  return `janamat-pulse:project:${projectId}`;
}

/**
 * Self Protocol adapter (passport/national-ID zk proofs). The real verification
 * calls the Self verifier SDK server-side and reads the disclosed nullifier /
 * unique identifier. Wired against a live Self app + scope; kept as a clearly
 * marked integration point because it requires the SDK + a real proof session.
 */
export class SelfVerifier implements VerifierAdapter {
  readonly scheme = 'self' as const;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly opts: { scope: string; endpoint?: string }) {}

  async verify(_proof: IdentityProof): Promise<VerifiedIdentity> {
    // INTEGRATION POINT (milestone 3, live):
    //   import { SelfBackendVerifier } from '@selfxyz/core';
    //   const res = await verifier.verify(_proof.payload);
    //   if (!res.isValid) throw new Error('invalid Self proof');
    //   return { uniqueId: res.nullifier ?? res.userIdentifier, scheme: 'self',
    //            attributes: { nationality: res.nationality } };
    throw new Error(
      'SelfVerifier not yet wired to @selfxyz/core — use DevVerifier locally, see docs/ZK.md',
    );
  }
}

/**
 * zkPassport adapter (NFC e-passport zk proofs). Same shape; real verification
 * validates the zkPassport proof server-side and reads its unique-identifier
 * output. Integration point marked for the live SDK.
 */
export class ZkPassportVerifier implements VerifierAdapter {
  readonly scheme = 'zkpassport' as const;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly opts: { scope: string }) {}

  async verify(_proof: IdentityProof): Promise<VerifiedIdentity> {
    // INTEGRATION POINT (milestone 3, live):
    //   import { ZKPassport } from '@zkpassport/sdk';
    //   const { verified, uniqueIdentifier } = await zkp.verify(_proof.payload);
    //   if (!verified) throw new Error('invalid zkPassport proof');
    //   return { uniqueId: uniqueIdentifier, scheme: 'zkpassport' };
    throw new Error(
      'ZkPassportVerifier not yet wired to @zkpassport/sdk — use DevVerifier locally, see docs/ZK.md',
    );
  }
}

/**
 * Development verifier — NOT for production. Treats the payload as a caller-
 * supplied unique identifier so the full nullifier → on-chain → sybil-rejection
 * flow can be exercised end-to-end without a live passport scan. The real
 * adapters above replace this in production; the nullifier math is identical, so
 * swapping them changes only WHERE uniqueId comes from, not the security model.
 */
export class DevVerifier implements VerifierAdapter {
  readonly scheme = 'dev' as const;

  async verify(proof: IdentityProof): Promise<VerifiedIdentity> {
    const uniqueId =
      typeof proof.payload === 'string' && proof.payload.length > 0
        ? proof.payload
        : (proof.payload as { uniqueId?: string })?.uniqueId;
    if (!uniqueId) throw new Error('DevVerifier requires a non-empty uniqueId payload');
    return { uniqueId, scheme: 'dev' };
  }
}

/** Registry: pick the adapter for an incoming proof's scheme. */
export class IdentityVerifier {
  private readonly adapters = new Map<IdentityProof['scheme'], VerifierAdapter>();

  constructor(adapters: VerifierAdapter[]) {
    for (const a of adapters) this.adapters.set(a.scheme, a);
  }

  /** Verify a proof and derive the per-project nullifier in one step. */
  async verifyForProject(
    proof: IdentityProof,
    projectId: number,
  ): Promise<{ identity: VerifiedIdentity; nullifier: Uint8Array }> {
    const scope = projectScope(projectId);
    if (proof.scope !== scope) {
      throw new Error(`proof scope "${proof.scope}" does not match project scope "${scope}"`);
    }
    const adapter = this.adapters.get(proof.scheme);
    if (!adapter) throw new Error(`no verifier registered for scheme "${proof.scheme}"`);
    const identity = await adapter.verify(proof);
    const nullifier = deriveNullifier(identity, scope);
    return { identity, nullifier };
  }
}

/** Default verifier: dev adapter always on; real adapters when configured. */
export function buildIdentityVerifier(): IdentityVerifier {
  const adapters: VerifierAdapter[] = [new DevVerifier()];
  // In production, register the real adapters (scope from config):
  //   adapters.push(new SelfVerifier({ scope: 'janamat-pulse' }));
  //   adapters.push(new ZkPassportVerifier({ scope: 'janamat-pulse' }));
  return new IdentityVerifier(adapters);
}
