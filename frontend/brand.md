# Brand — SolVane

_Status: active — derived from `solvane-logo-v3.svg`_

SolVane is a news-sentiment AI trading agent for Solana. The product is a live
trading terminal: it must feel precise, fast, and trustworthy — a professional
instrument, not a toy. Dark-first, because that is where traders live.

## Palette

Anchored to Solana's brand gradient (purple → green) pulled straight from the logo.

| Token            | Hex        | Use                                            |
| ---------------- | ---------- | ---------------------------------------------- |
| Purple (primary) | `#9945FF`  | Primary accent, gradient start, active states  |
| Green (signal)   | `#14F195`  | Bullish, positive P&L, gradient end, success   |
| Green (deep)     | `#0E8F63`  | Wordmark accent, secondary green               |
| Ink / badge      | `#0B0B14`  | App background base                             |
| Surface          | `#12121C`  | Cards, panels                                  |
| Surface-2        | `#191926`  | Elevated rows, inputs                          |
| Border           | `#242433`  | Hairlines, dividers                            |
| Text             | `#ECECF3`  | Primary text                                   |
| Muted            | `#8A8A9A`  | Secondary text, labels                         |
| Bearish / danger | `#FF5C7A`  | Bearish sentiment, negative P&L, errors        |
| Warning          | `#FFB020`  | Cooldowns, pending, caution                    |

Signal semantics are strict: **green = bullish/up**, **red = bearish/down**,
**purple = the agent / brand**, **amber = paused/pending**. Never mix these.

## Typography

- **UI sans:** Geist (via `next/font`). Tight, modern, neutral.
- **Numeric / mono:** Geist Mono — every price, amount, %, and address uses
  tabular mono so columns align and numbers don't jump.

## Gradient

`linear-gradient(120deg, #9945FF 0%, #14F195 100%)` — the "SolVane beam". Used
sparingly: logo, primary CTA, active sentiment gauge, one hero accent per view.
Never as a full-panel background.

## Voice

Terse, quantified, honest. "BUY approved · conf 78%" not "The AI has decided to
buy!". Surface reasoning, never hype. This is a demo instrument — say so where it
matters (dry-run badge), never oversell.
