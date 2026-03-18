// lib/supabase/queries.ts
// All reusable Supabase query functions — centralised here so no raw queries scatter across components
// Use server client (service role) for all writes; anon client is fine for reads

import { createServerSupabaseClient } from './server';
import type { Venue, Mention, Summary, VenueWithSummary, NewSummary } from '@/types/database';
import type { VenueFilters } from '@/types/api';

// ─── Venues ───────────────────────────────────────────────────────────────────

/**
 * Fetch venues with optional filters, search, and sorting
 * Used by GET /api/venues and the /venues listing page
 */
export async function getVenues(filters: VenueFilters): Promise<{ venues: Venue[]; total: number }> {
  const supabase = createServerSupabaseClient();
  const {
    city,
    category,
    search,
    sort = 'vibe_score',
    limit = 20,
    offset = 0,
  } = filters;

  let query = supabase
    .from('venues')
    .select('*', { count: 'exact' })
    .eq('is_active', true);

  if (city) query = query.eq('city', city);
  if (category) query = query.eq('category', category);
  if (search) query = query.ilike('name', `%${search}%`);

  // Sort order — vibe_score descending makes sense as the default (trending first)
  query = query.order(sort, { ascending: sort === 'name' });

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw new Error(`getVenues failed: ${error.message}`);

  return { venues: data as Venue[], total: count ?? 0 };
}

/**
 * Get a single venue by its slug, including its current AI summary
 * Used by GET /api/venues/[slug] and the /venues/[slug] profile page
 */
export async function getVenueBySlug(slug: string): Promise<VenueWithSummary | null> {
  const supabase = createServerSupabaseClient();

  const { data: venue, error: venueError } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (venueError) {
    if (venueError.code === 'PGRST116') return null; // Not found
    throw new Error(`getVenueBySlug failed: ${venueError.message}`);
  }

  // Fetch the current summary for this venue
  const { data: summary } = await supabase
    .from('summaries')
    .select('*')
    .eq('venue_id', venue.id)
    .eq('is_current', true)
    .single();

  return { ...(venue as Venue), summary: summary as Summary | null };
}

/**
 * Get recent mentions for a venue (for the mention feed on profile page)
 * Public-facing so we only return the fields needed — no internal processing flags
 */
export async function getMentionsByVenueId(venueId: string, limit = 10): Promise<Mention[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('mentions')
    .select('*')
    .eq('venue_id', venueId)
    .order('posted_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getMentionsByVenueId failed: ${error.message}`);

  return data as Mention[];
}

// ─── Processing pipeline queries ─────────────────────────────────────────────

/**
 * Fetch unprocessed mentions in batches — used by the AI processing pipeline
 * Optionally filter to a single venue for targeted reprocessing
 */
export async function getUnprocessedMentions(limit = 50, venueId?: string): Promise<Mention[]> {
  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('mentions')
    .select('*')
    .eq('is_processed', false)
    .order('posted_at', { ascending: true }) // Process oldest first
    .limit(limit);

  if (venueId) query = query.eq('venue_id', venueId);

  const { data, error } = await query;

  if (error) throw new Error(`getUnprocessedMentions failed: ${error.message}`);

  return data as Mention[];
}

/**
 * Mark a batch of mentions as processed after AI analysis
 */
export async function markMentionsProcessed(
  updates: Array<{
    id: string;
    sentiment: string;
    sentiment_score: number;
    ai_tags: string[];
  }>
): Promise<void> {
  const supabase = createServerSupabaseClient();

  // Upsert each update individually — batch upsert with different values per row
  await Promise.all(
    updates.map((update) =>
      supabase
        .from('mentions')
        .update({
          sentiment: update.sentiment,
          sentiment_score: update.sentiment_score,
          ai_tags: update.ai_tags,
          is_processed: true,
        })
        .eq('id', update.id)
    )
  );
}

/**
 * Update a venue's vibe_score after recalculation
 * Called by vibe-score.ts after processing a batch of mentions
 */
export async function upsertVibeScore(venueId: string, score: number): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('venues')
    .update({
      vibe_score: Math.round(score * 10) / 10, // Round to 1 decimal place
      updated_at: new Date().toISOString(),
    })
    .eq('id', venueId);

  if (error) throw new Error(`upsertVibeScore failed: ${error.message}`);
}

/**
 * Upsert a new AI-generated summary for a venue
 * Archives old summaries (is_current = false) and sets the new one as current
 */
export async function upsertSummary(summary: NewSummary): Promise<void> {
  const supabase = createServerSupabaseClient();

  // Archive the previous current summary first
  await supabase
    .from('summaries')
    .update({ is_current: false })
    .eq('venue_id', summary.venue_id)
    .eq('is_current', true);

  // Insert the new summary as current
  const { error } = await supabase.from('summaries').insert({
    ...summary,
    is_current: true,
    generated_at: new Date().toISOString(),
  });

  if (error) throw new Error(`upsertSummary failed: ${error.message}`);
}

/**
 * Get mentions from the last 30 days for vibe score calculation
 * Returns only the fields needed by calculateVibeScore()
 */
export async function getRecentMentionsForScoring(venueId: string): Promise<Mention[]> {
  const supabase = createServerSupabaseClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('mentions')
    .select('*')
    .eq('venue_id', venueId)
    .eq('is_processed', true)
    .gte('posted_at', thirtyDaysAgo.toISOString())
    .order('posted_at', { ascending: false });

  if (error) throw new Error(`getRecentMentionsForScoring failed: ${error.message}`);

  return data as Mention[];
}

/**
 * Upsert a mention — used by the Apify parser when saving scraped data
 * post_url is unique so duplicate posts are safely ignored
 */
export async function upsertMention(mention: Omit<Mention, 'id'>): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase
    .from('mentions')
    .upsert(mention, { onConflict: 'post_url' });

  if (error) throw new Error(`upsertMention failed: ${error.message}`);
}

/**
 * Update a scrape job status — called during the Apify polling/webhook flow
 */
export async function updateScrapeJobStatus(
  jobId: string,
  updates: {
    status: string;
    items_scraped?: number;
    error_message?: string;
    completed_at?: string;
  }
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error } = await supabase.from('scrape_jobs').update(updates).eq('id', jobId);

  if (error) throw new Error(`updateScrapeJobStatus failed: ${error.message}`);
}

/**
 * Update total_mentions count for a venue — run after each scrape batch
 */
export async function updateVenueMentionCount(venueId: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { count, error: countError } = await supabase
    .from('mentions')
    .select('*', { count: 'exact', head: true })
    .eq('venue_id', venueId);

  if (countError) throw new Error(`updateVenueMentionCount count failed: ${countError.message}`);

  const { error } = await supabase
    .from('venues')
    .update({ total_mentions: count ?? 0 })
    .eq('id', venueId);

  if (error) throw new Error(`updateVenueMentionCount update failed: ${error.message}`);
}
