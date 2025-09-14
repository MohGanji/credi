/**
 * Factory for creating appropriate crawler instances based on URL
 * Provides simple interface: fetchProfile(url) and fetchRecentPosts(url, maxCount)
 * Supports switching between real and mock crawlers via USE_REAL_CRAWLERS environment variable
 */

import { BaseCrawler } from './BaseCrawler';
import { TwitterCrawler } from './TwitterCrawler';
import { LinkedInCrawler } from './LinkedInCrawler';
import { TwitterCrawlerMock } from './mock/TwitterCrawlerMock';
import { LinkedInCrawlerMock } from './mock/LinkedInCrawlerMock';
import { ProfileData, Post } from './types';
import { logger } from '../logger';

export class CrawlerFactory {
  private static crawlers: Map<string, BaseCrawler> = new Map();
  private static mockCrawlers: Map<string, BaseCrawler> = new Map();

  /**
   * PUBLIC API: Fetch profile information for any supported URL
   */
  static async fetchProfile(url: string): Promise<ProfileData> {
    const sessionId = `factory_profile_${Date.now()}`;

    logger.info('CrawlerFactory: Starting profile fetch', {
      sessionId,
      url,
      useRealCrawlers: process.env.USE_REAL_CRAWLERS === 'true',
    });

    const crawler = this.getCrawler(url);

    if (!crawler) {
      logger.error('CrawlerFactory: Unsupported platform', {
        sessionId,
        url,
        supportedPlatforms: this.getSupportedPlatforms(),
      });

      const error = new Error(
        'Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.'
      ) as any;
      error.code = 'INVALID_URL';
      throw error;
    }

    logger.info('CrawlerFactory: Using crawler for profile fetch', {
      sessionId,
      crawlerType: crawler.constructor.name,
    });

    try {
      const result = await crawler.fetchProfile(url);

      logger.info('CrawlerFactory: Profile fetch completed successfully', {
        sessionId,
        platform: result.platform,
        username: result.username,
        displayName: result.displayName,
        verified: result.verified,
        followerCount: result.followerCount,
      });

      return result;
    } catch (error) {
      logger.error('CrawlerFactory: Profile fetch failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        crawlerType: crawler.constructor.name,
      });
      throw error;
    }
  }

  /**
   * PUBLIC API: Fetch recent posts for any supported URL
   */
  static async fetchRecentPosts(
    url: string,
    maxCount: number = 20
  ): Promise<Post[]> {
    const sessionId = `factory_posts_${Date.now()}`;

    logger.info('CrawlerFactory: Starting posts fetch', {
      sessionId,
      url,
      maxCount,
      useRealCrawlers: process.env.USE_REAL_CRAWLERS === 'true',
    });

    const crawler = this.getCrawler(url);

    if (!crawler) {
      logger.error('CrawlerFactory: Unsupported platform for posts', {
        sessionId,
        url,
        supportedPlatforms: this.getSupportedPlatforms(),
      });

      const error = new Error(
        'Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.'
      ) as any;
      error.code = 'INVALID_URL';
      throw error;
    }

    logger.info('CrawlerFactory: Using crawler for posts fetch', {
      sessionId,
      crawlerType: crawler.constructor.name,
    });

    try {
      const result = await crawler.fetchRecentPosts(url, maxCount);

      logger.info('CrawlerFactory: Posts fetch completed successfully', {
        sessionId,
        postCount: result.length,
        maxCount,
        averageContentLength:
          result.reduce((sum, p) => sum + p.content.length, 0) / result.length,
        platforms: [...new Set(result.map((p) => p.author.username))].length,
      });

      return result;
    } catch (error) {
      logger.error('CrawlerFactory: Posts fetch failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        crawlerType: crawler.constructor.name,
      });
      throw error;
    }
  }

  /**
   * Get appropriate crawler for a URL (internal method)
   */
  private static getCrawler(url: string): BaseCrawler | null {
    const useRealCrawlers = process.env.USE_REAL_CRAWLERS === 'true';

    logger.debug('CrawlerFactory: Selecting crawler', {
      url,
      useRealCrawlers,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      hasTwitterActorId: !!process.env.APIFY_TWITTER_ACTOR_ID,
      hasLinkedInActorId: !!process.env.APIFY_LINKEDIN_ACTOR_ID,
    });

    // Detect platform first to avoid initializing unnecessary crawlers
    const platform = this.detectPlatform(url);
    if (!platform) {
      logger.debug('CrawlerFactory: No suitable crawler found', { url });
      return null;
    }

    if (useRealCrawlers) {
      // Use real crawlers (which internally fall back to mock if needed)
      if (platform === 'twitter') {
        logger.debug('CrawlerFactory: Selected Twitter crawler (real)', {
          url,
        });
        return this.getOrCreateCrawler('twitter', TwitterCrawler);
      }

      if (platform === 'linkedin') {
        logger.debug('CrawlerFactory: Selected LinkedIn crawler (real)', {
          url,
        });
        return this.getOrCreateCrawler('linkedin', LinkedInCrawler);
      }
    } else {
      // Use mock crawlers directly
      if (platform === 'twitter') {
        logger.debug('CrawlerFactory: Selected Twitter crawler (mock)', {
          url,
        });
        return this.getOrCreateMockCrawler('twitter', TwitterCrawlerMock);
      }

      if (platform === 'linkedin') {
        logger.debug('CrawlerFactory: Selected LinkedIn crawler (mock)', {
          url,
        });
        return this.getOrCreateMockCrawler('linkedin', LinkedInCrawlerMock);
      }
    }

    logger.debug('CrawlerFactory: No suitable crawler found', { url });
    return null;
  }

  /**
   * Detect platform from URL without creating crawlers
   */
  private static detectPlatform(url: string): string | null {
    const normalizedUrl = url.toLowerCase();

    // Twitter/X detection
    if (
      normalizedUrl.includes('twitter.com') ||
      normalizedUrl.includes('x.com')
    ) {
      const twitterPattern =
        /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
      if (twitterPattern.test(url)) {
        return 'twitter';
      }
    }

    // LinkedIn detection
    if (normalizedUrl.includes('linkedin.com')) {
      const linkedinPattern =
        /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
      if (linkedinPattern.test(url)) {
        return 'linkedin';
      }
    }

    return null;
  }

  /**
   * Utility: Get supported platforms
   */
  static getSupportedPlatforms(): string[] {
    return ['twitter', 'linkedin'];
  }

  /**
   * Utility: Check if a platform is supported
   */
  static isSupported(url: string): boolean {
    return this.getCrawler(url) !== null;
  }

  private static getOrCreateCrawler<T extends BaseCrawler>(
    key: string,
    CrawlerClass: new () => T
  ): T {
    if (!this.crawlers.has(key)) {
      this.crawlers.set(key, new CrawlerClass());
    }
    return this.crawlers.get(key) as T;
  }

  private static getOrCreateMockCrawler<T extends BaseCrawler>(
    key: string,
    CrawlerClass: new () => T
  ): T {
    if (!this.mockCrawlers.has(key)) {
      this.mockCrawlers.set(key, new CrawlerClass());
    }
    return this.mockCrawlers.get(key) as T;
  }
}
