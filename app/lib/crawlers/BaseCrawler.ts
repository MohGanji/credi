/**
 * Base crawler class that all platform-specific crawlers extend
 * Simple interface with just two public methods: fetchProfile and fetchRecentPosts
 */

import { ProfileData, Post, CrawlerError } from './types';

export abstract class BaseCrawler {
  // Internal caching and rate limiting
  private profileCache = new Map<string, { profile: ProfileData; timestamp: number }>();
  private postsCache = new Map<string, { posts: Post[]; timestamp: number }>();
  private rateLimitTracker = new Map<string, number[]>();
  
  // Configuration
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  private readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private readonly MAX_REQUESTS_PER_WINDOW = 10;

  /**
   * PUBLIC API: Fetch profile information for a given URL
   */
  async fetchProfile(url: string): Promise<ProfileData> {
    // Validate URL
    if (!this.validateUrl(url)) {
      throw this.createError('INVALID_URL', 'Invalid URL format for this platform');
    }

    // Check cache first
    const cached = this.getProfileFromCache(url);
    if (cached) {
      return cached;
    }

    // Check rate limiting
    if (!this.canMakeRequest()) {
      const error = this.createError('RATE_LIMITED', 'Rate limit exceeded. Please try again later.');
      error.retryAfter = this.getRetryAfter();
      throw error;
    }

    // Record request for rate limiting
    this.recordRequest();

    try {
      // Fetch profile using platform-specific implementation
      const profile = await this.scrapeProfile(url);
      
      // Cache result
      this.setProfileCache(url, profile);
      
      return profile;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUBLIC API: Fetch recent posts for a given profile URL
   */
  async fetchRecentPosts(url: string, maxCount: number = 20): Promise<Post[]> {
    // Validate URL
    if (!this.validateUrl(url)) {
      throw this.createError('INVALID_URL', 'Invalid URL format for this platform');
    }

    // Validate maxCount
    if (maxCount <= 0 || maxCount > 100) {
      throw this.createError('INVALID_URL', 'maxCount must be between 1 and 100');
    }

    // Check cache first
    const cacheKey = `${url}:${maxCount}`;
    const cached = this.getPostsFromCache(cacheKey);
    if (cached) {
      return cached.slice(0, maxCount);
    }

    // Check rate limiting
    if (!this.canMakeRequest()) {
      const error = this.createError('RATE_LIMITED', 'Rate limit exceeded. Please try again later.');
      error.retryAfter = this.getRetryAfter();
      throw error;
    }

    // Record request for rate limiting
    this.recordRequest();

    try {
      // Fetch posts using platform-specific implementation
      const posts = await this.scrapePosts(url, maxCount);
      
      // Cache result
      this.setPostsCache(cacheKey, posts);
      
      return posts;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Abstract methods that each platform crawler must implement
   */
  protected abstract validateUrl(url: string): boolean;
  protected abstract scrapeProfile(url: string): Promise<ProfileData>;
  protected abstract scrapePosts(url: string, maxCount: number): Promise<Post[]>;

  /**
   * Internal cache management for profiles
   */
  private getProfileFromCache(url: string): ProfileData | null {
    const cached = this.profileCache.get(url);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TIMEOUT) {
      this.profileCache.delete(url);
      return null;
    }

    return cached.profile;
  }

  private setProfileCache(url: string, profile: ProfileData): void {
    this.profileCache.set(url, {
      profile: { ...profile, lastUpdated: new Date().toISOString() },
      timestamp: Date.now()
    });
  }

  /**
   * Internal cache management for posts
   */
  private getPostsFromCache(cacheKey: string): Post[] | null {
    const cached = this.postsCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TIMEOUT) {
      this.postsCache.delete(cacheKey);
      return null;
    }

    return cached.posts;
  }

  private setPostsCache(cacheKey: string, posts: Post[]): void {
    this.postsCache.set(cacheKey, {
      posts,
      timestamp: Date.now()
    });
  }

  /**
   * Internal rate limiting
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(this.constructor.name) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.RATE_LIMIT_WINDOW);
    this.rateLimitTracker.set(this.constructor.name, validRequests);

    return validRequests.length < this.MAX_REQUESTS_PER_WINDOW;
  }

  private recordRequest(): void {
    const now = Date.now();
    const requests = this.rateLimitTracker.get(this.constructor.name) || [];
    requests.push(now);
    this.rateLimitTracker.set(this.constructor.name, requests);
  }

  private getRetryAfter(): number {
    const requests = this.rateLimitTracker.get(this.constructor.name) || [];
    if (requests.length === 0) return 0;

    const oldestRequest = Math.min(...requests);
    const timeUntilReset = this.RATE_LIMIT_WINDOW - (Date.now() - oldestRequest);
    return Math.max(0, Math.ceil(timeUntilReset / 1000));
  }

  /**
   * Internal error handling
   */
  private createError(code: CrawlerError['code'], message: string): CrawlerError {
    const error = new Error(message) as Error & CrawlerError;
    error.code = code;
    error.message = message;
    return error;
  }

  private handleError(error: unknown): CrawlerError {
    if (error instanceof Error) {
      // Handle specific error types that crawlers might throw
      if (error.message.includes('private') || error.message.includes('access')) {
        return this.createError('PRIVATE_PROFILE', 'This profile appears to be private or access is restricted');
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return this.createError('NOT_FOUND', 'Profile not found. Please check the URL and try again.');
      }

      if (error.message.includes('network') || error.message.includes('timeout')) {
        return this.createError('NETWORK_ERROR', 'Network error occurred. Please check your connection and try again.');
      }
    }

    return this.createError('NETWORK_ERROR', 'An unexpected error occurred while fetching information');
  }
}