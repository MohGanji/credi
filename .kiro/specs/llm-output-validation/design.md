# Design Document

## Overview

This design implements reliable LLM output validation by extending the existing AgentExecutorService with LangChain's built-in `withStructuredOutput()` method. This approach leverages LangChain's provider-optimized structured output capabilities, which automatically handle function calling, retries, and validation across different LLM providers, ensuring backward compatibility while adding robust type safety.

## Approach

We'll leverage LangChain's official structured output support:

1. **LangChain's `withStructuredOutput()`**: Use built-in method that handles provider-specific optimizations
2. **Well-Documented Zod Schemas**: Create schemas with detailed descriptions to guide LLM responses
3. **Provider Optimization**: Automatic function calling for OpenAI/Anthropic, fallback methods for others
4. **Built-in Retry Logic**: LangChain handles retries and prompt enhancement automatically

## Architecture

Add optional Zod schema parameter to existing AgentExecutorService methods. When provided:

1. Create LangChain model using existing logic
2. Apply `withStructuredOutput(schema)` to get structured model
3. Invoke structured model - LangChain handles validation, retries, and provider optimization
4. Return only the parsed, type-safe data (not AgentResponse)

### Enhanced Interfaces

```typescript
// Method overloads for type safety
async executeAgent<T>(
  model: ModelConfig,
  prompt: string,
  config: AgentConfig | undefined,
  schema: z.ZodSchema<T>
): Promise<T>

async executeAgent(
  model: ModelConfig,
  prompt: string,
  config?: AgentConfig
): Promise<AgentResponse>

// No changes needed to AgentConfig - LangChain handles retry logic
interface AgentConfig {
  temperature?: number
  maxTokens?: number
  timeout?: number
}
```

## Components and Interfaces

### Enhanced AgentExecutorService

**Core Logic**:

1. Create LangChain model using existing `createLangChainModel()` method
2. If schema provided, apply `withStructuredOutput(schema)` to model
3. Invoke structured model with prompt - LangChain handles all validation internally
4. Return only the parsed, type-safe data (guaranteed to match schema type)
5. LangChain automatically handles retries, provider optimization, and error cases

**No Custom Helper Methods Needed**:
- LangChain's `withStructuredOutput()` handles schema conversion, validation, and retries
- Provider-specific optimizations (function calling, JSON mode) handled automatically
- Error handling and retry logic built into LangChain

## Data Models

### Well-Documented Zod Schemas

All Zod schemas must include detailed descriptions to guide LLM responses:

```typescript
import { z } from 'zod';

// Example: Well-documented schema with descriptions
const AnalysisResultSchema = z.object({
  crediScore: z.number()
    .min(0).max(10)
    .describe("Overall credibility score from 0-10, where 0 is completely unreliable and 10 is highly credible"),
  
  overview: z.object({
    sampledPosts: z.number()
      .describe("Total number of posts analyzed from the profile"),
    
    focusAreas: z.array(z.string())
      .describe("List of main topics or themes identified in the analyzed content"),
  }).describe("High-level summary of the analysis scope and focus"),
  
  detailedAnalysis: z.array(
    z.object({
      criterion: z.string()
        .describe("Name of the credibility criterion being evaluated"),
      
      score: z.number().min(0).max(10)
        .describe("Score for this specific criterion from 0-10"),
      
      reasoning: z.string()
        .describe("Detailed explanation of why this score was assigned, with specific examples"),
    })
  ).describe("Breakdown of analysis by individual credibility criteria"),
});

// Use with service - returns typed data directly
const result: z.infer<typeof AnalysisResultSchema> = await agentExecutor.executeAgent(
  model,
  prompt,
  config,
  AnalysisResultSchema
);

// result is fully typed and validated by LangChain
console.log(result.crediScore); // TypeScript knows this is a number
console.log(result.overview.sampledPosts); // TypeScript knows this is a number
```

## Error Handling

### LangChain-Managed Error Handling

LangChain's `withStructuredOutput()` handles most error scenarios automatically:

1. **Validation Failures**: LangChain automatically retries with enhanced prompts
2. **Provider Errors**: LangChain handles provider-specific error cases
3. **Final Failures**: LangChain throws clear errors when all attempts fail

```typescript
// LangChain handles errors internally, but we can catch and wrap them
try {
  const result = await structuredModel.invoke([new HumanMessage(prompt)]);
  return result;
} catch (error) {
  // LangChain provides detailed error information
  throw new Error(`Structured output failed: ${error.message}`);
}
```

## Testing Strategy

### Unit Tests

1. **LangChain Integration Tests**:
   - Test `withStructuredOutput()` with various Zod schemas
   - Verify type safety and parsing accuracy
   - Test error handling when LangChain fails

2. **Schema Documentation Tests**:
   - Verify all schemas include proper descriptions
   - Test that descriptions improve LLM compliance
   - Validate nested object descriptions

### Test Data

```typescript
// Well-documented test schemas
const SimpleSchema = z.object({ 
  message: z.string().describe("A simple text message response") 
});

const ComplexSchema = z.object({
  score: z.number().min(0).max(10)
    .describe("Numerical score from 0 to 10"),
  summary: z.string()
    .describe("Brief summary of the analysis in 1-2 sentences"),
  details: z.array(z.string())
    .describe("List of specific findings or observations")
});
```

## Implementation Strategy

### Single Phase Implementation

1. Add Zod dependency to package.json (already have LangChain)
2. Add optional schema parameter to AgentExecutorService methods
3. Implement LangChain's `withStructuredOutput()` integration
4. Update CredibilityAnalyzer with well-documented schemas
5. Add tests for LangChain integration

## Integration Points

### CredibilityAnalyzer Integration

```typescript
// Before (current)
const result = await this.agentExecutor.agentConsensus(models, prompt, config);
const analysisContent = result.responses[0]?.content || '';
// Manual parsing with fallback to raw output

// After (with LangChain structured output)
const analysisResult: AnalysisResult = await this.agentExecutor.agentConsensus(
  models, 
  prompt, 
  config, 
  AnalysisResultSchema // Well-documented Zod schema
);
// analysisResult is fully typed and guaranteed to match schema
```

### Backward Compatibility

- All existing method calls continue to work unchanged
- Schema parameter is optional
- When no schema provided, behavior identical to current implementation
- LangChain handles all provider differences transparently

## Performance Considerations

- Minimal overhead when schema not provided
- LangChain optimizes per provider (function calling vs JSON mode)
- Built-in retry logic is more efficient than custom implementation
- Well-documented schemas improve first-attempt success rates
