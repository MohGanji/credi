import { NextRequest, NextResponse } from 'next/server';
import { CrawlerFactory } from '../../lib/crawlers/CrawlerFactory';
import { ProfileData } from '../../lib/crawlers/types';

// Re-export for compatibility with existing frontend code
export type ProfilePreview = ProfileData;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Use the simplified crawler factory interface
    const profile = await CrawlerFactory.fetchProfile(url);

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error: any) {
    console.error('Error in profile preview API:', error);
    
    // Handle specific error codes from crawlers
    switch (error?.code) {
      case 'INVALID_URL':
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      case 'PRIVATE_PROFILE':
        return NextResponse.json(
          { error: error.message },
          { status: 403 }
        );
      case 'NOT_FOUND':
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      case 'RATE_LIMITED':
        return NextResponse.json(
          { error: error.message, retryAfter: error.retryAfter },
          { 
            status: 429,
            headers: error.retryAfter ? { 'Retry-After': error.retryAfter.toString() } : {}
          }
        );
      case 'NETWORK_ERROR':
        return NextResponse.json(
          { error: error.message },
          { status: 502 }
        );
      default:
        return NextResponse.json(
          { error: error?.message || 'Failed to fetch profile information' },
          { status: 500 }
        );
    }
  }
}