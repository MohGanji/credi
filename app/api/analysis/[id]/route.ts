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

    // Return the analysis data
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
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
