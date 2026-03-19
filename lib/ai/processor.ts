// lib/ai/processor.ts
// Batch AI processing logic — runs sentiment analysis on unprocessed mentions
// and generates venue summaries using the appropriate model for each task
//
// Key design choices:
// - Process in batches of 50 (balance of cost vs latency)
// - Use Promise.allSettled NOT Promise.all — one failed call shouldn't kill the batch
// - Log errors per-mention but continue processing the rest

import { getAiClient, BULK_MODEL, SUMMARY_MODEL } from './client';
import { SENTIMENT_SYSTEM_PROMPT, SUMMARY_SYSTEM_PROMPT } from './prompts';
import {
  getUnprocessedMentions,
  markMentionsProcessed,
  getRecentMentionsForScoring,
  upsertSummary,
  upsertVibeScore,
} from '@/lib/supabase/queries';
import { calculateVibeScore } from '@/lib/utils/vibe-score';
import type { Mention } from '@/types/database';
import type { MentionAIResult, SummaryAIResult } from '@/types/api';

const BATCH_SIZE = 50;

// ─── Sentiment Analysis ───────────────────────────────────────────────────────

/**
 * Analyze sentiment for a single mention using Gemini Flash Lite
 * Returns the AI result or null if the API call fails
 */
async function analyzeMentionSentiment(mention: Mention): Promise<MentionAIResult | null> {
  try {
    const response = await getAiClient().chat.completions.create({
      model: BULK_MODEL,
      messages: [
        { role: 'system', content: SENTIMENT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Analyze this post about a Nigerian venue:\n\n"${mention.post_text}"`,
        },
      ],
      temperature: 0.1, // Low temp for consistent classification
      max_tokens: 150,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const result = JSON.parse(raw) as MentionAIResult;
    return result;
  } catch (error) {
    console.error(`Failed to analyze mention ${mention.id}:`, error);
    return null;
  }
}

/**
 * Process a batch of mentions — runs sentiment analysis on all of them
 * Uses Promise.allSettled so individual failures don't block the batch
 */
export async function processMentionBatch(mentions: Mention[]): Promise<number> {
  const results = await Promise.allSettled(
    mentions.map((mention) => analyzeMentionSentiment(mention))
  );

  const updates: Array<{
    id: string;
    sentiment: string;
    sentiment_score: number;
    ai_tags: string[];
  }> = [];

  results.forEach((result, index) => {
    const mention = mentions[index];
    if (result.status === 'fulfilled' && result.value) {
      updates.push({
        id: mention.id,
        sentiment: result.value.sentiment,
        sentiment_score: result.value.sentiment_score,
        ai_tags: result.value.ai_tags,
      });
    } else if (result.status === 'rejected') {
      console.error(`Mention ${mention.id} analysis rejected:`, result.reason);
    }
  });

  if (updates.length > 0) {
    await markMentionsProcessed(updates);
  }

  return updates.length;
}

/**
 * Main processing function — fetches all unprocessed mentions and processes them
 * Called by POST /api/process
 * Optionally scoped to a single venue via venueId
 */
export async function processAllUnprocessedMentions(venueId?: string): Promise<{
  processed: number;
  batches: number;
}> {
  let totalProcessed = 0;
  let batches = 0;
  let hasMore = true;

  while (hasMore) {
    const mentions = await getUnprocessedMentions(BATCH_SIZE, venueId);

    if (mentions.length === 0) {
      hasMore = false;
      break;
    }

    const processed = await processMentionBatch(mentions);
    totalProcessed += processed;
    batches++;

    // If we got fewer than BATCH_SIZE, we've processed everything
    if (mentions.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return { processed: totalProcessed, batches };
}

// ─── Summary Generation ───────────────────────────────────────────────────────

/**
 * Generate a venue summary from the last 30 days of processed mentions
 * Uses DeepSeek V3.2 for quality user-facing output
 */
export async function generateVenueSummary(venueId: string): Promise<boolean> {
  const mentions = await getRecentMentionsForScoring(venueId);

  if (mentions.length < 5) {
    // Not enough data to generate a meaningful summary
    console.log(`Skipping summary for venue ${venueId}: only ${mentions.length} recent mentions`);
    return false;
  }

  // Build the context from mentions — take top 50 most engaging ones
  const topMentions = mentions
    .sort((a, b) => (b.likes + b.author_followers * 0.001) - (a.likes + a.author_followers * 0.001))
    .slice(0, 50);

  const mentionContext = topMentions
    .filter((m) => m.post_text)
    .map((m) => `[${m.platform}] "${m.post_text}" (${m.likes} likes)`)
    .join('\n');

  try {
    const response = await getAiClient().chat.completions.create({
      model: SUMMARY_MODEL,
      messages: [
        { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a venue summary from these ${topMentions.length} social media mentions:\n\n${mentionContext}`,
        },
      ],
      temperature: 0.3, // Slightly higher for more natural prose
      max_tokens: 500,
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return false;

    const result = JSON.parse(raw) as SummaryAIResult;

    // Calculate the vibe score from mentions
    const vibeScore = calculateVibeScore(mentions);

    // Sort mentions by date to get period range
    const sortedByDate = [...mentions].sort(
      (a, b) => new Date(a.posted_at ?? 0).getTime() - new Date(b.posted_at ?? 0).getTime()
    );

    // Save summary and update score
    await Promise.all([
      upsertSummary({
        venue_id: venueId,
        pros: result.pros,
        cons: result.cons,
        vibe_tags: result.vibe_tags,
        summary_text: result.summary_text,
        mentions_analyzed: mentions.length,
        period_start: sortedByDate[0]?.posted_at ?? null,
        period_end: sortedByDate[sortedByDate.length - 1]?.posted_at ?? null,
      }),
      upsertVibeScore(venueId, vibeScore),
    ]);

    return true;
  } catch (error) {
    console.error(`Failed to generate summary for venue ${venueId}:`, error);
    return false;
  }
}
