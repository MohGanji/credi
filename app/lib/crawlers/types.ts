/**
 * Common types for profile crawlers
 */

export interface ProfileData {
  platform: string;
  username: string;
  displayName: string;
  profileTitle: string;
  bio: string;
  isPublic: boolean;
  profilePicture?: string;
  followerCount?: number;
  verified?: boolean;
  lastUpdated: string;
}

export interface Post {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    displayName: string;
  };
  metrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
  url: string;
  isRetweet?: boolean;
  originalPost?: {
    id: string;
    author: {
      username: string;
      displayName: string;
    };
  };
}

export interface CrawlerError {
  code: 'INVALID_URL' | 'PRIVATE_PROFILE' | 'NOT_FOUND' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  message: string;
  retryAfter?: number;
}