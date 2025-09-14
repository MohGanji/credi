import { test } from 'tap';
import { CredibilityAnalyzer } from '../CredibilityAnalyzer';

test('Prompt Improvement Tests', async (t) => {
  // Mock the environment variable for testing
  const originalPrompt = process.env.CREDIBILITY_ANALYSIS_PROMPT;
  process.env.CREDIBILITY_ANALYSIS_PROMPT = `Analyze the following {platform} social media profile for credibility based on these 8 criteria:

1. Test criteria...

Profile Information:
- Username: {username}
- Display Name: {displayName}
- Bio: {bio}
- Verified: {verified}

Recent Posts ({postCount} total):
{posts}

Test prompt template for validation.`;

  const analyzer = new CredibilityAnalyzer();

  // Restore environment after tests
  t.teardown(() => {
    if (originalPrompt) {
      process.env.CREDIBILITY_ANALYSIS_PROMPT = originalPrompt;
    } else {
      delete process.env.CREDIBILITY_ANALYSIS_PROMPT;
    }
  });

  t.test('should include platform in prompt', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post content',
        timestamp: '2025-09-14T12:00:00Z',
        url: 'https://linkedin.com/posts/dharmesh_test-post-123',
        links: [],
      },
    ];

    const mockProfileInfo = {
      platform: 'linkedin',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      verified: false,
    };

    // Access the private method through reflection for testing
    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    t.ok(prompt.includes('LinkedIn'), 'Prompt should include LinkedIn platform name');
    t.ok(prompt.includes('following LinkedIn social media profile'), 'Prompt should specify LinkedIn in the opening');
    t.notOk(prompt.includes('{platform}'), 'Platform placeholder should be replaced');
  });

  t.test('should include post URLs in prompt', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post with URL',
        timestamp: '2025-09-14T12:00:00Z',
        url: 'https://linkedin.com/posts/dharmesh_test-post-123',
        links: [],
      },
      {
        id: '2',
        content: 'Test post without URL',
        timestamp: '2025-09-14T12:01:00Z',
        links: [],
      },
    ];

    const mockProfileInfo = {
      platform: 'linkedin',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      verified: false,
    };

    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    t.ok(prompt.includes('URL: https://linkedin.com/posts/dharmesh_test-post-123'), 'Prompt should include post URL when available');
    t.ok(prompt.includes('Test post with URL'), 'Prompt should include post content');
    t.ok(prompt.includes('Test post without URL'), 'Prompt should include posts without URLs');
  });

  t.test('should handle Twitter platform correctly', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Twitter test post',
        timestamp: '2025-09-14T12:00:00Z',
        url: 'https://x.com/testuser/status/123456789',
        links: [],
      },
    ];

    const mockProfileInfo = {
      platform: 'twitter',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      verified: true,
    };

    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    t.ok(prompt.includes('Twitter/X'), 'Prompt should include Twitter/X platform name');
    t.ok(prompt.includes('following Twitter/X social media profile'), 'Prompt should specify Twitter/X in the opening');
    t.ok(prompt.includes('URL: https://x.com/testuser/status/123456789'), 'Prompt should include Twitter URL');
  });

  t.test('should handle unknown platform gracefully', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Unknown platform post',
        timestamp: '2025-09-14T12:00:00Z',
        url: 'https://example.com/post/123',
        links: [],
      },
    ];

    const mockProfileInfo = {
      platform: 'unknown',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      verified: false,
    };

    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    t.ok(prompt.includes('following unknown social media profile'), 'Prompt should handle unknown platform');
    t.ok(prompt.includes('URL: https://example.com/post/123'), 'Prompt should include URL regardless of platform');
  });

  t.test('should include all required profile information', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post',
        timestamp: '2025-09-14T12:00:00Z',
        url: 'https://linkedin.com/posts/test-123',
        links: ['https://example.com'],
      },
    ];

    const mockProfileInfo = {
      platform: 'linkedin',
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Professional test bio',
      verified: true,
    };

    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    // Check profile information is included
    t.ok(prompt.includes('Username: testuser'), 'Prompt should include username');
    t.ok(prompt.includes('Display Name: Test User'), 'Prompt should include display name');
    t.ok(prompt.includes('Bio: Professional test bio'), 'Prompt should include bio');
    t.ok(prompt.includes('Verified: Yes'), 'Prompt should include verification status');
    t.ok(prompt.includes('Recent Posts (1 total)'), 'Prompt should include post count');

    // Check post information is included
    t.ok(prompt.includes('Post 1 (2025-09-14T12:00:00Z)'), 'Prompt should include post timestamp');
    t.ok(prompt.includes('Test post'), 'Prompt should include post content');
    t.ok(prompt.includes('URL: https://linkedin.com/posts/test-123'), 'Prompt should include post URL');
    t.ok(prompt.includes('Links: https://example.com'), 'Prompt should include post links');
  });

  t.test('should handle missing profile information gracefully', async (t) => {
    const mockPosts = [
      {
        id: '1',
        content: 'Test post',
        timestamp: '2025-09-14T12:00:00Z',
        links: [],
      },
    ];

    const mockProfileInfo = {
      platform: null,
      username: null,
      displayName: null,
      bio: null,
      verified: null,
    };

    const buildPrompt = (analyzer as any).buildCredibilityPrompt.bind(analyzer);
    const prompt = buildPrompt(mockPosts, mockProfileInfo);

    t.ok(prompt.includes('Username: unknown'), 'Prompt should handle missing username');
    t.ok(prompt.includes('Display Name: unknown'), 'Prompt should handle missing display name');
    t.ok(prompt.includes('Bio: No bio available'), 'Prompt should handle missing bio');
    t.ok(prompt.includes('Verified: No'), 'Prompt should handle missing verification');
    t.ok(prompt.includes('following social media social media profile'), 'Prompt should handle missing platform');
  });

  t.test('getPlatformDisplayName should return correct display names', async (t) => {
    const getPlatformDisplayName = (analyzer as any).getPlatformDisplayName.bind(analyzer);

    t.equal(getPlatformDisplayName('twitter'), 'Twitter/X', 'Should return Twitter/X for twitter');
    t.equal(getPlatformDisplayName('linkedin'), 'LinkedIn', 'Should return LinkedIn for linkedin');
    t.equal(getPlatformDisplayName('TWITTER'), 'Twitter/X', 'Should handle uppercase twitter');
    t.equal(getPlatformDisplayName('LINKEDIN'), 'LinkedIn', 'Should handle uppercase linkedin');
    t.equal(getPlatformDisplayName('facebook'), 'facebook', 'Should return original for unknown platform');
    t.equal(getPlatformDisplayName(null), 'social media', 'Should return default for null platform');
    t.equal(getPlatformDisplayName(undefined), 'social media', 'Should return default for undefined platform');
    t.equal(getPlatformDisplayName(''), 'social media', 'Should return default for empty platform');
  });
});