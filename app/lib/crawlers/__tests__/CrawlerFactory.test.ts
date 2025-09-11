/**
 * Tests for CrawlerFactory
 */

import { CrawlerFactory } from '../CrawlerFactory';

describe('CrawlerFactory', () => {
  describe('fetchProfile', () => {
    it('should successfully fetch Twitter profiles', async () => {
      const profile = await CrawlerFactory.fetchProfile('https://twitter.com/testuser');
      
      expect(profile).toBeDefined();
      expect(profile.platform).toBe('twitter');
      expect(profile.username).toBe('testuser');
      expect(profile.displayName).toBeDefined();
      expect(profile.bio).toBeDefined();
      expect(profile.lastUpdated).toBeDefined();
    });

    it('should successfully fetch LinkedIn profiles', async () => {
      const profile = await CrawlerFactory.fetchProfile('https://linkedin.com/in/test-user');
      
      expect(profile).toBeDefined();
      expect(profile.platform).toBe('linkedin');
      expect(profile.username).toBe('test-user');
      expect(profile.displayName).toBeDefined();
      expect(profile.bio).toBeDefined();
      expect(profile.lastUpdated).toBeDefined();
    });

    it('should throw error for unsupported URLs', async () => {
      await expect(CrawlerFactory.fetchProfile('https://facebook.com/user'))
        .rejects.toThrow('Unsupported platform');
    });

    it('should throw error for malformed URLs', async () => {
      await expect(CrawlerFactory.fetchProfile('not-a-url'))
        .rejects.toThrow('Unsupported platform');
    });

    it('should support both twitter.com and x.com domains', async () => {
      const twitterProfile = await CrawlerFactory.fetchProfile('https://twitter.com/testuser');
      const xProfile = await CrawlerFactory.fetchProfile('https://x.com/testuser');
      
      expect(twitterProfile.platform).toBe('twitter');
      expect(xProfile.platform).toBe('twitter');
      expect(twitterProfile.username).toBe('testuser');
      expect(xProfile.username).toBe('testuser');
    });
  });

  describe('fetchRecentPosts', () => {
    it('should successfully fetch Twitter posts', async () => {
      const posts = await CrawlerFactory.fetchRecentPosts('https://twitter.com/testuser', 10);
      
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(10);
      
      // Check post structure
      posts.forEach(post => {
        expect(post.id).toBeDefined();
        expect(post.content).toBeDefined();
        expect(post.createdAt).toBeDefined();
        expect(post.author.username).toBe('testuser');
        expect(post.author.displayName).toBeDefined();
        expect(post.metrics).toBeDefined();
        expect(post.url).toBeDefined();
      });
    });

    it('should successfully fetch LinkedIn posts', async () => {
      const posts = await CrawlerFactory.fetchRecentPosts('https://linkedin.com/in/test-user', 5);
      
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts.length).toBeLessThanOrEqual(5);
      
      // Check post structure
      posts.forEach(post => {
        expect(post.id).toBeDefined();
        expect(post.content).toBeDefined();
        expect(post.createdAt).toBeDefined();
        expect(post.author.username).toBe('test-user');
        expect(post.author.displayName).toBeDefined();
        expect(post.metrics).toBeDefined();
        expect(post.url).toBeDefined();
      });
    });

    it('should respect maxCount parameter', async () => {
      const posts3 = await CrawlerFactory.fetchRecentPosts('https://twitter.com/testuser', 3);
      const posts10 = await CrawlerFactory.fetchRecentPosts('https://twitter.com/testuser2', 10);
      
      expect(posts3.length).toBeLessThanOrEqual(3);
      expect(posts10.length).toBeLessThanOrEqual(10);
    });

    it('should throw error for invalid maxCount', async () => {
      await expect(CrawlerFactory.fetchRecentPosts('https://twitter.com/testuser', 0))
        .rejects.toThrow('maxCount must be between 1 and 100');
      
      await expect(CrawlerFactory.fetchRecentPosts('https://twitter.com/testuser', 101))
        .rejects.toThrow('maxCount must be between 1 and 100');
    });

    it('should throw error for unsupported URLs', async () => {
      await expect(CrawlerFactory.fetchRecentPosts('https://facebook.com/user', 10))
        .rejects.toThrow('Unsupported platform');
    });
  });

  describe('Platform support', () => {
    it('should return correct supported platforms', () => {
      const platforms = CrawlerFactory.getSupportedPlatforms();
      expect(platforms).toContain('twitter');
      expect(platforms).toContain('linkedin');
      expect(platforms.length).toBe(2);
    });

    it('should check if URL is supported', () => {
      expect(CrawlerFactory.isSupported('https://twitter.com/user')).toBe(true);
      expect(CrawlerFactory.isSupported('https://linkedin.com/in/user')).toBe(true);
      expect(CrawlerFactory.isSupported('https://x.com/user')).toBe(true);
      expect(CrawlerFactory.isSupported('https://facebook.com/user')).toBe(false);
      expect(CrawlerFactory.isSupported('not-a-url')).toBe(false);
    });
  });

  describe('Caching behavior', () => {
    it('should cache profile results', async () => {
      const url = 'https://twitter.com/cachetest';
      
      // First request
      const profile1 = await CrawlerFactory.fetchProfile(url);
      
      // Second request should be faster (from cache)
      const startTime = Date.now();
      const profile2 = await CrawlerFactory.fetchProfile(url);
      const endTime = Date.now();
      
      // Should be much faster (cached)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Results should be identical
      expect(profile1.username).toBe(profile2.username);
      expect(profile1.displayName).toBe(profile2.displayName);
    });

    it('should cache posts results', async () => {
      const url = 'https://twitter.com/cachetest';
      
      // First request
      const posts1 = await CrawlerFactory.fetchRecentPosts(url, 5);
      
      // Second request should be faster (from cache)
      const startTime = Date.now();
      const posts2 = await CrawlerFactory.fetchRecentPosts(url, 5);
      const endTime = Date.now();
      
      // Should be much faster (cached)
      expect(endTime - startTime).toBeLessThan(100);
      
      // Results should be identical
      expect(posts1.length).toBe(posts2.length);
      if (posts1.length > 0 && posts2.length > 0) {
        expect(posts1[0].id).toBe(posts2[0].id);
      }
    });
  });

  describe('Error handling', () => {
    it('should handle rate limiting', async () => {
      // Make multiple requests quickly to trigger rate limiting
      const promises = Array.from({ length: 15 }, (_, i) => 
        CrawlerFactory.fetchProfile(`https://twitter.com/ratetest${i}`)
          .catch(error => error) // Catch errors to prevent test failure
      );
      
      const results = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResults = results.filter(r => 
        r instanceof Error && r.message.includes('Rate limit')
      );
      
      expect(rateLimitedResults.length).toBeGreaterThan(0);
    });

    it('should handle various error scenarios gracefully', async () => {
      // Test that the service handles errors properly
      const profile = await CrawlerFactory.fetchProfile('https://twitter.com/testuser');
      
      // Even if there are simulated errors, the service should handle them
      expect(profile).toBeDefined();
      expect(profile.platform).toBeDefined();
      expect(profile.username).toBeDefined();
    });
  });
});