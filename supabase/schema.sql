-- supabase/schema.sql
-- Full database schema for iSabiSpot
-- Source of truth — run this in Supabase SQL Editor to set up a new project
--
-- Tables: venues, mentions, summaries, scrape_jobs
-- Includes: indexes, RLS policies, updated_at trigger

-- ─── Enable required extensions ───────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Custom types ─────────────────────────────────────────────────────────────

create type venue_category  as enum ('Food', 'Stay', 'Party', 'Chill');
create type platform_type   as enum ('instagram', 'twitter', 'tiktok');
create type sentiment_type  as enum ('positive', 'negative', 'neutral');
create type scrape_status   as enum ('pending', 'running', 'done', 'failed');
create type nigeria_city    as enum ('Lagos', 'Abuja', 'Port Harcourt');

-- ─── updated_at trigger function ─────────────────────────────────────────────

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ─── venues ───────────────────────────────────────────────────────────────────
-- Master directory of all spots — restaurants, hotels, clubs, chill spots

create table venues (
  id                uuid primary key default uuid_generate_v4(),
  name              text not null,
  slug              text not null unique,        -- URL slug, auto-generated, never changes
  city              nigeria_city not null,
  area              text,                        -- e.g. "Victoria Island", "Lekki"
  category          venue_category not null,
  sub_category      text,                        -- e.g. "Fine dining", "Rooftop bar"
  address           text,
  google_place_id   text unique,                 -- From Google Maps — for deduplication
  instagram_handle  text,                        -- Without @ prefix
  cover_image_url   text,
  vibe_score        numeric(3,1) not null default 5.0 check (vibe_score >= 1.0 and vibe_score <= 10.0),
  total_mentions    integer not null default 0,
  is_verified       boolean not null default false,   -- Manually verified by iSabiSpot team
  is_active         boolean not null default true,    -- Soft delete — set false instead of deleting
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Indexes for common query patterns
create index idx_venues_city       on venues (city);
create index idx_venues_category   on venues (category);
create index idx_venues_vibe_score on venues (vibe_score desc);
create index idx_venues_slug       on venues (slug);
create index idx_venues_is_active  on venues (is_active) where is_active = true;

-- Full-text search on venue name
create index idx_venues_name_trgm  on venues using gin (name gin_trgm_ops);

-- updated_at trigger
create trigger set_venues_updated_at
  before update on venues
  for each row execute function update_updated_at_column();

-- ─── mentions ─────────────────────────────────────────────────────────────────
-- Raw social media posts about venues — one row per post
-- is_processed = false until AI has run sentiment analysis on it

create table mentions (
  id                uuid primary key default uuid_generate_v4(),
  venue_id          uuid not null references venues(id) on delete cascade,
  platform          platform_type not null,
  post_url          text not null unique,         -- Unique constraint prevents duplicate scrapes
  post_text         text,
  author_username   text,
  author_followers  integer not null default 0,
  likes             integer not null default 0,
  sentiment         sentiment_type,               -- Set by AI after processing
  sentiment_score   numeric(4,3),                 -- 0.000–1.000, set by AI
  ai_tags           text[] not null default '{}', -- e.g. ['food quality', 'ambiance']
  is_processed      boolean not null default false,
  posted_at         timestamptz,
  created_at        timestamptz not null default now()
);

-- Indexes for processing pipeline and venue profile page
create index idx_mentions_venue_id      on mentions (venue_id);
create index idx_mentions_is_processed  on mentions (is_processed) where is_processed = false;
create index idx_mentions_platform      on mentions (platform);
create index idx_mentions_posted_at     on mentions (posted_at desc);
-- Composite: all unprocessed mentions for a venue (used in processor.ts)
create index idx_mentions_venue_unprocessed on mentions (venue_id, is_processed) where is_processed = false;
-- Composite: recent processed mentions for vibe score calculation
create index idx_mentions_venue_recent  on mentions (venue_id, posted_at desc) where is_processed = true;

-- ─── summaries ────────────────────────────────────────────────────────────────
-- AI-generated venue summaries — one "current" summary per venue at any time
-- Old summaries are archived (is_current = false) rather than deleted — for history

create table summaries (
  id                 uuid primary key default uuid_generate_v4(),
  venue_id           uuid not null references venues(id) on delete cascade,
  pros               text[] not null default '{}',   -- 3–5 positive points
  cons               text[] not null default '{}',   -- 2–4 negative points
  vibe_tags          text[] not null default '{}',   -- e.g. ['Date spot', 'Live music']
  summary_text       text,                           -- 2–3 sentence human-friendly summary
  mentions_analyzed  integer not null default 0,     -- How many posts fed into this summary
  period_start       timestamptz,                    -- Oldest mention in the analysis window
  period_end         timestamptz,                    -- Newest mention in the analysis window
  is_current         boolean not null default true,  -- Only one true per venue at any time
  generated_at       timestamptz not null default now()
);

-- Index to quickly fetch current summary for a venue (used on every profile page load)
create index idx_summaries_venue_current on summaries (venue_id, is_current) where is_current = true;
create index idx_summaries_venue_id      on summaries (venue_id);
create index idx_summaries_generated_at  on summaries (generated_at desc);

-- ─── scrape_jobs ──────────────────────────────────────────────────────────────
-- Tracks Apify actor runs — for debugging, retry logic, and cost monitoring

create table scrape_jobs (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid references venues(id) on delete set null, -- Null = global scrape (all venues)
  platform        platform_type not null,
  apify_run_id    text unique,              -- Apify's run ID for webhook/polling
  status          scrape_status not null default 'pending',
  hashtags        text[] not null default '{}', -- Which hashtags were searched
  items_scraped   integer not null default 0,
  error_message   text,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_scrape_jobs_status      on scrape_jobs (status);
create index idx_scrape_jobs_platform    on scrape_jobs (platform);
create index idx_scrape_jobs_apify_run   on scrape_jobs (apify_run_id);
create index idx_scrape_jobs_created_at  on scrape_jobs (created_at desc);

-- ─── Row Level Security (RLS) ─────────────────────────────────────────────────
-- Enable RLS on all tables — default deny everything

alter table venues      enable row level security;
alter table mentions    enable row level security;
alter table summaries   enable row level security;
alter table scrape_jobs enable row level security;

-- venues: public can SELECT active venues only
create policy "Public can view active venues"
  on venues for select
  using (is_active = true);

-- summaries: public can SELECT current summaries only
create policy "Public can view current summaries"
  on summaries for select
  using (is_current = true);

-- mentions: NO public access — raw social posts are internal only
-- (Frontend only shows summaries and processed vibe scores, not raw mentions)

-- scrape_jobs: NO public access — operational data, internal only

-- Service role key bypasses RLS entirely — all writes in the app use the service role
-- This means API routes (/api/scrape, /api/process) can INSERT/UPDATE freely
-- The anon key in the browser is limited to the SELECT policies above

-- ─── Useful views (optional, for convenience) ─────────────────────────────────

-- Quick overview: all active venues with their current summary
create or replace view venues_with_summaries as
  select
    v.*,
    s.pros,
    s.cons,
    s.vibe_tags,
    s.summary_text,
    s.generated_at as summary_generated_at
  from venues v
  left join summaries s on s.venue_id = v.id and s.is_current = true
  where v.is_active = true;
