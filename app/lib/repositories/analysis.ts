import { prisma } from '../db';
import { Analysis, Prisma } from '../../generated/prisma';
import { AnalysisSection } from '../types/analysis';

export interface CreateAnalysisData {
  profileUrl: string;
  platform: string;
  username: string;
  expiresAt: Date;
  requestedBy?: string; // Optional field for future use
  postsId?: string; // Reference to posts
  state?: string; // Analysis state
  crediScore: number;
  sections: AnalysisSection[];
  processingTimeMs?: number;
  modelUsed?: string;
  tokensUsed?: number;
  analysisPrompt?: string; // The full prompt used for credibility analysis
  scoringPrompt?: string; // The full prompt used for scoring
}

export interface UpdateAnalysisData {
  postsId?: string;
  state?: string;
  errorMessage?: string;
  retryCount?: number;
  lastRetryAt?: Date;
  crediScore?: number;
  sections?: AnalysisSection[];
  processingTimeMs?: number;
  modelUsed?: string;
  tokensUsed?: number;
  expiresAt?: Date;
  requestedBy?: string;
  analysisPrompt?: string;
  scoringPrompt?: string;
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
        postsId: data.postsId,
        state: data.state || 'COMPLETED',
        crediScore: data.crediScore,
        sections: data.sections as unknown as Prisma.InputJsonValue,
        processingTimeMs: data.processingTimeMs,
        modelUsed: data.modelUsed,
        tokensUsed: data.tokensUsed,
        analysisPrompt: data.analysisPrompt,
        scoringPrompt: data.scoringPrompt,
      },
    });
  }

  /**
   * Create analysis with specific state
   */
  static async createWithState(
    data: Omit<CreateAnalysisData, 'crediScore' | 'sections'> & {
      crediScore?: number;
      sections?: AnalysisSection[];
    },
    state: string
  ): Promise<Analysis> {
    return await prisma.analysis.create({
      data: {
        profileUrl: data.profileUrl,
        platform: data.platform,
        username: data.username,
        expiresAt: data.expiresAt,
        requestedBy: data.requestedBy,
        postsId: data.postsId,
        state,
        crediScore: data.crediScore || 0,
        sections: (data.sections || []) as unknown as Prisma.InputJsonValue,
        processingTimeMs: data.processingTimeMs,
        modelUsed: data.modelUsed,
        tokensUsed: data.tokensUsed,
        analysisPrompt: data.analysisPrompt,
        scoringPrompt: data.scoringPrompt,
      },
    });
  }

  /**
   * Find the most recent analysis by profile URL
   */
  static async findLatestByProfileUrl(
    profileUrl: string
  ): Promise<Analysis | null> {
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
        postsId: data.postsId,
        state: data.state,
        errorMessage: data.errorMessage,
        retryCount: data.retryCount,
        lastRetryAt: data.lastRetryAt,
        crediScore: data.crediScore,
        sections: data.sections as unknown as Prisma.InputJsonValue,
        processingTimeMs: data.processingTimeMs,
        modelUsed: data.modelUsed,
        tokensUsed: data.tokensUsed,
        expiresAt: data.expiresAt,
        requestedBy: data.requestedBy,
        analysisPrompt: data.analysisPrompt,
        scoringPrompt: data.scoringPrompt,
      },
    });
  }

  /**
   * Update analysis state
   */
  static async updateState(
    id: string,
    state: string,
    errorMessage?: string
  ): Promise<Analysis> {
    return await prisma.analysis.update({
      where: {
        id,
      },
      data: {
        state,
        errorMessage,
      },
    });
  }

  /**
   * Increment retry count
   */
  static async incrementRetryCount(id: string): Promise<Analysis> {
    return await prisma.analysis.update({
      where: {
        id,
      },
      data: {
        retryCount: {
          increment: 1,
        },
        lastRetryAt: new Date(),
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
  static async findValidLatestByProfileUrl(
    profileUrl: string
  ): Promise<Analysis | null> {
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

  /**
   * Find analyses by profile URL and state
   */
  static async findByProfileUrlAndState(
    profileUrl: string,
    states: string[]
  ): Promise<Analysis[]> {
    return await prisma.analysis.findMany({
      where: {
        profileUrl,
        state: {
          in: states,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Find latest failed analysis for a profile URL
   */
  static async findLatestFailedByProfileUrl(
    profileUrl: string
  ): Promise<Analysis | null> {
    return await prisma.analysis.findFirst({
      where: {
        profileUrl,
        state: {
          in: ['CRAWLING_FAILED', 'ANALYSIS_FAILED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
