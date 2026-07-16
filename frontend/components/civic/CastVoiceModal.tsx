'use client';

import { useEffect, useState } from 'react';
import { X, Fingerprint, Link2, CheckCircle2, Loader2, LogIn, ShieldCheck } from 'lucide-react';
import { castOpinion, type CivicProjectView, type OpinionResult } from '@/lib/civic';
import { usePrivyState } from '@/lib/usePrivyState';
import { shortAddr } from '@/lib/format';

type Phase = 'form' | 'verifying' | 'anchoring' | 'done' | 'error';

/**
 * One account = one voice per project. Identity is Privy social login: the user
 * signs in, and their Privy access token is verified server-side and mapped to a
 * per-project nullifier. This is honest social-login sybil resistance, NOT
 * passport-grade personhood. Copy avoids em/en dashes.
 */
export function CastVoiceModal({
  project,
  onClose,
}: {
  project: CivicProjectView;
  onClose: () => void;
}) {
  const { configured, ready, authenticated, loggingIn, loginError, email, solanaWallet, login, getAccessToken } =
    usePrivyState();
  const [phase, setPhase] = useState<Phase>('form');
  const [sentiment, setSentiment] = useState(-40);
  const [result, setResult] = useState<OpinionResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit() {
    setErr(null);
    setPhase('verifying');
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Could not read your sign-in. Please sign in again.');
      setPhase('anchoring');
      const r = await castOpinion({
        projectId: project.id,
        sentiment,
        confidence: 80,
        accessToken: token,
      });
      setResult(r);
      setPhase('done');
    } catch (e) {
      setErr((e as Error).message);
      setPhase('error');
    }
  }

  const stanceLabel = sentiment <= -20 ? 'Disputes the claim' : sentiment >= 20 ? 'Corroborates the claim' : 'Neutral';
  const stanceColor = sentiment <= -20 ? 'text-civic' : sentiment >= 20 ? 'text-signal' : 'text-content-muted';
  const identityLabel = solanaWallet?.address ? shortAddr(solanaWallet.address) : email ?? 'your account';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Cast your voice on ${project.name}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-line bg-surface shadow-panel animate-fade-up">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2 text-content">
            <Fingerprint size={18} className="text-signal" aria-hidden />
            <span className="text-[15px] font-semibold">Cast your voice</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-content-faint hover:text-content hover:bg-white/5 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[13px] text-content-muted">
            On <span className="text-content font-medium">{project.name}</span>. Verified via social
            login (one account, one voice per project). Passport-grade zk identity (zkPassport /
            Self) is the documented upgrade. Your sentiment is anchored on-chain under an unlinkable
            nullifier, never your name.
          </p>

          {phase === 'form' || phase === 'error' ? (
            <>
              {/* sentiment slider */}
              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label htmlFor="sentiment" className="text-[12px] text-content-muted">
                    Your read on the official claim
                  </label>
                  <span className={`text-[12px] font-medium ${stanceColor}`}>{stanceLabel}</span>
                </div>
                <input
                  id="sentiment"
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={sentiment}
                  onChange={(e) => setSentiment(Number(e.target.value))}
                  className="mt-2 w-full accent-signal cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-content-faint">
                  <span>Disputes</span>
                  <span className="tnum font-mono">{sentiment > 0 ? '+' : ''}{sentiment}</span>
                  <span>Corroborates</span>
                </div>
              </div>

              {err && (
                <p role="alert" className="mt-3 text-[12px] text-civic">
                  {err}
                </p>
              )}

              {/* identity gate */}
              {!configured ? (
                <p className="mt-5 rounded-md border border-line bg-ink px-3 py-2.5 text-[12px] text-content-muted">
                  Sign-in is not configured for this deployment, so voices cannot be recorded here.
                </p>
              ) : !authenticated ? (
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={login}
                    disabled={!ready || loggingIn}
                    className="flex w-full items-center justify-center gap-2 rounded-md bg-signal px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-signal/90 disabled:opacity-60 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    {loggingIn ? (
                      <Loader2 size={15} className="animate-spin" aria-hidden />
                    ) : (
                      <LogIn size={15} aria-hidden />
                    )}
                    Sign in to cast your voice
                  </button>
                  <p className="mt-2 text-[11px] text-content-faint">
                    Sign in with email, Google, X, or a wallet. One verified account can weigh in
                    once per project.
                  </p>
                  {loginError && (
                    <p role="alert" className="mt-2 text-[11px] text-civic">
                      {loginError}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="mt-5 flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-2.5">
                    <ShieldCheck size={15} className="text-signal" aria-hidden />
                    <span className="text-[12px] text-content-muted">
                      Signed in as{' '}
                      <span className="font-mono text-content">{identityLabel}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={submit}
                    className="mt-4 w-full rounded-md bg-signal px-4 py-2.5 text-[14px] font-semibold text-ink transition-colors hover:bg-signal/90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                  >
                    Verify and record on-chain
                  </button>
                </>
              )}
            </>
          ) : null}

          {(phase === 'verifying' || phase === 'anchoring') && (
            <div className="mt-6 flex flex-col items-center gap-3 py-4 text-center">
              <Loader2 size={26} className="animate-spin text-signal" aria-hidden />
              <p className="text-[13px] text-content-muted">
                {phase === 'verifying' ? 'Verifying your sign-in…' : 'Anchoring your voice on Solana…'}
              </p>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="mt-6 flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2 size={30} className="text-signal" aria-hidden />
              <p className="text-[14px] font-medium text-content">Your voice was recorded.</p>
              <div className="w-full rounded-lg border border-line bg-ink p-3 text-left">
                <div className="text-[10px] uppercase tracking-[0.14em] text-content-faint">Nullifier (unlinkable)</div>
                <code className="mt-1 block break-all font-mono text-[11px] text-content-muted">{result.nullifier}</code>
                {result.onChain && result.signature ? (
                  <a
                    href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-chain hover:text-chain/80 cursor-pointer"
                  >
                    <Link2 size={13} aria-hidden />
                    View transaction
                  </a>
                ) : (
                  <p className="mt-2 text-[11px] text-content-faint">
                    Off-chain mode: nullifier derived, not broadcast (set a program id to anchor).
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-md border border-line px-4 py-2 text-[13px] text-content hover:bg-white/5 cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
