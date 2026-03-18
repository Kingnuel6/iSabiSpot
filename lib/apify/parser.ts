// lib/apify/parser.ts
// Normalize raw Apify actor output into the shape that fits our mentions table
// Each platform returns completely different data structures — this is the translation layer
// If you add a new actor, add a parser function here

import type {
  RawInstagramPost,
  RawTweet,
  RawTikTokPost,
  ParsedMention,
} from '@/types/apify';

/**
 * Parse raw Instagram post into normalized ParsedMention
 */
export function parseInstagramPost(post: RawInstagramPost): ParsedMention {
  return {
    platform: 'instagram',
    post_url: `https://www.instagram.com/p/${post.shortCode}/`,
    post_text: post.caption,
    author_username: post.ownerUsername,
    author_followers: 0, // Instagram hashtag scraper doesn't expose follower count
    likes: post.likesCount,
    posted_at: post.timestamp,
    raw_data: post as unknown as Record<string, unknown>,
  };
}

/**
 * Parse raw Tweet into normalized ParsedMention
 */
export function parseTweet(tweet: RawTweet): ParsedMention {
  return {
    platform: 'twitter',
    post_url: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id}`,
    post_text: tweet.full_text,
    author_username: tweet.user.screen_name,
    author_followers: tweet.user.followers_count,
    likes: tweet.favorite_count,
    posted_at: tweet.created_at,
    raw_data: tweet as unknown as Record<string, unknown>,
  };
}

/**
 * Parse raw TikTok post into normalized ParsedMention
 */
export function parseTikTokPost(post: RawTikTokPost): ParsedMention {
  return {
    platform: 'tiktok',
    post_url: post.webVideoUrl,
    post_text: post.text,
    author_username: post.authorMeta.name,
    author_followers: post.authorMeta.fans,
    likes: post.diggCount,
    posted_at: new Date(post.createTime * 1000).toISOString(), // Unix to ISO
    raw_data: post as unknown as Record<string, unknown>,
  };
}

/**
 * Parse a batch of Apify results based on platform
 * Returns normalized mentions ready to upsert into the DB
 */
export function parseApifyResults(
  platform: 'instagram' | 'twitter' | 'tiktok',
  rawItems: unknown[]
): ParsedMention[] {
  const parsers = {
    instagram: (item: unknown) => parseInstagramPost(item as RawInstagramPost),
    twitter:   (item: unknown) => parseTweet(item as RawTweet),
    tiktok:    (item: unknown) => parseTikTokPost(item as RawTikTokPost),
  };

  const parser = parsers[platform];

  return rawItems
    .map((item) => {
      try {
        return parser(item);
      } catch (error) {
        console.error(`Failed to parse ${platform} item:`, error, item);
        return null;
      }
    })
    .filter((item): item is ParsedMention => item !== null);
}
