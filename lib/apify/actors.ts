// lib/apify/actors.ts
// Centralized Apify actor config — change actor IDs here only
// If an actor gets deprecated or replaced, update this file and all callers update automatically

export const ACTORS = {
  GOOGLE_MAPS:        'apify/google-maps-scraper',
  INSTAGRAM_HASHTAG:  'apify/instagram-hashtag-scraper',
  INSTAGRAM_COMMENTS: 'apify/instagram-comment-scraper',
  TWITTER:            'apify/twitter-scraper',
  TIKTOK_HASHTAG:     'clockworks/free-tiktok-scraper',
  TIKTOK_COMMENTS:    'novi/tiktok-comment-scraper',
} as const;

// Nigerian hashtags to scrape for social proof
// These are the main discovery channels for Lagos, Abuja, and PH spots
export const NIGERIA_HASHTAGS = [
  '#LagosEats', '#LagosNightlife', '#LagosRestaurants',
  '#AbujaEats', '#AbujaVibes', '#AbujaRestaurants',
  '#PHCity', '#PortHarcourt',
  '#NaijaFoodie', '#NaijaEats',
  '#WhereToEatLagos', '#LagosWeekend', '#LagosHotels',
  '#LagosBar', '#LagosClub', '#VictoriaIsland',
];

// ─── Actor input builders ─────────────────────────────────────────────────────
// These functions build the input payloads for each Apify actor
// Centralising here means changing search params is a one-line fix

/**
 * Build input for the Instagram Hashtag Scraper
 * Scrapes recent posts for a given hashtag
 */
export function buildInstagramHashtagInput(hashtags: string[], resultsPerHashtag = 50) {
  return {
    hashtags: hashtags.map((h) => h.replace('#', '')), // Actor expects no # prefix
    resultsLimit: resultsPerHashtag,
    scrapeType: 'posts',
  };
}

/**
 * Build input for the Twitter/X Scraper
 * Searches by hashtag or keyword
 */
export function buildTwitterInput(searchTerms: string[], maxTweets = 100) {
  return {
    searchTerms,
    maxTweets,
    addUserInfo: true,
    startUrls: [],
    lang: '', // Empty = all languages (Nigerian users often tweet in English + Pidgin)
  };
}

/**
 * Build input for the TikTok Hashtag Scraper
 */
export function buildTikTokInput(hashtags: string[], maxItems = 50) {
  return {
    hashtags: hashtags.map((h) => h.replace('#', '')),
    maxItems,
  };
}

/**
 * Build input for Google Maps Scraper — used in the seed script to pull initial venues
 * Searches by category + city to build out the venue directory
 */
export function buildGoogleMapsInput(searchTerms: string[], maxResults = 100) {
  return {
    searchStringsArray: searchTerms,
    maxCrawledPlacesPerSearch: maxResults,
    language: 'en',
    countryCode: 'ng', // Nigeria
    includeHistogram: false,
    includeOpeningHours: true,
    includePeopleAlsoSearch: false,
  };
}
