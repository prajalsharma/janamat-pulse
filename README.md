<div align="center">
  <h2>Janamat Pulse</h2>
  <p><strong>An agentic civic-accountability layer for Solana — complementing Janamat.</strong></p>
</div>

Janamat Pulse is an AI agent that continuously reads Nepal's civic discourse,
quantifies public sentiment on government projects, and anchors a tamper-proof
record on Solana — where **one verified human = one civic voice** (sybil
resistance via zk identity). It turns Janamat's public square into an automated
**accountability signal**: it diffs what the government *officially claims* about a
project against what the *public actually says*, and flags the gap.

> Built for the Superteam Nepal "build something you'll keep building" bounty.
> Tracks: **agentic apps + open governance**, with **zkid / zkPassport** and
> **Janamat** brownie-point alignment.

---

## The problem

Public works in Nepal are opaque: fund allocations and milestone claims are hard
to verify, and public frustration is scattered across news and social media where
it can be ignored, altered, or deleted. Janamat put public opinion on-chain to
make it immutable. **Janamat Pulse adds the missing automated layer:** an agent
that measures that opinion at scale, attributes it to specific projects, and makes
the government-claim-vs-public-reality gap legible and permanent.

## What it does

Every tick, the agent:

1. **Ingests** civic news + public discourse and open government data.
2. **Scores** each item with an LLM — sentiment, the actor involved, the concrete
   claim it reacts to, and its **stance** vs the project's official claim — with a
   transparent, persisted reasoning chain (no black boxes).
3. **Attributes** it to a tracked government project.
4. **Anchors** verified civic opinions on Solana as immutable records, gated so
   each real human can only speak once per project.
5. **Flags** accountability gaps and streams everything to a live civic terminal.

## Tracked projects (MVP seed)

| Project | Category | Why |
|---|---|---|
| Melamchi Water Supply | Water | The definitive "promised for decades vs delivered" gap |
| Pokhara International Airport | Aviation | Loan / viability / underutilization controversy |
| Kathmandu–Terai Fast Track | Infrastructure | Repeated delays + budget scrutiny |

## Architecture

```
Off-chain agent (forked from a working sentiment engine)
  civic feeds → LLM sentiment + claim + stance → accountability engine
        │                                              │
        │ anchors verified opinions                    │ streams
        ▼                                              ▼
On-chain: civic_record (Anchor)                Live civic terminal (Next.js)
  • Project: official_claim, net_sentiment       sentiment by project + on-chain
  • CitizenVoice PDA per (project, nullifier)    proof links + accountability flags
    → one verified human = one voice
  • zk nullifier from off-chain verifier
    (STRETCH: on-chain proof verification +
     SPL state compression for scale)

Identity: zkPassport / Self (zk citizenship proof) · Privy (session/login)
```

## Repo layout

```
program/      Anchor workspace — civic_record program (Rust)
backend/      TypeScript agent: civic feeds, LLM sentiment, accountability engine,
              on-chain anchoring, zk verifier, REST + WebSocket   (forked engine)
frontend/     Next.js civic terminal — live sentiment + on-chain proofs  (forked)
docs/         audit, design, milestone notes
```

## Status (honest)

This project pivots a **real, working off-chain sentiment engine** (news ingestion,
LLM scoring with transparent reasoning, SQLite, REST + WebSocket, live dashboard,
Privy auth — all type-clean and previously running). The **on-chain program** and
**zk identity** layers are being built from scratch against that engine.

- ✅ Reusable engine forked in and type-clean
- ✅ Civic reclassification: sentiment vs official claim + accountability engine (verified on 32 live Nepali headlines)
- ✅ `civic_record` Anchor program — built, deployed, **4/4 tests pass incl. sybil-rejection**
- ✅ zk identity verifier (Self / zkPassport adapters) → per-project nullifier (verified)
- ✅ Full path proven on a validator: zk proof → nullifier → on-chain opinion → aggregate updated
- ✅ **Deployed to devnet** — program live, registry + 3 projects registered on-chain
- 🔜 Reskin frontend terminal as the civic pulse UI + live link
- 🔜 3-min demo video, build-in-public posts
- 🧭 STRETCH: on-chain zk proof verification + SPL Account Compression

**Program (devnet):** [`GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu`](https://explorer.solana.com/address/GQ9X4R1UKVUHz96XbRMDyngtQibxP1wMkmyngjLZNUwu?cluster=devnet)

See [`docs/AUDIT.md`](docs/AUDIT.md) for the baseline audit of the forked engine.

## Local dev

```bash
# toolchain (once): Solana CLI + Anchor
# sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
# cargo install --git https://github.com/coral-xyz/anchor avm --force && avm install latest && avm use latest

npm run install:all      # backend + frontend deps
cd program && anchor build && anchor keys sync   # build program, sync program id
```

> Not financial advice or an official government record. A civic-transparency
> prototype. No token, no trading — Solana is used as a public ledger, not money.
