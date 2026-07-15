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
    searchQuery: 'Melamchi water supply Kathmandu',
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
    searchQuery: '"Pokhara International Airport"',
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
      'kathmandu tarai',
      'expressway',
      'kathmandu-terai fast track',
      'nijgadh',
    ],
    searchQuery: 'Kathmandu Terai Fast Track expressway',
  },
];

/**
 * Build a live Google News RSS search feed for a project. This is how the agent
 * sources REAL, project-specific discourse: the feed is derived from the project
 * itself (not a hardcoded URL list), so it scales with the registry.
 */
export function projectNewsFeed(p: CivicProject): string {
  const q = encodeURIComponent(p.searchQuery ?? p.name);
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
}

/** One live news-search feed per tracked project. */
export function projectNewsFeeds(): string[] {
  return CIVIC_PROJECTS.map(projectNewsFeed);
}

/** Attribute a headline/text to a tracked project by keyword match, or null. */
export function attributeProject(text: string): CivicProject | null {
  const hay = text.toLowerCase();
  for (const p of CIVIC_PROJECTS) {
    if (p.keywords.some((k) => hay.includes(k))) return p;
  }
  return null;
}
