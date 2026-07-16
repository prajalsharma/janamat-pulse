import 'dotenv/config';
import { z } from 'zod';

/**
 * Central, validated configuration. Every module reads from `config` so that
 * env parsing + defaults live in exactly one place. Invalid values fail fast
 * at boot rather than surfacing as mysterious runtime errors.
 */
const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-opus-4-8'),

  SOLANA_RPC_URL: z.string().url().default('https://api.mainnet-beta.solana.com'),
  SOLANA_CLUSTER: z.enum(['mainnet-beta', 'devnet', 'testnet']).default('mainnet-beta'),
  AGENT_WALLET_SECRET: z.string().optional().default(''),

  EXECUTION_MODE: z.enum(['dry-run', 'live']).default('dry-run'),

  QUOTE_MINT: z.string().default('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
  BASE_MINT: z.string().default('So11111111111111111111111111111111111111112'),

  MAX_TRADE_USD: z.coerce.number().positive().default(50),
  MIN_SENTIMENT_CONFIDENCE: z.coerce.number().min(0).max(1).default(0.6),
  MIN_PRICE_MOVE_PCT: z.coerce.number().min(0).default(1.0),
  TRADE_COOLDOWN_SECONDS: z.coerce.number().int().nonnegative().default(120),
  MAX_SLIPPAGE_BPS: z.coerce.number().int().positive().default(100),

  AGENT_TICK_SECONDS: z.coerce.number().int().positive().default(45),

  PRICE_MODE: z.enum(['sentiment', 'live']).default('sentiment'),
  PRICE_MAX_DRIFT_PCT: z.coerce.number().min(0).default(0.8),

  NEWS_FEEDS: z
    .string()
    .default(
      'https://cointelegraph.com/rss/tag/solana,https://decrypt.co/feed,https://cryptoslate.com/feed/',
    ),

  // ── Janamat Pulse: civic domain ─────────────────────────────────────────
  // Nepali news RSS the agent reads for civic discourse. Free + keyless.
  CIVIC_NEWS_FEEDS: z
    .string()
    .default(
      'https://english.onlinekhabar.com/feed,https://kathmandupost.com/rss,https://myrepublica.nagariknetwork.com/feed/,https://english.khabarhub.com/feed/',
    ),
  // A project is flagged when average public sentiment falls to or below this
  // (-100..100). Government claims are implicitly positive, so a strongly
  // negative public reading is the accountability gap.
  CIVIC_FLAG_THRESHOLD: z.coerce.number().min(-100).max(100).default(-20),
  // Minimum attributed items before a project's flag is considered meaningful.
  CIVIC_MIN_SAMPLE: z.coerce.number().int().positive().default(3),

  // On-chain anchoring (optional; set after `anchor deploy`). When unset the
  // agent runs fully off-chain and the opinion API returns the derived nullifier
  // without broadcasting.
  CIVIC_PROGRAM_ID: z.string().optional().default(''),
  CIVIC_RELAYER_KEY: z.string().optional().default('~/.config/solana/id.json'),

  // Privy identity layer (optional). When both are set, the opinion API verifies
  // the Privy access token server-side and uses the stable Privy user id as the
  // identity for the nullifier. When PRIVY_APP_SECRET is unset the server runs in
  // dev mode: it trusts the token's subject WITHOUT cryptographic verification so
  // local development still works end to end.
  PRIVY_APP_ID: z.string().optional().default(''),
  PRIVY_APP_SECRET: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('✖ Invalid environment configuration:\n', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  port: env.PORT,
  logLevel: env.LOG_LEVEL,

  ai: {
    apiKey: env.ANTHROPIC_API_KEY,
    model: env.ANTHROPIC_MODEL,
    enabled: env.ANTHROPIC_API_KEY.length > 0,
  },

  solana: {
    rpcUrl: env.SOLANA_RPC_URL,
    cluster: env.SOLANA_CLUSTER,
    walletSecret: env.AGENT_WALLET_SECRET,
    hasWallet: env.AGENT_WALLET_SECRET.length > 0,
  },

  executionMode: env.EXECUTION_MODE,

  trade: {
    quoteMint: env.QUOTE_MINT,
    baseMint: env.BASE_MINT,
    maxTradeUsd: env.MAX_TRADE_USD,
    minConfidence: env.MIN_SENTIMENT_CONFIDENCE,
    minPriceMovePct: env.MIN_PRICE_MOVE_PCT,
    cooldownSeconds: env.TRADE_COOLDOWN_SECONDS,
    maxSlippageBps: env.MAX_SLIPPAGE_BPS,
  },

  agent: {
    tickSeconds: env.AGENT_TICK_SECONDS,
  },

  price: {
    // 'sentiment' drives a news-reactive simulated price (demo + AI-optional
    // backup). Forced to 'live' whenever EXECUTION_MODE is live so real trades
    // never size off a simulated number.
    mode: env.EXECUTION_MODE === 'live' ? 'live' : env.PRICE_MODE,
    maxDriftPct: env.PRICE_MAX_DRIFT_PCT,
  },

  newsFeeds: env.NEWS_FEEDS.split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  civic: {
    feeds: env.CIVIC_NEWS_FEEDS.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    flagThreshold: env.CIVIC_FLAG_THRESHOLD,
    minSample: env.CIVIC_MIN_SAMPLE,
  },

  onchain: {
    programId: env.CIVIC_PROGRAM_ID,
    relayerKey: env.CIVIC_RELAYER_KEY,
    enabled: env.CIVIC_PROGRAM_ID.length > 0,
  },

  privy: {
    appId: env.PRIVY_APP_ID,
    appSecret: env.PRIVY_APP_SECRET,
    // Server-side token verification is on only when the secret is present.
    enabled: env.PRIVY_APP_SECRET.length > 0,
  },
} as const;

export type Config = typeof config;
