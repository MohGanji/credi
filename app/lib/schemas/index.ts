/**
 * Centralized export for all Zod schemas used in the application
 * This provides a single import point for structured output validation
 */

export {
  // Main credibility analysis schemas
  CredibilityAnalysisResultSchema,
  OverviewSectionSchema,
  StrengthsSectionSchema,
  CriteriaEvaluationSectionSchema,
  CriteriaEvaluationItemSchema,
  RepresentativePostsSectionSchema,
  RepresentativePostSchema,
  ScoreJustificationSectionSchema,
  
  // TypeScript type exports
  type CredibilityAnalysisResult,
  type OverviewSection,
  type StrengthsSection,
  type CriteriaEvaluationSection,
  type CriteriaEvaluationItem,
  type RepresentativePostsSection,
  type RepresentativePost,
  type ScoreJustificationSection,
  
  // Example usage patterns
  ExampleUsage,
} from './credibility-analysis';