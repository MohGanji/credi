import { Analysis } from '../../generated/prisma';
import {
  AgentExecutorService,
  getAgentExecutorService,
  ModelConfig,
} from './AgentExecutorService';
import { logger } from '../logger';

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

    const prompt = this.buildCredibilityPrompt(posts, profileInfo);
    logger.debug('Built analysis prompt', {
      sessionId,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...',
    });

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      logger.info('Using mock data for analysis', { sessionId });
      return this.getMockAnalysisResult(profileInfo);
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

    if (executionType === 'consensus') {
      // Use consensus with aggregation
      const consensusModels = this.getConsensusModels();
      const aggregatorModel = this.getConsensusAggregatorModel();

      logger.info('Executing consensus analysis with aggregation', {
        sessionId,
        inputModelCount: consensusModels.length,
        inputModels: consensusModels.map((m) => m.name),
        aggregatorModel: aggregatorModel.name,
      });

      const consensusResult =
        await this.agentExecutor.executeConsensusWithAggregation(
          consensusModels,
          aggregatorModel,
          prompt,
          {
            temperature: 0.2,
            maxTokens: 4000,
            timeout: options?.timeout || 120000,
          }
        );

      logger.info('Consensus analysis with aggregation completed', {
        sessionId,
        model: consensusResult.model,
        tokensUsed: consensusResult.tokensUsed,
        processingTime: consensusResult.processingTime,
        contentLength: consensusResult.content.length,
        contentPreview: consensusResult.content.substring(0, 100) + '...',
      });

      result = { responses: [consensusResult] };
      modelUsed = consensusResult.model;
    } else {
      logger.info('Executing single model analysis', {
        sessionId,
        model: models[0].name,
      });

      // Use single model execution
      const singleResult = await this.agentExecutor.executeAgent(
        models[0],
        prompt,
        {
          temperature: 0.2,
          maxTokens: 4000,
          timeout: options?.timeout || 120000,
        }
      );

      logger.info('Single model analysis completed', {
        sessionId,
        model: singleResult.model,
        tokensUsed: singleResult.tokensUsed,
        processingTime: singleResult.processingTime,
        contentLength: singleResult.content.length,
        contentPreview: singleResult.content.substring(0, 100) + '...',
      });

      result = { responses: [singleResult] };
      modelUsed = singleResult.model;
    }

    // Use the first successful response for analysis content
    const analysisContent = result.responses[0]?.content || '';
    const totalTokens = result.responses.reduce(
      (sum: number, r: any) => sum + (r.tokensUsed || 0),
      0
    );

    logger.info('Selecting response for final analysis', {
      sessionId,
      selectedModel: result.responses[0]?.model,
      selectedResponseLength: analysisContent.length,
      aggregationStrategy: 'first_response', // Currently using first response
      totalResponses: result.responses.length,
    });

    // Parse the result and convert to Analysis format
    const finalResult = this.parseAnalysisResult(analysisContent, profileInfo, {
      processingTimeMs: Date.now() - startTime,
      modelUsed,
      tokensUsed: totalTokens,
    });

    logger.info('Analysis completed successfully', {
      sessionId,
      finalScore: finalResult.crediScore,
      sectionCount: Array.isArray(finalResult.sections) ? finalResult.sections.length : 0,
      totalProcessingTime: Date.now() - startTime,
      totalTokensUsed: totalTokens,
      modelsUsed: modelUsed,
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
  ): Promise<{ score: number; reasoning: string }> {
    const prompt = this.buildScoringPrompt(analysisData);

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      return { score: 7.5, reasoning: 'Mock scoring result for testing' };
    }

    // For scoring, always use single model execution for consistency
    const models = options?.models || this.getSingleModel();

    const result = await this.agentExecutor.executeAgent(models[0], prompt, {
      temperature: 0.1,
      maxTokens: 1000,
    });

    return this.parseScoringResult(result.content || '');
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
${post.links?.length > 0 ? 'Links: ' + post.links.join(', ') : ''}
`
      )
      .join('\n');

    return template
      .replace('{username}', profileInfo.username || 'unknown')
      .replace('{displayName}', profileInfo.displayName || 'unknown')
      .replace('{bio}', profileInfo.bio || 'No bio available')
      .replace('{verified}', profileInfo.verified ? 'Yes' : 'No')
      .replace('{postCount}', posts.length.toString())
      .replace('{posts}', postsText);
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

  private parseAnalysisResult(
    result: string,
    profileInfo: any,
    metadata: {
      processingTimeMs: number;
      modelUsed: string;
      tokensUsed: number;
    }
  ): Omit<Analysis, 'id' | 'createdAt'> {
    logger.debug('Parsing analysis result', {
      resultLength: result.length,
      resultPreview: result.substring(0, 200) + '...',
      metadata,
    });

    try {
      // Try to parse JSON from the result
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('No JSON found in analysis response', {
          resultLength: result.length,
          resultPreview: result.substring(0, 500),
        });
        throw new Error('No JSON found in response');
      }

      logger.debug('Found JSON in response', {
        jsonLength: jsonMatch[0].length,
        jsonPreview: jsonMatch[0].substring(0, 200) + '...',
      });

      const parsed = JSON.parse(jsonMatch[0]);
      logger.debug('Successfully parsed JSON response', {
        hasOverview: !!parsed.overview,
        hasStrengths: !!parsed.strengths,
        hasCriteriaEvaluation: !!parsed.criteriaEvaluation,
        hasRepresentativePosts: !!parsed.representativePosts,
        hasScoreJustification: !!parsed.scoreJustification,
        crediScore: parsed.crediScore,
        parsedKeys: Object.keys(parsed),
      });

      // Convert to AnalysisResult format
      const sections = [
        {
          name: 'overview',
          data: parsed.overview || {},
        },
        {
          name: 'strengths',
          data: parsed.strengths || {},
        },
        {
          name: 'criteria_evaluation',
          data: parsed.criteriaEvaluation || {},
        },
        {
          name: 'representative_posts',
          data: parsed.representativePosts || {},
        },
        {
          name: 'score_justification',
          data: parsed.scoreJustification || {},
        },
      ];

      const finalResult = {
        profileUrl: '', // Will be set by caller
        platform: this.detectPlatform(profileInfo.username || ''),
        username: profileInfo.username || 'unknown',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        crediScore: parsed.crediScore || 5,
        sections,
        processingTimeMs: metadata.processingTimeMs,
        modelUsed: metadata.modelUsed,
        tokensUsed: metadata.tokensUsed,
        requestedBy: null,
      };

      logger.info('Analysis result parsed successfully', {
        finalScore: finalResult.crediScore,
        sectionCount: sections.length,
        sectionsWithData: sections.filter(
          (s) =>
            s.data &&
            typeof s.data === 'object' &&
            Object.keys(s.data).length > 0
        ).length,
        aggregationMethod: 'single_response_parsing', // Currently using first/only response
      });

      return finalResult;
    } catch (error) {
      logger.error('Failed to parse analysis result', {
        error: error instanceof Error ? error.message : 'Unknown error',
        resultLength: result.length,
        resultSample: result.substring(0, 1000),
      });

      // Fallback: create a basic result with the raw response
      const fallbackResult = {
        profileUrl: '',
        platform: this.detectPlatform(profileInfo.username || ''),
        username: profileInfo.username || 'unknown',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        crediScore: 5,
        sections: [
          {
            name: 'raw_analysis',
            data: {
              'Analysis Result': result,
              Note: 'Failed to parse structured response, showing raw output',
            },
          },
        ],
        processingTimeMs: metadata.processingTimeMs,
        modelUsed: metadata.modelUsed,
        tokensUsed: metadata.tokensUsed,
        requestedBy: null,
      };

      logger.warn('Using fallback analysis result', {
        fallbackScore: fallbackResult.crediScore,
        rawContentLength: result.length,
      });

      return fallbackResult;
    }
  }

  private parseScoringResult(result: string): {
    score: number;
    reasoning: string;
  } {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 5,
        reasoning: parsed.reasoning || 'Score calculated by AI analysis',
      };
    } catch (error) {
      logger.error('Failed to parse scoring result', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {
        score: 5,
        reasoning: 'Failed to parse scoring result: ' + result,
      };
    }
  }

  private getMockAnalysisResult(
    profileInfo: any
  ): Omit<Analysis, 'id' | 'createdAt'> {
    return {
      profileUrl: '',
      platform: this.detectPlatform(profileInfo.username || ''),
      username: profileInfo.username || 'unknown',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      crediScore: 7.5,
      sections: [
        {
          name: 'overview',
          data: {
            'Sampled Posts': '10',
            'Focus Areas': 'Content Quality, Source Citations',
            'Analysis Date': new Date().toISOString(),
            Platform: this.detectPlatform(profileInfo.username || ''),
            'Profile Status': 'Active',
          },
        },
      ],
      processingTimeMs: 1500,
      modelUsed: 'mock-model',
      tokensUsed: 2500,
      requestedBy: null,
    };
  }

  private detectPlatform(username: string): string {
    if (username.includes('@')) return 'twitter';
    if (username.includes('linkedin')) return 'linkedin';
    return 'unknown';
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
