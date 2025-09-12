# Implementation Plan

- [ ] 1. Add Zod dependency and setup validation infrastructure
  - Add zod and zod-to-json-schema packages to package.json
  - Create utility function for converting Zod schemas to JSON Schema format
  - Add ValidationError class for structured error handling
  - _Requirements: 1.1, 2.1, 2.4_

- [ ] 2. Extend AgentExecutorService with optional schema validation
  - Add optional generic schema parameter to executeAgent method signature
  - Add optional generic schema parameter to agentConsensus method signature
  - Implement backward compatibility ensuring existing calls work unchanged
  - _Requirements: 1.1, 4.1, 4.2_

- [ ] 3. Implement simple prompt enhancement with schema information
  - Create function to convert Zod schema to JSON Schema string
  - Create function to enhance prompts with schema requirements
  - Add simple JSON formatting instructions to enhanced prompts
  - _Requirements: 3.1, 3.2_

- [ ] 4. Add response parsing and validation logic
  - Implement JSON extraction from LLM responses (handle markdown code blocks)
  - Add Zod schema validation with clear error reporting
  - Create ValidationError with original response and validation details
  - _Requirements: 1.2, 2.3, 2.4_

- [ ] 5. Implement simple retry mechanism
  - Add retry logic with fixed 2 retry attempts on validation failures
  - Enhance retry prompts with simple "return valid JSON" instruction
  - Add basic logging for validation failures
  - _Requirements: 1.3, 3.3_

- [ ] 6. Update CredibilityAnalyzer to use validated responses
  - Define Zod schema for credibility analysis response format
  - Update analyzeProfile method to use schema validation
  - Remove manual JSON parsing and fallback logic in favor of validated responses
  - Update error handling to use ValidationError instead of raw response fallback
  - _Requirements: 1.1, 4.4_

- [ ] 7. Add basic tests for validation functionality
  - Write unit tests for schema conversion utilities
  - Write unit tests for validation and retry logic with mocked LLM responses
  - Write integration test with CredibilityAnalyzer using real schema
  - Test backward compatibility with existing AgentExecutorService calls
  - _Requirements: 2.2, 4.3_
