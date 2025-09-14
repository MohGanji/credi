/**
 * Twitter/X profile crawler using Apify for real data scraping
 * Falls back to mock data when USE_REAL_CRAWLERS=false
 */

import { ApifyClient } from 'apify-client';
import { BaseCrawler } from './BaseCrawler';
import { ProfileData, Post } from './types';
import { TwitterCrawlerMock } from './mock/TwitterCrawlerMock';
import { logger } from '../logger';

export class TwitterCrawler extends BaseCrawler {
  private mockCrawler: TwitterCrawlerMock;
  private apifyClient: ApifyClient | null = null;
  private useRealCrawlers: boolean;

  constructor() {
    super();
    this.mockCrawler = new TwitterCrawlerMock();
    this.useRealCrawlers = process.env.USE_REAL_CRAWLERS === 'true';

    logger.info('TwitterCrawler initialized', {
      useRealCrawlers: this.useRealCrawlers,
      hasApifyToken: !!process.env.APIFY_API_TOKEN,
      hasActorId: !!process.env.APIFY_TWITTER_ACTOR_ID,
    });

    if (this.useRealCrawlers) {
      const apiToken = process.env.APIFY_API_TOKEN;
      if (!apiToken) {
        logger.warn('APIFY_API_TOKEN not found, falling back to mock data');
        this.useRealCrawlers = false;
      } else {
        this.apifyClient = new ApifyClient({ token: apiToken });
        logger.info('Apify client initialized for Twitter crawler');
      }
    }
  }

  protected validateUrl(url: string): boolean {
    const twitterPattern =
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
    return twitterPattern.test(url);
  }

  protected async scrapeProfile(url: string): Promise<ProfileData> {
    const username = this.extractUsername(url);
    const sessionId = `twitter_profile_${username}_${Date.now()}`;

    logger.info('Starting Twitter profile scraping', {
      sessionId,
      url,
      username,
      useRealCrawlers: this.useRealCrawlers,
    });

    if (!this.useRealCrawlers || !this.apifyClient) {
      logger.info('Using mock crawler for Twitter profile', { sessionId });
      return this.mockCrawler.fetchProfile(url);
    }

    try {
      const actorId = process.env.APIFY_TWITTER_ACTOR_ID;

      if (!actorId) {
        logger.error('APIFY_TWITTER_ACTOR_ID not configured', { sessionId });
        throw new Error('APIFY_TWITTER_ACTOR_ID not configured');
      }

      // Extract username for the new actor format
      const username = this.extractUsername(url);

      logger.info('Starting Apify actor run for Twitter profile', {
        sessionId,
        actorId,
        profileUrl: url,
        from: username,
        maxItems: 1,
        queryType: 'Latest',
      });

      // Run the Apify actor to get profile data
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        from: username,
        maxItems: 1, // Just need profile info
        queryType: 'Latest',
      });

      logger.info('Apify actor run completed for Twitter profile', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      logger.info('Retrieved Twitter profile data from Apify', {
        sessionId,
        itemCount: items?.length || 0,
        hasItems: !!(items && items.length > 0),
      });

      if (!items || items.length === 0) {
        logger.warn('No profile data returned from Apify', { sessionId });
        throw new Error('Profile not found or access restricted');
      }

      const profileData = items[0] as any;
      
      // Log the structure of the response for debugging
      logger.debug('Twitter profile data structure', {
        sessionId,
        availableKeys: Object.keys(profileData),
        hasAuthor: !!profileData.author,
        hasUser: !!profileData.user,
        sampleData: JSON.stringify(profileData).substring(0, 500),
      });

      // Extract profile information from the response
      // Try different possible field names for author/user data
      const author = profileData.author || profileData.user || profileData;
      if (!author) {
        logger.warn('No author information in profile data', {
          sessionId,
          availableKeys: Object.keys(profileData),
        });
        throw new Error('Profile information not available');
      }

      const result = {
        platform: 'twitter',
        username: author.screenName || author.screen_name || author.username || username,
        displayName: author.name || author.displayName || author.display_name || username,
        profileTitle: `${author.name || author.displayName || username} (@${author.screenName || author.screen_name || author.username || username})`,
        bio: author.description || author.bio || '',
        isPublic: true,
        profilePicture: author.profileImageUrl || author.profile_image_url || author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || username)}&background=1da1f2&color=fff&size=128&bold=true`,
        followerCount: author.followersCount || author.followers_count || author.followerCount || 0,
        verified: author.verified || false,
        lastUpdated: new Date().toISOString(),
      };

      logger.info('Twitter profile scraping completed successfully', {
        sessionId,
        username: result.username,
        displayName: result.displayName,
        followerCount: result.followerCount,
        verified: result.verified,
        bioLength: result.bio.length,
      });

      return result;
    } catch (error) {
      logger.error('Twitter profile scraping failed', {
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
    const sessionId = `twitter_posts_${username}_${Date.now()}`;

    logger.info('Starting Twitter posts scraping', {
      sessionId,
      url,
      username,
      maxCount,
      useRealCrawlers: this.useRealCrawlers,
    });

    if (!this.useRealCrawlers || !this.apifyClient) {
      logger.info('Using mock crawler for Twitter posts', { sessionId });
      return this.mockCrawler.fetchRecentPosts(url, maxCount);
    }

    try {
      const actorId = process.env.APIFY_TWITTER_ACTOR_ID;

      if (!actorId) {
        logger.error('APIFY_TWITTER_ACTOR_ID not configured', { sessionId });
        throw new Error('APIFY_TWITTER_ACTOR_ID not configured');
      }

      const resultsLimit = Math.min(maxCount, 100); // Apify actor limit

      // Extract username for the new actor format
      const username = this.extractUsername(url);

      logger.info('Starting Apify actor run for Twitter posts', {
        sessionId,
        actorId,
        profileUrl: url,
        from: username,
        maxItems: resultsLimit,
        queryType: 'Latest',
      });

      // Run the Apify actor to get posts
      const startTime = Date.now();
      const run = await this.apifyClient.actor(actorId).call({
        from: username,
        maxItems: resultsLimit,
        queryType: 'Latest',
      });

      logger.info('Apify actor run completed for Twitter posts', {
        sessionId,
        runId: run.id,
        status: run.status,
        duration: Date.now() - startTime,
        datasetId: run.defaultDatasetId,
      });

      // Get results from the dataset
      const { items } = await this.apifyClient.dataset(run.defaultDatasetId).listItems();

      logger.info('Retrieved Twitter posts data from Apify', {
        sessionId,
        itemCount: items?.length || 0,
        hasItems: !!(items && items.length > 0),
        requestedCount: resultsLimit,
        actualCount: items?.length || 0,
      });

      if (!items || items.length === 0) {
        logger.warn('No posts data returned from Apify', { sessionId });
        throw new Error('No posts found or profile is private');
      }

      // Log the structure of the first post for debugging
      if (items.length > 0) {
        logger.debug('Twitter posts data structure', {
          sessionId,
          firstPostKeys: Object.keys(items[0]),
          hasAuthor: !!items[0].author,
          hasUser: !!items[0].user,
          samplePost: JSON.stringify(items[0]).substring(0, 500),
        });
      }

      // Log if we got fewer posts than requested
      if (items.length < resultsLimit) {
        logger.info('Received fewer posts than requested - this may be normal if the profile has limited recent posts', {
          sessionId,
          requested: resultsLimit,
          received: items.length,
          profileUrl: url,
        });
      }

      // Convert Apify results to our Post format
      const posts: Post[] = items.map((item: any, index: number) => {
        const postAuthor = item.author || item.user || { screenName: username, name: username };
        const post = {
          id: item.postId || item.id || item.conversationId || item.id_str || `post_${Date.now()}_${Math.random()}`,
          content: item.postText || item.text || item.full_text || item.content || '',
          createdAt: item.timestamp || item.created_at ? new Date(item.timestamp || item.created_at).toISOString() : new Date().toISOString(),
          author: {
            username: postAuthor.screenName || postAuthor.screen_name || postAuthor.username || username,
            displayName: postAuthor.name || postAuthor.displayName || postAuthor.display_name || postAuthor.screenName || 'Unknown User',
          },
          metrics: {
            likes: item.favouriteCount || item.likeCount || item.favorite_count || item.like_count || 0,
            shares: item.repostCount || item.retweetCount || item.retweet_count || item.quote_count || 0,
            comments: item.replyCount || item.reply_count || 0,
            views: item.viewCount || item.view_count || 0,
          },
          url: item.postUrl || item.url || `https://x.com/${postAuthor.screenName || postAuthor.screen_name || username}/status/${item.postId || item.id || item.id_str}`,
          isRetweet: item.isRetweet || item.is_retweet || false,
          originalPost: (item.isRetweet || item.is_retweet) ? {
            id: item.originalPostId || item.retweeted_status?.id_str || 'unknown',
            author: {
              username: item.originalAuthor?.screenName || item.retweeted_status?.user?.screen_name || 'unknown',
              displayName: item.originalAuthor?.name || item.retweeted_status?.user?.name || 'Unknown User',
            },
          } : undefined,
        };

        logger.debug('Processed Twitter post', {
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

      logger.info('Twitter posts scraping completed successfully', {
        sessionId,
        totalPostsRetrieved: posts.length,
        finalPostCount: finalPosts.length,
        maxCount,
        averageContentLength: finalPosts.reduce((sum, p) => sum + p.content.length, 0) / finalPosts.length,
        retweetCount: finalPosts.filter(p => p.isRetweet).length,
      });

      return finalPosts;
    } catch (error) {
      logger.error('Twitter posts scraping failed', {
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
      return urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}
