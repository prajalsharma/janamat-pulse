'use client';

/**
 * Full-width amber notice under the header when the terminal is view-only.
 * Amber (not red) because nothing is broken - this is a limited/paused state.
 * The "Sign in" affordance is hidden when Privy is unconfigured (it would no-op).
 */

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

export function ReadOnlyBanner({
  configured,
  onSignIn,
}: {
  configured: boolean;
  onSignIn: () => void;
}) {
  return (
    <div
      role="status"
      className="border-b border-warn/25 bg-warn/10 text-warn"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-2 text-[12.5px]">
        <span>Read-only demo. Sign in to control or fund the agent.</span>
        {configured && (
          <button
            onClick={onSignIn}
            className={`ml-auto rounded-md px-2 py-0.5 font-medium underline-offset-2 transition-colors duration-100 hover:underline ${FOCUS_RING}`}
          >
            Sign in
          </button>
        )}
      </div>
    </div>
  );
}
