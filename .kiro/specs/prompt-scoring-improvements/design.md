# Design Document

## Overview

This design document outlines the technical approach for implementing improvements to the AI analysis prompt and scoring system. The improvements focus on creating a more accurate, respectful, and user-friendly credibility analysis experience.

## Architecture

The improvements will be implemented across several components:

1. **Schema Layer** (`app/lib/schemas/credibility-analysis.ts`) - Updated data structures
2. **Prompt Templates** (`.env`) - Enhanced AI instructions and output format
3. **Analysis Service** (`app/lib/services/CredibilityAnalyzer.ts`) - Score calculation logic
4. **Data Models** - Updated to support new scoring methodology

## Components and Interfaces

### 1. Criteria-Based Scoring System

#### Individual Criterion Scoring
```typescript
interface CriterionScore {
  criterion: string;
  score: number; // 0-10 with one decimal precision
  status: CriterionStatus;
  evaluation: string;
  examples?: string[];
}

type CriterionStatus = 'exemplary' | 'strong' | 'adequate' | 'weak' | 'concerning' | 'Deceptive';
```

#### Weighted Average Calculation
```typescript
interface ScoringWeights {
  unnecessaryComplexity: number;
  proprietarySelling: number;
  usVsThemFraming: number;
  overselling: number;
  emotionOverData: number;
  lackOfSourcing: number;
  serialContrarian: number;
  guruSyndrome: number;
}

// Default equal weighting (1.0 each), can be adjusted based on importance
const DEFAULT_WEIGHTS: ScoringWeights = {
  unnecessaryComplexity: 1.0,
  proprietarySelling: 1.0,
  usVsThemFraming: 1.0,
  overselling: 1.0,
  emotionOverData: 1.0,
  lackOfSourcing: 1.0,
  serialContrarian: 1.0,
  guruSyndrome: 1.0
};
```

### 2. Respectful Status System

#### Status Level Mapping
```typescript
const STATUS_LEVELS = {
  exemplary: {
    label: 'Exemplary',
    description: 'Sets a positive example for others to follow',
    scoreRange: [9.0, 10.0]
  },
  strong: {
    label: 'Strong',
    description: 'Demonstrates good practices with minor areas for enhancement',
    scoreRange: [7.0, 8.9]
  },
  adequate: {
    label: 'Adequate',
    description: 'Meets basic standards with room for improvement',
    scoreRange: [5.0, 6.9]
  },
  weak: {
    label: 'Weak',
    description: 'Shows some concerning patterns that could be addressed',
    scoreRange: [3.0, 4.9]
  },
  concerning: {
    label: 'Concerning',
    description: 'Exhibits patterns that may impact credibility significantly',
    scoreRange: [1.5, 2.9]
  },
  deceptive: {
    label: 'Deceptive',
    description: 'Contains misleading or deceptive content patterns',
    scoreRange: [0.0, 1.4]
  }
};
```

### 3. Tabular Overview Structure

#### Overview Table Format
```typescript
interface OverviewTable {
  'Sampled Posts': string; // e.g., "12 Posts"
  'Focus Area': string;    // Description of main topics
  'Analysis Date': string; // ISO timestamp
  'Platform': string;      // e.g., "LinkedIn", "Twitter/X"
}
```

### 4. Enhanced Sections Structure

#### Updated Analysis Result Schema
```typescript
interface EnhancedAnalysisResult {
  crediScore: number; // Calculated from weighted average
  overview: OverviewTable;
  criteriaEvaluation: CriterionScore[];
  representativePosts: RepresentativePost[];
  strengths: StrengthsSection;
  weaknesses: WeaknessesSection; // New section
  scoreJustification: ScoreJustificationSection;
}

interface WeaknessesSection {
  'Content Quality'?: string;
  'Source Citations'?: string;
  'Balanced Perspective'?: string;
  'Communication Style'?: string;
  'Evidence Usage'?: string;
}

interface StrengthsSection {
  'Content Quality'?: string;
  'Source Citations'?: string;
  'Balanced Perspective'?: string;
  'Communication Style'?: string;
  'Evidence Usage'?: string;
}
```

## Data Models

### Scoring Calculation Flow

1. **Individual Criterion Analysis**: AI provides score (0-10) and status for each criterion
2. **Weighted Average Calculation**: Apply weights to individual scores
3. **Final Score Precision**: Round to one decimal place
4. **Consensus Aggregation**: For consensus mode, aggregate individual model scores before final calculation

### Score Calculation Formula

```typescript
function calculateWeightedScore(
  criterionScores: CriterionScore[],
  weights: ScoringWeights
): number {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  criterionScores.forEach(criterion => {
    const weight = weights[criterion.criterion as keyof ScoringWeights];
    totalWeightedScore += criterion.score * weight;
    totalWeight += weight;
  });
  
  const finalScore = totalWeightedScore / totalWeight;
  return Math.round(finalScore * 10) / 10; // One decimal precision
}
```

## Error Handling

### Invalid Scores
- If a criterion score is outside 0-10 range, clamp to valid range
- If a criterion is not applicable, exclude from weighted average calculation
- If all criteria are invalid, return a default score with appropriate messaging

### Missing Data
- If individual criterion scores are missing, fall back to overall score estimation
- If consensus data is incomplete, use available model scores for calculation
- If no significant strengths are found, strengths section may be omitted
- If no significant weaknesses are found, weaknesses section may be omitted
- Log warnings for missing or invalid scoring data

## Testing Strategy

As per requirements, no automated testing will be implemented for these changes. Manual user testing will be conducted to verify:

1. Score calculation accuracy with various input scenarios
2. Status level appropriateness and respectful language
3. Overview table formatting and readability
4. Strengths/weaknesses section balance and usefulness
5. Overall analysis flow and user experience

## Implementation Phases

### Phase 1: Schema and Data Structure Updates
- Update `CredibilityAnalysisResultSchema` with new structures
- Add criterion scoring interfaces
- Implement weighted average calculation logic

### Phase 2: Prompt Template Enhancements
- Update `.env` prompt templates with new instructions
- Add respectful language guidelines
- Implement tabular overview format requirements

### Phase 3: Service Layer Integration
- Update `CredibilityAnalyzer` to handle new scoring methodology
- Implement consensus score aggregation
- Add weaknesses section generation aligned with criteria
- Implement optional strengths/weaknesses sections based on content significance

### Phase 4: Output Formatting
- Ensure proper section ordering
- Implement table formatting for overview
- Validate score precision and status mapping

## Performance Considerations

- Weighted average calculation adds minimal computational overhead
- Consensus aggregation may require additional processing but improves accuracy
- Schema changes maintain backward compatibility with existing data
- New sections add content volume but improve analysis quality

## Security and Privacy

- No additional security considerations introduced
- Existing privacy protections remain in place
- Respectful language improvements enhance user experience without compromising functionality