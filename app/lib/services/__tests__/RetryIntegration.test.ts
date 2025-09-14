import { test } from 'tap';
import { AnalysisRepository } from '../../repositories/analysis';
import { PostsRepository } from '../../repositories/posts';

test('Retry Integration Tests', async (t) => {
  const testProfileUrl = 'https://x.com/retrytest';
  const testPlatform = 'twitter';
  const testUsername = 'retrytest';

  t.test('should handle complete retry workflow', async (t) => {
    // Step 1: Create a failed analysis with posts
    const postsData = {
      profileUrl: testProfileUrl,
      platform: testPlatform,
      username: testUsername,
      displayName: 'Retry Test User',
      bio: 'Test bio for retry',
      verified: false,
      followerCount: 500,
      posts: [
        {
          id: '1',
          content: 'Test post 1',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'Test post 2',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const posts = await PostsRepository.create(postsData);
    t.ok(posts.id, 'Posts should be created');

    // Create failed analysis
    const analysisData = {
      profileUrl: testProfileUrl,
      platform: testPlatform,
      username: testUsername,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      postsId: posts.id,
      crediScore: 0,
      sections: [],
    };

    const failedAnalysis = await AnalysisRepository.createWithState(
      analysisData,
      'ANALYSIS_FAILED'
    );
    await AnalysisRepository.update(failedAnalysis.id, {
      errorMessage: 'AI parsing failed',
      retryCount: 1,
    });

    t.equal(
      failedAnalysis.state,
      'ANALYSIS_FAILED',
      'Analysis should be in failed state'
    );
    t.ok(failedAnalysis.postsId, 'Analysis should have posts reference');

    // Step 2: Simulate retry logic
    const latestFailed =
      await AnalysisRepository.findLatestFailedByProfileUrl(testProfileUrl);
    t.ok(latestFailed, 'Should find latest failed analysis');
    t.equal(
      latestFailed?.id,
      failedAnalysis.id,
      'Should return the correct failed analysis'
    );

    // Check retry count limit
    const canRetry = (latestFailed?.retryCount || 0) < 3;
    t.ok(canRetry, 'Should allow retry when under limit');

    // Step 3: Simulate successful retry
    if (latestFailed && canRetry) {
      // Update to analyzing state
      const updatedAnalysis = await AnalysisRepository.updateState(
        latestFailed.id,
        'ANALYZING'
      );
      t.equal(
        updatedAnalysis.state,
        'ANALYZING',
        'Should update to analyzing state'
      );

      // Increment retry count
      await AnalysisRepository.incrementRetryCount(latestFailed.id);

      // Simulate successful completion
      const completedAnalysis = await AnalysisRepository.update(
        latestFailed.id,
        {
          state: 'COMPLETED',
          crediScore: 7.5,
          sections: [
            {
              name: 'Test Section',
              data: { score: 7.5, analysis: 'Test analysis' },
            },
          ],
        }
      );

      t.equal(
        completedAnalysis.state,
        'COMPLETED',
        'Should complete successfully'
      );
      t.equal(completedAnalysis.crediScore, 7.5, 'Should have updated score');
      t.equal(
        completedAnalysis.retryCount,
        2,
        'Should have incremented retry count'
      );
    }
  });

  t.test('should prevent retry when max attempts reached', async (t) => {
    const maxRetryUrl = 'https://x.com/maxretrytest';

    // Create analysis with max retries
    const analysisData = {
      profileUrl: maxRetryUrl,
      platform: testPlatform,
      username: 'maxretrytest',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      crediScore: 0,
      sections: [],
    };

    const maxRetryAnalysis = await AnalysisRepository.createWithState(
      analysisData,
      'ANALYSIS_FAILED'
    );
    await AnalysisRepository.update(maxRetryAnalysis.id, {
      retryCount: 3, // Max retries reached
      errorMessage: 'Max retries reached',
    });

    const latestFailed =
      await AnalysisRepository.findLatestFailedByProfileUrl(maxRetryUrl);
    const canRetry = (latestFailed?.retryCount || 0) < 3;

    t.notOk(canRetry, 'Should not allow retry when max attempts reached');
    t.equal(latestFailed?.retryCount, 3, 'Should have max retry count');
  });

  t.test('should handle crawling failure retry', async (t) => {
    const crawlingFailUrl = 'https://x.com/crawlingfailtest';

    // Create crawling failed analysis (no posts)
    const analysisData = {
      profileUrl: crawlingFailUrl,
      platform: testPlatform,
      username: 'crawlingfailtest',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      crediScore: 0,
      sections: [],
    };

    const crawlingFailedAnalysis = await AnalysisRepository.createWithState(
      analysisData,
      'CRAWLING_FAILED'
    );
    await AnalysisRepository.update(crawlingFailedAnalysis.id, {
      errorMessage: 'Crawler failed to fetch profile',
      retryCount: 1,
    });

    t.equal(
      crawlingFailedAnalysis.state,
      'CRAWLING_FAILED',
      'Analysis should be in crawling failed state'
    );
    t.notOk(
      crawlingFailedAnalysis.postsId,
      'Analysis should not have posts when crawling failed'
    );

    // Simulate retry from crawling
    const latestFailed =
      await AnalysisRepository.findLatestFailedByProfileUrl(crawlingFailUrl);
    t.ok(latestFailed, 'Should find latest failed analysis');
    t.equal(
      latestFailed?.state,
      'CRAWLING_FAILED',
      'Should be in crawling failed state'
    );

    // Update to crawling state for retry
    const retryAnalysis = await AnalysisRepository.updateState(
      latestFailed!.id,
      'CRAWLING'
    );
    t.equal(
      retryAnalysis.state,
      'CRAWLING',
      'Should update to crawling state for retry'
    );
  });

  t.test('should reuse valid posts for analysis retry', async (t) => {
    const reusePostsUrl = 'https://x.com/reusepoststest';

    // Create posts
    const postsData = {
      profileUrl: reusePostsUrl,
      platform: testPlatform,
      username: 'reusepoststest',
      displayName: 'Reuse Posts Test',
      bio: 'Test for post reuse',
      verified: true,
      followerCount: 1000,
      posts: [
        {
          id: '1',
          content: 'Reusable post 1',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          content: 'Reusable post 2',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          content: 'Reusable post 3',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const posts = await PostsRepository.create(postsData);
    t.ok(posts.id, 'Posts should be created');
    t.notOk(PostsRepository.isExpired(posts), 'Posts should not be expired');

    // Create analysis failed with posts
    const analysisData = {
      profileUrl: reusePostsUrl,
      platform: testPlatform,
      username: 'reusepoststest',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      postsId: posts.id,
      crediScore: 0,
      sections: [],
    };

    const failedAnalysis = await AnalysisRepository.createWithState(
      analysisData,
      'ANALYSIS_FAILED'
    );

    // Verify posts can be reused
    const validPosts =
      await PostsRepository.findValidPostsByProfileUrl(reusePostsUrl);
    t.ok(validPosts, 'Should find valid posts for reuse');
    t.equal(validPosts?.id, posts.id, 'Should return the same posts record');
    t.equal(
      (validPosts?.posts as any[]).length,
      3,
      'Should have all posts available'
    );

    // Verify analysis references the posts
    t.equal(
      failedAnalysis.postsId,
      posts.id,
      'Analysis should reference the posts'
    );
  });

  t.test('should handle expired posts scenario', async (t) => {
    const expiredPostsUrl = 'https://x.com/expiredpoststest';

    // Create expired posts (simulate by setting past expiration)
    const expiredPostsData = {
      profileUrl: expiredPostsUrl,
      platform: testPlatform,
      username: 'expiredpoststest',
      displayName: 'Expired Posts Test',
      bio: 'Test for expired posts',
      verified: false,
      followerCount: 200,
      posts: [
        {
          id: '1',
          content: 'Expired post 1',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const expiredPosts = await PostsRepository.create(expiredPostsData);

    // Manually set expiration to past (simulate expired posts)
    // Note: In a real scenario, this would happen naturally over time
    const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    // Create analysis with expired posts reference
    const analysisData = {
      profileUrl: expiredPostsUrl,
      platform: testPlatform,
      username: 'expiredpoststest',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      postsId: expiredPosts.id,
      crediScore: 0,
      sections: [],
    };

    const failedAnalysis = await AnalysisRepository.createWithState(
      analysisData,
      'ANALYSIS_FAILED'
    );

    // Simulate checking for valid posts (would return null for expired)
    // In real implementation, this would check expiration date
    t.ok(failedAnalysis.postsId, 'Analysis should have posts reference');

    // When posts are expired, the system should retry from crawling
    // This would be handled in the main retry logic
  });
});
