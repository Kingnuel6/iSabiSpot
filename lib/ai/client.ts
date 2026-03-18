// lib/ai/client.ts
// OpenRouter client using the OpenAI-compatible SDK
// OpenRouter gives us access to Gemini, DeepSeek, and others via one API
// Just swap baseURL — the OpenAI SDK interface stays the same

import OpenAI from 'openai';

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error('Missing OPENROUTER_API_KEY in .env.local');
}

export const aiClient = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    // OpenRouter requires these for rate limiting and analytics
    'HTTP-Referer': 'https://isabispot.com',
    'X-Title': 'iSabiSpot',
  },
});

// ─── Model constants ──────────────────────────────────────────────────────────

// Bulk processing — cheap & fast (~$0.075/M input tokens)
// ⚠️ Going away June 1 2026 — migrate to BULK_MODEL_NEXT before then
export const BULK_MODEL = 'google/gemini-2.0-flash-lite-001';

// Fallback bulk model (use this after June 2026)
// Switch the import of BULK_MODEL to BULK_MODEL_NEXT when the time comes
export const BULK_MODEL_NEXT = 'google/gemini-3.1-flash-lite-preview';

// Summary generation — quality user-facing output (~$0.255/M input tokens)
// DeepSeek V3.2 is GPT-5 class quality at a fraction of the cost
export const SUMMARY_MODEL = 'deepseek/deepseek-v3.2';
