import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * Wallet + RPC access. The secret key never leaves this module.
 *
 * The agent ALWAYS has a real wallet with a real address:
 *  - If AGENT_WALLET_SECRET is set, that key is used (base58 or JSON-array form).
 *  - Otherwise a Keypair is auto-generated once and persisted to
 *    data/agent-wallet.json (the 64-byte secret-key array, same format as the
 *    Solana CLI). It is loaded back on every subsequent boot and never
 *    overwritten. This keeps the MVP honest - a genuine keypair, not a fake.
 */
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', '..', 'data');
const walletFile = join(dataDir, 'agent-wallet.json');

function decodeBase58(str: string): Uint8Array {
  const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const bytes: number[] = [0];
  for (const ch of str) {
    const value = ALPHABET.indexOf(ch);
    if (value === -1) throw new Error('invalid base58 character');
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let k = 0; k < str.length && str[k] === '1'; k++) bytes.push(0);
  return Uint8Array.from(bytes.reverse());
}

class WalletService {
  readonly connection: Connection;
  private keypair: Keypair;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.keypair = this.resolveKeypair();
    logger.info({ pubkey: this.publicKey, cluster: config.solana.cluster }, 'agent wallet ready');
  }

  /** Load from an explicit secret, else load/create the persisted keypair. */
  private resolveKeypair(): Keypair {
    if (config.solana.hasWallet) {
      const secret = config.solana.walletSecret.trim();
      const bytes = secret.startsWith('[')
        ? Uint8Array.from(JSON.parse(secret))
        : decodeBase58(secret);
      return Keypair.fromSecretKey(bytes);
    }
    return this.loadOrCreatePersisted();
  }

  private loadOrCreatePersisted(): Keypair {
    mkdirSync(dataDir, { recursive: true });
    // Never overwrite an existing file - the persisted key is the agent's identity.
    if (existsSync(walletFile)) {
      try {
        const bytes = Uint8Array.from(JSON.parse(readFileSync(walletFile, 'utf8')));
        const kp = Keypair.fromSecretKey(bytes);
        logger.info({ file: walletFile }, 'loaded persisted agent wallet');
        return kp;
      } catch (err) {
        // A corrupt file is fatal for signing integrity - do NOT silently mint a
        // new key over it (would strand any funds on the old address).
        throw new Error(
          `agent wallet file ${walletFile} is unreadable: ${(err as Error).message}`,
        );
      }
    }
    const kp = Keypair.generate();
    writeFileSync(walletFile, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
    logger.info({ file: walletFile, pubkey: kp.publicKey.toBase58() }, 'generated + persisted new agent wallet');
    return kp;
  }

  get signer(): Keypair {
    return this.keypair;
  }

  get publicKey(): string {
    return this.keypair.publicKey.toBase58();
  }

  async getSolBalance(): Promise<number> {
    try {
      const lamports = await this.connection.getBalance(this.keypair.publicKey);
      return lamports / LAMPORTS_PER_SOL;
    } catch (err) {
      logger.debug({ err: (err as Error).message }, 'getSolBalance failed');
      return 0;
    }
  }

  async getTokenBalance(mint: string): Promise<number> {
    try {
      const accounts = await this.connection.getParsedTokenAccountsByOwner(
        this.keypair.publicKey,
        { mint: new PublicKey(mint) },
      );
      let total = 0;
      for (const acc of accounts.value) {
        total += acc.account.data.parsed.info.tokenAmount.uiAmount ?? 0;
      }
      return total;
    } catch (err) {
      logger.debug({ err: (err as Error).message }, 'getTokenBalance failed');
      return 0;
    }
  }

  /** USDC balance (the configured quote mint). */
  async getUsdcBalance(): Promise<number> {
    return this.getTokenBalance(config.trade.quoteMint);
  }

  /**
   * Request a devnet airdrop and wait for confirmation. Only devnet has a
   * faucet - mainnet/testnet callers get a hard error so this can never be
   * mistaken for free mainnet SOL.
   */
  async requestAirdrop(sol = 1): Promise<string> {
    if (config.solana.cluster !== 'devnet') {
      throw new Error('airdrop only available on devnet');
    }
    const lamports = Math.round(sol * LAMPORTS_PER_SOL);
    try {
      const sig = await this.connection.requestAirdrop(this.keypair.publicKey, lamports);
      const latest = await this.connection.getLatestBlockhash();
      await this.connection.confirmTransaction({ signature: sig, ...latest }, 'confirmed');
      logger.info({ sig, sol, pubkey: this.publicKey }, 'devnet airdrop confirmed');
      return sig;
    } catch (err) {
      const msg = (err as Error).message ?? '';
      // The public devnet faucet is frequently rate-limited/exhausted (429).
      // Surface a clear, actionable message instead of a raw RPC error.
      if (msg.includes('429') || /limit|dry|faucet/i.test(msg)) {
        throw new Error(
          'Public devnet faucet is rate-limited right now. Try again later or fund the address at faucet.solana.com.',
        );
      }
      throw new Error(`airdrop failed: ${msg}`);
    }
  }
}

export const walletService = new WalletService();
