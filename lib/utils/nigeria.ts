// lib/utils/nigeria.ts
// Nigerian cities, areas, categories, and constants
// These are the building blocks for filters, search, and venue classification
// Update NIGERIA_AREAS when adding new cities or as the app expands

import type { NigeriaCity, VenueCategory } from '@/types/database';

// ─── Cities ───────────────────────────────────────────────────────────────────

export const NIGERIA_CITIES: NigeriaCity[] = ['Lagos', 'Abuja', 'Port Harcourt'];

// ─── Areas by city ────────────────────────────────────────────────────────────
// Most popular areas where venues are concentrated
// VI = Victoria Island (used everywhere on socials)

export const NIGERIA_AREAS: Record<NigeriaCity, string[]> = {
  Lagos: [
    'Victoria Island',
    'Lekki',
    'Ikoyi',
    'Ikeja',
    'Surulere',
    'Ajah',
    'Lagos Island',
    'Yaba',
    'Oniru',
    'Osapa',
  ],
  Abuja: [
    'Maitama',
    'Wuse',
    'Wuse 2',
    'Garki',
    'Asokoro',
    'Gwarinpa',
    'Jabi',
    'Utako',
    'Central Business District',
  ],
  'Port Harcourt': [
    'GRA Phase 1',
    'GRA Phase 2',
    'D-Line',
    'Rumuola',
    'Trans Amadi',
    'Old GRA',
    'Peter Odili',
  ],
};

// ─── Venue categories ─────────────────────────────────────────────────────────

export const VENUE_CATEGORIES: { value: VenueCategory; label: string; emoji: string }[] = [
  { value: 'Food',  label: 'Food & Drinks', emoji: '🍽️' },
  { value: 'Stay',  label: 'Hotels & Stays', emoji: '🏨' },
  { value: 'Party', label: 'Clubs & Bars',   emoji: '🎉' },
  { value: 'Chill', label: 'Chill Spots',    emoji: '☀️' },
];

// ─── Vibe tags ────────────────────────────────────────────────────────────────
// These must match exactly what the AI is allowed to return in SUMMARY_SYSTEM_PROMPT

export const VIBE_TAGS: string[] = [
  'Date spot',
  'Great for photos',
  'Loud',
  'Quiet work spot',
  'Live music',
  'Family friendly',
  'Late night',
  'Good for groups',
  'Affordable',
  'Upscale',
  'Outdoor seating',
];

// ─── Hashtags ─────────────────────────────────────────────────────────────────
// Export here too so frontend and scripts can reference same list

export const NIGERIA_HASHTAGS: string[] = [
  '#LagosEats', '#LagosNightlife', '#LagosRestaurants',
  '#AbujaEats', '#AbujaVibes', '#AbujaRestaurants',
  '#PHCity', '#PortHarcourt',
  '#NaijaFoodie', '#NaijaEats',
  '#WhereToEatLagos', '#LagosWeekend', '#LagosHotels',
  '#LagosBar', '#LagosClub', '#VictoriaIsland',
];

// ─── City meta (for SEO and city landing pages) ───────────────────────────────

export const CITY_META: Record<NigeriaCity, { description: string; keywords: string[] }> = {
  Lagos: {
    description: 'Find the best restaurants, hotels, clubs, and chill spots in Lagos, Nigeria. Real-time vibe scores from Instagram, TikTok, and X.',
    keywords: ['Lagos restaurants', 'Lagos nightlife', 'Victoria Island spots', 'Lekki restaurants', 'Lagos hotels'],
  },
  Abuja: {
    description: 'Discover top-rated venues in Abuja, Nigeria. AI-powered vibe scores updated every 48 hours from real social media posts.',
    keywords: ['Abuja restaurants', 'Abuja nightlife', 'Maitama spots', 'Wuse restaurants', 'Abuja hotels'],
  },
  'Port Harcourt': {
    description: 'Explore the best spots in Port Harcourt, Nigeria. Social proof directory powered by real reviews from Instagram, TikTok, and X.',
    keywords: ['Port Harcourt restaurants', 'PH nightlife', 'GRA restaurants', 'Port Harcourt hotels'],
  },
};
