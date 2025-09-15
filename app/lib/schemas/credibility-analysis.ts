import { z } from 'zod';

/**
 * Well-documented Zod schemas for credibility analysis structured output
 * These schemas guide LLM responses with detailed descriptions for each field
 */

// Overview section schema with tabular format and user-friendly headers
export const OverviewSectionSchema = z
  .object({
    'Sampled Posts': z
      .string()
      .describe(
        "Total number of posts analyzed from the profile (e.g., '15 Posts')"
      ),

    'Focus Area': z
      .string()
      .describe(
        "Main topics or themes identified in the analyzed content (e.g., 'Health advice, Nutrition claims, Personal anecdotes')"
      ),

    'Analysis Date': z
      .string()
      .describe(
        "Human-readable date when the analysis was performed (e.g., 'January 15, 2024')"
      ),

    Platform: z
      .string()
      .describe(
        "Social media platform where the profile was found (e.g., 'Twitter/X', 'LinkedIn')"
      ),
  })
  .describe(
    'High-level summary providing context about the analysis scope, timing, and profile characteristics in a table format with Topic and Value columns'
  );

// Strengths section schema for positive credibility indicators
export const StrengthsSectionSchema = z
  .object({
    'Source Citations': z
      .string()
      .optional()
      .describe(
        'Examples of how the profile cites sources and references for claims'
      ),
    'Balanced Perspective': z
      .string()
      .optional()
      .describe(
        'Evidence of presenting multiple viewpoints or acknowledging limitations'
      ),
    'Expert Credentials': z
      .string()
      .optional()
      .describe(
        'Relevant qualifications or expertise demonstrated in the content'
      ),
    'Transparent Communication': z
      .string()
      .optional()
      .describe('Clear, honest communication style without hidden agendas'),
    'Evidence-Based Claims': z
      .string()
      .optional()
      .describe(
        'Use of data, research, or factual evidence to support statements'
      ),
    'Constructive Tone': z
      .string()
      .optional()
      .describe(
        'Professional, respectful communication that builds understanding'
      ),
  })
  .describe(
    'Positive credibility indicators found in the profile, with specific examples of how each strength manifests in the content'
  );

// Individual criteria evaluation schema with scoring and respectful status levels
export const CriteriaEvaluationItemSchema = z
  .object({
    criterion: z
      .string()
      .describe(
        "Name of the specific credibility criterion being evaluated (e.g., 'Unnecessary Complexity', 'Lack of Sourcing', 'Guru Syndrome')"
      ),

    score: z
      .number()
      .min(0)
      .max(10)
      .describe(
        'Numerical score from 0-10 for this specific criterion, where 0 represents significant issues and 10 represents exemplary performance'
      ),

    status: z
      .enum([
        'exemplary',
        'strong',
        'adequate',
        'weak',
        'concerning',
        'deceptive',
      ])
      .describe(
        "Respectful status classification: 'exemplary' (9.0-10.0) sets positive example, 'strong' (7.0-8.9) demonstrates good practices, 'adequate' (5.0-6.9) meets basic standards, 'weak' (3.0-4.9) shows concerning patterns, 'concerning' (1.5-2.9) exhibits patterns impacting credibility, 'deceptive' (0.0-1.4) contains misleading content"
      ),

    evaluation: z
      .string()
      .describe(
        'Detailed explanation that is first informative, then constructive and educational. Focus on awareness and improvement opportunities rather than purely judgmental language. Recognize positive examples when appropriate.'
      ),

    examples: z
      .array(z.string())
      .optional()
      .describe(
        "Optional array of specific examples from the profile's content that illustrate this criterion (e.g., specific post excerpts, patterns observed)"
      ),
  })
  .describe(
    'Evaluation of a single credibility criterion with numerical scoring, respectful status classification, and constructive feedback'
  );

// Criteria evaluation section schema (array of evaluations)
export const CriteriaEvaluationSectionSchema = z
  .array(CriteriaEvaluationItemSchema)
  .describe(
    'Comprehensive evaluation of the profile against all credibility criteria, providing detailed analysis for each criterion with specific examples and reasoning'
  );

// Representative post schema
export const RepresentativePostSchema = z
  .object({
    category: z
      .string()
      .describe(
        "Category or type of post this represents (e.g., 'Health Claim', 'Personal Anecdote', 'Product Promotion', 'Educational Content')"
      ),

    content: z
      .string()
      .describe(
        "Formatted content starting with [timestamp][url] on the first line, followed by the actual post text on subsequent lines. Format: '[Jan 15, 2024][https://platform.com/post/123]\\nActual post content here...' If URL is not available, use empty brackets: '[Jan 15, 2024][]\\nPost content...'"
      ),

    reasoning: z
      .string()
      .describe(
        'Detailed explanation of why this post was selected as representative, what credibility patterns it demonstrates, and how it relates to the overall analysis'
      ),
  })
  .describe(
    'A specific post that exemplifies key credibility patterns found in the profile, with timestamp and URL embedded in the content field for better readability'
  );

// Representative posts section schema
export const RepresentativePostsSectionSchema = z
  .array(RepresentativePostSchema)
  .describe(
    'Collection of specific posts that best illustrate the credibility patterns identified in the analysis, chosen to provide concrete examples of the evaluation criteria'
  );

// Score justification section schema
export const ScoreJustificationSectionSchema = z
  .object({
    'Why Not Higher': z
      .array(z.string())
      .optional()
      .describe(
        "List of specific factors that prevented a higher credibility score, with concrete examples from the profile's content"
      ),

    'Why Not Lower': z
      .array(z.string())
      .optional()
      .describe(
        'List of positive factors that prevented a lower credibility score, highlighting redeeming qualities or strengths found in the content'
      ),

    'Key Factors': z
      .array(z.string())
      .optional()
      .describe(
        'Most important factors that influenced the final score, both positive and negative, ranked by their impact on credibility assessment'
      ),
  })
  .describe(
    'Detailed justification for the assigned credibility score, explaining the reasoning behind the numerical rating with specific evidence'
  );

// Complete credibility analysis result schema
export const CredibilityAnalysisResultSchema = z
  .object({
    crediScore: z
      .number()
      .min(0)
      .max(10)
      .describe(
        'Overall credibility score from 0-10 calculated as a weighted average of individual criterion scores, displayed with precision of at most one decimal point (e.g., 8.1). 0 represents completely unreliable content, 5 represents average credibility, and 10 represents highly credible content'
      ),

    overview: OverviewSectionSchema,

    strengths: StrengthsSectionSchema,

    criteriaEvaluation: CriteriaEvaluationSectionSchema,

    representativePosts: RepresentativePostsSectionSchema,

    scoreJustification: ScoreJustificationSectionSchema,
  })
  .describe(
    'Complete credibility analysis result containing a numerical score and detailed breakdown of all evaluation criteria, strengths, representative content, and score justification'
  );

// Simple schema for scoring results
export const ScoringResultSchema = z
  .object({
    score: z
      .number()
      .min(0)
      .max(10)
      .describe('Credibility score from 0-10 based on the analysis data'),

    reasoning: z
      .string()
      .describe(
        'Detailed explanation of how the score was calculated and what factors influenced it'
      ),
  })
  .describe('Scoring result with numerical score and detailed reasoning');

// Scoring weights interface for weighted average calculation
export interface ScoringWeights {
  unnecessaryComplexity: number;
  proprietarySelling: number;
  usVsThemFraming: number;
  overselling: number;
  emotionOverData: number;
  lackOfSourcing: number;
  serialContrarian: number;
  guruSyndrome: number;
}

// Default equal weighting (can be adjusted based on importance)
export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  unnecessaryComplexity: 1.0,
  proprietarySelling: 1.0,
  usVsThemFraming: 1.0,
  overselling: 1.0,
  emotionOverData: 1.0,
  lackOfSourcing: 1.0,
  serialContrarian: 1.0,
  guruSyndrome: 1.0,
};

// Status level mapping for respectful classifications
export const STATUS_LEVELS = {
  exemplary: {
    label: 'Exemplary',
    description: 'Sets a positive example for others to follow',
    scoreRange: [9.0, 10.0] as const,
  },
  strong: {
    label: 'Strong',
    description: 'Demonstrates good practices with minor areas for enhancement',
    scoreRange: [7.0, 8.9] as const,
  },
  adequate: {
    label: 'Adequate',
    description: 'Meets basic standards with room for improvement',
    scoreRange: [5.0, 6.9] as const,
  },
  weak: {
    label: 'Weak',
    description: 'Shows some concerning patterns that could be addressed',
    scoreRange: [3.0, 4.9] as const,
  },
  concerning: {
    label: 'Concerning',
    description: 'Exhibits patterns that may impact credibility significantly',
    scoreRange: [1.5, 2.9] as const,
  },
  deceptive: {
    label: 'Deceptive',
    description: 'Contains misleading or deceptive content patterns',
    scoreRange: [0.0, 1.4] as const,
  },
} as const;

// Type inference for TypeScript usage
export type CredibilityAnalysisResult = z.infer<
  typeof CredibilityAnalysisResultSchema
>;
export type ScoringResult = z.infer<typeof ScoringResultSchema>;
export type OverviewSection = z.infer<typeof OverviewSectionSchema>;
export type StrengthsSection = z.infer<typeof StrengthsSectionSchema>;
export type CriteriaEvaluationSection = z.infer<
  typeof CriteriaEvaluationSectionSchema
>;
export type CriteriaEvaluationItem = z.infer<
  typeof CriteriaEvaluationItemSchema
>;
export type RepresentativePostsSection = z.infer<
  typeof RepresentativePostsSectionSchema
>;
export type RepresentativePost = z.infer<typeof RepresentativePostSchema>;
export type ScoreJustificationSection = z.infer<
  typeof ScoreJustificationSectionSchema
>;

/**
 * Calculate weighted average score from individual criterion scores
 */
export function calculateWeightedScore(
  criterionScores: CriteriaEvaluationItem[],
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  if (criterionScores.length === 0) {
    return 0;
  }

  let totalWeightedScore = 0;
  let totalWeight = 0;

  criterionScores.forEach((criterion) => {
    // Map criterion names to weight keys (normalize naming)
    const weightKey = normalizeWeightKey(criterion.criterion);
    const weight = weights[weightKey as keyof ScoringWeights] || 1.0;

    // Clamp score to valid range
    const clampedScore = Math.max(0, Math.min(10, criterion.score));

    totalWeightedScore += clampedScore * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) {
    return 0;
  }

  const finalScore = totalWeightedScore / totalWeight;
  // Round to one decimal precision
  return Math.round(finalScore * 10) / 10;
}

/**
 * Normalize criterion names to match weight keys
 */
function normalizeWeightKey(criterionName: string): string {
  const normalized = criterionName.toLowerCase().replace(/[^a-z]/g, '');

  // Map common criterion name variations to weight keys
  const mappings: Record<string, string> = {
    unnecessarycomplexity: 'unnecessaryComplexity',
    proprietarypushyselling: 'proprietarySelling',
    proprietaryselling: 'proprietarySelling',
    usvsthemframing: 'usVsThemFraming',
    overselling: 'overselling',
    oversellingnarrowinterventions: 'overselling',
    emotionoverdata: 'emotionOverData',
    emotionstoryoverdata: 'emotionOverData',
    lackofsourcing: 'lackOfSourcing',
    serialcontrarian: 'serialContrarian',
    gurusyndrome: 'guruSyndrome',
  };

  return mappings[normalized] || 'unnecessaryComplexity'; // fallback
}

/**
 * Determine status level based on score
 */
export function getStatusFromScore(score: number): keyof typeof STATUS_LEVELS {
  const clampedScore = Math.max(0, Math.min(10, score));

  for (const [status, config] of Object.entries(STATUS_LEVELS)) {
    const [min, max] = config.scoreRange;
    if (clampedScore >= min && clampedScore <= max) {
      return status as keyof typeof STATUS_LEVELS;
    }
  }

  // Fallback
  return 'adequate';
}

// Example usage demonstrating proper schema documentation patterns
export const ExampleUsage = {
  // Example of how to use the schema with LangChain structured output
  schema: CredibilityAnalysisResultSchema,

  // Example of a well-documented simple schema for other use cases
  simpleExampleSchema: z
    .object({
      message: z
        .string()
        .describe(
          "A clear, concise response message that directly answers the user's question"
        ),

      confidence: z
        .number()
        .min(0)
        .max(1)
        .describe(
          'Confidence level in the response from 0.0 (very uncertain) to 1.0 (completely certain)'
        ),

      sources: z
        .array(z.string())
        .optional()
        .describe(
          'Optional list of sources or references that support the response, formatted as URLs or citations'
        ),
    })
    .describe(
      'Simple response format with message, confidence level, and optional supporting sources'
    ),

  // Example of a complex nested schema with detailed descriptions
  complexExampleSchema: z
    .object({
      analysis: z
        .object({
          summary: z
            .string()
            .describe('Brief 1-2 sentence summary of the main findings'),

          details: z
            .array(
              z
                .object({
                  category: z
                    .string()
                    .describe(
                      "Category name for this detail (e.g., 'Technical Issues', 'Content Quality')"
                    ),

                  findings: z
                    .array(z.string())
                    .describe(
                      'Specific findings within this category, each as a separate string'
                    ),

                  severity: z
                    .enum(['low', 'medium', 'high'])
                    .describe(
                      "Severity level: 'low' for minor issues, 'medium' for moderate concerns, 'high' for serious problems"
                    ),
                })
                .describe(
                  'Detailed findings grouped by category with severity assessment'
                )
            )
            .describe(
              'Comprehensive breakdown of all findings organized by category'
            ),

          recommendations: z
            .array(z.string())
            .describe(
              'Actionable recommendations based on the analysis, prioritized by importance'
            ),
        })
        .describe(
          'Complete analysis with summary, detailed findings, and actionable recommendations'
        ),

      metadata: z
        .object({
          analysisDate: z
            .string()
            .describe('ISO timestamp when the analysis was performed'),

          dataPoints: z.number().describe('Number of data points analyzed'),

          processingTime: z
            .number()
            .describe('Time taken to complete the analysis in milliseconds'),
        })
        .describe('Metadata about the analysis process and timing'),
    })
    .describe(
      'Complex analysis result with nested structure, detailed findings, and comprehensive metadata'
    ),
};
