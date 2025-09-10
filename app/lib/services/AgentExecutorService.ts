import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { BaseLanguageModel } from '@langchain/core/language_models/base'
import { HumanMessage } from '@langchain/core/messages'

export interface ModelConfig {
  name: string
  apiKey: string
  temperature?: number
  maxTokens?: number
}

export interface AgentConfig {
  temperature?: number
  maxTokens?: number
  timeout?: number
}

export interface AgentResponse {
  content: string
  model: string
  tokensUsed?: number
  processingTime: number
}

export interface ConsensusResponse {
  responses: AgentResponse[]
  consensus?: string
  processingTime: number
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
    const startTime = Date.now()
    
    try {
      const langchainModel = this.createLangChainModel(model, config)
      const response = await langchainModel.invoke([new HumanMessage(prompt)])
      const content = response.content as string
      
      return {
        content,
        model: model.name,
        tokensUsed: this.estimateTokens(prompt + content),
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`Agent execution failed for ${model.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
    const startTime = Date.now()
    
    if (models.length === 0) {
      throw new Error('At least one model is required for consensus')
    }

    try {
      // Execute all models in parallel
      const promises = models.map(model => 
        this.executeAgent(model, prompt, config)
      )
      
      const responses = await Promise.allSettled(promises)
      
      // Filter successful responses
      const successfulResponses = responses
        .filter((result): result is PromiseFulfilledResult<AgentResponse> => result.status === 'fulfilled')
        .map(result => result.value)
      
      if (successfulResponses.length === 0) {
        throw new Error('All models failed to execute')
      }

      // Log any failures
      const failures = responses
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason)
      
      if (failures.length > 0) {
        console.warn('Some models failed during consensus:', failures)
      }

      return {
        responses: successfulResponses,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      throw new Error(`Consensus execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private createLangChainModel(model: ModelConfig, config?: AgentConfig): BaseLanguageModel {
    const temperature = config?.temperature ?? model.temperature ?? 0.7
    const maxTokens = config?.maxTokens ?? model.maxTokens ?? 4000
    
    // Infer provider from model name
    if (model.name.startsWith('gpt-') || model.name.startsWith('o1-')) {
      return new ChatOpenAI({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxTokens
      })
    }
    
    if (model.name.startsWith('claude-')) {
      return new ChatAnthropic({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxTokens
      })
    }
    
    if (model.name.startsWith('gemini-') || model.name.includes('gemini')) {
      return new ChatGoogleGenerativeAI({
        model: model.name,
        apiKey: model.apiKey,
        temperature,
        maxOutputTokens: maxTokens
      })
    }
    
    throw new Error(`Unsupported model: ${model.name}. Unable to infer provider.`)
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}

// Singleton instance
let globalService: AgentExecutorService | null = null

export function getAgentExecutorService(): AgentExecutorService {
  if (!globalService) {
    globalService = new AgentExecutorService()
  }
  return globalService
}