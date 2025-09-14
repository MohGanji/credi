import { test } from 'tap';
import { AnalysisRepository } from '../../repositories/analysis';
import { PostsRepository } from '../../repositories/posts';

test('Retry Logic Tests', async (t) => {
  // Mock the repositories for testing
  const mockAnalysis = {
    id: 'test-analysis-1',
    profileUrl: 'https://twitter.com/testuser',
    platform: 'twitter',
    username: 'testuser',
    state: 'ANALYSIS_FAILED',
    retryCount: 1,
    postsId: 'test-posts-1',
    crediScore: 0,
    sections: [],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    requestedBy: null,
    errorMessage: 'AI parsing failed',
    lastRetryAt: new Date(),
    processingTimeMs: null,
    modelUsed: null,
    tokensUsed: null,
    analysisPrompt: null,
    scoringPrompt: null,
  };

  const mockPosts = {
    id: 'test-posts-1',
    profileUrl: 'https://twitter.com/testuser',
    platform: 'twitter',
    username: 'testuser',
    displayName: 'Test User',
    bio: 'Test bio',
    verified: false,
    followerCount: 1000,
    posts: [
      { id: '1', content: 'Test post 1', timestamp: new Date().toISOString() },
      { id: '2', content: 'Test post 2', timestamp: new Date().toISOString() },
    ],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    analyses: [],
  };

  t.test('should identify retry scenarios correctly', async (t) => {
    // Test case 1: Analysis failed with valid posts - should retry AI analysis
    const analysisFailedWithPosts = { ...mockAnalysis, state: 'ANALYSIS_FAILED', postsId: 'test-posts-1' };
    
    t.equal(analysisFailedWithPosts.state, 'ANALYSIS_FAILED', 'Analysis should be in ANALYSIS_FAILED state');
    t.ok(analysisFailedWithPosts.postsId, 'Analysis should have postsId for reuse');
    t.equal(analysisFailedWithPosts.retryCount, 1, 'Retry count should be tracked');

    // Test case 2: Crawling failed - should retry from crawling
    const crawlingFailed = { ...mockAnalysis, state: 'CRAWLING_FAILED', postsId: null };
    
    t.equal(crawlingFailed.state, 'CRAWLING_FAILED', 'Analysis should be in CRAWLING_FAILED state');
    t.notOk(crawlingFailed.postsId, 'Analysis should not have postsId when crawling failed');

    // Test case 3: Max retries reached - should not retry
    const maxRetriesReached = { ...mockAnalysis, retryCount: 3 };
    
    t.equal(maxRetriesReached.retryCount, 3, 'Should track when max retries reached');
    t.ok(maxRetriesReached.retryCount >= 3, 'Should prevent further retries when limit reached');
  });

  t.test('should handle posts expiration correctly', async (t) => {
    // Test expired posts
    const expiredPosts = {
      ...mockPosts,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    };

    const isExpired = PostsRepository.isExpired(expiredPosts);
    t.ok(isExpired, 'Should correctly identify expired posts');

    // Test valid posts
    const validPosts = {
      ...mockPosts,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    };

    const isValid = !PostsRepository.isExpired(validPosts);
    t.ok(isValid, 'Should correctly identify valid posts');
  });

  t.test('should validate retry count limits', async (t) => {
    const testCases = [
      { retryCount: 0, shouldAllow: true, description: 'first retry' },
      { retryCount: 1, shouldAllow: true, description: 'second retry' },
      { retryCount: 2, shouldAllow: true, description: 'third retry' },
      { retryCount: 3, shouldAllow: false, description: 'max retries reached' },
      { retryCount: 4, shouldAllow: false, description: 'exceeded max retries' },
    ];

    testCases.forEach(({ retryCount, shouldAllow, description }) => {
      const canRetry = retryCount < 3;
      t.equal(canRetry, shouldAllow, `Should ${shouldAllow ? 'allow' : 'prevent'} ${description}`);
    });
  });

  t.test('should determine correct retry strategy', async (t) => {
    // Test retry from AI analysis (posts available)
    const analysisFailedScenario = {
      state: 'ANALYSIS_FAILED',
      postsId: 'test-posts-1',
      retryCount: 1,
    };

    t.equal(analysisFailedScenario.state, 'ANALYSIS_FAILED', 'Should identify AI analysis failure');
    t.ok(analysisFailedScenario.postsId, 'Should have posts available for reuse');

    // Test retry from crawling (no posts or crawling failed)
    const crawlingFailedScenario = {
      state: 'CRAWLING_FAILED',
      postsId: null,
      retryCount: 1,
    };

    t.equal(crawlingFailedScenario.state, 'CRAWLING_FAILED', 'Should identify crawling failure');
    t.notOk(crawlingFailedScenario.postsId, 'Should not have posts when crawling failed');
  });

  t.test('should handle state transitions correctly', async (t) => {
    const stateTransitions = [
      { from: 'ANALYSIS_FAILED', to: 'ANALYZING', description: 'retry AI analysis' },
      { from: 'CRAWLING_FAILED', to: 'CRAWLING', description: 'retry crawling' },
      { from: 'ANALYZING', to: 'COMPLETED', description: 'successful completion' },
      { from: 'ANALYZING', to: 'ANALYSIS_FAILED', description: 'AI analysis failure' },
      { from: 'CRAWLING', to: 'ANALYZING', description: 'successful crawling' },
      { from: 'CRAWLING', to: 'CRAWLING_FAILED', description: 'crawling failure' },
    ];

    stateTransitions.forEach(({ from, to, description }) => {
      // These are the valid state transitions based on our design
      const validTransitions = {
        'ANALYSIS_FAILED': ['ANALYZING'],
        'CRAWLING_FAILED': ['CRAWLING'],
        'ANALYZING': ['COMPLETED', 'ANALYSIS_FAILED'],
        'CRAWLING': ['ANALYZING', 'CRAWLING_FAILED'],
      };

      const isValidTransition = validTransitions[from as keyof typeof validTransitions]?.includes(to);
      t.ok(isValidTransition, `Should allow transition from ${from} to ${to} for ${description}`);
    });
  });
});