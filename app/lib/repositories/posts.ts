import { PrismaClient, Posts } from '../../generated/prisma';
import { logger } from '../logger';

const prisma = new PrismaClient();

export interface PostsData {
  profileUrl: string;
  platform: string;
  username: string;
  displayName?: string;
  bio?: string;
  verified?: boolean;
  followerCount?: number;
  posts: any[]; // Array of post objects
}

export class PostsRepository {
  /**
   * Find valid (non-expired) posts by profile URL
   */
  static async findValidPostsByProfileUrl(profileUrl: string): Promise<Posts | null> {
    try {
      const posts = await prisma.posts.findFirst({
        where: {
          profileUrl,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (posts) {
        logger.info('Found valid cached posts', {
          postsId: posts.id,
          profileUrl,
          postCount: Array.isArray(posts.posts) ? posts.posts.length : 0,
          expiresAt: posts.expiresAt,
        });
      }

      return posts;
    } catch (error) {
      logger.error('Error finding posts by profile URL', {
        profileUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Create new posts record
   */
  static async create(data: PostsData): Promise<Posts> {
    try {
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const posts = await prisma.posts.create({
        data: {
          profileUrl: data.profileUrl,
          platform: data.platform,
          username: data.username,
          displayName: data.displayName,
          bio: data.bio,
          verified: data.verified || false,
          followerCount: data.followerCount,
          posts: data.posts,
          expiresAt,
        },
      });

      logger.info('Created new posts record', {
        postsId: posts.id,
        profileUrl: data.profileUrl,
        platform: data.platform,
        username: data.username,
        postCount: Array.isArray(data.posts) ? data.posts.length : 0,
        expiresAt: posts.expiresAt,
      });

      return posts;
    } catch (error) {
      logger.error('Error creating posts', {
        profileUrl: data.profileUrl,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Check if posts are expired
   */
  static isExpired(posts: Posts): boolean {
    return new Date() > posts.expiresAt;
  }

  /**
   * Clean up expired posts
   */
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.posts.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info('Cleaned up expired posts', {
        deletedCount: result.count,
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired posts', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}