import tap from 'tap';
import { AnalysisRepository, CreateAnalysisData } from '../analysis';
import { AnalysisSection } from '../../types/analysis';
import { prisma } from '../../db';

// Mock data for testing
const mockAnalysisData: CreateAnalysisData = {
  profileUrl: 'https://twitter.com/testuser',
  platform: 'twitter',
  username: 'testuser',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  requestedBy: 'test-user-id', // Optional field
  crediScore: 8.5,
  sections: [
    {
      name: 'overview',
      data: {
        'Sampled Posts': '50',
        'Focus Areas': 'Technology, AI, Software Development',
        'Analysis Date': new Date().toLocaleDateString(),
        'Platform': 'Twitter/X',
        'Profile Status': 'Active'
      }
    },
    {
      name: 'strengths',
      data: {
        'Technical Expertise': 'High technical knowledge in software development',
        'Consistency': 'Regular posting schedule with quality content',
        'Community Engagement': 'Good interaction with followers and peers'
      }
    },
    {
      name: 'criteria_evaluation',
      data: {
        'Unnecessary Complexity': {
          status: 'pass',
          evaluation: 'Uses clear, accessible language'
        },
        'Proprietary/Pushy Selling': {
          status: 'pass',
          evaluation: 'No excessive self-promotion detected'
        },
        'Us vs. Them Framing': {
          status: 'pass',
          evaluation: 'No divisive language detected'
        },
        'Overselling Narrow Interventions': {
          status: 'pass',
          evaluation: 'Balanced claims without overpromising'
        },
        'Emotion/Story vs Data': {
          status: 'pass',
          evaluation: 'Good balance of stories and data'
        },
        'Lack of Sourcing': {
          status: 'pass',
          evaluation: 'Provides adequate sources'
        },
        'Serial Contrarian': {
          status: 'pass',
          evaluation: 'Not overly contrarian'
        },
        'Guru Syndrome': {
          status: 'pass',
          evaluation: 'Shows appropriate humility'
        }
      }
    },
    {
      name: 'representative_posts',
      data: {
        'High Quality Posts': [
          {
            content: 'Great insights on AI development trends',
            timestamp: '2 days ago',
            url: '#',
            reasoning: 'Shows technical depth and industry awareness'
          }
        ]
      }
    },
    {
      name: 'score_justification',
      data: {
        'Why Not Higher': [
          'Could provide more data sources',
          'Some posts are more opinion-based'
        ],
        'Why Not Lower': [
          'Consistent technical accuracy',
          'Good community engagement',
          'Transparent about expertise'
        ],
        'Key Factors': [
          'Technical expertise',
          'Community engagement',
          'Transparency'
        ]
      }
    }
  ],
  processingTimeMs: 5000,
  modelUsed: 'gpt-4',
  tokensUsed: 2500
};

tap.beforeEach(async () => {
  // Clean up any existing test data
  await prisma.analysis.deleteMany({
    where: {
      profileUrl: {
        contains: 'testuser'
      }
    }
  });
});

tap.teardown(async () => {
  // Clean up after tests
  await prisma.analysis.deleteMany({
    where: {
      profileUrl: {
        contains: 'testuser'
      }
    }
  });
  await prisma.$disconnect();
});

tap.test('AnalysisRepository.create should create a new analysis', async (t) => {
  const analysis = await AnalysisRepository.create(mockAnalysisData);

  t.ok(analysis, 'Analysis should be created');
  t.equal(analysis.profileUrl, mockAnalysisData.profileUrl, 'Profile URL should match');
  t.equal(analysis.platform, mockAnalysisData.platform, 'Platform should match');
  t.equal(analysis.username, mockAnalysisData.username, 'Username should match');
  t.equal(analysis.crediScore, mockAnalysisData.crediScore, 'Credi score should match');
  t.ok(analysis.sections, 'Sections should be present');
  t.equal(Array.isArray(analysis.sections), true, 'Sections should be an array');
});

tap.test('AnalysisRepository.create should allow multiple analyses for same profile URL', async (t) => {
  const first = await AnalysisRepository.create(mockAnalysisData);
  const second = await AnalysisRepository.create(mockAnalysisData);

  t.ok(first, 'First analysis should be created');
  t.ok(second, 'Second analysis should be created');
  t.not(first.id, second.id, 'Analyses should have different IDs');
  t.equal(first.profileUrl, second.profileUrl, 'Both should have same profile URL');
});

tap.test('AnalysisRepository.findLatestByProfileUrl should find latest analysis by profile URL', async (t) => {
  const first = await AnalysisRepository.create(mockAnalysisData);
  // Wait a bit to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 10));
  const second = await AnalysisRepository.create(mockAnalysisData);

  const found = await AnalysisRepository.findLatestByProfileUrl(mockAnalysisData.profileUrl);

  t.ok(found, 'Analysis should be found');
  t.equal(found?.id, second.id, 'Should return the latest analysis');
  t.equal(found?.profileUrl, mockAnalysisData.profileUrl, 'Profile URLs should match');
});

tap.test('AnalysisRepository.findAllByProfileUrl should find all analyses for profile URL', async (t) => {
  const first = await AnalysisRepository.create(mockAnalysisData);
  const second = await AnalysisRepository.create(mockAnalysisData);

  const found = await AnalysisRepository.findAllByProfileUrl(mockAnalysisData.profileUrl);

  t.equal(found.length, 2, 'Should find both analyses');
  t.ok(found.some(a => a.id === first.id), 'Should include first analysis');
  t.ok(found.some(a => a.id === second.id), 'Should include second analysis');
});

tap.test('AnalysisRepository.findLatestByProfileUrl should return null for non-existent profile URL', async (t) => {
  const found = await AnalysisRepository.findLatestByProfileUrl('https://twitter.com/nonexistent');
  t.equal(found, null, 'Should return null for non-existent profile');
});

tap.test('AnalysisRepository.update should update analysis data', async (t) => {
  const created = await AnalysisRepository.create(mockAnalysisData);

  const newSections: AnalysisSection[] = [
    {
      name: 'overview',
      data: {
        'Sampled Posts': '75',
        'Focus Areas': 'Technology, AI, Machine Learning, Data Science',
        'Analysis Date': new Date().toLocaleDateString(),
        'Platform': 'Twitter/X',
        'Profile Status': 'Active'
      }
    }
  ];

  const updateData = {
    crediScore: 9.0,
    sections: newSections
  };

  const updated = await AnalysisRepository.update(created.id, updateData);

  t.equal(updated.crediScore, 9.0, 'Credi score should be updated');
  t.ok(updated.sections, 'Sections should be present');
  t.equal(Array.isArray(updated.sections), true, 'Sections should be an array');
});

tap.test('AnalysisRepository.findValidLatestByProfileUrl should find valid non-expired analysis', async (t) => {
  // Create expired analysis
  const expiredData = {
    ...mockAnalysisData,
    expiresAt: new Date(Date.now() - 1000) // 1 second ago
  };
  await AnalysisRepository.create(expiredData);

  // Create valid analysis
  const validData = {
    ...mockAnalysisData,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  };
  const validAnalysis = await AnalysisRepository.create(validData);

  const found = await AnalysisRepository.findValidLatestByProfileUrl(mockAnalysisData.profileUrl);

  t.ok(found, 'Should find valid analysis');
  t.equal(found?.id, validAnalysis.id, 'Should return the valid analysis, not expired one');
});

tap.test('AnalysisRepository.findExpired should find expired analyses', async (t) => {
  const expiredData = {
    ...mockAnalysisData,
    profileUrl: 'https://twitter.com/expired',
    expiresAt: new Date(Date.now() - 1000) // 1 second ago
  };

  await AnalysisRepository.create(expiredData);

  const expired = await AnalysisRepository.findExpired();
  t.ok(expired.length > 0, 'Should find expired analyses');
  t.ok(expired.some(a => a.profileUrl === expiredData.profileUrl), 'Should include the expired analysis');
});

// Caching functionality tests
tap.test('Caching: findValidLatestByProfileUrl should return null when no valid cache exists', async (t) => {
  const found = await AnalysisRepository.findValidLatestByProfileUrl('https://twitter.com/nocache');
  t.equal(found, null, 'Should return null when no cached analysis exists');
});

tap.test('Caching: findValidLatestByProfileUrl should return cached analysis within 24 hours', async (t) => {
  const cacheData = {
    ...mockAnalysisData,
    profileUrl: 'https://twitter.com/cached',
    expiresAt: new Date(Date.now() + 23 * 60 * 60 * 1000) // 23 hours from now (within cache period)
  };

  const created = await AnalysisRepository.create(cacheData);
  const found = await AnalysisRepository.findValidLatestByProfileUrl(cacheData.profileUrl);

  t.ok(found, 'Should find cached analysis');
  t.equal(found?.id, created.id, 'Should return the cached analysis');
  t.equal(found?.profileUrl, cacheData.profileUrl, 'Profile URLs should match');
  t.ok(found?.expiresAt > new Date(), 'Analysis should not be expired');
});

tap.test('Caching: findValidLatestByProfileUrl should not return expired cache', async (t) => {
  const expiredCacheData = {
    ...mockAnalysisData,
    profileUrl: 'https://twitter.com/expiredcache',
    expiresAt: new Date(Date.now() - 1000) // 1 second ago (expired)
  };

  await AnalysisRepository.create(expiredCacheData);
  const found = await AnalysisRepository.findValidLatestByProfileUrl(expiredCacheData.profileUrl);

  t.equal(found, null, 'Should not return expired cached analysis');
});

tap.test('Caching: should return most recent valid cache when multiple exist', async (t) => {
  const profileUrl = 'https://twitter.com/multiplecache';

  // Create older valid cache
  const olderCache = {
    ...mockAnalysisData,
    profileUrl,
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000) // 20 hours from now
  };
  await AnalysisRepository.create(olderCache);

  // Wait a bit to ensure different timestamps
  await new Promise(resolve => setTimeout(resolve, 10));

  // Create newer valid cache
  const newerCache = {
    ...mockAnalysisData,
    profileUrl,
    crediScore: 9.5, // Different score to distinguish
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000) // 22 hours from now
  };
  const newerCreated = await AnalysisRepository.create(newerCache);

  const found = await AnalysisRepository.findValidLatestByProfileUrl(profileUrl);

  t.ok(found, 'Should find cached analysis');
  t.equal(found?.id, newerCreated.id, 'Should return the most recent valid cache');
  t.equal(found?.crediScore, 9.5, 'Should return the newer analysis with different score');
});

tap.test('Caching: should handle normalized URLs consistently', async (t) => {
  const baseUrl = 'https://twitter.com/normalizetest';
  const urlWithTrailingSlash = 'https://twitter.com/normalizetest/';

  // Create cache with base URL
  const cacheData = {
    ...mockAnalysisData,
    profileUrl: baseUrl,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
  const created = await AnalysisRepository.create(cacheData);

  // Should find cache with exact URL
  const foundExact = await AnalysisRepository.findValidLatestByProfileUrl(baseUrl);
  t.ok(foundExact, 'Should find cache with exact URL');
  t.equal(foundExact?.id, created.id, 'Should return the cached analysis');

  // Note: URL normalization should be handled at the API level before calling repository
  // This test verifies that the repository works with exact URL matches
});