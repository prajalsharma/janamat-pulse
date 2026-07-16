import { createHash } from 'node:crypto';
import { PrivyClient } from '@privy-io/server-auth';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

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
  scheme: 'zkpassport' | 'self' | 'privy' | 'dev';
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
 * Privy social-login adapter. This is the identity layer that is actually wired
 * for Janamat Pulse today: a signed-in Privy account (email / Google / X /
 * wallet) is the "one distinct person" the nullifier is scoped to. Honest
 * framing: this is social-login sybil resistance (one account = one voice per
 * project), NOT passport-grade personhood. zkPassport / Self remain the
 * documented upgrade above; the nullifier math is identical, so swapping the
 * source of `uniqueId` changes nothing downstream.
 *
 * The proof payload is the Privy **access token** (a JWT) obtained client-side
 * via `getAccessToken()`. When PRIVY_APP_SECRET is configured the token is
 * verified cryptographically server-side and the stable Privy user id is read
 * from the verified claims. When it is NOT configured the server runs in dev
 * mode: it decodes the token's subject WITHOUT verification (clearly logged) so
 * local development still exercises the full flow.
 */
export class PrivyVerifier implements VerifierAdapter {
  readonly scheme = 'privy' as const;
  private client: PrivyClient | null = null;

  constructor(private readonly opts: { appId: string; appSecret: string }) {}

  private get configured(): boolean {
    return this.opts.appId.length > 0 && this.opts.appSecret.length > 0;
  }

  private getClient(): PrivyClient {
    if (!this.client) this.client = new PrivyClient(this.opts.appId, this.opts.appSecret);
    return this.client;
  }

  async verify(proof: IdentityProof): Promise<VerifiedIdentity> {
    const token = extractToken(proof.payload);
    if (!token) {
      throw new Error('PrivyVerifier requires a Privy access token as the proof payload');
    }

    if (this.configured) {
      // Real, cryptographic verification against the app's ES256 key.
      const claims = await this.getClient().verifyAuthToken(token);
      if (!claims.userId) throw new Error('Privy token verified but carried no user id');
      return { uniqueId: `privy:${claims.userId}`, scheme: 'privy' };
    }

    // Dev mode: no app secret. Decode the subject WITHOUT verifying the
    // signature so local dev works. Never use this path in production.
    const sub = decodeJwtSubject(token);
    if (!sub) {
      throw new Error(
        'PrivyVerifier dev mode: could not read a subject from the token (set PRIVY_APP_SECRET for real verification)',
      );
    }
    logger.warn(
      { userId: sub },
      'PrivyVerifier: dev mode, trusting token subject WITHOUT verification (set PRIVY_APP_SECRET to enable real server-side verification)',
    );
    return { uniqueId: `privy:${sub}`, scheme: 'privy' };
  }
}

/** Pull the JWT out of a string payload or a `{ token }` object payload. */
function extractToken(payload: unknown): string | null {
  if (typeof payload === 'string' && payload.length > 0) return payload;
  const t = (payload as { token?: string })?.token;
  return typeof t === 'string' && t.length > 0 ? t : null;
}

/** Decode a JWT's `sub` claim WITHOUT verifying the signature (dev mode only). */
function decodeJwtSubject(token: string): string | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const claims = JSON.parse(json) as { sub?: string };
    return typeof claims.sub === 'string' && claims.sub.length > 0 ? claims.sub : null;
  } catch {
    return null;
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

/**
 * Default verifier: Privy social login is the live identity layer, dev adapter
 * stays on for local scripts/tests. The Privy adapter verifies real access
 * tokens when PRIVY_APP_SECRET is set, and falls back to a clearly-logged dev
 * mode otherwise so the flow is exercisable without a secret.
 */
export function buildIdentityVerifier(): IdentityVerifier {
  const adapters: VerifierAdapter[] = [
    new DevVerifier(),
    new PrivyVerifier({ appId: config.privy.appId, appSecret: config.privy.appSecret }),
  ];
  // The passport-grade upgrade path (documented, not yet wired):
  //   adapters.push(new SelfVerifier({ scope: 'janamat-pulse' }));
  //   adapters.push(new ZkPassportVerifier({ scope: 'janamat-pulse' }));
  return new IdentityVerifier(adapters);
}
