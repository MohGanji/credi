import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRepository } from '../../lib/repositories/analysis';
import { validateSocialMediaUrl, getPlatformInfo } from '../../lib/validation';
import { generateMockAnalysisResult } from '../../lib/mock-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileUrl } = body;

    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required' },
        { status: 400 }
      );
    }

    // Validate the URL
    const validationResult = validateSocialMediaUrl(profileUrl);
    if (!validationResult.isValid || !validationResult.platform) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid profile URL' },
        { status: 400 }
      );
    }

    // Get platform info
    const platformInfo = getPlatformInfo(profileUrl);
    if (!platformInfo) {
      return NextResponse.json(
        { error: 'Unable to extract platform information' },
        { status: 400 }
      );
    }

    // Use normalized URL for cache lookup to ensure consistency
    const normalizedUrl = platformInfo.normalizedUrl;

    // Check for cached results first
    const cachedAnalysis = await AnalysisRepository.findValidLatestByProfileUrl(normalizedUrl);
    if (cachedAnalysis) {
      console.log(`Serving cached analysis for ${normalizedUrl} (ID: ${cachedAnalysis.id})`);
      return NextResponse.json({
        success: true,
        analysisId: cachedAnalysis.id,
        message: 'Analysis started successfully',
        analysis: {
          id: cachedAnalysis.id,
          profileUrl: cachedAnalysis.profileUrl,
          platform: cachedAnalysis.platform,
          username: cachedAnalysis.username,
          createdAt: cachedAnalysis.createdAt,
          status: 'started'
        }
      });
    }

    // Generate mock analysis result using the mock data generator
    const mockAnalysisResult = generateMockAnalysisResult(
      normalizedUrl,
      validationResult.platform,
      platformInfo.username
    );

    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const analysisData = {
      profileUrl: mockAnalysisResult.profileUrl,
      platform: mockAnalysisResult.platform,
      username: mockAnalysisResult.username,
      expiresAt,
      crediScore: mockAnalysisResult.crediScore,
      sections: mockAnalysisResult.sections,
      processingTimeMs: mockAnalysisResult.processingTimeMs,
      modelUsed: mockAnalysisResult.modelUsed,
      tokensUsed: mockAnalysisResult.tokensUsed
    };

    const analysis = await AnalysisRepository.create(analysisData);
    console.log(`Created new analysis for ${normalizedUrl} (ID: ${analysis.id})`);

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: 'Analysis started successfully',
      analysis: {
        id: analysis.id,
        profileUrl: analysis.profileUrl,
        platform: analysis.platform,
        username: analysis.username,
        createdAt: analysis.createdAt,
        status: 'started'
      }
    });

  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}