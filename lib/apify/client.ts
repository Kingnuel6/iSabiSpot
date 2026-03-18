// lib/apify/client.ts
// Apify SDK instance — single place to configure the client
// All actor runs and dataset reads go through this instance

import { ApifyClient } from 'apify-client';

if (!process.env.APIFY_API_TOKEN) {
  throw new Error('Missing APIFY_API_TOKEN in .env.local');
}

// Singleton client — reuse across the app
export const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});
