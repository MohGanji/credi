import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRepository } from '../../../lib/repositories/analysis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    // Find the analysis by ID
    const analysis = await AnalysisRepository.findById(id);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Handle different analysis states
    if (analysis.state === 'COMPLETED') {
      // Return completed analysis data
      return NextResponse.json({
        id: analysis.id,
        profileUrl: analysis.profileUrl,
        platform: analysis.platform,
        username: analysis.username,
        createdAt: analysis.createdAt.toISOString(),
        expiresAt: analysis.expiresAt.toISOString(),
        crediScore: analysis.crediScore,
        sections: analysis.sections,
        processingTimeMs: analysis.processingTimeMs,
        modelUsed: analysis.modelUsed,
        tokensUsed: analysis.tokensUsed,
        state: analysis.state,
      });
    } else if (analysis.state === 'CRAWLING' || analysis.state === 'ANALYZING') {
      // Analysis is still in progress
      return NextResponse.json({
        success: false,
        error: 'Analysis is still in progress. Please try again in a few moments.',
        status: 'processing',
        state: analysis.state,
        id: analysis.id,
      }, { status: 202 }); // 202 Accepted - processing
    } else if (analysis.state === 'CRAWLING_FAILED' || analysis.state === 'ANALYSIS_FAILED') {
      // Analysis failed
      return NextResponse.json({
        success: false,
        error: 'Analysis failed. You can retry by submitting the same URL again.',
        details: analysis.errorMessage || 'Analysis encountered an error.',
        type: 'analysis_failed',
        state: analysis.state,
        retryCount: analysis.retryCount,
        id: analysis.id,
      }, { status: 400 });
    } else {
      // Unknown state
      return NextResponse.json({
        success: false,
        error: 'Analysis is in an unknown state.',
        state: analysis.state,
        id: analysis.id,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
