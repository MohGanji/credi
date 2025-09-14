import { test } from 'tap';
import { z } from 'zod';
import {
  AgentExecutorService,
  ModelConfig,
  AgentConfig,
} from '../AgentExecutorService';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { HumanMessage } from '@langchain/core/messages';

// Mock LangChain model that can simulate failures and successes
class MockChatModel extends BaseChatModel {
  private failureCount: number;
  private maxFailures: number;
  private shouldSucceed: boolean;

  constructor(maxFailures: number = 0, shouldSucceed: boolean = true) {
    super({});
    this.failureCount = 0;
    this.maxFailures = maxFailures;
    this.shouldSucceed = shouldSucceed;
  }

  async _generate() {
    throw new Error('Not implemented for mock');
  }

  _llmType(): string {
    return 'mock';
  }

  withStructuredOutput<T>(schema: z.ZodSchema<T>) {
    return {
      invoke: async (messages: any[]) => {
        this.failureCount++;

        // Fail for the first maxFailures attempts
        if (this.failureCount <= this.maxFailures) {
          throw new Error(
            `Mock structured output failure ${this.failureCount}`
          );
        }

        // After maxFailures, either succeed or fail permanently
        if (!this.shouldSucceed) {
          throw new Error('Mock permanent failure');
        }

        // Return a valid response that matches common test schemas
        return {
          score: 8.5,
          message: 'Mock successful response',
          details: ['detail1', 'detail2'],
        };
      },
    };
  }
}

// Test schema
const TestSchema = z.object({
  score: z.number().min(0).max(10).describe('A score from 0 to 10'),
  message: z.string().describe('A descriptive message'),
  details: z.array(z.string()).describe('Array of detail strings'),
});

test('AgentExecutorService retry mechanism', async (t) => {
  const service = new AgentExecutorService();

  // Mock the createLangChainModel method to return our mock model
  const originalCreateModel = (service as any).createLangChainModel;

  t.test('should succeed on first attempt when no failures', async (t) => {
    const mockModel = new MockChatModel(0, true); // No failures
    (service as any).createLangChainModel = () => mockModel;

    const modelConfig: ModelConfig = {
      name: 'mock-model',
      apiKey: 'test-key',
    };

    const config: AgentConfig = {
      retryCount: 3,
    };

    const result = await service.executeAgent(
      modelConfig,
      'Test prompt',
      config,
      TestSchema
    );

    t.equal(result.model, 'mock-model');
    t.equal(result.content.score, 8.5);
    t.equal(result.content.message, 'Mock successful response');
    t.equal(result.content.details.length, 2);
  });

  t.test('should succeed after 2 failures with retry', async (t) => {
    const mockModel = new MockChatModel(2, true); // Fail twice, then succeed
    (service as any).createLangChainModel = () => mockModel;

    const modelConfig: ModelConfig = {
      name: 'mock-model',
      apiKey: 'test-key',
    };

    const config: AgentConfig = {
      retryCount: 3,
    };

    const result = await service.executeAgent(
      modelConfig,
      'Test prompt',
      config,
      TestSchema
    );

    t.equal(result.model, 'mock-model');
    t.equal(result.content.score, 8.5);
    t.equal(result.content.message, 'Mock successful response');
  });

  t.test('should fail after exhausting all retries', async (t) => {
    const mockModel = new MockChatModel(5, false); // Always fail
    (service as any).createLangChainModel = () => mockModel;

    const modelConfig: ModelConfig = {
      name: 'mock-model',
      apiKey: 'test-key',
    };

    const config: AgentConfig = {
      retryCount: 3,
    };

    try {
      await service.executeAgent(
        modelConfig,
        'Test prompt',
        config,
        TestSchema
      );
      t.fail('Should have thrown an error');
    } catch (error) {
      t.ok(error instanceof Error);
      t.match(error.message, /Structured output failed after 3 attempts/);
      t.match(error.message, /mock-model/);
    }
  });

  t.test('should use default retry count when not specified', async (t) => {
    const mockModel = new MockChatModel(2, true); // Fail twice, then succeed
    (service as any).createLangChainModel = () => mockModel;

    const modelConfig: ModelConfig = {
      name: 'mock-model',
      apiKey: 'test-key',
    };

    // No retry count specified, should default to 3
    const result = await service.executeAgent(
      modelConfig,
      'Test prompt',
      undefined,
      TestSchema
    );

    t.equal(result.model, 'mock-model');
    t.equal(result.content.score, 8.5);
  });

  t.test('should work with consensus execution', async (t) => {
    const mockModel1 = new MockChatModel(1, true); // Fail once, then succeed
    const mockModel2 = new MockChatModel(0, true); // Succeed immediately

    let modelCallCount = 0;
    (service as any).createLangChainModel = (model: ModelConfig) => {
      modelCallCount++;
      return modelCallCount === 1 ? mockModel1 : mockModel2;
    };

    const modelConfigs: ModelConfig[] = [
      { name: 'mock-model-1', apiKey: 'test-key-1' },
      { name: 'mock-model-2', apiKey: 'test-key-2' },
    ];

    const config: AgentConfig = {
      retryCount: 3,
    };

    const result = await service.agentConsensus(
      modelConfigs,
      'Test prompt',
      config,
      TestSchema
    );

    t.equal(result.responses.length, 2);
    t.equal(result.responses[0].model, 'mock-model-1');
    t.equal(result.responses[1].model, 'mock-model-2');
  });

  // Restore original method
  (service as any).createLangChainModel = originalCreateModel;
});

test('AgentExecutorService retry helper methods', async (t) => {
  const service = new AgentExecutorService();

  t.test('should add retry instructions to prompt', async (t) => {
    const addRetryInstructions = (service as any).addRetryInstructions.bind(
      service
    );
    const originalPrompt = 'Analyze this data';

    const enhancedPrompt = addRetryInstructions(originalPrompt);

    t.match(enhancedPrompt, /Analyze this data/);
    t.match(enhancedPrompt, /IMPORTANT: You MUST respond with valid JSON/);
    t.match(enhancedPrompt, /Do not include any text before or after the JSON/);
    t.match(enhancedPrompt, /Do not wrap the JSON in markdown code blocks/);
    t.match(enhancedPrompt, /Ensure all required fields are present/);
  });
});
