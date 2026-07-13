/**
 * Deterministic, keyless identicon for the YOUR-wallet identity slot.
 *
 * Two-wallet design rule: identity carries NO signal color. Purple = the agent,
 * green = bull, red = bear are reserved. So the identicon hue is constrained to a
 * neutral cool band (steel / slate, hue 195-235, low saturation) - distinct per
 * address, but never readable as a market or brand accent.
 *
 * GitHub-style 5x5 symmetric pixel grid, mirrored horizontally, derived purely
 * from the address string. No external asset, no network.
 */

function hash32(input: string): number {
  // FNV-1a, stable across runs.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Neutral cool hue in [195, 235]; never lands on purple/green/red signals. */
export function identiconHue(address: string): number {
  return 195 + (hash32(address) % 41);
}

/** 5x5 boolean grid, left half hashed then mirrored to the right for symmetry. */
export function identiconCells(address: string): boolean[][] {
  const h = hash32(address + ':cells');
  const grid: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [false, false, false, false, false];
    for (let x = 0; x < 3; x++) {
      // One bit per left-half cell; deterministic spread across the hash.
      const on = ((h >> ((y * 3 + x) % 30)) & 1) === 1;
      row[x] = on;
      row[4 - x] = on;
    }
    grid.push(row);
  }
  return grid;
}
