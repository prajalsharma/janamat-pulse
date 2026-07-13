/** Number + address formatting. Consistent precision per the number-formatting spec. */

export function usd(n: number | null | undefined, dp = 2): string {
  if (n == null || Number.isNaN(n)) return '-';
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

export function signedUsd(n: number | null | undefined, dp = 2): string {
  if (n == null || Number.isNaN(n)) return '-';
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
}

export function pct(n: number | null | undefined, dp = 1): string {
  if (n == null || Number.isNaN(n)) return '-';
  return `${(n * 100).toFixed(dp)}%`;
}

export function token(n: number | null | undefined, dp = 4): string {
  if (n == null || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dp });
}

export function shortAddr(addr: string | null, lead = 4, tail = 4): string {
  if (!addr) return '-';
  if (addr.length <= lead + tail + 1) return addr;
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

export function ago(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function clockIn(ts: number | null): string {
  if (!ts) return '-';
  const s = Math.max(0, Math.round((ts - Date.now()) / 1000));
  return `${s}s`;
}
