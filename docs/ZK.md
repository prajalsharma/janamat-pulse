# Zero-Knowledge Identity — design & status

Janamat Pulse enforces **one verified human = one civic voice** without learning
who the human is. This is the sybil-resistance layer the Superteam bounty
explicitly asks for (zkid / zkPassport).

## The model

```
Citizen ──(zk identity proof)──▶ Verifier ──(unique id)──▶ deriveNullifier(id, scope)
  zkPassport / Self               off-chain                 sha256(scheme‖id‖scope)
                                                                   │
                                                                   ▼
                                          submit_opinion(nullifier, sentiment, …)
                                          on-chain: CitizenVoice PDA per (project, nullifier)
                                          re-use of a nullifier ⇒ PDA exists ⇒ tx fails
```

- **Proof** attests "a distinct real person" (e.g. a valid passport via zkPassport
  NFC, or a national ID / passport via Self Protocol) and yields a stable,
  privacy-preserving **unique identifier** — never a name or document number.
- **Nullifier** = `sha256(scheme ‖ uniqueId ‖ scope)`, truncated to 32 bytes.
  - Deterministic: same human + same scope → same nullifier ⇒ can't vote twice.
  - Scoped per project (`janamat-pulse:project:<id>`): a citizen may weigh in once
    **per project**, and nullifiers are unlinkable across projects.
  - One-way: reveals nothing about the identity.
- **On-chain**, the nullifier seeds a `CitizenVoice` PDA. Anchor's `init`
  constraint fails if that PDA already exists — that *is* the anti-sybil guarantee.

## What is built (MVP)

- `backend/src/zk/verifier.ts` — adapter interface + nullifier derivation +
  scope handling + a registry. `DevVerifier` lets the full flow run without a
  live passport scan. **Verified end-to-end** (`src/scripts/zk-smoke.ts`):
  deterministic per-project nullifiers, cross-project distinctness, scope-mismatch
  rejection.
- `backend/src/services/civic-opinion.ts` + `POST /api/civic/opinion` — verify →
  derive nullifier → anchor on-chain (or dry-run when no program is configured).
- On-chain enforcement lives in the `civic_record` program (`CitizenVoice` PDA).

## Integration points (live wiring)

The real adapters are stubbed with clearly-marked SDK calls in `verifier.ts`:

- **Self Protocol** (`@selfxyz/core`) — passport / national-ID zk proofs. Broadest
  reach for Nepal (supports national ID paths, not passport-only). Recommended
  primary.
- **zkPassport** (`@zkpassport/sdk`) — NFC e-passport zk proofs.

Swapping a real adapter in changes only **where `uniqueId` comes from** — the
nullifier math and on-chain security model are identical.

> Note on reach: passport penetration in Nepal is low, so treat the proof as
> sybil resistance, not universal enrollment. Prefer an adapter that supports
> national-ID paths. This tradeoff is intentional and disclosed.

## STRETCH (documented, not in MVP)

1. **On-chain proof verification** — verify the Groth16/Plonk proof *inside* the
   Anchor program instead of trusting the off-chain verifier. Removes the trusted
   verifier from the security model.
2. **SPL Account Compression** — move the per-opinion record log into a concurrent
   Merkle tree so millions of civic opinions cost cents.
