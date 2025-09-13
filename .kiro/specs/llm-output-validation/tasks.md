# Implementation Plan

- [x] 1. Add Zod dependency for schema definitions
  - Add zod package to package.json (LangChain already installed)
  - No need for zod-to-json-schema as LangChain handles schema conversion internally
  - _Requirements: 1.1, 2.1_

- [x] 2. Extend AgentExecutorService with LangChain structured output support
  - Add method overloads to executeAgent and agentConsensus for type safety
  - When schema provided, return parsed type directly (not AgentResponse)
  - When no schema provided, return AgentResponse as before for backward compatibility
  - Implement LangChain's withStructuredOutput() integration for structured responses
  - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3_

- [x] 3. Implement structured output logic using LangChain's built-in capabilities
  - Modify executeAgent to use withStructuredOutput() when schema provided
  - Let LangChain handle provider-specific optimizations (function calling, JSON mode)
  - Return only the parsed, type-safe data when schema is provided
  - Handle LangChain errors and wrap them in clear error messages
  - _Requirements: 1.3, 1.4, 3.1, 3.2, 3.3_

- [x] 4. Create well-documented Zod schemas for credibility analysis
  - Define comprehensive Zod schema for credibility analysis response format
  - Add detailed .describe() calls to all schema fields explaining their purpose
  - Include descriptions for nested objects and arrays to guide LLM responses
  - Create example schema showing proper documentation patterns
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 5. Update CredibilityAnalyzer to use structured output
  - Replace manual JSON parsing with LangChain structured output
  - Use the two main AgentExecutorService methods: executeAgent for single model, executeConsensusWithAggregation for consensus
  - Update analyzeProfile method to pass well-documented Zod schema and receive typed result
  - Remove fallback logic for raw responses in favor of guaranteed typed responses
  - Update error handling to work with LangChain's structured output errors
  - Keep all Zod schemas in the dedicated schemas directory, not inline in service files
  - _Requirements: 1.4, 4.3_

- [x] 6. Implement simple retry mechanism for structured output failures
  - Add configurable retry count (default 3 attempts) to AgentExecutorService methods
  - When structured output fails on retry attempts, add fixed instructions to prompt about JSON format requirements
  - Use simple retry logic without exponential backoff - just retry {count} times immediately
  - Log retry attempts and failure reasons for debugging
  - Fail gracefully after max retries with clear error message to user
  - Apply retry logic to both single model execution and consensus aggregation
  - Keep retry enhancement simple: fixed message about JSON format compliance
  - _Requirements: 1.4, 3.3, 4.3_

- [ ] 7. Update prompts with strict, authoritative language for better compliance
  - Rewrite CREDIBILITY_ANALYSIS_PROMPT with strong, imperative language
  - Add CRITICAL REQUIREMENTS section with MUST/NEVER statements
  - Include explicit warnings about format violations and consequences
  - Use authoritative tone: "You MUST", "NEVER deviate", "CRITICAL", "REQUIRED"
  - Add schema compliance warnings: "Failure to follow this format will result in system errors"
  - Update CREDIBILITY_SCORING_PROMPT with similar strict language
  - Test that stricter prompts improve structured output compliance rates
  - _Requirements: 1.4, 2.2, 3.3_

- [ ] 8. Add comprehensive tests for LangChain integration
  - Write unit tests for AgentExecutorService with various Zod schemas
  - Test that well-documented schemas improve LLM response quality
  - Write integration tests with CredibilityAnalyzer using structured output
  - Test backward compatibility ensuring existing calls work unchanged
  - Test error handling when LangChain structured output fails
  - Test retry mechanism with mock failures and recovery scenarios
  - Test that stricter prompts improve compliance compared to original prompts
  - _Requirements: 2.4, 3.4, 4.3_
