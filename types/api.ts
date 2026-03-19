// types/api.ts
// Request and Response types for all API routes
// These are used both in the route handlers and in frontend fetch calls

import type { Venue, Mention, Summary, VenueWithSummary, Platform } from './database';

// ─── GET /api/venues ─────────────────────────────────────────────────────────

export interface VenueFilters {
  city?: string;
  category?: string;
  search?: string;
  sort?: 'vibe_score' | 'name' | 'updated_at';
  limit?: number;
  offset?: number;
}

export interface VenueListResponse {
  venues: Venue[];
  total: number;
  hasMore: boolean;
}

// ─── GET /api/venues/[slug] ───────────────────────────────────────────────────

export interface VenueDetailResponse {
  venue: VenueWithSummary;
  summary: Summary | null;
  mentions: Mention[];
}

// ─── POST /api/scrape ─────────────────────────────────────────────────────────

export interface ScrapeRequest {
  platforms: Platform[];
  hashtags?: string[];
}

export interface ScrapeJobResult {
  id: string;
  platform: Platform;
  apify_run_id: string;
  status: 'pending' | 'running';
}

export interface ScrapeResponse {
  jobs: ScrapeJobResult[];
}

// ─── POST /api/process ───────────────────────────────────────────────────────

export interface ProcessRequest {
  venue_id?: string; // Optional — omit to process all venues
}

export interface ProcessResponse {
  processed: number;
  updated_venues: number;
}

// ─── Generic API error response ───────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: string;
}

// ─── AI response shapes (internal — used in processor.ts) ────────────────────

export interface MentionAIResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentiment_score: number; // 0.0 to 1.0
  ai_tags: string[];
}

export interface SummaryAIResult {
  pros: string[];
  cons: string[];
  vibe_tags: string[];
  summary_text: string;
}
