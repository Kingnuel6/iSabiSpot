// types/database.ts
// TypeScript interfaces mirroring the Supabase database tables
// Think of these as the single source of truth for data shapes across the whole app

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

export interface ScrapeJob {
  id: string;
  venue_id: string | null;
  platform: Platform;
  apify_run_id: string | null;
  status: ScrapeStatus;
  hashtags: string[];
  items_scraped: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Joined type used on venue profile page — includes current AI summary
export interface VenueWithSummary extends Venue {
  summary: Summary | null;
}

// Used when inserting a new AI-generated summary into the DB
export interface NewSummary {
  venue_id: string;
  pros: string[];
  cons: string[];
  vibe_tags: string[];
  summary_text: string | null;
  mentions_analyzed: number;
  period_start: string | null;
  period_end: string | null;
}
