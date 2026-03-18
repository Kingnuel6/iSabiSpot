# iSabiSpot — Claude Code Master Context
 
## What Is iSabiSpot?
 
**iSabiSpot** is an AI-powered Social Proof Directory for the Nigerian hospitality and
recreation industry. It scrapes real-time mentions from Instagram, X (Twitter), and TikTok,
then uses AI (via OpenRouter) to generate live "Vibe Scores" (1–10) and Pros/Cons summaries for
hotels, restaurants, and clubs across Lagos, Abuja, and Port Harcourt.
 
**Core value prop:** Where Google Maps shows you a 3-year-old 4-star rating, iSabiSpot
tells you "the AC has been out for 2 weeks and the jollof rice is still 🔥 though."
 
---
 
## Tech Stack
 
| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR for SEO, fast page loads, API routes built-in |
| Styling | Tailwind CSS + Shadcn/ui | Fast, consistent, accessible components |
| Type Safety | TypeScript (strict mode) | Catch errors early |
| State / Data | TanStack Query (React Query) | Server state, caching, background refetching |
| Forms | react-hook-form + Zod | Validated forms, reuse Zod schemas on API too |
| Database | Supabase (PostgreSQL) | Auth + DB + RLS + Edge Functions in one |
| DB Client | Supabase JS SDK | Direct typed queries, no ORM overhead needed |
| AI Brain | OpenRouter API | Gemini Flash Lite for bulk, DeepSeek V3.2 for summaries |
| Scraping | Apify | Managed actors for Instagram, X, TikTok, GMaps |
| Deployment | Vercel | Native Next.js support, cron jobs, env management |
| CI/CD | GitHub Actions | Lint + type-check on every PR |
 
---
 
## Full Project Structure
 
```
isabispot/
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout (fonts, providers, navbar)
│   ├── page.tsx                      # Homepage: hero + search + featured venues
│   ├── venues/
│   │   ├── page.tsx                  # Venue listing with filters
│   │   └── [slug]/
│   │       └── page.tsx              # Venue profile page
│   ├── cities/
│   │   └── [city]/page.tsx           # City landing page (Lagos, Abuja, PH)
│   └── api/
│       ├── venues/
│       │   ├── route.ts              # GET /api/venues (list + search + filter)
│       │   └── [slug]/route.ts       # GET /api/venues/:slug (single venue)
│       ├── scrape/
│       │   └── route.ts              # POST /api/scrape (trigger Apify job)
│       ├── process/
│       │   └── route.ts              # POST /api/process (run AI on raw mentions)
│       └── cron/
│           └── route.ts              # GET /api/cron (Vercel cron every 48hrs)
│
├── components/
│   ├── ui/                           # Shadcn/ui base components (auto-generated)
│   ├── layout/
│   │   ├── Navbar.tsx                # Top nav with search
│   │   └── Footer.tsx
│   ├── venue/
│   │   ├── VenueCard.tsx             # Card shown in listings grid
│   │   ├── VenueGrid.tsx             # Responsive grid of VenueCards
│   │   ├── VenueProfile.tsx          # Full venue detail view
│   │   ├── VibeScore.tsx             # Animated 1–10 score badge
│   │   ├── VibeSummary.tsx           # Pros/Cons + summary text
│   │   ├── VibeTags.tsx              # Tag pills: 'Date spot', 'Loud', etc.
│   │   └── MentionFeed.tsx           # Links to original social posts
│   ├── search/
│   │   ├── SearchBar.tsx             # Main search input
│   │   ├── FilterPanel.tsx           # City / Category / Vibe filters
│   │   └── SearchResults.tsx         # Results wrapper with empty states
│   └── shared/
│       ├── CityBadge.tsx             # Lagos / Abuja / PH pill
│       ├── CategoryIcon.tsx          # Food / Stay / Party / Chill icon
│       ├── LoadingSkeleton.tsx       # Skeleton screens for all cards
│       └── EmptyState.tsx            # "No spots found" UI
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client (anon key)
│   │   ├── server.ts                 # Server Supabase client (service role)
│   │   └── queries.ts                # All reusable DB query functions
│   ├── ai/
│   │   ├── client.ts                 # OpenRouter client (OpenAI-compatible SDK)
│   │   ├── prompts.ts                # All system prompts (with slang glossary)
│   │   └── processor.ts             # Batch mention processing logic
│   ├── apify/
│   │   ├── client.ts                 # Apify SDK instance
│   │   ├── actors.ts                 # Actor IDs + input builders
│   │   └── parser.ts                 # Normalize raw Apify output → DB shape
│   └── utils/
│       ├── vibe-score.ts             # Vibe Score calculation formula
│       ├── slug.ts                   # Generate URL slugs from venue names
│       └── nigeria.ts                # Nigerian cities, areas, slang constants
│
├── hooks/
│   ├── useVenues.ts                  # TanStack Query: fetch venues list
│   ├── useVenue.ts                   # TanStack Query: fetch single venue
│   └── useSearch.ts                  # Debounced search with filters
│
├── types/
│   ├── database.ts                   # TypeScript types mirroring Supabase tables
│   ├── api.ts                        # Request/Response types for API routes
│   └── apify.ts                      # Raw Apify actor output types
│
├── scripts/                          # Run manually or via CI — NOT part of Next.js
│   ├── seed-venues.ts                # One-time: pull 500+ venues from Google Maps
│   ├── scrape-mentions.ts            # Trigger Apify scrape for all platforms
│   └── process-mentions.ts           # Run AI processing on unprocessed mentions
│
├── supabase/
│   └── schema.sql                    # Full DB schema (source of truth)
│
├── .env.local                        # Real keys — NEVER commit this
├── .env.example                      # Placeholder keys — always commit this
├── .gitignore                        # Must include .env.local
├── vercel.json                       # Cron job config
└── CLAUDE.md                         # This file
```
 
---
 
## Data Flow Architecture
 
```
[Apify Actors]
    │  Instagram / X / TikTok / Google Maps
    ▼
[/api/scrape]  ←  triggered by Vercel Cron every 48hrs
    │  POST to Apify → get run_id → save scrape_job record
    ▼
[Apify Webhook / Polling]
    │  When run completes → raw posts land in mentions table (is_processed = false)
    ▼
[/api/process]
    │  Fetch all unprocessed mentions in batches of 50
    │  Send to gemini-2.0-flash-lite → get sentiment + ai_tags per mention
    │  Update mention records (is_processed = true)
    ▼
[vibe-score.ts]
    │  Recalculate venue.vibe_score from last 30 days of mentions
    │  Weighted: likes (40%) + follower count (30%) + recency (30%)
    ▼
[/api/process → summary step]
    │  Take top 20–50 recent mentions per venue
    │  Send to deepseek-v3.2 → get pros[], cons[], vibe_tags[], summary_text
    │  Upsert into summaries table (set is_current = true, archive old)
    ▼
[Supabase DB]
    │  venues + mentions + summaries all updated
    ▼
[Next.js Frontend]
    │  /venues → lists all venues, sorted by vibe_score desc
    │  /venues/[slug] → full profile: score + summary + mention feed
    ▼
[User sees]
    "Terra Kulture VI — Vibe Score: 8.4 🔥
     Pros: 'Food is consistently 🔥', 'Good for dates', 'Live music Fridays'
     Cons: 'Parking is a nightmare', 'Service slows after 9pm'"
```
 
---
 
## API Routes Specification
 
### `GET /api/venues`
Fetch venues with optional filters and search.
 
**Query params:**
- `city` — Lagos | Abuja | Port Harcourt
- `category` — Food | Stay | Party | Chill
- `search` — text search on venue name
- `sort` — vibe_score | name | updated_at (default: vibe_score)
- `limit` — default 20, max 50
- `offset` — for pagination
 
**Returns:** `{ venues: Venue[], total: number, hasMore: boolean }`
 
---
 
### `GET /api/venues/[slug]`
Full venue data including current summary and recent mentions.
 
**Returns:** `{ venue: Venue, summary: Summary, mentions: Mention[] }`
 
---
 
### `POST /api/scrape`
Triggers Apify scrape jobs. Protected — requires CRON_SECRET header.
 
**Body:** `{ platforms: ['instagram', 'twitter', 'tiktok'], hashtags?: string[] }`
 
**Returns:** `{ jobs: ScrapeJob[] }`
 
---
 
### `POST /api/process`
Runs AI processing on all unprocessed mentions. Protected — requires CRON_SECRET header.
 
**Body:** `{ venue_id?: string }` (optional — process single venue or all)
 
**Returns:** `{ processed: number, updated_venues: number }`
 
---
 
### `GET /api/cron`
Called by Vercel Cron every 48 hours. Chains scrape → process → score update.
 
**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 6 */2 * *"
    }
  ]
}
```
 
---
 
## Key Library Implementations
 
### `lib/supabase/queries.ts`
All DB queries in one place — no scattered Supabase calls across components.
 
```typescript
// Pattern: typed query functions only, no raw queries in components
export async function getVenues(filters: VenueFilters): Promise<Venue[]>
export async function getVenueBySlug(slug: string): Promise<VenueWithSummary | null>
export async function getUnprocessedMentions(limit: number): Promise<Mention[]>
export async function upsertVibeScore(venueId: string, score: number): Promise<void>
export async function upsertSummary(summary: NewSummary): Promise<void>
```
 
---
 
### `lib/ai/client.ts`
OpenRouter client using the OpenAI-compatible SDK. Just swap the base URL — same interface everywhere.
 
```typescript
import OpenAI from 'openai';
 
export const aiClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
 
// Bulk processing — cheap & fast (~$0.075/M input tokens)
// ⚠️ Going away June 1 2026 — migrate to gemini-3.1-flash-lite-preview before then
export const BULK_MODEL = 'google/gemini-2.0-flash-lite-001';
 
// Fallback bulk model (use this after June 2026)
export const BULK_MODEL_NEXT = 'google/gemini-3.1-flash-lite-preview';
 
// Summary generation — quality user-facing output (~$0.255/M input tokens)
export const SUMMARY_MODEL = 'deepseek/deepseek-v3.2';
```
 
---
 
### `lib/ai/prompts.ts`
System prompts with Nigerian slang context baked in.
 
```typescript
export const SENTIMENT_SYSTEM_PROMPT = `
You are an AI analyst for iSabiSpot, a Nigerian venue discovery platform.
 
Analyze social media posts about Nigerian restaurants, hotels, clubs, and chill spots.
 
NIGERIAN SLANG GLOSSARY (critical for accurate sentiment):
- "e choke" = amazing, overwhelming in a good way → POSITIVE
- "e dey sweet" = delicious / enjoyable → POSITIVE
- "it was a vibe" / "the vibe was mad" = great atmosphere → POSITIVE
- "the place dey gbadun" = place is lively/popping → POSITIVE
- "no cap" = for real, no lie (emphasis) → neutral amplifier
- "hammer" = a big success → POSITIVE
- "wash" / "e wash" = disappointing, overhyped → NEGATIVE
- "e no reach" = didn't meet expectations → NEGATIVE
- "dem chop my money" = felt ripped off → NEGATIVE
- "IJGB" = "I just got back" Nigerian returnee (context clue, not sentiment)
 
Return ONLY valid JSON. No markdown, no explanation.
`;
 
export const SUMMARY_SYSTEM_PROMPT = `
You are the AI brain of iSabiSpot, Nigeria's social proof venue directory.
 
Given a list of social media mentions about a Nigerian venue, generate:
1. pros: array of 3–5 specific positive points (use casual Nigerian tone)
2. cons: array of 2–4 specific negative points (honest, not harsh)
3. vibe_tags: array of 3–6 tags from: ['Date spot', 'Great for photos', 'Loud',
   'Quiet work spot', 'Live music', 'Family friendly', 'Late night',
   'Good for groups', 'Affordable', 'Upscale', 'Outdoor seating']
4. summary_text: 2–3 sentences, casual Nigerian voice, present tense
 
Return ONLY valid JSON. No markdown, no explanation.
`;
```
 
---
 
### `lib/utils/vibe-score.ts`
Vibe Score formula — transparent and reproducible.
 
```typescript
/**
 * Calculates Vibe Score (1.0–10.0) from last 30 days of mentions
 *
 * Weights:
 *   - Sentiment score:    40% (core signal)
 *   - Recency:            30% (fresher = more relevant)
 *   - Engagement (likes): 20% (popular posts matter more)
 *   - Influence:          10% (author follower count)
 */
export function calculateVibeScore(mentions: Mention[]): number
```
 
---
 
### `lib/apify/actors.ts`
Centralized Apify actor config — change actor IDs here only.
 
```typescript
export const ACTORS = {
  GOOGLE_MAPS:       'apify/google-maps-scraper',
  INSTAGRAM_HASHTAG: 'apify/instagram-hashtag-scraper',
  INSTAGRAM_COMMENTS:'apify/instagram-comment-scraper',
  TWITTER:           'apify/twitter-scraper',
  TIKTOK_HASHTAG:    'clockworks/free-tiktok-scraper',
  TIKTOK_COMMENTS:   'novi/tiktok-comment-scraper',
} as const;
 
export const NIGERIA_HASHTAGS = [
  '#LagosEats', '#LagosNightlife', '#LagosRestaurants',
  '#AbujaEats', '#AbujaVibes', '#AbujaRestaurants',
  '#PHCity', '#PortHarcourt',
  '#NaijaFoodie', '#NaijaEats',
  '#WhereToEatLagos', '#LagosWeekend', '#LagosHotels',
  '#LagosBar', '#LagosClub', '#VictoriaIsland',
];
```
 
---
 
## Frontend Pages Breakdown
 
### Homepage (`/`)
- Hero section: "Find Where Nigeria Is Vibing Right Now"
- Search bar (city dropdown + keyword input)
- Category pills: Food / Stay / Party / Chill
- Featured venues: top 6 by vibe_score across all cities
- City sections: Lagos trending, Abuja trending
- How it works: 3-step explainer
 
### Venue Listing (`/venues`)
- Filter sidebar: City, Category, Vibe Tags, Min Score
- Sort: Trending (vibe_score) / Newest / Alphabetical
- Responsive grid of VenueCards
- Pagination (20 per page)
- Empty state with suggestion to try different filters
 
### Venue Profile (`/venues/[slug]`)
- Hero: cover image, name, city/area badges, category
- Vibe Score: large animated number with trend indicator
- AI Summary: Pros list + Cons list (labeled "AI-generated from social posts")
- Vibe Tags: pill row
- Mention Feed: last 10 social posts with platform icon + link
- Last updated timestamp
 
### City Landing (`/cities/[city]`)
- Dynamic pages for Lagos, Abuja, Port Harcourt
- Top venues by category in that city
- SEO-optimized with city-specific meta tags
 
---
 
## TypeScript Types
 
```typescript
// types/database.ts
 
export type VenueCategory = 'Food' | 'Stay' | 'Party' | 'Chill';
export type Platform = 'instagram' | 'twitter' | 'tiktok';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type ScrapeStatus = 'pending' | 'running' | 'done' | 'failed';
export type NigeriaCity = 'Lagos' | 'Abuja' | 'Port Harcourt';
 
export interface Venue {
  id: string;
  name: string;
  slug: string;
  city: NigeriaCity;
  area: string | null;
  category: VenueCategory;
  sub_category: string | null;
  address: string | null;
  google_place_id: string | null;
  instagram_handle: string | null;
  cover_image_url: string | null;
  vibe_score: number;
  total_mentions: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
 
export interface Mention {
  id: string;
  venue_id: string;
  platform: Platform;
  post_url: string;
  post_text: string | null;
  author_username: string | null;
  author_followers: number;
  likes: number;
  sentiment: Sentiment | null;
  sentiment_score: number | null;
  ai_tags: string[];
  is_processed: boolean;
  posted_at: string | null;
}
 
export interface Summary {
  id: string;
  venue_id: string;
  pros: string[];
  cons: string[];
  vibe_tags: string[];
  summary_text: string | null;
  mentions_analyzed: number;
  period_start: string | null;
  period_end: string | null;
  is_current: boolean;
  generated_at: string;
}
 
export interface VenueWithSummary extends Venue {
  summary: Summary | null;
}
```
 
---
 
## Environment Variables
 
```bash
# .env.example — commit this file, placeholders only
 
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
 
# OpenRouter (replaces Anthropic API — OpenAI-compatible)
OPENROUTER_API_KEY=your_openrouter_api_key
 
# Apify
APIFY_API_TOKEN=your_apify_api_token
 
# Cron security (generate a random string, e.g. openssl rand -hex 32)
CRON_SECRET=your_random_cron_secret
```
 
> ⚠️ Real values go in `.env.local` ONLY — never in .env.example, never in CLAUDE.md, never committed to Git.
 
---
 
## Security Rules
 
- `NEXT_PUBLIC_*` keys = safe for browser (anon key only — this is read-only by RLS design)
- All other keys = server-side only (service role, OpenRouter, Apify, CRON_SECRET)
- `/api/scrape`, `/api/process`, `/api/cron` — validate `Authorization: Bearer CRON_SECRET` header
- Supabase RLS: public SELECT on venues + summaries only; service_role for all writes
- Never expose raw mentions or scrape_jobs to the public frontend
- Validate all API inputs with Zod schemas before touching the database
- Rate limit public API routes (Vercel built-in or upstash/ratelimit)
 
---
 
## AI Processing — Model Selection (via OpenRouter)
 
OpenRouter is OpenAI-compatible — use the `openai` npm package with a custom `baseURL`. No separate SDK needed.
 
| Task | Model (OpenRouter string) | Cost | Reason |
|---|---|---|---|
| Sentiment per mention | `google/gemini-2.0-flash-lite-001` | $0.075/M input | High volume, simple task, cheapest reliable option |
| Entity extraction | `google/gemini-2.0-flash-lite-001` | $0.075/M input | Bulk, fast |
| Pros/Cons summary | `deepseek/deepseek-v3.2` | $0.255/M input | User-facing output, GPT-5 class quality |
| Vibe tag classification | `google/gemini-2.0-flash-lite-001` | $0.075/M input | Simple classification |
 
**⚠️ Migration note:** `gemini-2.0-flash-lite-001` is retiring June 1, 2026.
Upgrade to `google/gemini-3.1-flash-lite-preview` before that date — it's already defined as `BULK_MODEL_NEXT` in `lib/ai/client.ts`.
 
**Estimated cost at MVP scale (10,000 mentions / 48hr cycle):** ~$1–2 total.
 
**Batch strategy:** Process mentions in batches of 50.
Use `Promise.allSettled` (not `Promise.all`) so one failed API call doesn't kill the whole batch.
 
---
 
## Supabase Tables Summary
 
| Table | Purpose | Key columns |
|---|---|---|
| `venues` | Master directory of all spots | name, slug, city, category, vibe_score |
| `mentions` | Raw social posts per venue | platform, post_text, sentiment, is_processed |
| `summaries` | AI-generated summaries | pros[], cons[], vibe_tags[], is_current |
| `scrape_jobs` | Apify run tracking | status, apify_run_id, items_scraped |
 
RLS is enabled on all tables. Supabase project URL: stored in `.env.local` only.
 
---
 
## Apify Actors Reference
 
| Platform | Actor | Purpose |
|---|---|---|
| Google Maps | `apify/google-maps-scraper` | Seed initial venue database (500+ spots) |
| Instagram | `apify/instagram-hashtag-scraper` | Scrape by hashtag |
| Instagram | `apify/instagram-comment-scraper` | Pull comments on venue posts |
| X / Twitter | `apify/twitter-scraper` | Search by hashtag/keyword |
| TikTok | `clockworks/free-tiktok-scraper` | Scrape by hashtag |
| TikTok | `novi/tiktok-comment-scraper` | Comment sentiment |
 
---
 
## Build Order (Phase 1 MVP)
 
Follow this exact sequence:
 
1. **Project init** — `npx create-next-app@latest isabispot --typescript --tailwind --app`
2. **Install deps** — Shadcn/ui, TanStack Query, react-hook-form, Zod, Supabase SDK, openai (for OpenRouter), Apify SDK
3. **Supabase setup** — `lib/supabase/client.ts`, `server.ts`, `queries.ts`
4. **Types** — define all TypeScript interfaces in `types/database.ts`
5. **API routes** — `/api/venues` first (read-only, test against real DB)
6. **Seed script** — `scripts/seed-venues.ts` → Google Maps actor → populate venues table
7. **Frontend shell** — Navbar, Footer, Layout, basic homepage
8. **Venue listing page** — `/venues` with VenueCard grid
9. **Venue profile page** — `/venues/[slug]` with static data first
10. **Apify scrape pipeline** — `lib/apify/` + `/api/scrape`
11. **AI processing pipeline** — `lib/ai/` + `/api/process`
12. **Vibe Score calculation** — `lib/utils/vibe-score.ts`
13. **Summary display** — VibeSummary component on venue profile
14. **Cron job** — `vercel.json` + `/api/cron`
15. **Polish** — Loading skeletons, empty states, SEO meta tags
16. **Deploy** — Vercel, set all env vars in dashboard, verify cron is firing
 
---
 
## Key Conventions
 
- File names: `PascalCase` for components, `camelCase` for utils/lib
- All async API calls wrapped in try/catch with typed error responses
- Supabase: always use `server.ts` (service role) for writes, `client.ts` (anon) for reads
- Every component handles three states: loading → error → data
- Slugs: auto-generated from venue name on insert, never manually set
- Nigerian slang: never "correct" or normalize Nigerian Pidgin in AI prompts — preserve it as-is
- Comments in code: write them as if explaining to a new Nigerian developer joining the team
 
---
 
*iSabiSpot | Stack: Next.js 14 + Supabase + OpenRouter (Gemini Flash Lite + DeepSeek V3.2) + Apify | Lagos, Nigeria | March 2026*
