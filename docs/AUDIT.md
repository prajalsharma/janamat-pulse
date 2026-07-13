# SolVane — Senior Solana Audit (baseline for the Janamat Pulse pivot)

**Date:** 2026-07-13
**Auditor scope:** three independent passes over the real codebase (Solana execution backend, auth/ZK frontend, build/run + on-chain). All findings cite `file:line` from the actual code. Nothing below is assumed.

**One-line verdict:** SolVane is a *real, type-clean, off-chain AI trading agent*. Its news→sentiment→dashboard engine is genuinely reusable. But it has **no Solana program and no zero-knowledge code of any kind** — the two pieces that matter most for the Janamat bounty are 100% greenfield.

---

## 1. What is genuinely real (reusable core) ✅

| Subsystem | Verdict | Evidence |
|---|---|---|
| News ingestion (RSS) | REAL | `backend/src/services/news.*`, feeds in `.env.example` |
| Sentiment — Claude tier | REAL | `sentiment.ts:87-123` — real `client.messages.create` call |
| Sentiment — lexical fallback | REAL | `sentiment.ts:22-71` — deterministic bag-of-words scorer |
| SQLite persistence | REAL | `db/index.ts:14-142` — WAL, 3 tables, prepared statements; DB active today |
| REST API | REAL | `api/rest.ts:32-118` — full surface |
| WebSocket live stream | REAL | `api/ws.ts:12-40` |
| Portfolio / P&L | REAL | `services/portfolio.ts:26-74` — avg-cost-basis reconstruction |
| Privy login | REAL | `PrivyClientProvider.tsx:31-53`; live app id in `.env.local` |
| Two-wallet model (user vs agent vault) | REAL | `Header.tsx:42-185`, `UserWalletMenu.tsx:72-73`, `useAgentWallet.ts:31-33` |
| Real on-chain SOL transfer (fund modal) | REAL | `FundAgentModal.tsx:132-193` — builds, Privy-signs, `sendRawTransaction`, confirms |
| Frontend direct web3.js reads/writes | REAL | `getBalance`, `SystemProgram.transfer`, `requestAirdrop` |
| Backend build | PASSES | `tsc --noEmit` exit 0 |
| Frontend build | PASSES | `tsc --noEmit` exit 0 |

The Jupiter live-swap path is also real: quote → swap-build → sign → `sendRawTransaction` → confirm (`executor.ts:121-151`), and live mode correctly forces a real price source (`config.ts:89`). This is the trading path we **drop** for the civic pivot.

---

## 2. Bounty-critical gaps — both 100% ABSENT ❌

### 2.1 No Solana program (nothing on-chain of our own)
- No `Anchor.toml`, no `Cargo.toml`, no `programs/`, no `.rs`, no `declare_id!`, no anchor dependency anywhere in the repo.
- SolVane's only "on-chain" interaction is calling **Jupiter's hosted HTTP API** and signing the tx it returns.
- **Implication:** the bounty requires "a functional prototype deployed on the Solana blockchain." Janamat Pulse's immutable-civic-record premise **is** a program. This is greenfield.

### 2.2 No zero-knowledge / zkid / zkPassport / proof-of-human
- Grep across the whole repo for `zk|zkid|zkpass|semaphore|groth|snark|nullifier|poh|humanity|merkle|circuit|worldcoin` → **nothing** (only false positives: a lucide `BrainCircuit` icon).
- No zk library in `package.json` (frontend or backend). No proof gen, no verifier, no nullifier.
- The `verify-humanity-poh` skill exists in the environment but is **unused** in code.
- **Implication:** the bounty's brownie points explicitly name zkid/zkPassport. Not even a stub exists.

### 2.3 No tests
- No `*.test.*`, no `*.spec.*`, no jest/vitest config, no test script. Zero coverage.

---

## 3. Security findings (current trading app)

Most evaporate on the civic pivot because the trading/executor path is removed. Listed for completeness:

1. **Plaintext private key at rest** — `data/agent-wallet.json` stores the raw 64-byte secret unencrypted, `mode 0o600` only (`wallet.ts:83`). Top custody risk for a mainnet trading agent. *(Gone once we drop the agent trading wallet.)*
2. **Unauthenticated control endpoints** — `POST /api/agent/start|stop|tick` accept requests with no token; the UI `disabled` attribute is the only gate (`useAgentStream.ts:180`). **This pattern carries over** — civic records must not be writable by anyone. Must fix.
3. **No pre-trade balance/affordability check** — risk engine ignores `hasWallet` (`risk.ts`); sells size SOL that may not be held (`executor.ts:61`). *(Gone with trading.)*
4. **Mainnet + live one env var away** — cluster/RPC default to mainnet (`config.ts:16-17`).
5. **Wide-open CORS** — `cors()` unrestricted (`index.ts:12`).
6. **Deprecated `confirmTransaction(sig, commitment)` overload** — flaky under load (`executor.ts:143`).
7. **Invalid default model id** `claude-opus-4-8` (`config.ts:14`) — live Claude calls would 404 and silently fall back to heuristic unless `ANTHROPIC_MODEL` is overridden.

Secrets hygiene is otherwise correct: `.env`, wallet JSON, and the SQLite DB are all gitignored; nothing sensitive is committed.

---

## 4. Gap map for the Janamat Pulse pivot

| Layer | Status | Notes |
|---|---|---|
| News/feed ingestion | ♻️ Reuse | Swap feed URLs to Nepali civic sources + open govt data |
| LLM sentiment + reasoning | ♻️ Reuse | Reclassify schema (issue/actor/constituency/claim) — prompt change |
| Live dashboard / WS / SQLite | ♻️ Reuse | As-is |
| Privy identity | ♻️ Reuse | Keep as the login layer |
| **On-chain civic-record program (Anchor + State Compression)** | 🔴 Build from zero | Hardest + most bounty-critical |
| **ZK sybil resistance (zkPassport / zkid)** | 🔴 Build from zero | Genuinely hard; phase carefully |
| Authenticated writes (verify identity before recording) | 🔴 Build | Current pattern is client-gated only |
| Accountability engine (claim vs sentiment diff) | 🟡 Adapt | Repurpose risk-engine logic |
| Tests | 🔴 Build | None exist |

**Honest reuse estimate:** ~55–60% by surface area (the entire off-chain pipeline). The Solana program and ZK identity — the two things judges will weight most — are from-scratch.

---

## 5. Chosen direction
- **Positioning:** agentic civic-accountability layer on top of Janamat ("Janamat Pulse").
- **Codebase:** pivot SolVane's engine into a **new repo** (SolVane stays intact for the grant).
- **ZK stance:** ambitious path — **real zkPassport/zkid day-one AND on-chain immutability first** (deploy Anchor program + state-compressed records with true citizenship proofs). Strongest story, highest risk; scoped as milestones.
