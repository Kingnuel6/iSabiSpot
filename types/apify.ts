// types/apify.ts
// Raw output types from Apify actors before normalization
// Each actor returns slightly different shapes — these capture the raw form

// ─── Instagram Hashtag Scraper ────────────────────────────────────────────────

export interface RawInstagramPost {
  id: string;
  shortCode: string;
  type: 'Image' | 'Video' | 'Sidecar';
  url: string;
  caption: string | null;
  hashtags: string[];
  mentions: string[];
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  ownerUsername: string;
  ownerFullName: string | null;
  ownerId: string;
  locationName: string | null;
  locationId: string | null;
  displayUrl: string | null;
}

// ─── Twitter / X Scraper ─────────────────────────────────────────────────────

export interface RawTweet {
  id: string;
  full_text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  quote_count: number;
  user: {
    id_str: string;
    screen_name: string;
    name: string;
    followers_count: number;
    friends_count: number;
    verified: boolean;
  };
  entities: {
    hashtags: Array<{ text: string }>;
    urls: Array<{ expanded_url: string }>;
  };
  lang: string;
}

// ─── TikTok Scraper ───────────────────────────────────────────────────────────

export interface RawTikTokPost {
  id: string;
  text: string;
  createTime: number; // Unix timestamp
  createTimeISO: string;
  authorMeta: {
    id: string;
    name: string;
    nickName: string;
    fans: number;
    following: number;
    heart: number;
    video: number;
  };
  musicMeta: {
    musicName: string;
    musicAuthor: string;
  };
  covers: {
    default: string;
    origin: string;
  };
  videoUrl: string;
  webVideoUrl: string;
  diggCount: number;       // likes
  shareCount: number;
  playCount: number;
  commentCount: number;
  hashtags: Array<{
    id: string;
    name: string;
    title: string;
    cover: string;
  }>;
}

// ─── Google Maps Scraper ──────────────────────────────────────────────────────

export interface RawGoogleMapsPlace {
  placeId: string;
  title: string;
  categoryName: string;
  address: string;
  city: string;
  neighborhood: string | null;
  postalCode: string | null;
  country: string;
  lat: number;
  lng: number;
  totalScore: number;        // Google star rating (1–5)
  reviewsCount: number;
  imageUrl: string | null;
  website: string | null;
  phone: string | null;
  openingHours: Array<{
    day: string;
    hours: string;
  }>;
  url: string;               // Google Maps URL
}

// ─── Normalized shape (output of parser.ts) ───────────────────────────────────

// What parser.ts returns — maps raw Apify output into Mention-ready data
export interface ParsedMention {
  platform: 'instagram' | 'twitter' | 'tiktok';
  post_url: string;
  post_text: string | null;
  author_username: string | null;
  author_followers: number;
  likes: number;
  posted_at: string | null;
  raw_data: Record<string, unknown>; // Keep raw for debugging
}
