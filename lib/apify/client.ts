// lib/apify/client.ts
// Apify SDK instance — single place to configure the client
// All actor runs and dataset reads go through this instance

import { ApifyClient } from 'apify-client';

// Call getApifyClient() inside API routes — not at module level
// so the build doesn't fail if APIFY_API_TOKEN is only available at runtime
export function getApifyClient(): ApifyClient {
  if (!process.env.APIFY_API_TOKEN) {
    throw new Error('Missing APIFY_API_TOKEN. Set it in Vercel project settings.');
  }
  return new ApifyClient({ token: process.env.APIFY_API_TOKEN });
}
