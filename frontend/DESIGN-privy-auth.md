# SolVane - Privy Auth + Two-Wallet Design Spec

Spec for the engineer agent. Design only. No app code here. Follow the SolVane brand
(`brand.md`); this is coherence + auth, not a rebrand.

**Register:** product UI (design serves the product). Terminal is a fintech trading
dashboard; the auth gate is the one brand moment inside it.

Copy rule for the whole build: no em-dashes and no en-dashes anywhere in visible
strings. Use a period, a comma, a colon, or a hyphen. (The current app violates this;
fix strings you touch.)

---

## 1. Design read

Reading this as: a dark fintech trading terminal for a crypto-native operator, with a
precise-instrument language, leaning toward the existing SolVane token system (Geist +
Geist Mono, Solana beam) plus a real Privy identity layer.

Dials (design-taste-frontend): VARIANCE 4 (structured, grid-true), MOTION 4 (functional
micro-motion, no choreography), DENSITY 6 (terminal). The auth gate alone runs quieter:
a single focused centered moment, which is the permitted exception to anti-center bias.

---

## 2. Audit of current coherence problems

Each bullet: problem -> fix.

- **The header wallet is the agent's server keypair dressed as "your account."**
  `Header.tsx` `WalletChip` reads `/api/wallet` (the bot's persisted devnet keypair),
  shows a copyable address + SOL balance + Airdrop, sitting in the top-right slot every
  SaaS user reads as "me." There is no login, so this is a fake session.
  **Fix:** relabel this element **Agent Vault**, give it the purple (agent) accent, and
  move the top-right identity slot to a real Privy user menu. See 4.2 and 4.3.

- **Airdrop is unlabeled as to whose wallet it funds.** The green Airdrop button implies
  the user is funding their own balance.
  **Fix:** Airdrop and the new Fund action both live *inside* the Agent Vault surface,
  explicitly "fund the agent." See 4.4.

- **`status.wallet` is passed as `fallbackAddr` and rendered as an identity.** Same fake
  session at the data layer.
  **Fix:** `status.wallet` is only ever the Agent Vault address. It never renders in the
  identity slot.

- **No access model.** README and `FinalCta` promise "No wallet, no keys, nothing to
  lose." That is true for read-only viewing but conflicts with operator controls
  (Start/Pause/Tick) being always-on for anyone.
  **Fix:** login gates *operator control and funding*, not *viewing*. Read-only demo
  stays keyless. Update `FinalCta` copy (4.7).

- **Two "wallet balances" with no relationship stated.** `PortfolioPanel` already says
  "Agent Book" and "On-chain wallet balance"; the header shows a second SOL number. A
  user cannot tell if these are the same money or theirs.
  **Fix:** one canonical Agent Vault balance in the header chip; PortfolioPanel's
  on-chain row relabels to "Agent Vault balance" so they visibly refer to one thing (4.6).

- **Badges, wallet, and controls are one undifferentiated right-side row.** No grouping
  communicates "these describe the agent, this is you."
  **Fix:** three explicit zones in the header: agent status, agent vault + operator
  controls, your identity. See 4.2.

- **Radius + accent drift.** Chips/controls use `rounded-md`, panels `rounded-xl`,
  landing `rounded-2xl/3xl`. Purple is used decoratively in places.
  **Fix (locks):** interactive chips/buttons `rounded-md`; dropdown/modal `rounded-xl`;
  panels stay `rounded-xl`. Purple means "the agent/brand" only. Identity is neutral.

---

## 3. Information architecture

### The two-wallet model (the whole point)

| | YOUR wallet | AGENT VAULT |
|---|---|---|
| What | Privy-authenticated identity (email / social / external Solana wallet) | Bot's server keypair that holds and trades funds |
| Means | "This is you. You are logged in." | "This is the machine's money." |
| Source | `@privy-io/react-auth` (`user`, `wallets`) | `/api/wallet` (`status.wallet`) |
| Accent | Neutral (surface-2, content text, identicon). No signal color. | Purple (`brand-purple`), the beam mark. Purple = the agent. |
| Location | Far top-right, user menu (SaaS convention) | Header center-right, inside the agent zone |
| Actions | Copy address, view on explorer, Disconnect (destructive, red) | Devnet Airdrop, Fund the agent, view on explorer |

The color split is brand-locked: `brand.md` says purple = the agent/brand. So the agent's
money is purple; your identity carries no market/brand signal color. That single rule
makes the two impossible to confuse.

### What login gates

- **Public, always:** landing `/`, and *viewing* the terminal (news, sentiment, price,
  decisions, trades, portfolio, live stream).
- **Gated behind Privy auth:** operator controls (Start / Pause / Tick), Fund the agent,
  and the "connected as you" identity menu.
- **Keyless fallback:** if Privy is unconfigured, or the user chooses "read-only demo,"
  the terminal renders fully with all controls disabled.

### Where "Fund the agent" lives

Inside the Agent Vault surface only. Two funding paths, both agent-scoped:
1. **Airdrop** (devnet only, `canAirdrop`): faucet SOL straight to the vault. Existing.
2. **Fund the agent** (new): a modal that sends SOL from YOUR Privy Solana wallet to the
   Agent Vault address. This is the concrete reason login exists.

---

## 4. Screen and component specs

Shared tokens (from `tailwind.config`): `ink #0B0B14`, `surface #12121C`,
`surface-2 #191926`, `border #242433`, `content #ECECF3`, `content-muted #8A8A9A`,
`brand-purple #9945FF`, `brand-green #14F195`, `bull #14F195`, `bear #FF5C7A`,
`warn #FFB020`, `bg-beam`, `shadow-panel`, `shadow-glow`. Fonts: Geist (UI), Geist Mono
(all numbers/addresses, with `.tnum`).

Contrast note (impeccable, WCAG AA): `content-muted` on `ink`/`surface` is ~4.6:1, fine
for labels and large text but borderline for small body. Use `content-muted` for labels
and secondary meta only; any sentence a user must read for meaning uses `content`.

Motion tokens: micro 140ms, dropdown/modal enter 200ms, exit 140ms, ease-out
(`cubic-bezier(0.16,1,0.3,1)`). Every animation has a `prefers-reduced-motion: reduce`
path (crossfade or instant). Modals/dropdowns animate from their trigger
(scale 0.97 -> 1 + fade), per ui-ux-pro-max `modal-motion`.

---

### 4.1 Auth gate (`/app` when not authenticated)

Full-viewport, single centered column. This is the one place centered is correct: it is
a gate, one decision, not a marketing hero.

**Layout.** `min-h-[100dvh]`, `grid place-items-center`, `px-5`. The same body backdrop
(radial purple/green glows) shows through so it reads as SolVane, not a blank auth page.
Centered card: `max-w-[420px] w-full rounded-xl border border-border bg-surface/80
backdrop-blur-xl shadow-panel px-7 py-8`.

Card contents, top to bottom:
1. `Logo` (mark + wordmark), size 40.
2. Headline (`text-xl font-semibold text-content`): **"Sign in to operate the agent"**.
3. Sub (`text-[13px] text-content-muted leading-relaxed`, max ~2 lines):
   **"Viewing is open to everyone. Sign in to start, pause, and fund the SolVane agent."**
4. Primary button, full width, `h-11 rounded-md bg-beam text-ink font-semibold
   shadow-glow`: **"Sign in with Privy"**. Opens the Privy modal (email, social, external
   Solana wallet are configured in Privy, so we do not rebuild those method buttons; one
   button is enough and keeps `primary-action`: one CTA).
5. Divider hairline.
6. Ghost link, `text-[13px] text-content-muted hover:text-content`:
   **"Continue in read-only demo"** -> renders the terminal in read-only mode (4.5).
7. Footer meta (`text-[11.5px] text-content-muted`): **"Devnet. Dry-run by default. No
   funds move unless you fund the agent."**

**States.**
- *logged-out (default):* as above.
- *logging-in:* primary button shows spinner + label **"Opening Privy..."**, disabled,
  `aria-busy`. Privy renders its own modal over this; keep the card visible behind a
  scrim (`bg-ink/60`).
- *error* (Privy modal dismissed / auth failed): inline row below the button,
  `text-[12.5px] text-bear`, **"Sign-in was cancelled. Try again."** Button returns to
  rest. Never a toast for a gate error; keep it in place (`error-recovery`).
- *authenticated:* unmount the gate, render terminal. No flash: while
  `ready === false`, show the loading state below, not the logged-out card.
- *loading (Privy not ready):* card body replaced by three skeleton bars matching the
  final shape (`h-11`, `h-4`, `h-4`, `animate-pulse bg-surface-2/60 rounded-md`). No
  spinner-only.
- *unconfigured:* see 4.5.

**A11y.** Card is `role="dialog"`-free (it is the page, not an overlay); focus lands on
the primary button on mount. Full keyboard path: Tab -> primary -> read-only link.
Visible focus ring `ring-2 ring-brand-purple ring-offset-2 ring-offset-ink` (reuse the
app's existing focus style).

---

### 4.2 Logged-in header

Rework `Header.tsx` into three labeled zones. Keep it `sticky top-0 z-20
border-b border-border bg-ink/80 backdrop-blur-xl`, `flex flex-wrap items-center gap-x-5
gap-y-3`.

```
[ Logo | connDot Stream live ]  ....  [ AGENT ZONE ]  [ YOU ]
```

**Zone A - brand/stream (left, unchanged):** `Logo` + connection `Dot` + status text.

**Zone B - agent (center-right), visually bracketed as "the machine":**
Order: status badges -> Agent Vault chip -> operator controls. Wrap B in a subtle group:
no box, but separate it from the identity slot with `ml-auto` and a `h-5 w-px bg-border`
divider before Zone C.
- Badges (keep): mode (`bull`/`warn`), cluster, engine. These describe the agent.
- **Agent Vault chip** (4.3): the relabeled former WalletChip, purple-accented.
- Operator controls (keep Tick + Start/Pause). These run the agent, so they belong beside
  it. When read-only or unauthenticated, they are disabled (4.5).

**Zone C - you (far right):** the Privy user menu (4.3). Standard top-right identity slot.

Rationale: everything describing or controlling the agent is one cluster; your identity
is the corner. A user never mistakes the agent's money for their account because the two
never touch and never share an accent.

**Responsive.**
- 1280: all three zones on one row.
- 768: header `flex-wrap`. Zone A row 1; Zones B + C wrap to row 2. Engine badge may drop.
- 375: cluster + engine badges hidden; mode badge stays. Agent Vault chip condenses to
  balance + purple dot only (address/airdrop move into a tap-to-open popover). User menu
  becomes avatar-only (no address preview). Controls stay full size (44px min touch).

---

### 4.3 Agent Vault chip + Your-wallet menu

#### Agent Vault chip (relabel + reskin of `WalletChip`)

Purpose: show the agent's fundable balance and vault actions, unmistakably the agent's.

**Layout.** `inline-flex h-9 items-center rounded-md border border-brand-purple/30
bg-surface-2`. A leading label makes ownership explicit:
- Leading segment: the beam `LogoMark` at 14px + micro-label **"AGENT VAULT"**
  (`text-[10px] font-medium uppercase tracking-wide text-brand-purple`). This is the one
  place the purple eyebrow-style label is earned: it is semantic ownership, not decoration.
- Divider `h-4 w-px bg-border`.
- SOL balance (Geist Mono `.tnum`), keep the up/down flash (`bull`/`bear`) on change.
- Divider. Address (`shortAddr`), click to copy, check-on-copy (keep existing behavior).
- Explorer external-link icon (keep).
- Actions region (right): **Airdrop** (devnet, existing green droplet) and, new, a
  **Fund** button (`text-brand-purple`, `Plus` or `ArrowUpRight` icon) that opens the
  Fund modal (4.4). Both are inside the vault, so both read as "fund the agent."

**States.**
- *loading:* existing skeleton pill (`h-9 w-40 animate-pulse`), keep.
- *empty (no vault address):* `Badge tone="muted"` **"Vault offline"** (was "No wallet").
- *copied:* check icon + `title="Copied"`.
- *airdropping / funding:* respective button shows spinner, disabled.
- *unauthenticated / read-only:* balance, address, explorer remain (viewing is open).
  Airdrop and Fund are disabled with tooltip **"Sign in to fund the agent."**

#### Your-wallet menu (new, Zone C)

Trigger button: `inline-flex h-9 items-center gap-2 rounded-md border border-border
bg-surface-2 pl-1.5 pr-2.5`. Contents: a 22px identicon (deterministic from the wallet
address; for email/social logins with an embedded wallet, still derive from that wallet
address) + `shortAddr(you)` in Geist Mono, or the email local-part if no external address
yet + a `ChevronDown` 14px. No purple anywhere here. Active/open state:
`border-content/20`.

**Dropdown** (native `<dialog>`/popover or portal + `position: fixed` to escape the
sticky header's stacking context, per impeccable interaction rule). `w-64 rounded-xl
border border-border bg-surface shadow-panel p-1.5`, enters scale 0.97 -> 1 + fade 200ms
from the trigger.
Rows:
1. Header block: **"Signed in"** label + full identity. If external wallet: address in
   mono with copy. If email/social: the email/handle, then the embedded Solana wallet
   address below in mono with copy.
2. Your SOL balance (from Privy wallet), `text-content-muted` label + mono value. This is
   the money you can fund *from*, distinct from the vault. Label it **"Your balance"**.
3. Divider.
4. **"Fund the agent"** row (icon `ArrowUpRight`) -> opens Fund modal. Present here too so
   the action is reachable from the identity side (it is a transfer *from you*).
5. **"View on explorer"** row (external icon).
6. Divider.
7. **"Disconnect"** row: destructive. `text-bear`, `hover:bg-bear/10`, icon `LogOut`.
   Spatially separated by the divider above (ui-ux-pro-max `destructive-nav-separation`).
   Calls Privy `logout()`; on success the gate returns.

**A11y.** Trigger `aria-haspopup="menu" aria-expanded`. Arrow-key roving focus through
rows. Escape closes and returns focus to trigger (`escape-routes`). Disconnect is a real
`<button>`, announced.

---

### 4.4 Fund-the-agent modal

Send SOL from your Privy Solana wallet to the Agent Vault address. This is why auth exists.

**Trigger:** Fund button (vault chip or user menu). Requires authenticated + a Privy
Solana wallet available. If authenticated via email/social, use the Privy embedded Solana
wallet.

**Container.** Centered modal, `role="dialog" aria-modal="true"`, scrim `bg-ink/70`
(50-60% is the legibility floor). Panel `w-full max-w-[400px] rounded-xl border
border-border bg-surface shadow-panel p-6`. Enter: scale 0.97 -> 1 + fade 200ms; scrim
fades. Reduced-motion: instant.

**Header.** Title `text-[15px] font-semibold text-content` **"Fund the agent"**. Sub
`text-[12.5px] text-content-muted` **"Move SOL from your wallet to the Agent Vault so it
can trade."** Close `X` top-right, 44px hit area.

**Body (default state).**
- **From row:** identicon + `shortAddr(you)` + your SOL balance (mono, right-aligned).
  Small `text-content-muted` label "From your wallet".
- Arrow-down glyph (`ArrowDown`, `text-content-muted`) between rows for direction.
- **To row:** beam mark + **"Agent Vault"** + `shortAddr(vault)`. Label "To the agent".
  Purple hairline accent on this row to reinforce ownership.
- **Amount field:** label *above* the input (never placeholder-as-label, ui-ux-pro-max
  `input-labels`). `type` numeric, Geist Mono, `.tnum`, suffix "SOL". Below the input,
  preset chips: `0.1` `0.5` `1` `Max`. Helper text below (`text-[12px]
  text-content-muted`): **"Leaves a little SOL for fees."** (Max leaves ~0.01 for fees.)

**Actions.** Secondary "Cancel" (ghost). Primary `bg-beam text-ink font-semibold h-11
rounded-md` **"Send to agent"**.

**States.**
- *default:* Send disabled until amount > 0 and <= (balance - fee buffer).
- *insufficient funds:* inline error *below the amount field* (`text-bear text-[12px]`),
  **"Not enough SOL. You have {bal}."** On devnet, append a secondary link **"Airdrop to
  your wallet"** if the Privy wallet supports it; otherwise **"Fund the agent by
  airdropping the vault"** points back to the vault Airdrop. First invalid field gets
  focus (`focus-management`).
- *review/confirm (optional single step):* the Send button label becomes **"Confirm:
  send {amount} SOL"** on first press, then executes on second, OR skip and go straight to
  signing. Prefer straight-to-signing since Privy shows its own signature prompt.
- *submitting (signing):* Privy signature UI appears; our button shows spinner +
  **"Confirm in wallet..."**, inputs disabled, `aria-busy`. Do not block the modal close
  entirely, but warn on dismiss with unsaved intent is unnecessary here (nothing is
  saved until signed); allow Cancel.
- *broadcasting:* spinner + **"Sending..."** after signature, before confirmation.
- *success:* modal body swaps to a compact success state: green check, **"Sent {amount}
  SOL to the agent."**, the tx signature as a mono `shortAddr` with an explorer link, and
  a single **"Done"** button. The vault balance chip flashes green on its next poll
  (existing flash logic). Auto-close is optional; prefer explicit Done so the user can
  grab the signature.
- *error* (rejected / failed / timeout): inline `text-bear`, cause + recovery
  (`error-clarity`): rejected -> **"Signature was rejected."**; failed ->
  **"Transfer failed. Nothing was sent."** + **"Try again"** button; timeout ->
  **"Still pending. Check the explorer."** + link. Never silently close.

**A11y.** Focus trap in modal; Escape cancels (disabled during broadcast to avoid
orphaning a signed tx, with the close button showing a tooltip). Focus starts on the
amount field. Numeric input triggers the number keyboard on mobile (`inputmode="decimal"`).

---

### 4.5 Read-only demo + Privy-unconfigured states

**Detection:** `NEXT_PUBLIC_PRIVY_APP_ID` absent -> unconfigured. Provider must not throw;
render children in read-only mode.

**Auth gate, unconfigured variant** (4.1 card, swapped middle):
- Headline **"Sign-in is not configured"**.
- Sub `text-content-muted`: **"No Privy app ID is set, so login is off. You can still
  watch the agent trade in read-only mode."**
- Primary button becomes **"Enter read-only demo"** (`bg-beam`), which routes into the
  terminal read-only. No secondary link needed.
- Footer meta unchanged (devnet / dry-run line).

**Read-only terminal mode** (also the "Continue in read-only demo" path):
- Persistent, dismissible-off banner directly under the header, full width,
  `bg-warn/10 border-b border-warn/25 text-warn text-[12.5px]`, `role="status"`:
  **"Read-only demo. Sign in to control or fund the agent."** with a **"Sign in"** text
  button on the right (hidden when unconfigured). Amber because it is a
  paused/limited state (brand: amber = paused/pending). Not red; nothing is broken.
- Operator controls (Tick, Start/Pause): `disabled`, `opacity-50`, `cursor-not-allowed`,
  `aria-disabled`, tooltip **"Sign in to control the agent."** Keep them visible so the
  affordance is legible (ui-ux-pro-max `disabled-states`, not hidden).
- Agent Vault chip: balance/address/explorer visible; Airdrop + Fund disabled with the
  sign-in tooltip.
- User menu (Zone C) is replaced by a single **"Sign in"** button (`bg-beam text-ink`,
  or `border` ghost when unconfigured and thus non-functional -> then hide it).
- Everything else (feeds, gauges, portfolio) fully live. Viewing is the product's open
  surface.

---

### 4.6 Relabeled / reshaped existing components (audit table)

| Element | Verdict | Action |
|---|---|---|
| `Header` Logo + conn dot | keep | no change |
| `Header` mode/cluster/engine badges | keep | stay in agent Zone B |
| `Header` `WalletChip` | **relabel + reskin** | becomes **Agent Vault chip** (4.3): purple border, "AGENT VAULT" label, beam mark, Fund button added |
| `WalletChip` `fallbackAddr={status.wallet}` | keep, reframe | `status.wallet` is only ever the vault address; never the identity slot |
| `Header` Tick / Start-Pause | keep, move | stay in Zone B beside the agent; gain disabled state when not authed |
| Top-right identity slot | **new** | Privy user menu (4.3) in Zone C |
| `PortfolioPanel` title "Agent Book . P&L" | keep | already agent-scoped, good |
| `PortfolioPanel` "On-chain wallet balance" row | **relabel** | -> **"Agent Vault balance"** so it visibly matches the header chip |
| `PortfolioPanel` uses `.` separator in title | keep | fine (single middot) |
| `app/app/page.tsx` footer dry-run/live line | keep, de-em-dash | replace the `—` with a period or colon |
| `FinalCta` copy "No wallet, no keys, nothing to lose" | **rewrite** | see 4.7 |
| `LandingNav` / `FinalCta` "Launch Terminal" -> `/app` | keep | `/app` now resolves to gate-or-terminal automatically; no link change needed |

---

### 4.7 Landing copy touch-ups (coherence only, not a redesign)

- `FinalCta` sub: replace with **"The terminal auto-starts in dry-run. Watch it free, or
  sign in to start, pause, and fund the agent yourself."** (removes the now-false "no
  wallet" promise; keeps the em-dash-free rule).
- Keep both landing CTAs labeled **"Launch Terminal"** (one intent, one label,
  ui-ux-pro-max / design-taste `NO DUPLICATE CTA INTENT`). Do not add a second "Sign in"
  CTA on the landing; the gate handles auth after launch.

---

## 5. Tokens, type, motion (grounded in the skills)

- **Palette (ui-ux-pro-max `color-semantic`, `dark-mode-pairing`):** the existing SolVane
  dark set is the source of truth (identity preservation, impeccable "committed brand
  colors win"). Semantic locks reaffirmed: green = up/bull, red = down/bear, purple = the
  agent/brand, amber = paused/limited. **Identity carries no signal color.** This is the
  spine of the two-wallet distinction.
- **Type (ui-ux-pro-max `font-pairing`; impeccable "one contrast axis"):** Geist (UI) +
  Geist Mono (all numerics, addresses, tx signatures) with `.tnum`. Sans + mono is a
  legitimate contrast axis; do not introduce a third family. Scale in use: labels
  `text-[10-11px] uppercase`, meta `12-13px`, body `13-15px`, titles `15-20px`.
- **Radius lock (impeccable shape-consistency):** interactive chips/buttons/inputs
  `rounded-md` (6px); dropdown/modal/panel `rounded-xl` (12px). No `rounded-2xl` inside
  the terminal.
- **Elevation:** reuse `shadow-panel` for menus/modals, `shadow-glow` only on the beam
  primary CTA. No new shadow values (ui-ux-pro-max `elevation-consistent`).
- **Motion (ui-ux-pro-max `duration-timing`, `modal-motion`, `easing`; impeccable
  ease-out-expo):** micro 140ms, enter 200ms, exit 140ms, ease
  `cubic-bezier(0.16,1,0.3,1)`. Dropdown + modal scale 0.97 -> 1 from trigger. Balance
  flash keeps the existing 600ms color fade. `:active` uses the app's existing
  `translate-y-px` tactile push. No bounce, no infinite loops added.
- **Reduced motion (mandatory):** all enters degrade to crossfade/instant under
  `prefers-reduced-motion: reduce`; the app already has a global reduce block, keep new
  transitions inside it.

Craft bans honored: no gradient text beyond the existing wordmark, no side-stripe
accent borders, no glassmorphism beyond the header/gate `backdrop-blur` already in the
brand, no decorative eyebrow on every surface (the "AGENT VAULT" label is the only new
uppercase micro-label and it is semantic ownership).

---

## 6. Accessibility + responsive

- **Contrast:** verify `content-muted` only on labels/large; use `content` for read-for-
  meaning body. All new state colors (`bear` errors, `warn` banner) checked >= 4.5:1 on
  their backgrounds. `text-ink` on `bg-beam` primary passes for large/bold.
- **Keyboard:** gate -> primary then read-only link. User menu: Enter opens, arrows rove,
  Esc closes to trigger. Fund modal: focus trap, Esc cancels (blocked mid-broadcast),
  focus starts on amount. All disabled controls are `aria-disabled` and skip activation
  but remain discoverable.
- **Focus visible:** reuse `ring-2 ring-brand-purple ring-offset-2 ring-offset-ink`
  everywhere (already the app pattern).
- **Screen readers:** read-only banner `role="status"`; fund success/error use
  `aria-live="polite"`. Icon-only buttons (copy, explorer, close, disconnect) carry
  `aria-label`. Identicons are `aria-hidden` (decorative; address is the label).
- **Touch:** all controls >= 44px hit area; on 375 the vault chip actions collapse into a
  tap popover so targets never crowd below 44px.
- **375:** gate card `w-full` padded; header per 4.2 (badges drop, chip condenses, menu is
  avatar-only); fund modal full-width `mx-4`, presets wrap.
- **768:** header wraps to two rows; modal centered; menu full.
- **1280:** all three header zones single row; comfortable.

---

## 7. For the engineer

### Component tree

```
app/layout.tsx
  └─ PrivyClientProvider  (new, "use client")   // wraps children; no-op when unconfigured
app/app/page.tsx
  └─ AuthGate  (new)                             // decides: gate | read-only | terminal
       ├─ SignInScreen (new)                     // 4.1 / 4.5 unconfigured variant
       └─ Terminal (existing page body)
            ├─ Header (modified)
            │    ├─ Zone A: Logo + conn (existing)
            │    ├─ Zone B: badges + AgentVaultChip (renamed WalletChip) + operator controls
            │    └─ Zone C: UserWalletMenu (new)  |  SignInButton (read-only)
            ├─ ReadOnlyBanner (new, conditional)  // 4.5
            ├─ ...existing panels...
            │    └─ PortfolioPanel (relabel on-chain row)
            └─ FundAgentModal (new)               // 4.4, portal
```

### Files to create

- `frontend/components/auth/PrivyClientProvider.tsx`
- `frontend/components/auth/AuthGate.tsx`
- `frontend/components/auth/SignInScreen.tsx`
- `frontend/components/auth/UserWalletMenu.tsx`
- `frontend/components/auth/FundAgentModal.tsx`
- `frontend/components/auth/ReadOnlyBanner.tsx`
- `frontend/lib/usePrivyState.ts` (thin wrapper: `{ ready, authenticated, configured,
  readOnly, user, solanaWallet, logout }`; `configured = !!NEXT_PUBLIC_PRIVY_APP_ID`)
- `frontend/lib/identicon.ts` (deterministic address -> svg/gradient; no external asset)

### Files to modify

- `frontend/app/layout.tsx` (wrap in `PrivyClientProvider`)
- `frontend/app/app/page.tsx` (mount `AuthGate`; de-em-dash footer line)
- `frontend/components/Header.tsx` (three zones; rename `WalletChip` -> `AgentVaultChip`,
  purple accent + label + Fund button; disabled controls when not authed; add
  `UserWalletMenu` / `SignInButton`)
- `frontend/components/PortfolioPanel.tsx` (row label -> "Agent Vault balance")
- `frontend/components/landing/FinalCta.tsx` (rewrite sub copy, 4.7)

### Dependencies to add

- `@privy-io/react-auth` (auth + embedded/external wallets)
- `@solana/web3.js` (build the SystemProgram transfer for Fund; sign via Privy)

### Intended Privy config (`PrivyProvider` props)

- `appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}`; if absent, render children directly in
  read-only mode (never mount the provider, never throw).
- `config.loginMethods: ['email', 'google', 'wallet']` (email + social + external).
- `config.appearance`: `theme: 'dark'`, `accentColor: '#9945FF'`, `logo` = SolVane mark,
  so the Privy modal matches the terminal.
- `config.embeddedWallets`: create a Solana embedded wallet on login for email/social
  users (`createOnLogin: 'users-without-wallets'`), so every authenticated user has a
  Solana address to fund from.
- Solana: enable external Solana wallet connectors (Phantom, Backpack, Solflare) and the
  Solana embedded wallet, matching the terminal's devnet cluster.
- Fund flow: read vault address from `/api/wallet` (`address`), build a
  `SystemProgram.transfer` for `amount` lamports from the Privy Solana wallet to the
  vault, sign+send via the Privy Solana provider on the same cluster as `status.cluster`.

### Backend note (not this agent's job, flag only)

No backend change is required for read-only, gating, or funding (the transfer is a plain
on-chain SOL send to the existing vault address). If a "who funded" audit trail is
wanted later, add a `POST /api/wallet/funded` breadcrumb. Out of scope here.
