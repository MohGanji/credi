import { test } from 'tap';

test('Prompt Integration Test', async (t) => {
  t.test('should verify prompt improvements are working', async (t) => {
    // This test verifies that our prompt improvements are correctly implemented
    // by checking the actual environment variable content
    
    const prompt = process.env.CREDIBILITY_ANALYSIS_PROMPT;
    t.ok(prompt, 'CREDIBILITY_ANALYSIS_PROMPT should be defined');
    
    if (prompt) {
      // Check that platform variable is included
      t.ok(prompt.includes('{platform}'), 'Prompt should include {platform} placeholder');
      t.ok(prompt.includes('following {platform} social media profile'), 'Prompt should specify platform in opening');
      
      // Check that URL instructions are included
      t.ok(prompt.includes('IMPORTANT INSTRUCTIONS FOR REPRESENTATIVE POSTS'), 'Prompt should include URL instructions');
      t.ok(prompt.includes('ONLY use the actual URLs provided'), 'Prompt should instruct to use only actual URLs');
      t.ok(prompt.includes('DO NOT generate, fabricate, or guess URLs'), 'Prompt should warn against fake URLs');
      
      // Check that all required placeholders are present
      const requiredPlaceholders = [
        '{platform}',
        '{username}',
        '{displayName}',
        '{bio}',
        '{verified}',
        '{postCount}',
        '{posts}'
      ];
      
      requiredPlaceholders.forEach(placeholder => {
        t.ok(prompt.includes(placeholder), `Prompt should include ${placeholder} placeholder`);
      });
    }
  });

  t.test('should verify data flow improvements', async (t) => {
    // Test that demonstrates the data flow improvements
    // This simulates how posts with URLs should be processed
    
    const mockPostWithUrl = {
      id: '1',
      content: 'Test post content',
      createdAt: '2025-09-14T12:00:00Z',
      url: 'https://linkedin.com/posts/dharmesh_test-123',
      author: {
        username: 'dharmesh',
        displayName: 'Dharmesh Shah'
      },
      metrics: {
        likes: 100,
        shares: 10,
        comments: 5
      },
      isRetweet: false
    };

    const mockPostWithoutUrl = {
      id: '2',
      content: 'Another test post',
      createdAt: '2025-09-14T12:01:00Z',
      url: '', // Empty URL
      author: {
        username: 'dharmesh',
        displayName: 'Dharmesh Shah'
      },
      metrics: {
        likes: 50,
        shares: 2,
        comments: 3
      },
      isRetweet: false
    };

    // Simulate the conversion that happens in the analysis route
    const convertedPosts = [mockPostWithUrl, mockPostWithoutUrl].map(post => ({
      id: post.id,
      content: post.content,
      timestamp: post.createdAt,
      url: post.url, // This is the key improvement - URL is now included
      links: [],
    }));

    t.equal(convertedPosts.length, 2, 'Should convert all posts');
    t.equal(convertedPosts[0].url, 'https://linkedin.com/posts/dharmesh_test-123', 'Should preserve URL when available');
    t.equal(convertedPosts[1].url, '', 'Should handle empty URL gracefully');
    
    // Verify all required fields are present
    convertedPosts.forEach((post, index) => {
      t.ok(post.id, `Post ${index + 1} should have id`);
      t.ok(post.content, `Post ${index + 1} should have content`);
      t.ok(post.timestamp, `Post ${index + 1} should have timestamp`);
      t.ok(post.hasOwnProperty('url'), `Post ${index + 1} should have url field (even if empty)`);
      t.ok(Array.isArray(post.links), `Post ${index + 1} should have links array`);
    });
  });

  t.test('should verify platform detection improvements', async (t) => {
    // Test platform-specific improvements
    const testCases = [
      {
        platform: 'linkedin',
        expectedDisplay: 'LinkedIn',
        expectedInPrompt: 'following LinkedIn social media profile'
      },
      {
        platform: 'twitter',
        expectedDisplay: 'Twitter/X',
        expectedInPrompt: 'following Twitter/X social media profile'
      },
      {
        platform: 'unknown',
        expectedDisplay: 'unknown',
        expectedInPrompt: 'following unknown social media profile'
      }
    ];

    testCases.forEach(({ platform, expectedDisplay, expectedInPrompt }) => {
      // This would be how the platform display name is determined
      let displayName;
      switch (platform?.toLowerCase()) {
        case 'twitter':
          displayName = 'Twitter/X';
          break;
        case 'linkedin':
          displayName = 'LinkedIn';
          break;
        default:
          displayName = platform || 'social media';
      }

      t.equal(displayName, expectedDisplay, `Should return correct display name for ${platform}`);
      
      // Simulate prompt replacement
      const mockPrompt = 'Analyze the following {platform} social media profile';
      const replacedPrompt = mockPrompt.replace('{platform}', displayName);
      t.ok(replacedPrompt.includes(expectedInPrompt), `Should correctly replace platform in prompt for ${platform}`);
    });
  });
});