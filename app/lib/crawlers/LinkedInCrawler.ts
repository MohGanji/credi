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
        profileUrl: url,
        username,
      });

      // Run the Apify actor to get profile data
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        urls: [url], // Use the full profile URL
        limitPerSource: 1, // Just need profile info
        deepScrape: true,
        rawData: false,
      });

      logger.info('Apify actor run completed for LinkedIn profile', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient
        .dataset(run.defaultDatasetId)
        .listItems();

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

      // Log the structure of the response for debugging
      logger.debug('LinkedIn profile data structure', {
        sessionId,
        availableKeys: Object.keys(result),
        hasAuthor: !!result.author,
        hasUser: !!result.user,
        hasProfile: !!result.profile,
        sampleData: JSON.stringify(result).substring(0, 500),
      });

      // Try to find profile information in different possible locations
      const profileData =
        result.author || result.user || result.profile || result;
      if (!profileData) {
        logger.warn('No profile information found in response', {
          sessionId,
          availableKeys: Object.keys(result),
        });
        throw new Error('Profile information not available');
      }

      // Extract author information from the profile data
      // The new actor format may have different field names
      const author = profileData;

      const profileResult = {
        platform: 'linkedin',
        username: author.username || author.publicIdentifier || username,
        displayName:
          author.displayName ||
          author.name ||
          `${author.first_name || author.firstName || ''} ${author.last_name || author.lastName || ''}`.trim() ||
          username,
        profileTitle:
          author.headline ||
          author.title ||
          `${author.first_name || author.firstName || ''} ${author.last_name || author.lastName || ''}`.trim(),
        bio: author.headline || author.bio || author.summary || '',
        isPublic: true,
        profilePicture:
          author.profile_picture ||
          author.profilePicture ||
          author.photoUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(author.displayName || author.name || username)}&background=0077b5&color=fff&size=128&bold=true`,
        followerCount: author.followersCount || author.followers_count || 0,
        verified: author.verified || false,
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

      // Re-throw the error instead of falling back to mock data
      throw error;
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
        profileUrl: url,
        username,
        limitPerSource: limit,
      });

      // Run the Apify actor to get posts
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        urls: [url], // Use the full profile URL
        limitPerSource: limit,
        deepScrape: true,
        rawData: false,
      });

      logger.info('Apify actor run completed for LinkedIn posts', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient
        .dataset(run.defaultDatasetId)
        .listItems();

      logger.info('Retrieved LinkedIn posts data from Apify', {
        sessionId,
        itemCount: items?.length || 0,
        hasItems: !!(items && items.length > 0),
        requestedCount: limit,
        actualCount: items?.length || 0,
      });

      if (!items || items.length === 0) {
        logger.warn('No posts data returned from Apify', { sessionId });
        throw new Error('No posts found or profile is private');
      }

      // Log if we got fewer posts than requested
      if (items.length < limit) {
        logger.info(
          'Received fewer posts than requested - this may be normal if the profile has limited recent posts',
          {
            sessionId,
            requested: limit,
            received: items.length,
            profileUrl: url,
          }
        );
      }

      const result = items[0] as any;

      // Log the structure of the first post for debugging
      logger.debug('LinkedIn posts data structure', {
        sessionId,
        availableKeys: Object.keys(result),
        isArray: Array.isArray(items),
        samplePost:
          items.length > 0
            ? JSON.stringify(items[0]).substring(0, 500)
            : 'No posts',
      });

      // The new actor returns posts directly in the items array
      if (!items || items.length === 0) {
        logger.warn('No posts found in LinkedIn response', {
          sessionId,
          itemCount: items?.length || 0,
        });
        throw new Error('No posts found or profile is private');
      }

      // Convert Apify results to our Post format
      const posts: Post[] = items.map((item: any, index: number) => {
        const postAuthor = item.author || item.user || { username: username };
        const post = {
          id:
            item.urn ||
            item.id ||
            item.postId ||
            item.activityId ||
            `post_${Date.now()}_${Math.random()}`,
          content: item.text || item.content || item.commentary || '',
          createdAt:
            item.posted_at?.timestamp || item.createdAt || item.publishedAt
              ? new Date(
                  item.posted_at?.timestamp ||
                    item.createdAt ||
                    item.publishedAt
                ).toISOString()
              : new Date().toISOString(),
          author: {
            username:
              postAuthor.username || postAuthor.publicIdentifier || username,
            displayName:
              postAuthor.displayName ||
              postAuthor.name ||
              `${postAuthor.first_name || postAuthor.firstName || ''} ${postAuthor.last_name || postAuthor.lastName || ''}`.trim() ||
              postAuthor.username ||
              'Unknown User',
          },
          metrics: {
            likes: item.stats?.like || item.likes || item.numLikes || 0,
            shares: item.stats?.reposts || item.shares || item.numShares || 0,
            comments:
              item.stats?.comments || item.comments || item.numComments || 0,
            views: item.views || item.numViews || 0,
          },
          url:
            item.url ||
            item.postUrl ||
            `https://linkedin.com/posts/${username}_${item.urn || item.id}`,
          isRetweet: item.post_type === 'repost' || item.isRepost || false,
          originalPost:
            item.post_type === 'repost' || item.isRepost
              ? {
                  id: item.original_post_id || item.originalPostId || 'unknown',
                  author: {
                    username:
                      item.original_author?.username ||
                      item.originalAuthor?.username ||
                      'unknown',
                    displayName:
                      item.original_author?.displayName ||
                      item.originalAuthor?.name ||
                      `${item.original_author?.first_name || ''} ${item.original_author?.last_name || ''}`.trim() ||
                      'Unknown User',
                  },
                }
              : undefined,
        };

        logger.debug('Processed LinkedIn post', {
          sessionId,
          postIndex: index,
          postId: post.id,
          contentLength: post.content.length,
          isRetweet: post.isRetweet,
          hasMetrics: !!(
            post.metrics.likes ||
            post.metrics.shares ||
            post.metrics.comments
          ),
        });

        return post;
      });

      const finalPosts = posts.slice(0, maxCount);

      logger.info('LinkedIn posts scraping completed successfully', {
        sessionId,
        totalPostsRetrieved: posts.length,
        finalPostCount: finalPosts.length,
        maxCount,
        averageContentLength:
          finalPosts.reduce((sum, p) => sum + p.content.length, 0) /
          finalPosts.length,
        retweetCount: finalPosts.filter((p) => p.isRetweet).length,
      });

      return finalPosts;
    } catch (error) {
      logger.error('LinkedIn posts scraping failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw the error instead of falling back to mock data
      throw error;
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
