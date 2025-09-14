import { test } from 'tap';
import { RepresentativePostSchema } from '../../schemas/credibility-analysis';

test('Representative Posts Format Tests', async (t) => {
  t.test('should validate new 3-column format with embedded timestamp and URL', async (t) => {
    const validPost = {
      category: 'High Quality',
      content: '[Jan 15, 2024][https://linkedin.com/posts/dharmesh_test-123]\nThis is a well-sourced post about AI development with proper citations and balanced perspective.',
      reasoning: 'This post demonstrates excellent sourcing practices and balanced analysis of complex topics.'
    };

    const result = RepresentativePostSchema.safeParse(validPost);
    t.ok(result.success, 'Should validate post with timestamp and URL');
    
    if (result.success) {
      t.equal(result.data.category, 'High Quality', 'Should preserve category');
      t.ok(result.data.content.includes('[Jan 15, 2024]'), 'Should include timestamp in content');
      t.ok(result.data.content.includes('[https://linkedin.com/posts/dharmesh_test-123]'), 'Should include URL in content');
      t.ok(result.data.content.includes('This is a well-sourced post'), 'Should include actual post content');
      t.equal(result.data.reasoning, validPost.reasoning, 'Should preserve reasoning');
    }
  });

  t.test('should validate format with missing URL', async (t) => {
    const postWithoutUrl = {
      category: 'Concerning',
      content: '[Jan 15, 2024][]\nThis post makes unsupported health claims without any citations or evidence.',
      reasoning: 'This post exemplifies the lack of sourcing criterion with unsubstantiated medical advice.'
    };

    const result = RepresentativePostSchema.safeParse(postWithoutUrl);
    t.ok(result.success, 'Should validate post without URL');
    
    if (result.success) {
      t.equal(result.data.category, 'Concerning', 'Should preserve category');
      t.ok(result.data.content.includes('[Jan 15, 2024][]'), 'Should include empty URL brackets');
      t.ok(result.data.content.includes('This post makes unsupported'), 'Should include actual post content');
    }
  });

  t.test('should validate different category types', async (t) => {
    const categories = [
      'High Quality',
      'Concerning', 
      'Educational',
      'Promotional',
      'Personal Anecdote',
      'Health Claim',
      'Product Promotion'
    ];

    categories.forEach(category => {
      const post = {
        category,
        content: `[Jan 15, 2024][https://example.com/post]\nSample content for ${category} category.`,
        reasoning: `This post represents the ${category} category because...`
      };

      const result = RepresentativePostSchema.safeParse(post);
      t.ok(result.success, `Should validate ${category} category`);
    });
  });

  t.test('should validate different timestamp formats', async (t) => {
    const timestampFormats = [
      '[Jan 15, 2024]',
      '[2024-01-15]',
      '[2024-01-15 14:30]',
      '[January 15, 2024]',
      '[15 Jan 2024]'
    ];

    timestampFormats.forEach(timestamp => {
      const post = {
        category: 'Test',
        content: `${timestamp}[https://example.com/post]\nTest content with different timestamp format.`,
        reasoning: 'Testing timestamp format validation.'
      };

      const result = RepresentativePostSchema.safeParse(post);
      t.ok(result.success, `Should validate timestamp format: ${timestamp}`);
    });
  });

  t.test('should validate multiline content', async (t) => {
    const multilinePost = {
      category: 'Educational',
      content: `[Jan 15, 2024][https://linkedin.com/posts/example]\nThis is a comprehensive post about AI development.\n\nIt includes multiple paragraphs with detailed explanations.\n\nThe post also includes:\n- Bullet points\n- References to studies\n- Balanced perspectives on the topic`,
      reasoning: 'This post demonstrates comprehensive educational content with proper structure and multiple supporting points.'
    };

    const result = RepresentativePostSchema.safeParse(multilinePost);
    t.ok(result.success, 'Should validate multiline content');
    
    if (result.success) {
      t.ok(result.data.content.includes('\n\n'), 'Should preserve paragraph breaks');
      t.ok(result.data.content.includes('- Bullet points'), 'Should preserve formatting');
    }
  });

  t.test('should reject invalid format', async (t) => {
    const invalidPosts = [
      {
        category: 'Test',
        // Missing content field
        reasoning: 'Test reasoning'
      },
      {
        // Missing category field
        content: '[Jan 15, 2024][]\nTest content',
        reasoning: 'Test reasoning'
      },
      {
        category: 'Test',
        content: '[Jan 15, 2024][]\nTest content',
        // Missing reasoning field
      }
    ];

    invalidPosts.forEach((post, index) => {
      const result = RepresentativePostSchema.safeParse(post);
      t.notOk(result.success, `Should reject invalid post format ${index + 1}`);
    });
  });

  t.test('should demonstrate improved readability', async (t) => {
    // Old format (for comparison)
    const oldFormat = {
      content: 'This is a well-sourced post about AI development.',
      url: 'https://linkedin.com/posts/dharmesh_test-123',
      timestamp: 'Jan 15, 2024',
      reasoning: 'Demonstrates excellent sourcing practices.'
    };

    // New format
    const newFormat = {
      category: 'High Quality',
      content: '[Jan 15, 2024][https://linkedin.com/posts/dharmesh_test-123]\nThis is a well-sourced post about AI development.',
      reasoning: 'Demonstrates excellent sourcing practices and provides more space for detailed reasoning about why this post exemplifies high-quality content with proper citations and balanced analysis.'
    };

    // Validate new format
    const result = RepresentativePostSchema.safeParse(newFormat);
    t.ok(result.success, 'New format should be valid');

    // Demonstrate space efficiency
    const oldFormatFields = Object.keys(oldFormat).length; // 4 fields
    const newFormatFields = Object.keys(newFormat).length; // 3 fields
    
    t.ok(newFormatFields < oldFormatFields, 'New format should have fewer fields');
    t.ok(newFormat.reasoning.length > 50, 'New format allows for longer reasoning text');
    t.ok(newFormat.content.includes('[Jan 15, 2024]'), 'Timestamp is embedded in content');
    t.ok(newFormat.content.includes('[https://linkedin.com/posts/dharmesh_test-123]'), 'URL is embedded in content');
  });
});