# Implementation Plan

## Task Overview

This implementation plan converts the prompt and scoring system improvements into discrete, manageable coding tasks. Each task focuses on specific components and can be implemented incrementally.

- [x] 1. Implement Criteria-Based Scoring System
  - Update schema to include individual criterion scores with 6-level status system (Exemplary → Strong → Adequate → Weak → Concerning → Deceptive)
  - Implement weighted average calculation logic for final score precision
  - Add consensus score aggregation for multiple model scenarios
  - Ensure evaluation language is informative first, then constructive and educational
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Update Overview Section to Tabular Format
  - Convert overview section from object format to table structure
  - Remove Profile Status field as it serves no purpose
  - Update prompt template to generate table-formatted overview data
  - Ensure user-friendly headers and proper value formatting
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3. Add Weaknesses Section and Reorganize Analysis Structure
  - Create new weaknesses section schema aligned with criteria and using informative, then constructive language
  - Make both strengths and weaknesses sections optional when not significant
  - Reorder analysis sections: Overview, Criteria Evaluation, Representative Posts, Strengths, Weaknesses, Score Justification
  - Update prompt templates to generate balanced strengths and weaknesses content aligned with the 8 criteria
  - Ensure consistent formatting and logical flow between sections
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_