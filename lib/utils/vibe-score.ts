// lib/utils/vibe-score.ts
// Vibe Score calculation — transparent, reproducible, weighted formula
// This is called after AI processing to update each venue's score
//
// Vibe Score is always 1.0–10.0 (not 0–10, because 0 feels broken to users)
// A venue with NO recent mentions keeps its last score until new data comes in

import type { Mention } from '@/types/database';

/**
 * Calculates Vibe Score (1.0–10.0) from last 30 days of processed mentions
 *
 * Weights:
 *   - Sentiment score:    40% (core signal — what people actually think)
 *   - Recency:            30% (fresher posts = more relevant to "right now")
 *   - Engagement (likes): 20% (popular posts from real people matter more)
 *   - Influence:          10% (high-follower authors carry more weight)
 *
 * Why these weights? Sentiment is the signal, recency keeps scores dynamic,
 * engagement filters out low-reach posts, influence catches influencer hype.
 */
export function calculateVibeScore(mentions: Mention[]): number {
  if (mentions.length === 0) return 5.0; // Default neutral score — no data yet

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  // Pre-calculate max likes and followers for normalization (avoid dividing by 0)
  const maxLikes = Math.max(...mentions.map((m) => m.likes), 1);
  const maxFollowers = Math.max(...mentions.map((m) => m.author_followers), 1);

  const scores = mentions.map((mention) => {
    // 1. Sentiment score (0.0–1.0 from AI)
    const sentimentScore = mention.sentiment_score ?? 0.5;

    // 2. Recency score: 1.0 = posted right now, 0.0 = posted exactly 30 days ago
    const postedAt = mention.posted_at ? new Date(mention.posted_at).getTime() : now;
    const ageMs = now - postedAt;
    const recencyScore = Math.max(0, 1 - ageMs / thirtyDaysMs);

    // 3. Engagement score: normalized likes (0.0–1.0 relative to max in batch)
    const engagementScore = mention.likes / maxLikes;

    // 4. Influence score: normalized follower count (0.0–1.0 relative to max in batch)
    const influenceScore = mention.author_followers / maxFollowers;

    // Weighted composite score (0.0–1.0)
    return (
      sentimentScore  * 0.40 +
      recencyScore    * 0.30 +
      engagementScore * 0.20 +
      influenceScore  * 0.10
    );
  });

  // Average across all mentions
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Scale from 0–1 range to 1–10 range
  // Min of 1.0 so venues never show as 0 even if all feedback is negative
  const vibeScore = 1 + avgScore * 9;

  // Round to one decimal place for clean display
  return Math.round(vibeScore * 10) / 10;
}

/**
 * Format vibe score for display — adds emoji indicator based on score tier
 * Used in VenueCard and VenueProfile components
 */
export function formatVibeScore(score: number): { label: string; emoji: string; tier: 'fire' | 'hot' | 'ok' | 'cold' } {
  if (score >= 8.0) return { label: score.toFixed(1), emoji: '🔥', tier: 'fire' };
  if (score >= 6.5) return { label: score.toFixed(1), emoji: '⚡', tier: 'hot' };
  if (score >= 5.0) return { label: score.toFixed(1), emoji: '✓',  tier: 'ok' };
  return               { label: score.toFixed(1), emoji: '❄️', tier: 'cold' };
}
