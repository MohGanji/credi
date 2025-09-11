import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { HumanMessage } from '@langchain/core/messages';

export interface ModelConfig {
  name: string;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentConfig {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
}

export interface AgentResponse {
  content: string;
  model: string;
  tokensUsed?: number;
  processingTime: number;
}

export interface ConsensusResponse {
  responses: AgentResponse[];
  consensus?: string;
  processingTime: number;
}

export class AgentExecutorService {
  /**
   * Execute a single agent with a model and prompt
   */
  async executeAgent(
    model: ModelConfig,
    prompt: string,
    config?: AgentConfig
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    console.log(`[AgentExecutor] Starting single agent execution`, {
      executionId,
      model: model.name,
      promptLength: prompt.length,
      config: {
        temperature: config?.temperature ?? model.temperature ?? 0.7,
        maxTokens: config?.maxTokens ?? model.maxTokens ?? 4000,
        timeout: config?.timeout,
      },
    });

    try {
      const langchainModel = this.createLangChainModel(model, config);
      console.log(`[AgentExecutor] Created LangChain model for ${model.name}`, {
        executionId,
      });

      const response = await langchainModel.invoke([new HumanMessage(prompt)]);
      const content = response.content as string;
      const processingTime = Date.now() - startTime;
      const tokensUsed = this.estimateTokens(prompt + content);

      console.log(`[AgentExecutor] Single agent execution completed`, {
        executionId,
        model: model.name,
        processingTime,
        tokensUsed,
        responseLength: content.length,
        responsePreview: content.substring(0, 200) + '...',
      });

      return {
        content,
        model: model.name,
        tokensUsed,
        processingTime,
      };
    } catch (error) {
      console.error(`[AgentExecutor] Single agent execution failed`, {
        executionId,
        model: model.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });
      throw new Error(
        `Agent execution failed for ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute multiple agents in parallel and return all responses
   */
  async agentConsensus(
    models: ModelConfig[],
    prompt: string,
    config?: AgentConfig
  ): Promise<ConsensusResponse> {
    const startTime = Date.now();
    const consensusId = `consensus_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    console.log(`[AgentExecutor] Starting consensus execution`, {
      consensusId,
      modelCount: models.length,
      models: models.map((m) => m.name),
      promptLength: prompt.length,
      config,
    });

    if (models.length === 0) {
      throw new Error('At least one model is required for consensus');
    }

    try {
      // Execute all models in parallel
      console.log(
        `[AgentExecutor] Executing ${models.length} models in parallel`,
        { consensusId }
      );
      const promises = models.map((model, index) => {
        console.log(
          `[AgentExecutor] Queuing model ${index + 1}/${models.length}: ${model.name}`,
          { consensusId }
        );
        return this.executeAgent(model, prompt, config);
      });

      const responses = await Promise.allSettled(promises);

      // Filter successful responses
      const successfulResponses = responses
        .filter(
          (result): result is PromiseFulfilledResult<AgentResponse> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);

      // Log any failures
      const failures = responses
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === 'rejected'
        )
        .map((result) => result.reason);

      console.log(`[AgentExecutor] Consensus execution results`, {
        consensusId,
        totalModels: models.length,
        successfulResponses: successfulResponses.length,
        failedResponses: failures.length,
        successfulModels: successfulResponses.map((r) => r.model),
        failures: failures.map((f) => f.message || f.toString()),
        totalProcessingTime: Date.now() - startTime,
      });

      if (successfulResponses.length === 0) {
        console.error(`[AgentExecutor] All models failed in consensus`, {
          consensusId,
          failures,
        });
        throw new Error('All models failed to execute');
      }

      if (failures.length > 0) {
        console.warn(`[AgentExecutor] Some models failed during consensus`, {
          consensusId,
          failureCount: failures.length,
          failures: failures.map((f) => f.message || f.toString()),
        });
      }

      const consensusResult = {
        responses: successfulResponses,
        processingTime: Date.now() - startTime,
      };

      console.log(`[AgentExecutor] Consensus completed successfully`, {
        consensusId,
        responseCount: successfulResponses.length,
        totalTokens: successfulResponses.reduce(
          (sum, r) => sum + (r.tokensUsed || 0),
          0
        ),
        avgProcessingTime:
          successfulResponses.reduce((sum, r) => sum + r.processingTime, 0) /
          successfulResponses.length,
        totalProcessingTime: consensusResult.processingTime,
      });

      return consensusResult;
    } catch (error) {
      console.error(`[AgentExecutor] Consensus execution failed`, {
        consensusId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });
      throw new Error(
        `Consensus execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute consensus with aggregation - multiple models provide input, one model aggregates
   */
  async executeConsensusWithAggregation(
    inputModels: ModelConfig[],
    aggregatorModel: ModelConfig,
    prompt: string,
    config?: AgentConfig
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const aggregationId = `aggregation_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    console.log(`[AgentExecutor] Starting consensus with aggregation`, {
      aggregationId,
      inputModelCount: inputModels.length,
      inputModels: inputModels.map((m) => m.name),
      aggregatorModel: aggregatorModel.name,
      promptLength: prompt.length,
    });

    if (inputModels.length === 0) {
      throw new Error('At least one input model is required for consensus');
    }

    try {
      // Step 1: Get responses from all input models
      console.log(
        `[AgentExecutor] Step 1: Getting responses from input models`,
        { aggregationId }
      );
      const consensusResult = await this.agentConsensus(
        inputModels,
        prompt,
        config
      );

      // Step 2: Create aggregation prompt with all responses
      console.log(`[AgentExecutor] Step 2: Building aggregation prompt`, {
        aggregationId,
        responseCount: consensusResult.responses.length,
      });
      const aggregationPrompt = this.buildAggregationPrompt(
        prompt,
        consensusResult.responses
      );

      // Step 3: Use aggregator model to create final response
      console.log(`[AgentExecutor] Step 3: Executing aggregator model`, {
        aggregationId,
        aggregatorModel: aggregatorModel.name,
      });
      const aggregatedResponse = await this.executeAgent(
        aggregatorModel,
        aggregationPrompt,
        {
          ...config,
          temperature: config?.temperature ?? 0.1, // Lower temperature for aggregation
        }
      );

      const totalProcessingTime = Date.now() - startTime;
      const totalTokensUsed =
        consensusResult.responses.reduce(
          (sum, r) => sum + (r.tokensUsed || 0),
          0
        ) + (aggregatedResponse.tokensUsed || 0);
      const modelDescription = `consensus(${consensusResult.responses.map((r) => r.model).join(',')}) -> ${aggregatorModel.name}`;

      console.log(`[AgentExecutor] Consensus aggregation completed`, {
        aggregationId,
        inputResponses: consensusResult.responses.length,
        totalTokensUsed,
        totalProcessingTime,
        modelDescription,
        finalResponseLength: aggregatedResponse.content.length,
      });

      // Return aggregated response with metadata about the process
      return {
        content: aggregatedResponse.content,
        model: modelDescription,
        tokensUsed: totalTokensUsed,
        processingTime: totalProcessingTime,
      };
    } catch (error) {
      console.error(`[AgentExecutor] Consensus aggregation failed`, {
        aggregationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });
      throw new Error(
        `Consensus aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildAggregationPrompt(
    originalPrompt: string,
    responses: AgentResponse[]
  ): string {
    const responseTexts = responses
      .map(
        (response, index) =>
          `## Response ${index + 1} (${response.model}):\n${response.content}`
      )
      .join('\n\n');

    return `You are tasked with analyzing multiple AI model responses to the same prompt and creating a single, comprehensive, and well-reasoned final response.

Original Prompt:
${originalPrompt}

Multiple Model Responses:
${responseTexts}

Instructions:
1. Analyze all the responses above for common themes, insights, and conclusions
2. Identify areas where models agree and where they differ
3. Synthesize the best elements from each response
4. Create a single, coherent response that represents the collective intelligence
5. Maintain the same format and structure as expected from the original prompt
6. If there are conflicting viewpoints, use your judgment to determine the most reasonable conclusion
7. Ensure the final response is comprehensive and addresses all aspects of the original prompt

Provide your synthesized response:`;
  }

  private createLangChainModel(
    model: ModelConfig,
    config?: AgentConfig
  ): BaseLanguageModel {
    const temperature = config?.temperature ?? model.temperature ?? 0.7;
    const maxTokens = config?.maxTokens ?? model.maxTokens ?? 4000;

    // Infer provider from model name
    if (model.name.startsWith('gpt-') || model.name.startsWith('o1-')) {
      return new ChatOpenAI({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxTokens,
      });
    }

    if (model.name.startsWith('claude-')) {
      return new ChatAnthropic({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxTokens,
      });
    }

    if (model.name.startsWith('gemini-') || model.name.includes('gemini')) {
      return new ChatGoogleGenerativeAI({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxOutputTokens: maxTokens,
      });
    }

    throw new Error(
      `Unsupported model: ${model.name}. Unable to infer provider.`
    );
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
let globalService: AgentExecutorService | null = null;

export function getAgentExecutorService(): AgentExecutorService {
  if (!globalService) {
    globalService = new AgentExecutorService();
  }
  return globalService;
}
