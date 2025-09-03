// Analysis section data types for type safety

// Overview section data
export interface OverviewSectionData {
  "Sampled Posts": string;
  "Focus Areas": string;
  "Analysis Date": string;
  "Platform": string;
  "Profile Status": string;
  [key: string]: string; // Allow additional string fields
}

// Strengths section data
export interface StrengthsSectionData {
  [strengthName: string]: string; // Each strength is a key-value pair
}

// Criteria evaluation result
export interface CriteriaEvaluation {
  status: "pass" | "warning" | "fail";
  evaluation: string;
  examples?: string[];
}

// Criteria evaluation section data
export interface CriteriaEvaluationSectionData {
  "Unnecessary Complexity": CriteriaEvaluation;
  "Proprietary/Pushy Selling": CriteriaEvaluation;
  "Us vs. Them Framing": CriteriaEvaluation;
  "Overselling Narrow Interventions": CriteriaEvaluation;
  "Emotion/Story vs Data": CriteriaEvaluation;
  "Lack of Sourcing": CriteriaEvaluation;
  "Serial Contrarian": CriteriaEvaluation;
  "Guru Syndrome": CriteriaEvaluation;
  [criteriaName: string]: CriteriaEvaluation; // Allow additional criteria
}

// Representative post
export interface RepresentativePost {
  content: string;
  timestamp: string;
  url: string;
  reasoning: string;
}

// Representative posts section data
export interface RepresentativePostsSectionData {
  "Recent Highlights"?: RepresentativePost[];
  "High Quality Posts"?: RepresentativePost[];
  "Concerning Posts"?: RepresentativePost[];
  [categoryName: string]: RepresentativePost[] | undefined; // Allow additional categories
}

// Score justification section data
export interface ScoreJustificationSectionData {
  "Why Not Higher"?: string[];
  "Why Not Lower"?: string[];
  "Key Factors"?: string[];
  [justificationCategory: string]: string[] | undefined; // Allow additional justification categories
}

// Union type for all possible section data types
export type SectionData = 
  | OverviewSectionData
  | StrengthsSectionData
  | CriteriaEvaluationSectionData
  | RepresentativePostsSectionData
  | ScoreJustificationSectionData;

// Typed analysis section
export interface AnalysisSection {
  name: string;
  data: SectionData;
}

// Specific section types for better type checking
export interface OverviewSection extends AnalysisSection {
  name: "overview";
  data: OverviewSectionData;
}

export interface StrengthsSection extends AnalysisSection {
  name: "strengths";
  data: StrengthsSectionData;
}

export interface CriteriaEvaluationSection extends AnalysisSection {
  name: "criteria_evaluation";
  data: CriteriaEvaluationSectionData;
}

export interface RepresentativePostsSection extends AnalysisSection {
  name: "representative_posts";
  data: RepresentativePostsSectionData;
}

export interface ScoreJustificationSection extends AnalysisSection {
  name: "score_justification";
  data: ScoreJustificationSectionData;
}

// Union type for all specific section types
export type TypedAnalysisSection = 
  | OverviewSection
  | StrengthsSection
  | CriteriaEvaluationSection
  | RepresentativePostsSection
  | ScoreJustificationSection;