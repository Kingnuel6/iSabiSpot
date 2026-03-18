# iSabiSpot — Claude Code Project Context

## Project Overview

**iSabiSpot** is an AI-powered Social Proof Directory for the Nigerian hospitality and
recreation industry. It scrapes real-time social media mentions from Instagram, X (Twitter),
and TikTok to generate live "Vibe Scores" and AI-summarized Pros/Cons for hotels,
restaurants, and clubs across Lagos, Abuja, and Port Harcourt.

Think: Google Maps meets social listening, built for the Nigerian market, powered by AI.

---

## Core Concept

**The Loop:**
1. Apify actors scrape social mentions by hashtag/location tag every 48 hours
2. Claude AI processes raw mentions → extracts sentiment, understands Nigerian slang
3. A "Vibe Score" (1–10) and Pros/Cons summary are generated per venue
4. Users browse a clean frontend to find trending spots by city, category, or vibe

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (App Router), Tailwind CSS, Shadcn/ui |
| Backend / Database | Supabase (PostgreSQL + Auth + Edge Functions) |
| AI Processing | Anthropic Claude API (Haiku for bulk, Sonnet for summaries) |
| Data Scraping | Apify (Instagram, X, TikTok, Google Maps actors) |
| Notifications (Phase 2) | Composio (email alerts, B2B integrations) |
| Orchestration | Node.js scripts + Supabase Edge Functions |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zxyaueqsmqqbuzdsmjkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eWF1ZXFzbXFxYnV6ZHNtamtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTM4ODAsImV4cCI6MjA4OTQyOTg4MH0.NNFcC0JQNjn5L2owIU7C1KsnR0wbmze4ynNe9ytUbkg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4eWF1ZXFzbXFxYnV6ZHNtamtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzg1Mzg4MCwiZXhwIjoyMDg5NDI5ODgwfQ.CDkJDYN8H6iAJ7bbFqMV5lZk5P88QfnU6FKn_C5YGJM

# Anthropic (add your key)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Apify (add your key)
APIFY_API_TOKEN=your_apify_token_here
```

> ⚠️ Never commit real keys to Git. Add `.env.local` to `.gitignore` immediately.

---

## Database Schema (Supabase / PostgreSQL)

### Table: `venues`
The core directory of all spots.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| name | text | Venue name |
| slug | text | URL-friendly unique identifier |
| city | text | 'Lagos' \| 'Abuja' \| 'Port Harcourt' |
| area | text | e.g. 'Victoria Island', 'Lekki', 'Wuse 2' |
| category | text | 'Food' \| 'Stay' \| 'Party' \| 'Chill' |
| sub_category | text | e.g. 'Rooftop Bar', 'Suya Spot' |
| address | text | Physical address |
| google_place_id | text | From Apify Google Maps scraper |
| instagram_handle | text | |
| vibe_score | numeric(3,1) | 1.0–10.0, computed from mentions |
| total_mentions | integer | Running count |
| is_verified | boolean | For B2B claimed listings (Phase 2) |
| is_active | boolean | Soft delete flag |

### Table: `mentions`
Raw social media posts referencing a venue.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| venue_id | uuid | FK → venues.id |
| platform | text | 'instagram' \| 'twitter' \| 'tiktok' |
| post_url | text | Unique — deduplication key |
| post_text | text | Raw post content |
| author_username | text | |
| author_followers | integer | For weighting influence |
| likes | integer | |
| sentiment | text | 'positive' \| 'negative' \| 'neutral' |
| sentiment_score | numeric(4,3) | -1.000 to 1.000 |
| ai_tags | text[] | e.g. ['great food', 'AC issues'] |
| is_processed | boolean | False until AI has analyzed it |
| posted_at | timestamptz | Original post date |

### Table: `summaries`
AI-generated vibe summaries per venue (refreshed every 48hrs).

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| venue_id | uuid | FK → venues.id |
| pros | text[] | e.g. ['Pepper soup was 🔥'] |
| cons | text[] | e.g. ['AC inconsistent'] |
| vibe_tags | text[] | e.g. ['Date spot', 'Great for photos'] |
| summary_text | text | 2–3 sentence overall summary |
| mentions_analyzed | integer | Input count for this summary |
| period_start | timestamptz | Date range covered |
| period_end | timestamptz | |
| is_current | boolean | Only one true per venue at a time |
| generated_at | timestamptz | |

### Table: `scrape_jobs`
Tracks every Apify scrape run for monitoring and debugging.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| platform | text | Which platform was scraped |
| hashtag_or_query | text | e.g. '#LagosNightlife' |
| apify_run_id | text | Apify's own run ID |
| status | text | 'pending' \| 'running' \| 'done' \| 'failed' |
| items_scraped | integer | Total posts pulled |
| items_matched | integer | Posts matched to a venue |
| started_at | timestamptz | |
| completed_at | timestamptz | |

---

## Apify Actors to Use

| Platform | Actor | Purpose |
|---|---|---|
| Google Maps | `apify/google-maps-scraper` | Seed initial venue database (500+ spots) |
| Instagram | `apify/instagram-hashtag-scraper` | Scrape by hashtag |
| Instagram | `apify/instagram-comment-scraper` | Pull comments on venue posts |
| X / Twitter | `apify/twitter-scraper` | Search by hashtag/keyword |
| TikTok | `clockworks/free-tiktok-scraper` | Scrape by hashtag |
| TikTok | `novi/tiktok-comment-scraper` | Comment sentiment |

**Key hashtags to target at launch:**
`#LagosEats`, `#LagosNightlife`, `#AbujaEats`, `#AbujaVibes`,
`#LagosRestaurants`, `#PHCity`, `#NaijaFoodie`, `#LagosHotels`,
`#WhereToEatLagos`, `#LagosWeekend`

---

## AI Processing Guidelines

### Model Usage
- **`claude-haiku-4-5`** — Bulk processing: sentiment tagging, entity extraction, categorization
- **`claude-sonnet-4-6`** — Final output: Pros/Cons generation, Vibe Score summary text

### Nigerian Slang Reference (train prompts with these)
The AI must understand:
- **"e choke"** = it's amazing / overwhelming in a good way
- **"no cap"** = no lie / for real
- **"e dey sweet"** = it's delicious / enjoyable
- **"e be like say"** = it seems like
- **"hammer"** = a big success / hit
- **"wash"** = disappointing / overhyped
- **"it was a vibe"** = great atmosphere
- **"the place dey gbadun"** = the place is popping/lively
- **"no front"** = no pretense / authentic
- **Japa** = emigrated (useful for IJGB/returnee context)
- **IJGB** = "I just got back" — Nigerians returning from abroad

### Vibe Score Calculation
```
Vibe Score = weighted average of sentiment_score values for last 30 days
Weight factors: author_followers (0.3) + likes (0.4) + recency (0.3)
Scale: normalize to 1.0–10.0
```

### Venue Categorization
- **Food** — restaurants, cafes, fast food, food trucks, suya spots
- **Stay** — hotels, serviced apartments, Airbnbs, guesthouses
- **Party** — clubs, bars, lounges, beach clubs, rooftop bars
- **Chill** — spas, parks, quiet cafes, co-working spaces, art galleries

---

## Key User Stories

1. "Show me what's trending in VI this weekend" → filter by city + area + vibe_score desc
2. "Is this hotel's WiFi actually good?" → check recent mentions with 'wifi' in ai_tags
3. "Quiet spot to work in Lekki" → category: Chill, area: Lekki
4. Vibe Score auto-updates every 48 hours via scheduled scrape job

---

## Project Structure (Recommended)

```
isabispot/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Homepage / search
│   ├── venues/
│   │   ├── page.tsx            # Venue listing
│   │   └── [slug]/page.tsx     # Venue profile
│   └── api/
│       ├── scrape/route.ts     # Trigger Apify jobs
│       └── process/route.ts    # Run AI processing
├── components/
│   ├── VenueCard.tsx
│   ├── VibeScore.tsx
│   ├── VibeSummary.tsx
│   └── SearchFilters.tsx
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── anthropic.ts            # Claude API client
│   ├── apify.ts                # Apify client + actor calls
│   └── vibe-score.ts           # Score calculation logic
├── scripts/
│   ├── seed-venues.ts          # One-time Google Maps seed
│   ├── scrape-mentions.ts      # Apify scrape orchestrator
│   └── process-mentions.ts     # AI processing pipeline
├── .env.local                  # Keys (never commit)
├── CLAUDE.md                   # This file
└── supabase/
    └── schema.sql              # Full DB schema
```

---

## Development Phases

### Phase 1 — MVP
- [ ] Supabase schema deployed
- [ ] Seed 100+ Lagos venues via Google Maps actor
- [ ] Apify scrape pipeline (Instagram + X)
- [ ] Claude AI sentiment + summary pipeline
- [ ] Frontend: Homepage, venue listing, venue profile
- [ ] Vibe Score display + Pros/Cons summary
- [ ] Search by city and category

### Phase 2 — Growth
- [ ] TikTok scraping added
- [ ] Real-time alerts (Composio / email)
- [ ] B2B dashboard for venue owners
- [ ] Abuja + Port Harcourt coverage
- [ ] AI-curated real photo gallery
- [ ] User accounts + saved spots

---

## Important Conventions

- All dates stored as `timestamptz` in UTC
- Slugs generated from venue name: lowercase, hyphens, no special chars
- Use `service_role` key for all server-side DB writes (scraping, AI processing)
- Use `anon` key only for public frontend reads
- RLS is enabled — public can SELECT venues and summaries; only service_role can INSERT/UPDATE
- All AI prompts must include Nigerian slang glossary in system context
- Never store raw API keys in code — always use environment variables

---

*Last updated: March 2026 | Stack: Next.js + Supabase + Claude API + Apify*
