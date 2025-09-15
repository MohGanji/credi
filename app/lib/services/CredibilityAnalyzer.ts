import { Analysis } from '../../generated/prisma';
import {
  AgentExecutorService,
  getAgentExecutorService,
  ModelConfig,
} from './AgentExecutorService';
import { logger } from '../logger';
import {
  CredibilityAnalysisResultSchema,
  CredibilityAnalysisResult,
  ScoringResultSchema,
  calculateWeightedScore,
  DEFAULT_SCORING_WEIGHTS,
} from '../schemas/credibility-analysis';

/**
 * Project-specific service for credibility analysis using the AI agent executor
 */
export class CredibilityAnalyzer {
  private agentExecutor: AgentExecutorService;

  constructor() {
    this.agentExecutor = getAgentExecutorService();
  }

  /**
   * Analyze a social media profile for credibility
   */
  async analyzeProfile(
    posts: any[],
    profileInfo: any,
    options?: {
      models?: ModelConfig[];
      timeout?: number;
    }
  ): Promise<Omit<Analysis, 'id' | 'createdAt'>> {
    const sessionId = `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    logger.info('Starting credibility analysis', {
      sessionId,
      username: profileInfo.username,
      postCount: posts.length,
      options: {
        customModels: !!options?.models,
        timeout: options?.timeout || 120000,
      },
    });

    const analysisPrompt = this.buildCredibilityPrompt(posts, profileInfo);
    logger.info('Built analysis prompt', {
      sessionId,
      promptLength: analysisPrompt.length,
      promptPreview: analysisPrompt.substring(0, 200) + '...',
      postCount: posts.length,
      profileUsername: profileInfo.username,
    });

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      logger.info('Using mock data for analysis', { sessionId });
      const mockResult = this.getMockAnalysisResult(profileInfo);
      // Add prompt to mock result for consistency
      return {
        ...mockResult,
        analysisPrompt,
      };
    }

    // Get execution strategy from environment
    const executionType = process.env.AGENT_EXECUTION_TYPE || 'single';
    const models = options?.models || this.getConfiguredModels(executionType);

    logger.info('Configured execution strategy', {
      sessionId,
      executionType,
      modelCount: models.length,
      models: models.map((m) => ({ name: m.name, hasApiKey: !!m.apiKey })),
      environmentConfig: {
        AGENT_EXECUTION_TYPE: process.env.AGENT_EXECUTION_TYPE,
        AGENT_MODELS: process.env.AGENT_MODELS,
        AGENT_DEFAULT_MODEL: process.env.AGENT_DEFAULT_MODEL,
      },
    });

    const startTime = Date.now();
    let result: any;
    let modelUsed: string;

    let analysisResult: CredibilityAnalysisResult;
    let totalTokens: number;

    try {
      if (executionType === 'consensus') {
        // Use consensus with aggregation and structured output
        const consensusModels = this.getConsensusModels();
        const aggregatorModel = this.getConsensusAggregatorModel();

        logger.info(
          'Executing consensus analysis with aggregation and structured output',
          {
            sessionId,
            inputModelCount: consensusModels.length,
            inputModels: consensusModels.map((m) => m.name),
            aggregatorModel: aggregatorModel.name,
          }
        );

        const consensusResult =
          await this.agentExecutor.executeConsensusWithAggregation(
            consensusModels,
            aggregatorModel,
            analysisPrompt,
            {
              temperature: 0.2,
              maxTokens: 4000,
              timeout: options?.timeout || 120000,
            },
            CredibilityAnalysisResultSchema
          );

        // Calculate weighted score from individual criteria
        const calculatedScore = calculateWeightedScore(
          consensusResult.content.criteriaEvaluation,
          DEFAULT_SCORING_WEIGHTS
        );

        // Update the result with the calculated score
        analysisResult = {
          ...consensusResult.content,
          crediScore: calculatedScore,
        };

        modelUsed = consensusResult.model;
        totalTokens = consensusResult.tokensUsed || 0;

        logger.info(
          'Consensus analysis with aggregation and structured output completed',
          {
            sessionId,
            model: consensusResult.model,
            tokensUsed: consensusResult.tokensUsed,
            processingTime: consensusResult.processingTime,
            originalScore: consensusResult.content.crediScore,
            calculatedScore: calculatedScore,
            criteriaCount: consensusResult.content.criteriaEvaluation.length,
          }
        );
      } else {
        logger.info(
          'Executing single model analysis with criteria-based scoring',
          {
            sessionId,
            model: models[0].name,
          }
        );

        // Use single model execution with structured output
        const singleResult = await this.agentExecutor.executeAgent(
          models[0],
          analysisPrompt,
          {
            temperature: 0.2,
            maxTokens: 4000,
            timeout: options?.timeout || 120000,
          },
          CredibilityAnalysisResultSchema
        );

        // Calculate weighted score from individual criteria
        const calculatedScore = calculateWeightedScore(
          singleResult.content.criteriaEvaluation,
          DEFAULT_SCORING_WEIGHTS
        );

        // Update the result with the calculated score
        analysisResult = {
          ...singleResult.content,
          crediScore: calculatedScore,
        };

        modelUsed = singleResult.model;
        totalTokens = singleResult.tokensUsed || 0;

        logger.info(
          'Single model analysis with criteria-based scoring completed',
          {
            sessionId,
            model: singleResult.model,
            tokensUsed: singleResult.tokensUsed,
            processingTime: singleResult.processingTime,
            originalScore: singleResult.content.crediScore,
            calculatedScore: calculatedScore,
            criteriaCount: singleResult.content.criteriaEvaluation.length,
          }
        );
      }
    } catch (error) {
      logger.error('Structured output analysis failed', {
        sessionId,
        executionType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });

      throw new Error(
        `Credibility analysis failed with structured output: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    logger.info('Structured analysis result received', {
      sessionId,
      crediScore: analysisResult.crediScore,
      overviewSampledPosts: analysisResult.overview['Sampled Posts'],
      criteriaCount: analysisResult.criteriaEvaluation.length,
      representativePostsCount: analysisResult.representativePosts.length,
      modelUsed,
    });

    // Convert structured result to Analysis format
    const finalResult = this.convertStructuredResultToAnalysis(
      analysisResult,
      profileInfo,
      {
        processingTimeMs: Date.now() - startTime,
        modelUsed,
        tokensUsed: totalTokens,
      }
    );

    // Add the analysis prompt to the result
    finalResult.analysisPrompt = analysisPrompt;

    logger.info('Analysis completed successfully', {
      sessionId,
      finalScore: finalResult.crediScore,
      sectionCount: Array.isArray(finalResult.sections)
        ? finalResult.sections.length
        : 0,
      totalProcessingTime: Date.now() - startTime,
      totalTokensUsed: totalTokens,
      modelsUsed: modelUsed,
      analysisPromptLength: analysisPrompt.length,
    });

    return finalResult;
  }

  /**
   * Score a profile based on analysis data
   */
  async scoreProfile(
    analysisData: any,
    options?: {
      models?: ModelConfig[];
    }
  ): Promise<{ score: number; reasoning: string; scoringPrompt: string }> {
    const sessionId = `scoring_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const scoringPrompt = this.buildScoringPrompt(analysisData);

    logger.info('Starting profile scoring', {
      sessionId,
      scoringPromptLength: scoringPrompt.length,
      scoringPromptPreview: scoringPrompt.substring(0, 200) + '...',
    });

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      logger.info('Using mock data for scoring', { sessionId });
      return {
        score: 7.5,
        reasoning: 'Mock scoring result for testing',
        scoringPrompt,
      };
    }

    // For scoring, always use single model execution for consistency
    const models = options?.models || this.getSingleModel();

    logger.info('Executing scoring with model', {
      sessionId,
      model: models[0].name,
    });

    try {
      const result = await this.agentExecutor.executeAgent(
        models[0],
        scoringPrompt,
        {
          temperature: 0.1,
          maxTokens: 1000,
        },
        ScoringResultSchema
      );

      logger.info('Scoring completed with structured output', {
        sessionId,
        model: result.model,
        tokensUsed: result.tokensUsed,
        processingTime: result.processingTime,
        score: result.content.score,
        reasoningLength: result.content.reasoning.length,
      });

      return {
        score: result.content.score,
        reasoning: result.content.reasoning,
        scoringPrompt,
      };
    } catch (error) {
      logger.error('Structured scoring failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new Error(
        `Profile scoring failed with structured output: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getConfiguredModels(executionType: string): ModelConfig[] {
    logger.debug('Getting configured models', {
      executionType,
      envVars: {
        AGENT_MODELS: process.env.AGENT_MODELS,
        AGENT_DEFAULT_MODEL: process.env.AGENT_DEFAULT_MODEL,
        hasOpenAI: !!process.env.OPENAI_API_KEY,
        hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
        hasGoogle: !!process.env.GOOGLE_API_KEY,
      },
    });

    if (executionType === 'consensus') {
      return this.getConsensusModels();
    } else {
      return this.getSingleModel();
    }
  }

  private getConsensusAggregatorModel(): ModelConfig {
    const aggregatorModelName =
      process.env.AGENT_CONSENSUS_MODEL ||
      process.env.AGENT_DEFAULT_MODEL ||
      'claude-3-haiku-20240307';
    logger.debug('Getting consensus aggregator model', { aggregatorModelName });

    const model = this.createModelConfig(aggregatorModelName);

    if (!model) {
      logger.warn(
        'Configured aggregator model not available, falling back to available models',
        {
          requestedModel: aggregatorModelName,
        }
      );
      // Fallback to any available model
      const availableModels = this.getAvailableModels();
      if (availableModels.length === 0) {
        throw new Error(
          'No API keys configured for consensus aggregator model. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY'
        );
      }
      logger.info('Using fallback aggregator model', {
        model: availableModels[0].name,
      });
      return availableModels[0];
    }

    logger.debug('Using configured aggregator model', { model: model.name });
    return model;
  }

  private getSingleModel(): ModelConfig[] {
    const defaultModel =
      process.env.AGENT_DEFAULT_MODEL || 'claude-3-haiku-20240307';
    logger.debug('Configuring single model', { defaultModel });

    const model = this.createModelConfig(defaultModel);

    if (!model) {
      logger.warn(
        'Default model not available, falling back to any available model',
        {
          requestedModel: defaultModel,
        }
      );

      // Fallback to any available model
      const availableModels = this.getAvailableModels();
      if (availableModels.length === 0) {
        logger.error('No API keys configured for any AI models');
        throw new Error(
          'No API keys configured for AI models. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY'
        );
      }

      logger.info('Using fallback model', {
        fallbackModel: availableModels[0].name,
        availableCount: availableModels.length,
      });
      return [availableModels[0]];
    }

    logger.info('Single model configured successfully', { model: model.name });
    return [model];
  }

  private getConsensusModels(): ModelConfig[] {
    const modelNames =
      process.env.AGENT_MODELS?.split(',').map((name) => name.trim()) || [];
    logger.debug('Configuring consensus models', {
      requestedModels: modelNames,
      modelCount: modelNames.length,
    });

    const models: ModelConfig[] = [];

    // Try to create models from the configured list
    for (const modelName of modelNames) {
      const model = this.createModelConfig(modelName);
      if (model) {
        models.push(model);
        logger.debug('Successfully configured model', { model: modelName });
      } else {
        logger.warn('Failed to configure model (missing API key)', {
          model: modelName,
        });
      }
    }

    // If no models from config are available, use all available models
    if (models.length === 0) {
      logger.warn(
        'No configured models available, falling back to all available models'
      );

      const availableModels = this.getAvailableModels();
      if (availableModels.length === 0) {
        logger.error('No API keys configured for any AI models');
        throw new Error(
          'No API keys configured for AI models. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY'
        );
      }

      logger.info('Using all available models for consensus', {
        models: availableModels.map((m) => m.name),
        count: availableModels.length,
      });
      return availableModels;
    }

    logger.info('Consensus models configured successfully', {
      models: models.map((m) => m.name),
      successfulCount: models.length,
      requestedCount: modelNames.length,
    });

    // For consensus, we need at least 1 model (can work with just 1)
    return models;
  }

  private getAvailableModels(): ModelConfig[] {
    const models: ModelConfig[] = [];

    if (process.env.ANTHROPIC_API_KEY) {
      models.push({
        name: 'claude-3-haiku-20240307',
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      });
    }

    if (process.env.OPENAI_API_KEY) {
      models.push({
        name: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      });
    }

    if (process.env.GOOGLE_API_KEY) {
      models.push({
        name: 'gemini-2.5-flash',
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      });
    }

    return models;
  }

  private createModelConfig(modelName: string): ModelConfig | null {
    logger.debug('Creating model configuration', {
      modelName,
      availableKeys: {
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY,
        google: !!process.env.GOOGLE_API_KEY,
      },
    });

    // Determine which API key to use based on model name
    if (modelName.startsWith('claude-') && process.env.ANTHROPIC_API_KEY) {
      logger.debug('Matched Anthropic model', { modelName });
      return {
        name: modelName,
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      };
    }

    if (
      (modelName.startsWith('gpt-') || modelName.startsWith('o1-')) &&
      process.env.OPENAI_API_KEY
    ) {
      logger.debug('Matched OpenAI model', { modelName });
      return {
        name: modelName,
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      };
    }

    if (
      (modelName.startsWith('gemini-') || modelName.includes('gemini')) &&
      process.env.GOOGLE_API_KEY
    ) {
      logger.debug('Matched Google model', { modelName });
      return {
        name: modelName,
        apiKey: process.env.GOOGLE_API_KEY,
        temperature: 0.2,
        maxTokens: 4000,
      };
    }

    logger.debug('No matching provider found for model', {
      modelName,
      reason:
        'Either model name pattern not recognized or corresponding API key not set',
    });
    return null;
  }

  private buildCredibilityPrompt(posts: any[], profileInfo: any): string {
    const template = process.env.CREDIBILITY_ANALYSIS_PROMPT;
    if (!template) {
      throw new Error(
        'CREDIBILITY_ANALYSIS_PROMPT environment variable must be set'
      );
    }

    const postsText = posts
      .map(
        (post: any, i: number) => `
Post ${i + 1} (${post.timestamp}):
${post.content}
${post.url ? `URL: ${post.url}` : ''}
${post.links?.length > 0 ? 'Links: ' + post.links.join(', ') : ''}
`
      )
      .join('\n');

    // Get platform display name for better context
    const platformDisplayName = this.getPlatformDisplayName(
      profileInfo.platform
    );

    return template
      .replace('{platform}', platformDisplayName)
      .replace('{username}', profileInfo.username || 'unknown')
      .replace('{displayName}', profileInfo.displayName || 'unknown')
      .replace('{bio}', profileInfo.bio || 'No bio available')
      .replace('{verified}', profileInfo.verified ? 'Yes' : 'No')
      .replace('{postCount}', posts.length.toString())
      .replace('{posts}', postsText);
  }

  private getPlatformDisplayName(platform: string): string {
    switch (platform?.toLowerCase()) {
      case 'twitter':
        return 'Twitter/X';
      case 'linkedin':
        return 'LinkedIn';
      default:
        return platform || '';
    }
  }

  private buildScoringPrompt(analysisData: any): string {
    const template = process.env.CREDIBILITY_SCORING_PROMPT;
    if (!template) {
      throw new Error(
        'CREDIBILITY_SCORING_PROMPT environment variable must be set'
      );
    }

    return template.replace('{analysisData}', JSON.stringify(analysisData));
  }

  private convertStructuredResultToAnalysis(
    structuredResult: CredibilityAnalysisResult,
    profileInfo: any,
    metadata: {
      processingTimeMs: number;
      modelUsed: string;
      tokensUsed: number;
    }
  ): Omit<Analysis, 'id' | 'createdAt'> {
    logger.debug('Converting structured result to Analysis format', {
      crediScore: structuredResult.crediScore,
      criteriaCount: structuredResult.criteriaEvaluation.length,
      representativePostsCount: structuredResult.representativePosts.length,
      hasStrengths: !!structuredResult.strengths,
      hasWeaknesses: !!structuredResult.weaknesses,
      metadata,
    });

    // Convert structured result to the sections format expected by the database
    // Order: Overview, Criteria Evaluation, Representative Posts, Strengths, Weaknesses, Score Justification
    const sections: Array<{ name: string; data: any }> = [
      {
        name: 'overview',
        data: structuredResult.overview,
      },
      {
        name: 'criteria_evaluation',
        data: structuredResult.criteriaEvaluation,
      },
      {
        name: 'representative_posts',
        data: structuredResult.representativePosts,
      },
    ];

    // Add optional strengths section if present
    if (structuredResult.strengths) {
      sections.push({
        name: 'strengths',
        data: structuredResult.strengths,
      });
    }

    // Add optional weaknesses section if present
    if (structuredResult.weaknesses) {
      sections.push({
        name: 'weaknesses',
        data: structuredResult.weaknesses,
      });
    }

    // Add score justification section
    sections.push({
      name: 'score_justification',
      data: structuredResult.scoreJustification,
    });

    const finalResult = {
      profileUrl: '', // Will be set by caller
      platform: profileInfo.platform || 'unknown',
      username: profileInfo.username || 'unknown',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      requestedBy: null,
      postsId: null,
      state: 'COMPLETED',
      errorMessage: null,
      retryCount: 0,
      lastRetryAt: null,
      crediScore: structuredResult.crediScore,
      sections,
      processingTimeMs: metadata.processingTimeMs,
      modelUsed: metadata.modelUsed,
      tokensUsed: metadata.tokensUsed,
      analysisPrompt: null, // Will be set by caller
      scoringPrompt: null, // Will be set by caller if used
    };

    logger.info('Structured result converted to Analysis format successfully', {
      finalScore: finalResult.crediScore,
      sectionCount: sections.length,
      overviewFields: Object.keys(structuredResult.overview).length,
      strengthsFields: structuredResult.strengths
        ? Object.keys(structuredResult.strengths).length
        : 0,
      weaknessesFields: structuredResult.weaknesses
        ? Object.keys(structuredResult.weaknesses).length
        : 0,
      criteriaEvaluations: structuredResult.criteriaEvaluation.length,
      representativePosts: structuredResult.representativePosts.length,
      scoreJustificationFields: Object.keys(structuredResult.scoreJustification)
        .length,
    });

    return finalResult;
  }

  private getMockAnalysisResult(
    profileInfo: any
  ): Omit<Analysis, 'id' | 'createdAt'> {
    // Create mock criteria evaluation with new scoring system
    const mockCriteriaEvaluation = [
      {
        criterion: 'Unnecessary Complexity',
        score: 8.0,
        status: 'strong' as const,
        evaluation:
          'The profile demonstrates clear communication with minimal unnecessary jargon. Content is accessible to a general audience while maintaining technical accuracy.',
        examples: [
          'Uses plain language to explain complex concepts',
          'Avoids excessive technical terminology',
        ],
      },
      {
        criterion: 'Lack of Sourcing',
        score: 7.5,
        status: 'strong' as const,
        evaluation:
          'Most claims are supported with appropriate references. Some improvement could be made in consistently citing primary sources.',
        examples: [
          'Links to peer-reviewed studies',
          'References authoritative sources',
        ],
      },
      {
        criterion: 'Guru Syndrome',
        score: 6.8,
        status: 'adequate' as const,
        evaluation:
          'Generally maintains humility while sharing expertise. Occasionally presents views with high confidence but acknowledges limitations.',
        examples: [
          'Acknowledges uncertainty in some posts',
          'Presents balanced viewpoints',
        ],
      },
    ];

    // Calculate weighted score from mock criteria
    const calculatedScore = calculateWeightedScore(
      mockCriteriaEvaluation,
      DEFAULT_SCORING_WEIGHTS
    );

    return {
      profileUrl: '',
      platform: profileInfo.platform || 'unknown',
      username: profileInfo.username || 'unknown',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      requestedBy: null,
      postsId: null,
      state: 'COMPLETED',
      errorMessage: null,
      retryCount: 0,
      lastRetryAt: null,
      crediScore: calculatedScore,
      sections: [
        {
          name: 'overview',
          data: {
            'Sampled Posts': '10 Posts',
            'Focus Area':
              'Content Quality, Source Citations, Evidence-based practices',
            'Analysis Date': new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            Platform:
              profileInfo.platform === 'twitter'
                ? 'Twitter/X'
                : profileInfo.platform || 'unknown',
          },
        },
        {
          name: 'criteria_evaluation',
          data: mockCriteriaEvaluation,
        },
        {
          name: 'representative_posts',
          data: [
            {
              category: 'Educational Content',
              content:
                '[Jan 15, 2024][]\nSharing insights on evidence-based practices with proper citations and balanced perspective.',
              reasoning:
                'Demonstrates commitment to factual accuracy and educational value',
            },
          ],
        },
        {
          name: 'strengths',
          data: {
            'Content Quality':
              'Demonstrates clear expertise and well-structured analysis',
            'Source Citations':
              'Consistently references credible sources and studies',
            'Balanced Perspective':
              'Presents multiple viewpoints on complex topics',
            'Communication Style': 'Clear about limitations and uncertainties',
            'Evidence Usage':
              'Supports claims with appropriate research and data',
          },
        },
        {
          name: 'weaknesses',
          data: {
            'Communication Style':
              'Occasional overconfidence in presenting certain viewpoints could be tempered with more acknowledgment of uncertainty',
            'Source Citations':
              'Could improve consistency in citing primary sources for all claims made',
          },
        },
        {
          name: 'score_justification',
          data: {
            'Key Factors': [
              'Strong sourcing practices with credible references',
              'Clear communication without unnecessary complexity',
              'Balanced perspective acknowledging limitations',
            ],
            'Why Not Higher': [
              'Occasional overconfidence in presenting certain viewpoints',
              'Could improve consistency in citing primary sources',
            ],
            'Why Not Lower': [
              'Demonstrates genuine expertise in subject matter',
              'Maintains professional and respectful tone',
            ],
          },
        },
      ],
      processingTimeMs: 1500,
      modelUsed: 'mock-model',
      tokensUsed: 2500,
      analysisPrompt: null, // Will be set by caller
      scoringPrompt: null, // Will be set by caller if used
    };
  }

  /**
   * Check if the service is properly configured
   */
  checkConfiguration(): {
    configured: boolean;
    availableModels: string[];
    executionType: string;
    configuredModels: string[];
    consensusAggregatorModel?: string;
    promptsConfigured: boolean;
    missingPrompts: string[];
  } {
    try {
      const availableModels = this.getAvailableModels();
      const executionType = process.env.AGENT_EXECUTION_TYPE || 'single';
      const configuredModels = this.getConfiguredModels(executionType);

      // Check if prompts are configured
      const missingPrompts: string[] = [];
      if (!process.env.CREDIBILITY_ANALYSIS_PROMPT) {
        missingPrompts.push('CREDIBILITY_ANALYSIS_PROMPT');
      }
      if (!process.env.CREDIBILITY_SCORING_PROMPT) {
        missingPrompts.push('CREDIBILITY_SCORING_PROMPT');
      }

      const result: any = {
        configured: availableModels.length > 0 && missingPrompts.length === 0,
        availableModels: availableModels.map((m) => m.name),
        executionType,
        configuredModels: configuredModels.map((m) => m.name),
        promptsConfigured: missingPrompts.length === 0,
        missingPrompts,
      };

      // Add consensus aggregator model info if using consensus
      if (executionType === 'consensus') {
        try {
          const aggregatorModel = this.getConsensusAggregatorModel();
          result.consensusAggregatorModel = aggregatorModel.name;
        } catch (error) {
          result.consensusAggregatorModel =
            'ERROR: ' +
            (error instanceof Error ? error.message : 'Unknown error');
          result.configured = false;
        }
      }

      return result;
    } catch (error) {
      return {
        configured: false,
        availableModels: [],
        executionType: process.env.AGENT_EXECUTION_TYPE || 'single',
        configuredModels: [],
        promptsConfigured: false,
        missingPrompts: [
          'CREDIBILITY_ANALYSIS_PROMPT',
          'CREDIBILITY_SCORING_PROMPT',
        ],
      };
    }
  }
}
