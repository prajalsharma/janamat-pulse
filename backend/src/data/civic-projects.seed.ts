import { CivicCategory, type CivicProject } from '../types/civic.js';

/**
 * Seed registry of nationally-salient Nepali government projects for the MVP.
 *
 * Chosen for (a) direct relevance to Janamat's anti-corruption / project-
 * milestone-transparency thesis, and (b) rich, ongoing public discourse so the
 * agent has real sentiment to score. `officialClaim` is the government's asserted
 * status — the accountability engine diffs public sentiment against it.
 *
 * NOTE: officialClaim values below are illustrative starting points for the demo
 * and must be sourced/updated from official statements before any public launch.
 */
export const CIVIC_PROJECTS: CivicProject[] = [
  {
    id: 1,
    name: 'Melamchi Water Supply Project',
    category: CivicCategory.Water,
    region: 'Kathmandu Valley',
    officialClaim:
      'Water is being delivered to Kathmandu Valley households; disruptions from monsoon damage are being repaired on schedule.',
    keywords: [
      'melamchi',
      'water supply',
      'kathmandu water',
      'khms',
      'melamchi drinking water',
    ],
  },
  {
    id: 2,
    name: 'Pokhara International Airport',
    category: CivicCategory.Aviation,
    region: 'Gandaki / Pokhara',
    officialClaim:
      'The airport is operational and attracting international flights, delivering economic returns that justify its cost.',
    keywords: [
      'pokhara airport',
      'pokhara international airport',
      'pia',
      'regional international airport pokhara',
    ],
  },
  {
    id: 3,
    name: 'Kathmandu–Terai (Fast Track) Expressway',
    category: CivicCategory.Infrastructure,
    region: 'Bagmati / Madhesh',
    officialClaim:
      'Construction is progressing toward the revised completion target with no further major delays expected.',
    keywords: [
      'fast track',
      'kathmandu terai',
      'expressway',
      'kathmandu-terai fast track',
      'nijgadh',
    ],
  },
];

/** Attribute a headline/text to a tracked project by keyword match, or null. */
export function attributeProject(text: string): CivicProject | null {
  const hay = text.toLowerCase();
  for (const p of CIVIC_PROJECTS) {
    if (p.keywords.some((k) => hay.includes(k))) return p;
  }
  return null;
}
