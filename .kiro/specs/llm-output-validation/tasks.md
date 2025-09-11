# Implementation Plan

- [ ] 1. Add Zod dependency and setup validation infrastructure
  - Add zod and zod-to-json-schema packages to package.json
  - Create utility functions for converting Zod schemas to JSON Schema format
  - Add ValidationError class for structured error handling
  - _Requirements: 3.1, 4.1, 4.3_

- [ ] 2. Extend AgentExecutorService with optional schema validation
  - Add optional generic schema parameter to executeAgent method signature
  - Add optional generic schema parameter to agentConsensus method signature
  - Implement backward compatibility ensuring existing calls work unchanged
  - _Requirements: 1.1, 7.1, 7.2_

- [ ] 3. Implement prompt enhancement with schema information
  - Create function to convert Zod schema to JSON Schema string
  - Create function to enhance prompts with schema requirements and format instructions
  - Add clear JSON formatting instructions to enhanced prompts
  - _Requirements: 5.1, 5.2_

- [ ] 4. Add response parsing and validation logic
  - Implement JSON extraction from LLM responses (handle markdown code blocks)
  - Add Zod schema validation with detailed error reporting
  - Create structured validation error messages for debugging
  - _Requirements: 1.2, 4.3_

- [ ] 5. Implement retry mechanism with enhanced prompting
  - Add retry logic that enhances prompts with validation error details on failures
  - Implement configurable maxRetries parameter in AgentConfig
  - Add retry attempt logging for monitoring and debugging
  - _Requirements: 1.3, 2.1, 5.3, 6.1_

- [ ] 6. Add comprehensive error handling and logging
  - Throw ValidationError with original response and Zod errors when all retries fail
  - Add detailed logging for validation attempts, failures, and successes
  - Ensure error messages provide actionable debugging information
  - _Requirements: 1.4, 6.2, 6.3, 7.4_

- [ ] 7. Update CredibilityAnalyzer to use validated responses
  - Define Zod schema for credibility analysis response format
  - Update analyzeProfile method to use schema validation
  - Remove manual JSON parsing and fallback logic in favor of validated responses
  - Update error handling to use ValidationError instead of raw response fallback
  - _Requirements: 1.1, 1.4_

- [ ] 8. Add comprehensive tests for validation functionality
  - Write unit tests for schema conversion utilities
  - Write unit tests for prompt enhancement functions
  - Write unit tests for validation and retry logic with mocked LLM responses
  - Write integration tests with real schemas and validation scenarios
  - _Requirements: 4.4, 6.4_
