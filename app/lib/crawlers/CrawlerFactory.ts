/**
 * Factory for creating appropriate crawler instances based on URL
 * Provides simple interface: fetchProfile(url) and fetchRecentPosts(url, maxCount)
 */

import { BaseCrawler } from './BaseCrawler';
import { TwitterCrawler } from './TwitterCrawler';
import { LinkedInCrawler } from './LinkedInCrawler';
import { ProfileData, Post } from './types';

export class CrawlerFactory {
  private static crawlers: Map<string, BaseCrawler> = new Map();

  /**
   * PUBLIC API: Fetch profile information for any supported URL
   */
  static async fetchProfile(url: string): Promise<ProfileData> {
    const crawler = this.getCrawler(url);
    
    if (!crawler) {
      const error = new Error('Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.') as any;
      error.code = 'INVALID_URL';
      throw error;
    }

    return crawler.fetchProfile(url);
  }

  /**
   * PUBLIC API: Fetch recent posts for any supported URL
   */
  static async fetchRecentPosts(url: string, maxCount: number = 20): Promise<Post[]> {
    const crawler = this.getCrawler(url);
    
    if (!crawler) {
      const error = new Error('Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.') as any;
      error.code = 'INVALID_URL';
      throw error;
    }

    return crawler.fetchRecentPosts(url, maxCount);
  }

  /**
   * Get appropriate crawler for a URL (internal method)
   */
  private static getCrawler(url: string): BaseCrawler | null {
    const twitterCrawler = this.getOrCreateCrawler('twitter', TwitterCrawler);
    const linkedinCrawler = this.getOrCreateCrawler('linkedin', LinkedInCrawler);

    // Check which crawler can handle this URL
    if ((twitterCrawler as any).validateUrl(url)) {
      return twitterCrawler;
    }
    
    if ((linkedinCrawler as any).validateUrl(url)) {
      return linkedinCrawler;
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
}