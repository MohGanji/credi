import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRepository } from '../../lib/repositories/analysis';
import { PostsRepository } from '../../lib/repositories/posts';
import { validateSocialMediaUrl, getPlatformInfo } from '../../lib/validation';
import { generateMockAnalysisResult } from '../../lib/mock-data';
import { CredibilityAnalyzer } from '../../lib/services/CredibilityAnalyzer';
import { CrawlerFactory } from '../../lib/crawlers/CrawlerFactory';
import { logger } from '../../lib/logger';

/**
 * Get platform-specific post count from environment variables
 */
function getPlatformPostCount(platform: string): number {
  const defaultCount = parseInt(process.env.POSTS_TO_FETCH || '10', 10);
  
  let count: number;
  switch (platform.toLowerCase()) {
    case 'twitter':
      count = parseInt(process.env.TWITTER_POSTS_TO_FETCH || defaultCount.toString(), 10);
      // Twitter supports up to 200 posts with the new actor
      return Math.min(Math.max(count, 1), 200);
    case 'linkedin':
      count = parseInt(process.env.LINKEDIN_POSTS_TO_FETCH || defaultCount.toString(), 10);
      // LinkedIn typically supports up to 100 posts
      return Math.min(Math.max(count, 1), 100);
    default:
      return Math.min(Math.max(defaultCount, 1), 100);
  }
}

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

    // Check for cached completed results first
    const cachedAnalysis =
      await AnalysisRepository.findValidLatestByProfileUrl(normalizedUrl);
    if (cachedAnalysis && cachedAnalysis.state === 'COMPLETED') {
      logger.info(`Serving cached completed analysis for ${normalizedUrl}`, {
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

    // Check for existing failed analysis to determine retry strategy
    const failedAnalysis = await AnalysisRepository.findLatestFailedByProfileUrl(normalizedUrl);
    
    // Check if AI agent execution is enabled (when MOCK_AGENT_CALL is false)
    const useAIAgents = process.env.MOCK_AGENT_CALL !== 'true';

    let analysisResult;
    let postsRecord;

    if (useAIAgents) {
      try {
        // Step 1: Handle posts (crawling or reuse existing)
        let posts, profileInfo;
        
        // Check if we can reuse existing posts from failed analysis
        if (failedAnalysis && failedAnalysis.postsId && failedAnalysis.state === 'ANALYSIS_FAILED') {
          logger.info(`Reusing existing posts for retry analysis ${normalizedUrl}`, {
            postsId: failedAnalysis.postsId,
          });
          
          postsRecord = await PostsRepository.findValidPostsByProfileUrl(normalizedUrl);
          if (postsRecord && !PostsRepository.isExpired(postsRecord)) {
            // Convert stored posts to format expected by CredibilityAnalyzer
            posts = (postsRecord.posts as any[]).map(post => ({
              id: post.id,
              content: post.content,
              timestamp: post.timestamp,
              links: post.links || [],
            }));

            profileInfo = {
              platform: postsRecord.platform,
              username: postsRecord.username,
              displayName: postsRecord.displayName,
              bio: postsRecord.bio,
              verified: postsRecord.verified,
            };

            logger.info(`Successfully reused existing posts for ${normalizedUrl}`, {
              profileUsername: profileInfo.username,
              postCount: posts.length,
              verified: profileInfo.verified,
            });
          }
        }

        // If no valid posts found, fetch new ones
        if (!posts || !profileInfo) {
          logger.info(`Fetching new profile data for ${normalizedUrl}`);
          
          try {
            const profileData = await CrawlerFactory.fetchProfile(normalizedUrl);
            
            // Get platform-specific post count
            const postsToFetch = getPlatformPostCount(validationResult.platform);
            logger.info(`Fetching ${postsToFetch} recent posts for ${normalizedUrl} (${validationResult.platform})`, {
              platform: validationResult.platform,
              postsToFetch,
              twitterLimit: process.env.TWITTER_POSTS_TO_FETCH,
              linkedinLimit: process.env.LINKEDIN_POSTS_TO_FETCH,
              fallbackLimit: process.env.POSTS_TO_FETCH,
            });
            const postsData = await CrawlerFactory.fetchRecentPosts(normalizedUrl, postsToFetch);

            // Convert crawler data to format expected by CredibilityAnalyzer
            posts = postsData.map(post => ({
              id: post.id,
              content: post.content,
              timestamp: post.createdAt,
              links: [], // Links are not currently tracked in Post interface
            }));

            profileInfo = {
              platform: profileData.platform,
              username: profileData.username,
              displayName: profileData.displayName,
              bio: profileData.bio,
              verified: profileData.verified,
            };

            // Store posts in database
            postsRecord = await PostsRepository.create({
              profileUrl: normalizedUrl,
              platform: validationResult.platform,
              username: profileInfo.username,
              displayName: profileInfo.displayName,
              bio: profileInfo.bio,
              verified: profileInfo.verified,
              followerCount: (profileData as any).followerCount,
              posts: posts,
            });

            logger.info(`Successfully fetched and stored new data for ${normalizedUrl}`, {
              postsId: postsRecord.id,
              profileUsername: profileInfo.username,
              platform: validationResult.platform,
              postCount: posts.length,
              requestedPostCount: postsToFetch,
              verified: profileInfo.verified,
            });

            // Log if we got fewer posts than requested
            if (posts.length < postsToFetch) {
              logger.info(`Received fewer posts than requested - this is normal if the profile has limited recent posts`, {
                profileUrl: normalizedUrl,
                requested: postsToFetch,
                received: posts.length,
              });
            }

          } catch (crawlerError) {
            logger.error('Crawler failed', {
              error: crawlerError instanceof Error ? crawlerError.message : 'Unknown crawler error',
              url: normalizedUrl,
            });

            return NextResponse.json(
              { 
                success: false,
                error: 'Failed to fetch profile data. Please check the URL and try again.',
                details: 'Unable to access the social media profile.',
                type: 'crawler_error'
              },
              { status: 400 }
            );
          }
        }

        // Step 2: Create analysis record in ANALYZING state
        const analysisData = {
          profileUrl: normalizedUrl,
          platform: validationResult.platform,
          username: profileInfo.username,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          postsId: postsRecord?.id,
          crediScore: 0,
          sections: [],
        };

        let analysis;
        if (failedAnalysis && failedAnalysis.state === 'ANALYSIS_FAILED') {
          // Update existing failed analysis for retry
          analysis = await AnalysisRepository.updateState(failedAnalysis.id, 'ANALYZING');
          await AnalysisRepository.incrementRetryCount(failedAnalysis.id);
          logger.info(`Retrying analysis for ${normalizedUrl}`, {
            analysisId: analysis.id,
            retryCount: analysis.retryCount,
          });
        } else {
          // Create new analysis
          analysis = await AnalysisRepository.createWithState(analysisData, 'ANALYZING');
          logger.info(`Created new analysis in ANALYZING state for ${normalizedUrl}`, {
            analysisId: analysis.id,
          });
        }

        // Step 3: Perform AI analysis
        logger.info(`Starting AI analysis for ${normalizedUrl}`, {
          analysisId: analysis.id,
          profileUsername: profileInfo.username,
          postCount: posts.length,
          verified: profileInfo.verified,
        });

        const credibilityAnalyzer = new CredibilityAnalyzer();
        analysisResult = await credibilityAnalyzer.analyzeProfile(
          posts,
          profileInfo,
          { timeout: 120000 }
        );

        // Step 4: Update analysis with results
        const finalAnalysis = await AnalysisRepository.update(analysis.id, {
          state: 'COMPLETED',
          crediScore: analysisResult.crediScore,
          sections: analysisResult.sections as any,
          processingTimeMs: analysisResult.processingTimeMs || undefined,
          modelUsed: analysisResult.modelUsed || undefined,
          tokensUsed: analysisResult.tokensUsed || undefined,
          analysisPrompt: analysisResult.analysisPrompt || undefined,
        });

        logger.info(`AI analysis completed successfully for ${normalizedUrl}`, {
          analysisId: finalAnalysis.id,
          score: finalAnalysis.crediScore,
          processingTime: finalAnalysis.processingTimeMs,
        });

        return NextResponse.json({
          success: true,
          analysisId: finalAnalysis.id,
          message: 'Analysis started successfully',
          analysis: {
            id: finalAnalysis.id,
            profileUrl: finalAnalysis.profileUrl,
            platform: finalAnalysis.platform,
            username: finalAnalysis.username,
            createdAt: finalAnalysis.createdAt,
            status: 'started',
          },
        });

      } catch (error) {
        logger.error('AI agent analysis failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: normalizedUrl,
        });

        // Update analysis state to failed if we have an analysis record
        if (failedAnalysis) {
          await AnalysisRepository.updateState(
            failedAnalysis.id, 
            'ANALYSIS_FAILED', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        return NextResponse.json(
          { 
            success: false,
            error: 'Analysis failed. Please try again later.',
            details: 'AI analysis service encountered an error.',
            type: 'analysis_error'
          },
          { status: 500 }
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
      logger.info(`Created mock analysis for ${normalizedUrl}`, {
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
    }


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
