import { prisma } from '../db';
import { Analysis, Prisma } from '../../generated/prisma';

export interface CreateAnalysisData {
  profileUrl: string;
  platform: string;
  username: string;
  expiresAt: Date;
  requestedBy?: string; // Optional field for future use
  sampledPosts: number;
  crediScore: number;
  focusAreas: string[];
  strengths: Record<string, any>;
  criteriaEvaluation: Record<string, any>;
  representativePosts: Record<string, any>;
  scoreJustification: Record<string, any>;
  processingTimeMs?: number;
  modelUsed?: string;
  tokensUsed?: number;
}

export interface UpdateAnalysisData {
  sampledPosts?: number;
  crediScore?: number;
  focusAreas?: string[];
  strengths?: Record<string, any>;
  criteriaEvaluation?: Record<string, any>;
  representativePosts?: Record<string, any>;
  scoreJustification?: Record<string, any>;
  processingTimeMs?: number;
  modelUsed?: string;
  tokensUsed?: number;
  expiresAt?: Date;
  requestedBy?: string;
}

export class AnalysisRepository {
  /**
   * Create a new analysis record (append-only, no duplicates prevented)
   */
  static async create(data: CreateAnalysisData): Promise<Analysis> {
    return await prisma.analysis.create({
      data: {
        profileUrl: data.profileUrl,
        platform: data.platform,
        username: data.username,
        expiresAt: data.expiresAt,
        requestedBy: data.requestedBy,
        sampledPosts: data.sampledPosts,
        crediScore: data.crediScore,
        focusAreas: data.focusAreas,
        strengths: data.strengths,
        criteriaEvaluation: data.criteriaEvaluation,
        representativePosts: data.representativePosts,
        scoreJustification: data.scoreJustification,
        processingTimeMs: data.processingTimeMs,
        modelUsed: data.modelUsed,
        tokensUsed: data.tokensUsed,
      },
    });
  }

  /**
   * Find the most recent analysis by profile URL
   */
  static async findLatestByProfileUrl(profileUrl: string): Promise<Analysis | null> {
    return await prisma.analysis.findFirst({
      where: {
        profileUrl,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find all analyses for a profile URL
   */
  static async findAllByProfileUrl(profileUrl: string): Promise<Analysis[]> {
    return await prisma.analysis.findMany({
      where: {
        profileUrl,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find analysis by ID
   */
  static async findById(id: string): Promise<Analysis | null> {
    return await prisma.analysis.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Update analysis by ID
   */
  static async update(id: string, data: UpdateAnalysisData): Promise<Analysis> {
    return await prisma.analysis.update({
      where: {
        id,
      },
      data: {
        sampledPosts: data.sampledPosts,
        crediScore: data.crediScore,
        focusAreas: data.focusAreas,
        strengths: data.strengths,
        criteriaEvaluation: data.criteriaEvaluation,
        representativePosts: data.representativePosts,
        scoreJustification: data.scoreJustification,
        processingTimeMs: data.processingTimeMs,
        modelUsed: data.modelUsed,
        tokensUsed: data.tokensUsed,
        expiresAt: data.expiresAt,
        requestedBy: data.requestedBy,
      },
    });
  }

  // Note: No delete methods - this is an append-only database for audit trail

  /**
   * Find all analyses with pagination
   */
  static async findMany(
    skip = 0,
    take = 10,
    orderBy: Prisma.AnalysisOrderByWithRelationInput = { createdAt: 'desc' }
  ): Promise<Analysis[]> {
    return await prisma.analysis.findMany({
      skip,
      take,
      orderBy,
    });
  }

  /**
   * Count total analyses
   */
  static async count(): Promise<number> {
    return await prisma.analysis.count();
  }

  /**
   * Find expired analyses (for cache management, not deletion from main DB)
   */
  static async findExpired(): Promise<Analysis[]> {
    return await prisma.analysis.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Find valid (non-expired) latest analysis for a profile URL
   */
  static async findValidLatestByProfileUrl(profileUrl: string): Promise<Analysis | null> {
    return await prisma.analysis.findFirst({
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
  }
}