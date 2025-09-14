import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';
import { z } from 'zod';

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
  retryCount?: number; // Default 3 attempts for structured output failures
}

export interface AgentResponse<T = string> {
  content: T;
  model: string;
  tokensUsed?: number;
  processingTime: number;
}

export interface ConsensusResponse<T = string> {
  responses: AgentResponse<T>[];
  consensus?: string;
  processingTime: number;
}

export class AgentExecutorService {
  /**
   * Execute a single agent with structured output validation
   */
  async executeAgent<T>(
    model: ModelConfig,
    prompt: string,
    config: AgentConfig | undefined,
    schema: z.ZodSchema<T>
  ): Promise<AgentResponse<T>>;

  /**
   * Execute a single agent with a model and prompt (backward compatibility)
   */
  async executeAgent(
    model: ModelConfig,
    prompt: string,
    config?: AgentConfig
  ): Promise<AgentResponse<string>>;

  /**
   * Execute a single agent with a model and prompt
   */
  async executeAgent<T>(
    model: ModelConfig,
    prompt: string,
    config?: AgentConfig,
    schema?: z.ZodSchema<T>
  ): Promise<AgentResponse<T> | AgentResponse<string>> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[AgentExecutor] Starting single agent execution`, {
      executionId,
      model: model.name,
      promptLength: prompt.length,
      structuredOutput: !!schema,
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

      // If schema is provided, use structured output with retry mechanism
      if (schema) {
        const maxRetries = config?.retryCount ?? 3;
        console.log(`[AgentExecutor] Using structured output with schema and retry mechanism`, {
          executionId,
          model: model.name,
          maxRetries,
        });

        const result = await this.executeStructuredOutputWithRetry(
          langchainModel,
          prompt,
          schema,
          model.name,
          executionId,
          maxRetries
        );

        const processingTime = Date.now() - startTime;

        // Estimate tokens based on the structured result
        const resultString = JSON.stringify(result);
        const tokensUsed = this.estimateTokens(prompt + resultString);

        console.log(`[AgentExecutor] Structured output execution completed`, {
          executionId,
          model: model.name,
          processingTime,
          tokensUsed,
          resultType: typeof result,
          maxRetries,
        });

        return {
          content: result as T,
          model: model.name,
          tokensUsed,
          processingTime,
        } as AgentResponse<T>;
      }

      // Backward compatibility: return AgentResponse when no schema provided
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
      } as AgentResponse<string>;
    } catch (error) {
      console.error(`[AgentExecutor] Single agent execution failed`, {
        executionId,
        model: model.name,
        structuredOutput: !!schema,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });

      if (schema) {
        throw new Error(
          `Structured output failed for ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      throw new Error(
        `Agent execution failed for ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute multiple agents in parallel with structured output validation
   */
  async agentConsensus<T>(
    models: ModelConfig[],
    prompt: string,
    config: AgentConfig | undefined,
    schema: z.ZodSchema<T>
  ): Promise<ConsensusResponse<T>>;

  /**
   * Execute multiple agents in parallel and return all responses (backward compatibility)
   */
  async agentConsensus(
    models: ModelConfig[],
    prompt: string,
    config?: AgentConfig
  ): Promise<ConsensusResponse<string>>;

  /**
   * Execute multiple agents in parallel and return all responses
   */
  async agentConsensus<T>(
    models: ModelConfig[],
    prompt: string,
    config?: AgentConfig,
    schema?: z.ZodSchema<T>
  ): Promise<ConsensusResponse<T> | ConsensusResponse<string>> {
    const startTime = Date.now();
    const consensusId = `consensus_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    console.log(`[AgentExecutor] Starting consensus execution`, {
      consensusId,
      modelCount: models.length,
      models: models.map((m) => m.name),
      promptLength: prompt.length,
      structuredOutput: !!schema,
      config,
    });

    if (models.length === 0) {
      throw new Error('At least one model is required for consensus');
    }

    try {
      // If schema is provided, use structured output for all models
      if (schema) {
        const maxRetries = config?.retryCount ?? 3;
        console.log(
          `[AgentExecutor] Executing ${models.length} models in parallel with structured output and retry mechanism`,
          { consensusId, maxRetries }
        );

        const promises = models.map((model, index) => {
          console.log(
            `[AgentExecutor] Queuing structured model ${index + 1}/${models.length}: ${model.name} (max retries: ${maxRetries})`,
            { consensusId }
          );
          return this.executeAgent(model, prompt, config, schema);
        });

        const responses = await Promise.allSettled(promises);

        // Filter successful responses
        const successfulResponses = responses
          .filter(
            (result): result is PromiseFulfilledResult<AgentResponse<T>> =>
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

        console.log(`[AgentExecutor] Structured consensus execution results`, {
          consensusId,
          totalModels: models.length,
          successfulResponses: successfulResponses.length,
          failedResponses: failures.length,
          successfulModels: successfulResponses.map((r) => r.model),
          failures: failures.map((f) => f.message || f.toString()),
          totalProcessingTime: Date.now() - startTime,
        });

        if (successfulResponses.length === 0) {
          console.error(`[AgentExecutor] All models failed in structured consensus`, {
            consensusId,
            failures,
          });
          throw new Error('All models failed to execute with structured output');
        }

        if (failures.length > 0) {
          console.warn(`[AgentExecutor] Some models failed during structured consensus`, {
            consensusId,
            failureCount: failures.length,
            failures: failures.map((f) => f.message || f.toString()),
          });
        }

        const consensusResult = {
          responses: successfulResponses,
          processingTime: Date.now() - startTime,
        };

        console.log(`[AgentExecutor] Structured consensus completed successfully`, {
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

        return consensusResult as ConsensusResponse<T>;
      }

      // Backward compatibility: Execute all models in parallel without structured output
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
          (result): result is PromiseFulfilledResult<AgentResponse<string>> =>
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

      return consensusResult as ConsensusResponse<string>;
    } catch (error) {
      console.error(`[AgentExecutor] Consensus execution failed`, {
        consensusId,
        structuredOutput: !!schema,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });

      if (schema) {
        throw new Error(
          `Structured consensus execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      throw new Error(
        `Consensus execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute consensus with aggregation with structured output validation
   */
  async executeConsensusWithAggregation<T>(
    inputModels: ModelConfig[],
    aggregatorModel: ModelConfig,
    prompt: string,
    config: AgentConfig | undefined,
    schema: z.ZodSchema<T>
  ): Promise<AgentResponse<T>>;

  /**
   * Execute consensus with aggregation - multiple models provide input, one model aggregates
   */
  async executeConsensusWithAggregation(
    inputModels: ModelConfig[],
    aggregatorModel: ModelConfig,
    prompt: string,
    config?: AgentConfig
  ): Promise<AgentResponse<string>>;

  /**
   * Execute consensus with aggregation - multiple models provide input, one model aggregates
   */
  async executeConsensusWithAggregation<T>(
    inputModels: ModelConfig[],
    aggregatorModel: ModelConfig,
    prompt: string,
    config?: AgentConfig,
    schema?: z.ZodSchema<T>
  ): Promise<AgentResponse<T> | AgentResponse<string>> {
    const startTime = Date.now();
    const aggregationId = `aggregation_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

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
      // If schema is provided, use structured output
      if (schema) {
        const maxRetries = config?.retryCount ?? 3;
        console.log(`[AgentExecutor] Starting structured consensus with aggregation and retry mechanism`, {
          aggregationId,
          structuredOutput: true,
          maxRetries,
        });

        // Step 1: Get structured responses from all input models
        console.log(
          `[AgentExecutor] Step 1: Getting structured responses from input models (max retries: ${maxRetries})`,
          { aggregationId }
        );
        const consensusResult = await this.agentConsensus(
          inputModels,
          prompt,
          config,
          schema
        );

        // For structured output, we can return the first successful response
        // since all responses should conform to the same schema
        const firstResponse = consensusResult.responses[0];
        const totalTokensUsed = consensusResult.responses.reduce(
          (sum, r) => sum + (r.tokensUsed || 0),
          0
        );
        const modelDescription = `consensus(${consensusResult.responses.map((r) => r.model).join(',')})`;

        console.log(`[AgentExecutor] Structured consensus aggregation completed`, {
          aggregationId,
          inputResponses: consensusResult.responses.length,
          totalTokensUsed,
          totalProcessingTime: Date.now() - startTime,
          modelDescription,
        });

        return {
          content: firstResponse.content,
          model: modelDescription,
          tokensUsed: totalTokensUsed,
          processingTime: Date.now() - startTime,
        } as AgentResponse<T>;
      }

      // Backward compatibility: Step 1: Get responses from all input models
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
      } as AgentResponse<string>;
    } catch (error) {
      console.error(`[AgentExecutor] Consensus aggregation failed`, {
        aggregationId,
        structuredOutput: !!schema,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
      });

      if (schema) {
        throw new Error(
          `Structured consensus aggregation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

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
3. When you encounter score values from multiple models, calculate the average score and round to 1 decimal place
4. Synthesize the best elements from each response
5. Create a single, coherent response that represents the collective intelligence
6. Maintain the same format and structure as expected from the original prompt
7. If there are conflicting viewpoints, use your judgment to determine the most reasonable conclusion
8. Ensure the final response is comprehensive and addresses all aspects of the original prompt

Provide your synthesized response:`;
  }



  private createLangChainModel(
    model: ModelConfig,
    config?: AgentConfig
  ): BaseChatModel {
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

  /**
   * Add fixed retry instructions to prompt for structured output failures
   */
  private addRetryInstructions(originalPrompt: string): string {
    return `${originalPrompt}

IMPORTANT: You MUST respond with valid JSON that matches the required schema format exactly. Do not include any text before or after the JSON. Do not wrap the JSON in markdown code blocks. Ensure all required fields are present and field types match exactly.`;
  }

  /**
   * Execute structured output with simple retry mechanism
   */
  private async executeStructuredOutputWithRetry<T>(
    langchainModel: BaseChatModel,
    originalPrompt: string,
    schema: z.ZodSchema<T>,
    modelName: string,
    executionId: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const isRetry = attempt > 0;
        const prompt = isRetry
          ? this.addRetryInstructions(originalPrompt)
          : originalPrompt;

        if (isRetry) {
          console.log(`[AgentExecutor] Retrying structured output (attempt ${attempt + 1}/${maxRetries})`, {
            executionId,
            model: modelName,
            attempt: attempt + 1,
            previousError: lastError?.message,
          });
        }

        const structuredModel = langchainModel.withStructuredOutput(schema);
        const result = await structuredModel.invoke([new HumanMessage(prompt)]);

        if (isRetry) {
          console.log(`[AgentExecutor] Structured output retry succeeded`, {
            executionId,
            model: modelName,
            successfulAttempt: attempt + 1,
          });
        }

        return result as T;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        console.warn(`[AgentExecutor] Structured output attempt ${attempt + 1} failed`, {
          executionId,
          model: modelName,
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message,
          willRetry: attempt < maxRetries - 1,
        });

        // If this is the last attempt, we'll throw the error after the loop
        if (attempt === maxRetries - 1) {
          break;
        }
      }
    }

    // All retries failed
    console.error(`[AgentExecutor] All structured output attempts failed`, {
      executionId,
      model: modelName,
      totalAttempts: maxRetries,
      finalError: lastError?.message,
    });

    throw new Error(
      `Structured output failed after ${maxRetries} attempts for ${modelName}: ${lastError?.message || 'Unknown error'}`
    );
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
