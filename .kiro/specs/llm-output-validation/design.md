# Design Document

## Overview

This design implements robust LLM output validation by extending the existing AgentExecutorService with optional schema validation capabilities. The solution leverages existing libraries where possible and provides seamless integration through optional parameters, ensuring backward compatibility while adding powerful type safety and retry mechanisms.

## Research Findings

### Existing Libraries Analysis

**LangChain Output Parsers:**
- `@langchain/core/output_parsers` provides structured output parsing
- `PydanticOutputParser` and `StructuredOutputParser` available but require Python-style schemas
- `JsonOutputParser` provides basic JSON validation
- Limited TypeScript/Zod integration

**Instructor Library:**
- Popular Python library for structured LLM outputs
- No official TypeScript/JavaScript version
- Concept: Use function calling or structured prompts with validation

**Zod Integration Options:**
- `zod-to-json-schema` converts Zod schemas to JSON Schema for prompt generation
- `@langchain/core` has some Zod integration but limited
- Custom integration needed for full TypeScript support

**LangChain Function Calling:**
- OpenAI and Anthropic support function calling with JSON schemas
- Can enforce structured outputs at the model level
- Better reliability than prompt-based approaches

### Recommended Approach

Based on research, we'll implement a hybrid approach:
1. **Primary**: Use LangChain's function calling when available (OpenAI, Anthropic)
2. **Fallback**: Enhanced prompting with Zod validation for other providers
3. **Integration**: Custom wrapper that provides unified interface

## Architecture

### Simple Approach

Add optional Zod schema parameter to existing AgentExecutorService methods. When provided:
1. Enhance prompt with JSON schema information
2. Parse and validate LLM response
3. Retry with better prompts if validation fails
4. Return typed result or throw clear error

### Enhanced Interfaces

```typescript
// Add optional schema parameter to existing methods
async executeAgent<T>(
  model: ModelConfig,
  prompt: string,
  config?: AgentConfig,
  schema?: z.ZodSchema<T>
): Promise<AgentResponse & { parsedContent?: T }>

// Simple validation config
interface AgentConfig {
  temperature?: number
  maxTokens?: number
  timeout?: number
  maxRetries?: number  // New: for validation retries (default: 2)
}
```

## Components and Interfaces

### Enhanced AgentExecutorService

**Core Logic**:
1. If schema provided, enhance prompt with JSON schema
2. Call LLM as usual
3. Try to parse response with Zod
4. If parsing fails, retry with enhanced error-specific prompt
5. After max retries, throw validation error

**Internal Helper Methods**:
- `enhancePromptWithSchema(prompt, schema)`: Add JSON schema to prompt
- `parseAndValidate<T>(response, schema)`: Parse JSON and validate with Zod
- `createRetryPrompt(originalPrompt, schema, error)`: Create better prompt for retry

## Data Models

### Example Usage

```typescript
import { z } from 'zod'

// Define schema
const AnalysisResultSchema = z.object({
  crediScore: z.number().min(0).max(10),
  overview: z.object({
    sampledPosts: z.number(),
    focusAreas: z.array(z.string())
  })
})

// Use with service
const result = await agentExecutor.executeAgent(
  model,
  prompt,
  { maxRetries: 2 },
  AnalysisResultSchema
)

// result.parsedContent is now typed as z.infer<typeof AnalysisResultSchema>
```

## Error Handling

### Simple Error Strategy

1. **First Failure**: Retry with validation errors added to prompt
2. **Final Failure**: Throw clear error with original response and validation details

```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public originalResponse: string,
    public zodError: z.ZodError
  ) {
    super(message)
  }
}
```

## Testing Strategy

### Unit Tests

1. **Schema Adapter Tests**:
   - Zod to JSON Schema conversion
   - Function call schema generation
   - Validation accuracy

2. **Validation Service Tests**:
   - Retry logic with mocked failures
   - Prompt enhancement effectiveness
   - Error handling scenarios

3. **Integration Tests**:
   - End-to-end validation with real models
   - Performance impact measurement
   - Backward compatibility verification

### Test Data

```typescript
// Test schemas of varying complexity
const SimpleSchema = z.object({ message: z.string() })
const ComplexSchema = z.object({
  analysis: z.object({
    score: z.number(),
    details: z.array(z.object({
      criterion: z.string(),
      evaluation: z.enum(['pass', 'fail']),
      reasoning: z.string()
    }))
  })
})
```

## Implementation Strategy

### Single Phase Implementation
1. Add Zod dependency to package.json
2. Add optional schema parameter to AgentExecutorService methods
3. Implement prompt enhancement with JSON schema
4. Add validation and retry logic
5. Update CredibilityAnalyzer to use validated responses

## Integration Points

### CredibilityAnalyzer Integration

```typescript
// Before (current)
const result = await this.agentExecutor.agentConsensus(models, prompt, config)
const analysisContent = result.responses[0]?.content || ''
// Manual parsing with fallback to raw output

// After (with validation)
const result = await this.agentExecutor.agentConsensus(
  models, 
  prompt, 
  config,
  { zodSchema: AnalysisResultSchema, description: 'Credibility analysis result' }
)
const analysisContent = result.validatedResponses?.[0] // Type-safe, validated result
```

### Backward Compatibility

- All existing method calls continue to work unchanged
- Schema parameter is optional
- When no schema provided, behavior identical to current implementation
- Gradual migration path for existing code

## Performance Considerations

- Minimal overhead when schema not provided (backward compatibility)
- Simple JSON schema generation from Zod (no caching needed initially)
- Retry logic adds latency but improves reliability