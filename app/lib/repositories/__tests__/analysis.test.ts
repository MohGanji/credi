import tap from 'tap';
import { AnalysisRepository, CreateAnalysisData } from '../analysis';
import { prisma } from '../../db';

// Mock data for testing
const mockAnalysisData: CreateAnalysisData = {
  profileUrl: 'https://twitter.com/testuser',
  platform: 'twitter',
  username: 'testuser',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  requestedBy: 'test-user-id', // Optional field
  sampledPosts: 50,
  crediScore: 8.5,
  focusAreas: ['Technology', 'AI', 'Software Development'],
  strengths: {
    expertise: 'High technical knowledge',
    consistency: 'Regular posting schedule',
    engagement: 'Good interaction with followers'
  },
  criteriaEvaluation: {
    expertise: 9,
    transparency: 8,
    consistency: 8,
    engagement: 7
  },
  representativePosts: {
    posts: [
      { id: '1', content: 'Sample post 1', engagement: 100 },
      { id: '2', content: 'Sample post 2', engagement: 150 }
    ]
  },
  scoreJustification: {
    reasoning: 'High expertise in technical topics with consistent posting',
    factors: ['Technical accuracy', 'Regular updates', 'Community engagement']
  },
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
  t.equal(analysis.sampledPosts, mockAnalysisData.sampledPosts, 'Sampled posts should match');
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
  
  const updateData = {
    crediScore: 9.0,
    sampledPosts: 75,
    focusAreas: ['Technology', 'AI', 'Machine Learning', 'Data Science']
  };
  
  const updated = await AnalysisRepository.update(created.id, updateData);
  
  t.equal(updated.crediScore, 9.0, 'Credi score should be updated');
  t.equal(updated.sampledPosts, 75, 'Sampled posts should be updated');
  t.same(updated.focusAreas, updateData.focusAreas, 'Focus areas should be updated');
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