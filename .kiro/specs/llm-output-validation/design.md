# Design Document

## Overview

This design implements simple LLM output validation by extending the existing AgentExecutorService with optional Zod schema validation. The solution uses a straightforward approach with enhanced prompting and basic retry logic, ensuring backward compatibility while adding type safety.

## Approach

We'll implement a simple, uniform approach for all LLM providers:

1. **Enhanced Prompting**: Add JSON schema information to prompts when schema provided
2. **Zod Validation**: Parse and validate responses using provided Zod schema
3. **Simple Retry**: Retry up to 2 times with enhanced prompts on validation failure
4. **Clear Errors**: Throw ValidationError with original response when all retries fail

## Architecture

Add optional Zod schema parameter to existing AgentExecutorService methods. When provided:

1. Enhance prompt with JSON schema information
2. Parse and validate LLM response
3. Retry up to 2 times with enhanced prompts if validation fails
4. Return typed result or throw ValidationError

### Enhanced Interfaces

```typescript
// Add optional schema parameter to existing methods
async executeAgent<T>(
  model: ModelConfig,
  prompt: string,
  config?: AgentConfig,
  schema?: z.ZodSchema<T>
): Promise<AgentResponse & { parsedContent?: T }>

// No changes needed to AgentConfig - use fixed retry count
interface AgentConfig {
  temperature?: number
  maxTokens?: number
  timeout?: number
}
```

## Components and Interfaces

### Enhanced AgentExecutorService

**Core Logic**:

1. If schema provided, enhance prompt with JSON schema
2. Call LLM as usual
3. Try to parse response with Zod
4. If parsing fails, retry up to 2 times with enhanced prompt
5. After 2 failed retries, throw ValidationError

**Internal Helper Methods**:

- `enhancePromptWithSchema(prompt, schema)`: Add JSON schema to prompt
- `parseAndValidate<T>(response, schema)`: Parse JSON and validate with Zod
- `createRetryPrompt(originalPrompt, schema)`: Create simple retry prompt with schema

## Data Models

### Example Usage

```typescript
import { z } from 'zod';

// Define schema
const AnalysisResultSchema = z.object({
  crediScore: z.number().min(0).max(10),
  overview: z.object({
    sampledPosts: z.number(),
    focusAreas: z.array(z.string()),
  }),
});

// Use with service
const result = await agentExecutor.executeAgent(
  model,
  prompt,
  { maxRetries: 2 },
  AnalysisResultSchema
);

// result.parsedContent is now typed as z.infer<typeof AnalysisResultSchema>
```

## Error Handling

### Simple Error Strategy

1. **Retry Failures**: Retry with simple enhanced prompt: "Please return valid JSON matching this schema"
2. **Final Failure**: Throw ValidationError with original response and validation details

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public originalResponse: string,
    public zodError: z.ZodError
  ) {
    super(message);
  }
}
```

## Testing Strategy

### Unit Tests

1. **Schema Conversion Tests**:
   - Zod to JSON Schema conversion
   - Validation accuracy

2. **Validation Service Tests**:
   - Retry logic with mocked failures
   - Error handling scenarios
   - Backward compatibility

### Test Data

```typescript
// Simple test schemas
const SimpleSchema = z.object({ message: z.string() });
const AnalysisSchema = z.object({
  score: z.number(),
  summary: z.string(),
});
```

## Implementation Strategy

### Single Phase Implementation

1. Add Zod dependency to package.json
2. Add optional schema parameter to AgentExecutorService methods
3. Implement simple prompt enhancement with JSON schema
4. Add basic validation and retry logic
5. Update CredibilityAnalyzer to use validated responses

## Integration Points

### CredibilityAnalyzer Integration

```typescript
// Before (current)
const result = await this.agentExecutor.agentConsensus(models, prompt, config);
const analysisContent = result.responses[0]?.content || '';
// Manual parsing with fallback to raw output

// After (with validation)
const result = await this.agentExecutor.agentConsensus(
  models, 
  prompt, 
  config, 
  AnalysisResultSchema
);
const analysisContent = result.parsedContent; // Type-safe, validated result
```

### Backward Compatibility

- All existing method calls continue to work unchanged
- Schema parameter is optional
- When no schema provided, behavior identical to current implementation

## Performance Considerations

- Minimal overhead when schema not provided
- Simple JSON schema generation from Zod
- Fixed retry count (2) keeps latency predictable
