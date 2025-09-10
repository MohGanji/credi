import { Analysis } from '../../generated/prisma'
import { AgentExecutorService, getAgentExecutorService, ModelConfig } from './AgentExecutorService'
import { logger } from '../logger'

/**
 * Project-specific service for credibility analysis using the AI agent executor
 */
export class CredibilityAnalyzer {
  private agentExecutor: AgentExecutorService

  constructor() {
    this.agentExecutor = getAgentExecutorService()
  }

  /**
   * Analyze a social media profile for credibility
   */
  async analyzeProfile(
    posts: any[],
    profileInfo: any,
    options?: {
      models?: ModelConfig[]
      timeout?: number
    }
  ): Promise<Omit<Analysis, 'id' | 'createdAt'>> {
    const prompt = this.buildCredibilityPrompt(posts, profileInfo)

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      return this.getMockAnalysisResult(profileInfo)
    }

    // Get default models if none provided
    const models = options?.models || this.getDefaultModels()

    const startTime = Date.now()
    const result = await this.agentExecutor.agentConsensus(models, prompt, {
      temperature: 0.2,
      maxTokens: 4000,
      timeout: options?.timeout || 120000
    })

    // Use the first successful response for now
    const analysisContent = result.responses[0]?.content || ''

    // Parse the result and convert to Analysis format
    return this.parseAnalysisResult(analysisContent, profileInfo, {
      processingTimeMs: Date.now() - startTime,
      modelUsed: result.responses.map(r => r.model).join(', '),
      tokensUsed: result.responses.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
    })
  }

  /**
   * Score a profile based on analysis data
   */
  async scoreProfile(
    analysisData: any,
    options?: {
      models?: ModelConfig[]
    }
  ): Promise<{ score: number; reasoning: string }> {
    const prompt = this.buildScoringPrompt(analysisData)

    // Use mock data if configured
    if (process.env.MOCK_AGENT_CALL === 'true') {
      return { score: 7.5, reasoning: 'Mock scoring result for testing' }
    }

    const models = options?.models || this.getDefaultModels().slice(0, 1) // Use single model for scoring

    const result = await this.agentExecutor.agentConsensus(models, prompt, {
      temperature: 0.1,
      maxTokens: 1000
    })

    return this.parseScoringResult(result.responses[0]?.content || '')
  }

  private getDefaultModels(): ModelConfig[] {
    const models: ModelConfig[] = []

    if (process.env.OPENAI_API_KEY) {
      models.push({
        name: process.env.AGENT_DEFAULT_MODEL || 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.2,
        maxTokens: 4000
      })
    }

    if (process.env.ANTHROPIC_API_KEY) {
      models.push({
        name: 'claude-3-haiku-20240307',
        apiKey: process.env.ANTHROPIC_API_KEY,
        temperature: 0.2,
        maxTokens: 4000
      })
    }

    if (models.length === 0) {
      throw new Error('No API keys configured for AI models. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY')
    }

    return models
  }

  private buildCredibilityPrompt(posts: any[], profileInfo: any): string {
    const template = process.env.CREDIBILITY_ANALYSIS_PROMPT || this.getDefaultAnalysisPrompt()

    const postsText = posts.map((post: any, i: number) => `
Post ${i + 1} (${post.timestamp}):
${post.content}
${post.links?.length > 0 ? 'Links: ' + post.links.join(', ') : ''}
`).join('\n')

    return template
      .replace('{username}', profileInfo.username || 'unknown')
      .replace('{displayName}', profileInfo.displayName || 'unknown')
      .replace('{bio}', profileInfo.bio || 'No bio available')
      .replace('{verified}', profileInfo.verified ? 'Yes' : 'No')
      .replace('{postCount}', posts.length.toString())
      .replace('{posts}', postsText)
  }

  private buildScoringPrompt(analysisData: any): string {
    const template = process.env.CREDIBILITY_SCORING_PROMPT || this.getDefaultScoringPrompt()

    return template.replace('{analysisData}', JSON.stringify(analysisData))
  }

  private parseAnalysisResult(
    result: string,
    profileInfo: any,
    metadata: { processingTimeMs: number; modelUsed: string; tokensUsed: number }
  ): Omit<Analysis, 'id' | 'createdAt'> {
    try {
      // Try to parse JSON from the result
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Convert to AnalysisResult format
      const sections = [
        {
          name: 'overview',
          data: parsed.overview || {}
        },
        {
          name: 'strengths',
          data: parsed.strengths || {}
        },
        {
          name: 'criteria_evaluation',
          data: parsed.criteriaEvaluation || {}
        },
        {
          name: 'representative_posts',
          data: parsed.representativePosts || {}
        },
        {
          name: 'score_justification',
          data: parsed.scoreJustification || {}
        }
      ];

      return {
        profileUrl: '', // Will be set by caller
        platform: this.detectPlatform(profileInfo.username || ''),
        username: profileInfo.username || 'unknown',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        crediScore: parsed.crediScore || 5,
        sections,
        processingTimeMs: metadata.processingTimeMs,
        modelUsed: metadata.modelUsed,
        tokensUsed: metadata.tokensUsed,
        requestedBy: null
      };
    } catch (error) {
      logger.error('Failed to parse analysis result', { error: error instanceof Error ? error.message : 'Unknown error' });

      // Fallback: create a basic result with the raw response
      return {
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
              'Note': 'Failed to parse structured response, showing raw output'
            }
          }
        ],
        processingTimeMs: metadata.processingTimeMs,
        modelUsed: metadata.modelUsed,
        tokensUsed: metadata.tokensUsed,
        requestedBy: null
      };
    }
  }

  private parseScoringResult(result: string): { score: number; reasoning: string } {
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 5,
        reasoning: parsed.reasoning || 'Score calculated by AI analysis'
      };
    } catch (error) {
      logger.error('Failed to parse scoring result', { error: error instanceof Error ? error.message : 'Unknown error' });
      return {
        score: 5,
        reasoning: 'Failed to parse scoring result: ' + result
      };
    }
  }

  private getMockAnalysisResult(profileInfo: any): Omit<Analysis, 'id' | 'createdAt'> {
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
            'Platform': this.detectPlatform(profileInfo.username || ''),
            'Profile Status': 'Active'
          }
        }
      ],
      processingTimeMs: 1500,
      modelUsed: 'mock-model',
      tokensUsed: 2500,
      requestedBy: null
    }
  }

  private detectPlatform(username: string): string {
    if (username.includes('@')) return 'twitter'
    if (username.includes('linkedin')) return 'linkedin'
    return 'unknown'
  }

  /**
   * Check if the service is properly configured
   */
  checkConfiguration(): { configured: boolean; availableModels: string[] } {
    try {
      const models = this.getDefaultModels()
      return {
        configured: models.length > 0,
        availableModels: models.map(m => m.name)
      }
    } catch (error) {
      return {
        configured: false,
        availableModels: []
      }
    }
  }

  private getDefaultAnalysisPrompt(): string {
    return `Analyze the following social media profile for credibility based on these 8 criteria:

1. Unnecessary Complexity - Does the content use overly complex language when simpler explanations would suffice?
2. Proprietary/Pushy Selling - Is the content primarily focused on selling products or services?
3. Us-vs-Them Framing - Does the content create divisive "us vs them" narratives?
4. Overselling Narrow Interventions - Does the content oversell limited solutions as cure-alls?
5. Emotion/Story Over Data - Does the content rely more on emotional appeals than factual evidence?
6. Lack of Sourcing - Does the content fail to cite credible sources for claims?
7. Serial Contrarian - Does the content consistently take contrarian positions without justification?
8. Guru Syndrome - Does the content position the author as an infallible expert?

Profile Information:
- Username: {username}
- Display Name: {displayName}
- Bio: {bio}
- Verified: {verified}

Recent Posts ({postCount} total):
{posts}

Provide a comprehensive analysis in JSON format with this structure:
{
  "overview": {
    "sampledPosts": number,
    "focusAreas": string[]
  },
  "strengths": {
    "contentQuality": string,
    "sourceCitations": string,
    "balancedPerspective": string
  },
  "criteriaEvaluation": {
    "unnecessaryComplexity": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "proprietarySelling": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "usVsThemFraming": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "overselling": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "emotionOverData": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "lackOfSourcing": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "serialContrarian": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] },
    "guruSyndrome": { "status": "pass|warning|fail", "evaluation": string, "examples": string[] }
  },
  "representativePosts": {
    "highQualityPosts": [{ "content": string, "url": string, "timestamp": string, "reasoning": string }],
    "concerningPosts": [{ "content": string, "url": string, "timestamp": string, "redFlags": string[] }]
  },
  "scoreJustification": {
    "whyNotHigher": string[],
    "whyNotLower": string[],
    "keyFactors": string[]
  },
  "crediScore": number
}`
  }

  private getDefaultScoringPrompt(): string {
    return `Based on the credibility analysis provided, calculate a final credibility score from 0-10 using this RIGOROUS gaussian-distributed scoring system:

SCORING DISTRIBUTION (Normal Curve - Be Tough but Fair):
- 9-10 (Top 5%): EXCEPTIONAL - Exemplary content with consistent sourcing, balanced analysis, and professional expertise. Zero red flags across all 8 criteria. Sets the gold standard.
- 7-8 (Next 15%): RELIABLE - High-quality content with minor issues. Maximum 1-2 'warning' flags, no 'fail' flags. Demonstrates expertise and good practices.
- 5-6 (Middle 60%): AVERAGE - Mixed quality typical of most social media. 2-4 'warning' flags or 1 'fail' flag. Some good content but notable concerns.
- 3-4 (Next 15%): CONCERNING - Significant reliability issues. Multiple 'fail' flags or pervasive 'warning' patterns. More problems than strengths.
- 0-2 (Bottom 5%): UNRELIABLE - Severe credibility problems. Multiple 'fail' flags across criteria. Actively misleading or harmful content patterns.

SCORING GUIDELINES:
1. DEFAULT to 5-6 range unless evidence clearly justifies moving up/down
2. Require STRONG evidence to award 7+ (exceptional sourcing, expertise, balance)
3. Require CLEAR red flags to score below 5 (misinformation, manipulation, guru behavior)
4. Weight 'fail' flags heavily: Each 'fail' = -1.5 points, each 'warning' = -0.5 points from baseline of 6
5. Consider CONSISTENCY across all 8 criteria - sporadic good content doesn't offset systematic issues
6. BIAS toward skepticism - extraordinary claims require extraordinary evidence of credibility

Analysis Data: {analysisData}

Provide the score as a JSON object with detailed reasoning: { "score": number, "reasoning": string, "flagSummary": { "fail": number, "warning": number, "pass": number } }`
  }
}