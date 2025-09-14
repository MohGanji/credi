# Requirements Document

## Introduction

This specification outlines improvements to the AI analysis prompt and scoring system to enhance accuracy, user experience, and respectful communication. The improvements focus on creating a more precise scoring methodology, improving user-facing language, and restructuring the analysis output for better readability.

## Requirements

### Requirement 1: Criteria-Based Scoring System

**User Story:** As a user analyzing social media profiles, I want the credibility score to be calculated based on individual criterion scores so that the final score is more transparent and accurate.

#### Acceptance Criteria

1. WHEN the AI analyzes a profile THEN it SHALL provide a numerical score (0-10) for each of the 8 credibility criteria
2. WHEN individual criterion scores are provided THEN the system SHALL calculate a weighted average to determine the final credibility score
3. WHEN the final score is calculated THEN it SHALL be displayed with precision of at most one decimal point (e.g., 8.1)
4. WHEN using consensus mode THEN the system SHALL aggregate individual model scores for each criterion before calculating the final weighted average
5. IF a criterion is not applicable to the content THEN the system SHALL handle it appropriately in the scoring calculation

### Requirement 2: Respectful Status Classifications

**User Story:** As a content creator whose profile is being analyzed, I want the evaluation language to be respectful and constructive so that I feel encouraged to improve rather than criticized.

#### Acceptance Criteria

1. WHEN evaluating criteria THEN the system SHALL use a 5-level status classification instead of pass/warning/fail
2. WHEN displaying status levels THEN they SHALL range from "Exemplary" (highest) to "Concerning" and then "Deceptive" (lowest)
3. WHEN providing evaluations THEN the language SHALL be first informative, then possibly constructive and educational rather than purely judgmental
4. WHEN a profile performs well on a criterion THEN it SHALL be recognized as setting a positive example
5. WHEN a profile has issues THEN the feedback SHALL focus on awareness and improvement opportunities

### Requirement 3: Tabular Overview Section

**User Story:** As a user reviewing analysis results, I want the overview information presented in a clear table format so that I can quickly understand the key details about the analysis.

#### Acceptance Criteria

1. WHEN displaying the overview section THEN it SHALL be formatted as a table with Topic and Value columns
2. WHEN showing analysis metadata THEN it SHALL include Sampled Posts, Focus Area, Analysis Date, and Platform
3. WHEN displaying the overview THEN it SHALL NOT include Profile Status as this field is not useful
4. WHEN presenting table headers THEN they SHALL be user-friendly and properly formatted
5. WHEN showing values THEN they SHALL be clearly formatted and easy to read

### Requirement 4: Weaknesses Section Addition

**User Story:** As a user analyzing profiles, I want to see both strengths and weaknesses clearly identified so that I have a balanced view of the profile's credibility patterns.

#### Acceptance Criteria

1. WHEN analyzing a profile THEN the system SHALL provide both a Strengths and Weaknesses section
2. WHEN displaying weaknesses THEN they SHALL cover similar topics to strengths and aligned with the criteria but focus on areas for improvement
3. WHEN presenting weaknesses THEN the language SHALL be informative, then constructive and educational
4. WHEN organizing the analysis THEN Strengths and Weaknesses sections SHALL be positioned after Representative Posts
5. WHEN no significant weaknesses are found THEN the section is optional. Similarly for strengths

### Requirement 5: Improved Section Organization

**User Story:** As a user reading analysis results, I want the information organized logically so that I can follow the analysis flow from examples to evaluation to summary.

#### Acceptance Criteria

1. WHEN displaying analysis results THEN the section order SHALL be: Overview, Criteria Evaluation, Representative Posts, Strengths, Weaknesses, Score Justification
2. WHEN presenting the analysis THEN each section SHALL have clear separation and appropriate headings
3. WHEN organizing content THEN the flow SHALL move from detailed evaluation to examples to summary insights
4. WHEN displaying sections THEN they SHALL maintain consistent formatting and structure
5. WHEN users navigate the analysis THEN the logical flow SHALL enhance comprehension and usability