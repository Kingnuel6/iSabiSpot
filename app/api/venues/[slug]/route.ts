// app/api/venues/[slug]/route.ts
// GET /api/venues/:slug — full venue data with current summary and recent mentions
// Public endpoint — no auth required

import { NextRequest, NextResponse } from 'next/server';
import { getVenueBySlug, getMentionsByVenueId } from '@/lib/supabase/queries';
import type { VenueDetailResponse, ApiError } from '@/types/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<VenueDetailResponse | ApiError>> {
  try {
    const { slug } = await params;

    const venue = await getVenueBySlug(slug);

    if (!venue) {
      return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
    }

    const mentions = await getMentionsByVenueId(venue.id, 10);

    return NextResponse.json({
      venue,
      summary: venue.summary,
      mentions,
    });
  } catch (error) {
    console.error('GET /api/venues/[slug] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch venue' },
      { status: 500 }
    );
  }
}
