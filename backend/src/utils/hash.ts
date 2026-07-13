import { createHash } from 'node:crypto';

/** Short, stable id derived from arbitrary input - used for dedup of news + records. */
export function stableId(...parts: (string | number)[]): string {
  return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 16);
}
