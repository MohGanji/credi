import { test } from 'tap';
import { PostsRepository, PostsData } from '../posts';

test('PostsRepository.create should create a new posts record', async (t) => {
  const postsData: PostsData = {
    profileUrl: 'https://x.com/testuser',
    platform: 'twitter',
    username: 'testuser',
    displayName: 'Test User',
    bio: 'Test bio',
    verified: true,
    followerCount: 1000,
    posts: [
      {
        id: '1',
        content: 'Test post content',
        timestamp: new Date('2024-01-15'),
        links: ['https://example.com'],
      },
    ],
  };

  const posts = await PostsRepository.create(postsData);

  t.ok(posts, 'Posts should be created');
  t.equal(posts.profileUrl, postsData.profileUrl, 'Profile URL should match');
  t.equal(posts.platform, postsData.platform, 'Platform should match');
  t.equal(posts.username, postsData.username, 'Username should match');
  t.equal(posts.displayName, postsData.displayName, 'Display name should match');
  t.equal(posts.bio, postsData.bio, 'Bio should match');
  t.equal(posts.verified, postsData.verified, 'Verified status should match');
  t.equal(posts.followerCount, postsData.followerCount, 'Follower count should match');
  t.ok(Array.isArray(posts.posts), 'Posts should be an array');
  t.equal((posts.posts as any[]).length, 1, 'Should have one post');
  t.ok(posts.expiresAt > new Date(), 'Should have future expiration date');
});

test('PostsRepository.findValidPostsByProfileUrl should find valid posts', async (t) => {
  const postsData: PostsData = {
    profileUrl: 'https://x.com/findtest',
    platform: 'twitter',
    username: 'findtest',
    posts: [{ id: '1', content: 'Test', timestamp: new Date(), links: [] }],
  };

  const createdPosts = await PostsRepository.create(postsData);
  const foundPosts = await PostsRepository.findValidPostsByProfileUrl(postsData.profileUrl);

  t.ok(foundPosts, 'Posts should be found');
  t.equal(foundPosts?.id, createdPosts.id, 'Should return the created posts');
});

test('PostsRepository.findValidPostsByProfileUrl should return null for expired posts', async (t) => {
  const postsData: PostsData = {
    profileUrl: 'https://x.com/expiredtest',
    platform: 'twitter',
    username: 'expiredtest',
    posts: [{ id: '1', content: 'Test', timestamp: new Date(), links: [] }],
  };

  const createdPosts = await PostsRepository.create(postsData);
  
  // Manually set expiration to past
  const { PrismaClient } = await import('../../../generated/prisma');
  const prisma = new PrismaClient();
  await prisma.posts.update({
    where: { id: createdPosts.id },
    data: { expiresAt: new Date(Date.now() - 1000) }, // 1 second ago
  });

  const foundPosts = await PostsRepository.findValidPostsByProfileUrl(postsData.profileUrl);
  t.equal(foundPosts, null, 'Should return null for expired posts');
});

test('PostsRepository.isExpired should correctly identify expired posts', async (t) => {
  const postsData: PostsData = {
    profileUrl: 'https://x.com/expiretest',
    platform: 'twitter',
    username: 'expiretest',
    posts: [{ id: '1', content: 'Test', timestamp: new Date(), links: [] }],
  };

  const posts = await PostsRepository.create(postsData);
  
  t.equal(PostsRepository.isExpired(posts), false, 'New posts should not be expired');
  
  // Create posts with past expiration
  const { PrismaClient } = await import('../../../generated/prisma');
  const prisma = new PrismaClient();
  const expiredPosts = await prisma.posts.create({
    data: {
      profileUrl: 'https://x.com/expiredtest2',
      platform: 'twitter',
      username: 'expiredtest2',
      posts: [],
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
    },
  });
  
  t.equal(PostsRepository.isExpired(expiredPosts), true, 'Expired posts should be identified as expired');
});