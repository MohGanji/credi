/**
 * LinkedIn profile crawler using Apify for real data scraping
 * Falls back to mock data when USE_REAL_CRAWLERS=false
 */

import { ApifyClient } from 'apify-client';
import { BaseCrawler } from './BaseCrawler';
import { ProfileData, Post } from './types';
import { LinkedInCrawlerMock } from './mock/LinkedInCrawlerMock';
import { logger } from '../logger';

export class LinkedInCrawler extends BaseCrawler {
  private mockCrawler: LinkedInCrawlerMock;
  private apifyClient: ApifyClient | null = null;
  private useRealCrawlers: boolean;

  constructor() {
    super();
    this.mockCrawler = new LinkedInCrawlerMock();
    this.useRealCrawlers = process.env.USE_REAL_CRAWLERS === 'true';
    
    logger.info('LinkedInCrawler initialized', {
      useRealCrawlers: this.useRealCrawlers,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      hasActorId: !!process.env.APIFY_LINKEDIN_ACTOR_ID,
    });
    
    if (this.useRealCrawlers) {
      const apiToken = process.env.APIFY_API_TOKEN;
      if (!apiToken) {
        logger.warn('APIFY_API_TOKEN not found, falling back to mock data');
        this.useRealCrawlers = false;
      } else {
        this.apifyClient = new ApifyClient({ token: apiToken });
        logger.info('Apify client initialized for LinkedIn crawler');
      }
    }
  }

  protected validateUrl(url: string): boolean {
    const linkedinPattern =
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinPattern.test(url);
  }

  protected async scrapeProfile(url: string): Promise<ProfileData> {
    const username = this.extractUsername(url);
    const sessionId = `linkedin_profile_${username}_${Date.now()}`;
    
    logger.info('Starting LinkedIn profile scraping', {
      sessionId,
      url,
      username,
      useRealCrawlers: this.useRealCrawlers,
    });

    if (!this.useRealCrawlers || !this.apifyClient) {
      logger.info('Using mock crawler for LinkedIn profile', { sessionId });
      return this.mockCrawler.fetchProfile(url);
    }

    try {
      const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID;
      
      if (!actorId) {
        logger.error('APIFY_LINKEDIN_ACTOR_ID not configured', { sessionId });
        throw new Error('APIFY_LINKEDIN_ACTOR_ID not configured');
      }

      logger.info('Starting Apify actor run for LinkedIn profile', {
        sessionId,
        actorId,
        username,
      });

      // Run the Apify actor to get profile data
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        username: username,
        page_number: 1,
        limit: 1, // Just need profile info
      });

      logger.info('Apify actor run completed for LinkedIn profile', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      logger.info('Retrieved LinkedIn profile data from Apify', {
        sessionId,
        itemCount: items?.length || 0,
        hasItems: !!(items && items.length > 0),
      });
      
      if (!items || items.length === 0) {
        logger.warn('No profile data returned from Apify', { sessionId });
        throw new Error('Profile not found or access restricted');
      }

      const result = items[0] as any;
      
      logger.debug('LinkedIn profile data structure', {
        sessionId,
        hasSuccess: !!result.success,
        hasData: !!result.data,
        hasPosts: !!(result.data && result.data.posts),
        postCount: result.data?.posts?.length || 0,
        availableKeys: Object.keys(result),
      });
      
      // Check if we got valid data
      if (!result.success || !result.data || !result.data.posts || result.data.posts.length === 0) {
        logger.warn('Invalid LinkedIn profile data structure', { 
          sessionId,
          success: result.success,
          hasData: !!result.data,
          hasPosts: !!(result.data && result.data.posts),
        });
        throw new Error('Profile information not available');
      }

      // Extract profile information from the first post's author data
      const firstPost = result.data.posts[0];
      const author = firstPost.author;
      
      if (!author) {
        logger.warn('No author information in LinkedIn profile data', { 
          sessionId,
          firstPostKeys: Object.keys(firstPost),
        });
        throw new Error('Profile information not available');
      }

      const profileResult = {
        platform: 'linkedin',
        username: author.username || username,
        displayName: `${author.first_name || ''} ${author.last_name || ''}`.trim() || username,
        profileTitle: author.headline || `${author.first_name || ''} ${author.last_name || ''}`.trim(),
        bio: author.headline || '',
        isPublic: true,
        profilePicture: author.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${author.first_name || ''} ${author.last_name || ''}`.trim() || username)}&background=0077b5&color=fff&size=128&bold=true`,
        followerCount: 0, // LinkedIn API doesn't typically provide follower count
        verified: false, // LinkedIn doesn't have verification badges
        lastUpdated: new Date().toISOString(),
      };

      logger.info('LinkedIn profile scraping completed successfully', {
        sessionId,
        username: profileResult.username,
        displayName: profileResult.displayName,
        profileTitle: profileResult.profileTitle,
        bioLength: profileResult.bio.length,
      });

      return profileResult;
    } catch (error) {
      logger.error('LinkedIn profile scraping failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      logger.info('Falling back to mock data for LinkedIn profile', { sessionId });
      // Fall back to mock data on error
      return this.mockCrawler.fetchProfile(url);
    }
  }

  protected async scrapePosts(url: string, maxCount: number): Promise<Post[]> {
    const username = this.extractUsername(url);
    const sessionId = `linkedin_posts_${username}_${Date.now()}`;
    
    logger.info('Starting LinkedIn posts scraping', {
      sessionId,
      url,
      username,
      maxCount,
      useRealCrawlers: this.useRealCrawlers,
    });

    if (!this.useRealCrawlers || !this.apifyClient) {
      logger.info('Using mock crawler for LinkedIn posts', { sessionId });
      return this.mockCrawler.fetchRecentPosts(url, maxCount);
    }

    try {
      const actorId = process.env.APIFY_LINKEDIN_ACTOR_ID;
      
      if (!actorId) {
        logger.error('APIFY_LINKEDIN_ACTOR_ID not configured', { sessionId });
        throw new Error('APIFY_LINKEDIN_ACTOR_ID not configured');
      }

      const limit = Math.min(maxCount, 100); // Apify actor limit
      
      logger.info('Starting Apify actor run for LinkedIn posts', {
        sessionId,
        actorId,
        username,
        limit,
      });

      // Run the Apify actor to get posts
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        username: username,
        page_number: 1,
        limit,
      });

      logger.info('Apify actor run completed for LinkedIn posts', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();
      
      logger.info('Retrieved LinkedIn posts data from Apify', {
        sessionId,
        itemCount: items?.length || 0,
        hasItems: !!(items && items.length > 0),
      });
      
      if (!items || items.length === 0) {
        logger.warn('No posts data returned from Apify', { sessionId });
        throw new Error('No posts found or profile is private');
      }

      const result = items[0] as any;
      
      logger.debug('LinkedIn posts data structure', {
        sessionId,
        hasSuccess: !!result.success,
        hasData: !!result.data,
        hasPosts: !!(result.data && result.data.posts),
        postCount: result.data?.posts?.length || 0,
        availableKeys: Object.keys(result),
      });
      
      // Check if we got valid data
      if (!result.success || !result.data || !result.data.posts) {
        logger.warn('Invalid LinkedIn posts data structure', { 
          sessionId,
          success: result.success,
          hasData: !!result.data,
          hasPosts: !!(result.data && result.data.posts),
        });
        throw new Error('No posts found or profile is private');
      }

      // Convert Apify results to our Post format
      const posts: Post[] = result.data.posts.map((item: any, index: number) => {
        const post = {
          id: item.urn || item.full_urn || `post_${Date.now()}_${Math.random()}`,
          content: item.text || '',
          createdAt: item.posted_at?.timestamp ? new Date(item.posted_at.timestamp).toISOString() : new Date().toISOString(),
          author: {
            username: item.author?.username || username,
            displayName: `${item.author?.first_name || ''} ${item.author?.last_name || ''}`.trim() || item.author?.username || 'Unknown User',
          },
          metrics: {
            likes: item.stats?.like || 0,
            shares: item.stats?.reposts || 0,
            comments: item.stats?.comments || 0,
            views: 0, // LinkedIn doesn't typically provide view counts
          },
          url: item.url || `https://linkedin.com/posts/${username}_${item.urn}`,
          isRetweet: item.post_type === 'repost' || false,
          originalPost: item.post_type === 'repost' ? {
            id: item.original_post_id || 'unknown',
            author: {
              username: item.original_author?.username || 'unknown',
              displayName: `${item.original_author?.first_name || ''} ${item.original_author?.last_name || ''}`.trim() || 'Unknown User',
            },
          } : undefined,
        };

        logger.debug('Processed LinkedIn post', {
          sessionId,
          postIndex: index,
          postId: post.id,
          contentLength: post.content.length,
          isRetweet: post.isRetweet,
          hasMetrics: !!(post.metrics.likes || post.metrics.shares || post.metrics.comments),
        });

        return post;
      });

      const finalPosts = posts.slice(0, maxCount);

      logger.info('LinkedIn posts scraping completed successfully', {
        sessionId,
        totalPostsRetrieved: posts.length,
        finalPostCount: finalPosts.length,
        maxCount,
        averageContentLength: finalPosts.reduce((sum, p) => sum + p.content.length, 0) / finalPosts.length,
        retweetCount: finalPosts.filter(p => p.isRetweet).length,
      });

      return finalPosts;
    } catch (error) {
      logger.error('LinkedIn posts scraping failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      logger.info('Falling back to mock data for LinkedIn posts', { sessionId });
      // Fall back to mock data on error
      return this.mockCrawler.fetchRecentPosts(url, maxCount);
    }
  }

  private extractUsername(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\/in\//, '').replace(/\/$/, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}
