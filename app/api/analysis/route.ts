import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRepository } from '../../lib/repositories/analysis';
import { validateSocialMediaUrl, getPlatformInfo } from '../../lib/validation';
import { generateMockAnalysisResult } from '../../lib/mock-data';
import { CredibilityAnalyzer } from '../../lib/services/CredibilityAnalyzer';
import { logger } from '../../lib/logger';

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
    const cachedAnalysis =
      await AnalysisRepository.findValidLatestByProfileUrl(normalizedUrl);
    if (cachedAnalysis) {
      logger.info(`Serving cached analysis for ${normalizedUrl}`, {
        analysisId: cachedAnalysis.id,
      });
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
          status: 'started',
        },
      });
    }

    // Check if AI agent execution is enabled (when MOCK_AGENT_CALL is false)
    const useAIAgents = process.env.MOCK_AGENT_CALL !== 'true';

    let analysisResult;

    if (useAIAgents) {
      try {
        // Use credibility analysis service for real analysis
        const credibilityAnalyzer = new CredibilityAnalyzer();

        // Mock posts data for now - in a real implementation, this would come from social media crawlers
        const mockPosts = [
          {
            id: '1',
            content:
              'Sample post content for analysis. This post demonstrates thoughtful analysis with references to credible sources.',
            timestamp: new Date('2024-01-15'),
            links: ['https://example.com/study'],
          },
          {
            id: '2',
            content:
              'Another sample post discussing market trends with balanced perspective and acknowledging uncertainty.',
            timestamp: new Date('2024-01-14'),
            links: [],
          },
        ];

        const mockProfileInfo = {
          username: platformInfo.username,
          displayName: platformInfo.username,
          bio: 'Sample bio for analysis - professional with expertise indicators',
          verified: false,
        };

        logger.info(`Starting AI analysis for ${normalizedUrl}`);

        analysisResult = await credibilityAnalyzer.analyzeProfile(
          mockPosts,
          mockProfileInfo,
          { timeout: 120000 }
        );

        // Set the profile URL in the result
        analysisResult.profileUrl = normalizedUrl;

        logger.info(`AI analysis completed for ${normalizedUrl}`, {
          score: analysisResult.crediScore,
          processingTime: analysisResult.processingTimeMs,
        });
      } catch (error) {
        logger.error('AI agent analysis failed, falling back to mock data', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Fallback to mock data if AI analysis fails
        analysisResult = generateMockAnalysisResult(
          normalizedUrl,
          validationResult.platform,
          platformInfo.username
        );
      }
    } else {
      // Use mock data when AI agents are disabled
      logger.info(
        `Using mock analysis for ${normalizedUrl} (AI agents disabled)`
      );
      analysisResult = generateMockAnalysisResult(
        normalizedUrl,
        validationResult.platform,
        platformInfo.username
      );
    }

    // Set expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const analysisData = {
      profileUrl: analysisResult.profileUrl,
      platform: analysisResult.platform,
      username: analysisResult.username,
      expiresAt,
      crediScore: analysisResult.crediScore,
      sections: analysisResult.sections as any, // Type assertion for JSON compatibility
      processingTimeMs: analysisResult.processingTimeMs || undefined,
      modelUsed: analysisResult.modelUsed || undefined,
      tokensUsed: analysisResult.tokensUsed || undefined,
    };

    const analysis = await AnalysisRepository.create(analysisData);
    logger.info(`Created new analysis for ${normalizedUrl}`, {
      analysisId: analysis.id,
      score: analysis.crediScore,
    });

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
        status: 'started',
      },
    });
  } catch (error) {
    logger.error('Error creating analysis', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
