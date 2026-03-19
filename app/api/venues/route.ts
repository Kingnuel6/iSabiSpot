// app/api/venues/route.ts
// GET /api/venues — list venues with optional filters, search, and sorting
// Public endpoint — no auth required (Supabase RLS handles access control)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVenues } from '@/lib/supabase/queries';
import type { VenueListResponse, ApiError } from '@/types/api';

// Zod schema for query param validation
const querySchema = z.object({
  city:     z.enum(['Lagos', 'Abuja', 'Port Harcourt']).optional(),
  category: z.enum(['Food', 'Stay', 'Party', 'Chill']).optional(),
  search:   z.string().max(100).optional(),
  sort:     z.enum(['vibe_score', 'name', 'updated_at']).optional().default('vibe_score'),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(20),
  offset:   z.coerce.number().int().min(0).optional().default(0),
});

export async function GET(request: NextRequest): Promise<NextResponse<VenueListResponse | ApiError>> {
  try {
    // Parse and validate query params
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: parsed.error.message },
        { status: 400 }
      );
    }

    const filters = parsed.data;
    const { venues, total } = await getVenues(filters);

    return NextResponse.json({
      venues,
      total,
      hasMore: filters.offset + filters.limit < total,
    });
  } catch (error) {
    console.error('GET /api/venues error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
}
