import { z } from 'zod';

/**
 * Well-documented Zod schemas for credibility analysis structured output
 * These schemas guide LLM responses with detailed descriptions for each field
 */

// Overview section schema with detailed field descriptions
export const OverviewSectionSchema = z.object({
  'Sampled Posts': z.string()
    .describe("Total number of posts analyzed from the profile (e.g., '15 posts')"),
  
  'Focus Areas': z.string()
    .describe("Comma-separated list of main topics or themes identified in the analyzed content (e.g., 'Health advice, Nutrition claims, Personal anecdotes')"),
  
  'Analysis Date': z.string()
    .describe("ISO timestamp of when the analysis was performed (e.g., '2024-01-15T10:30:00Z')"),
  
  Platform: z.string()
    .describe("Social media platform where the profile was found (e.g., 'twitter', 'linkedin')"),
  
  'Profile Status': z.string()
    .describe("Current status of the profile (e.g., 'Active', 'Verified', 'Private', 'Suspended')")
}).describe("High-level summary providing context about the analysis scope, timing, and profile characteristics");

// Strengths section schema for positive credibility indicators
export const StrengthsSectionSchema = z.object({
  'Source Citations': z.string().optional()
    .describe("Examples of how the profile cites sources and references for claims"),
  'Balanced Perspective': z.string().optional()
    .describe("Evidence of presenting multiple viewpoints or acknowledging limitations"),
  'Expert Credentials': z.string().optional()
    .describe("Relevant qualifications or expertise demonstrated in the content"),
  'Transparent Communication': z.string().optional()
    .describe("Clear, honest communication style without hidden agendas"),
  'Evidence-Based Claims': z.string().optional()
    .describe("Use of data, research, or factual evidence to support statements"),
  'Constructive Tone': z.string().optional()
    .describe("Professional, respectful communication that builds understanding"),
}).describe("Positive credibility indicators found in the profile, with specific examples of how each strength manifests in the content");

// Individual criteria evaluation schema
export const CriteriaEvaluationItemSchema = z.object({
  criterion: z.string()
    .describe("Name of the specific credibility criterion being evaluated (e.g., 'Unnecessary Complexity', 'Lack of Sourcing', 'Guru Syndrome')"),
  
  status: z.enum(['pass', 'warning', 'fail'])
    .describe("Evaluation result: 'pass' means the profile performs well on this criterion, 'warning' indicates some concerns, 'fail' means significant issues were found"),
  
  evaluation: z.string()
    .describe("Detailed explanation of the evaluation, including specific reasoning for the assigned status and how the profile's content demonstrates this criterion"),
  
  examples: z.array(z.string()).optional()
    .describe("Optional array of specific examples from the profile's content that illustrate this criterion (e.g., specific post excerpts, patterns observed)")
}).describe("Evaluation of a single credibility criterion with detailed reasoning and evidence");

// Criteria evaluation section schema (array of evaluations)
export const CriteriaEvaluationSectionSchema = z.array(CriteriaEvaluationItemSchema)
  .describe("Comprehensive evaluation of the profile against all credibility criteria, providing detailed analysis for each criterion with specific examples and reasoning");

// Representative post schema
export const RepresentativePostSchema = z.object({
  category: z.string()
    .describe("Category or type of post this represents (e.g., 'Health Claim', 'Personal Anecdote', 'Product Promotion', 'Educational Content')"),
  
  content: z.string()
    .describe("The actual text content of the post, quoted exactly as it appeared on the platform"),
  
  timestamp: z.string()
    .describe("When the post was published, in a readable format (e.g., '2024-01-15 14:30' or 'Jan 15, 2024')"),
  
  url: z.string()
    .describe("Direct URL link to the original post on the social media platform, if available"),
  
  reasoning: z.string()
    .describe("Detailed explanation of why this post was selected as representative, what credibility patterns it demonstrates, and how it relates to the overall analysis")
}).describe("A specific post that exemplifies key credibility patterns found in the profile");

// Representative posts section schema
export const RepresentativePostsSectionSchema = z.array(RepresentativePostSchema)
  .describe("Collection of specific posts that best illustrate the credibility patterns identified in the analysis, chosen to provide concrete examples of the evaluation criteria");

// Score justification section schema
export const ScoreJustificationSectionSchema = z.object({
  'Why Not Higher': z.array(z.string()).optional()
    .describe("List of specific factors that prevented a higher credibility score, with concrete examples from the profile's content"),
  
  'Why Not Lower': z.array(z.string()).optional()
    .describe("List of positive factors that prevented a lower credibility score, highlighting redeeming qualities or strengths found in the content"),
  
  'Key Factors': z.array(z.string()).optional()
    .describe("Most important factors that influenced the final score, both positive and negative, ranked by their impact on credibility assessment")
}).describe("Detailed justification for the assigned credibility score, explaining the reasoning behind the numerical rating with specific evidence");

// Complete credibility analysis result schema
export const CredibilityAnalysisResultSchema = z.object({
  crediScore: z.number()
    .min(0)
    .max(10)
    .describe("Overall credibility score from 0-10, where 0 represents completely unreliable content with serious credibility issues, 5 represents average credibility with mixed signals, and 10 represents highly credible content with excellent sourcing and balanced perspectives"),
  
  overview: OverviewSectionSchema,
  
  strengths: StrengthsSectionSchema,
  
  criteriaEvaluation: CriteriaEvaluationSectionSchema,
  
  representativePosts: RepresentativePostsSectionSchema,
  
  scoreJustification: ScoreJustificationSectionSchema
}).describe("Complete credibility analysis result containing a numerical score and detailed breakdown of all evaluation criteria, strengths, representative content, and score justification");

// Simple schema for scoring results
export const ScoringResultSchema = z.object({
  score: z.number()
    .min(0)
    .max(10)
    .describe("Credibility score from 0-10 based on the analysis data"),
  
  reasoning: z.string()
    .describe("Detailed explanation of how the score was calculated and what factors influenced it")
}).describe("Scoring result with numerical score and detailed reasoning");

// Type inference for TypeScript usage
export type CredibilityAnalysisResult = z.infer<typeof CredibilityAnalysisResultSchema>;
export type ScoringResult = z.infer<typeof ScoringResultSchema>;
export type OverviewSection = z.infer<typeof OverviewSectionSchema>;
export type StrengthsSection = z.infer<typeof StrengthsSectionSchema>;
export type CriteriaEvaluationSection = z.infer<typeof CriteriaEvaluationSectionSchema>;
export type CriteriaEvaluationItem = z.infer<typeof CriteriaEvaluationItemSchema>;
export type RepresentativePostsSection = z.infer<typeof RepresentativePostsSectionSchema>;
export type RepresentativePost = z.infer<typeof RepresentativePostSchema>;
export type ScoreJustificationSection = z.infer<typeof ScoreJustificationSectionSchema>;

// Example usage demonstrating proper schema documentation patterns
export const ExampleUsage = {
  // Example of how to use the schema with LangChain structured output
  schema: CredibilityAnalysisResultSchema,
  
  // Example of a well-documented simple schema for other use cases
  simpleExampleSchema: z.object({
    message: z.string()
      .describe("A clear, concise response message that directly answers the user's question"),
    
    confidence: z.number()
      .min(0)
      .max(1)
      .describe("Confidence level in the response from 0.0 (very uncertain) to 1.0 (completely certain)"),
    
    sources: z.array(z.string()).optional()
      .describe("Optional list of sources or references that support the response, formatted as URLs or citations")
  }).describe("Simple response format with message, confidence level, and optional supporting sources"),
  
  // Example of a complex nested schema with detailed descriptions
  complexExampleSchema: z.object({
    analysis: z.object({
      summary: z.string()
        .describe("Brief 1-2 sentence summary of the main findings"),
      
      details: z.array(
        z.object({
          category: z.string()
            .describe("Category name for this detail (e.g., 'Technical Issues', 'Content Quality')"),
          
          findings: z.array(z.string())
            .describe("Specific findings within this category, each as a separate string"),
          
          severity: z.enum(['low', 'medium', 'high'])
            .describe("Severity level: 'low' for minor issues, 'medium' for moderate concerns, 'high' for serious problems")
        }).describe("Detailed findings grouped by category with severity assessment")
      ).describe("Comprehensive breakdown of all findings organized by category"),
      
      recommendations: z.array(z.string())
        .describe("Actionable recommendations based on the analysis, prioritized by importance")
    }).describe("Complete analysis with summary, detailed findings, and actionable recommendations"),
    
    metadata: z.object({
      analysisDate: z.string()
        .describe("ISO timestamp when the analysis was performed"),
      
      dataPoints: z.number()
        .describe("Number of data points analyzed"),
      
      processingTime: z.number()
        .describe("Time taken to complete the analysis in milliseconds")
    }).describe("Metadata about the analysis process and timing")
  }).describe("Complex analysis result with nested structure, detailed findings, and comprehensive metadata")
};