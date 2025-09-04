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
  criterion: string;
  status: "pass" | "warning" | "fail";
  evaluation: string;
  examples?: string[];
}

// Criteria evaluation section data (now an array for table rendering)
export type CriteriaEvaluationSectionData = CriteriaEvaluation[];

// Representative post
export interface RepresentativePost {
  category: string;
  content: string;
  timestamp: string;
  url: string;
  reasoning: string;
}

// Representative posts section data (now an array for table rendering)
export type RepresentativePostsSectionData = RepresentativePost[];

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
  | ScoreJustificationSectionData
  | Record<string, any>; // Allow any structure for flexibility

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