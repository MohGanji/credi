# Zod Schemas for LLM Structured Output

This directory contains well-documented Zod schemas designed to guide LLM responses for reliable structured output validation using LangChain's `withStructuredOutput()` method.

## Key Principles

### 1. Comprehensive Field Descriptions
Every schema field includes detailed `.describe()` calls that:
- Explain the field's purpose and expected content
- Provide examples of valid values
- Guide the LLM on how to populate the field correctly
- Specify formats, ranges, and constraints

### 2. Nested Object Documentation
Complex nested structures include descriptions at multiple levels:
- Top-level schema describes the overall purpose
- Individual fields explain their specific role
- Nested objects have their own comprehensive descriptions

### 3. LLM-Friendly Guidance
Descriptions are written to help LLMs understand:
- What information to extract or generate
- How to format the response appropriately
- What level of detail is expected
- How different fields relate to each other

## Usage Examples

### Basic Usage with LangChain

```typescript
import { CredibilityAnalysisResultSchema } from './schemas';
import { AgentExecutorService } from '../services/AgentExecutorService';

// Use with structured output - returns typed data directly
const result: CredibilityAnalysisResult = await agentExecutor.executeAgent(
  model,
  prompt,
  config,
  CredibilityAnalysisResultSchema
);

// Result is fully typed and validated
console.log(result.crediScore); // TypeScript knows this is a number 0-10
console.log(result.overview['Sampled Posts']); // TypeScript knows this is a string
```

### Schema Documentation Best Practices

```typescript
// ✅ Good: Detailed, specific descriptions
const GoodSchema = z.object({
  score: z.number()
    .min(0)
    .max(10)
    .describe("Credibility score from 0-10, where 0 is completely unreliable and 10 is highly credible"),
  
  reasoning: z.string()
    .describe("Detailed explanation of the score with specific examples from the analyzed content")
});

// ❌ Bad: Vague or missing descriptions
const BadSchema = z.object({
  score: z.number(), // No description
  reasoning: z.string().describe("The reasoning") // Too vague
});
```

### Complex Nested Schemas

```typescript
const WellDocumentedSchema = z.object({
  analysis: z.object({
    findings: z.array(
      z.object({
        category: z.string()
          .describe("Category name for this finding (e.g., 'Source Quality', 'Communication Style')"),
        
        details: z.array(z.string())
          .describe("Specific observations within this category, each as a separate detailed point"),
        
        impact: z.enum(['positive', 'neutral', 'negative'])
          .describe("Overall impact on credibility: 'positive' improves trust, 'neutral' has no effect, 'negative' reduces trust")
      }).describe("Individual finding with categorized details and credibility impact assessment")
    ).describe("Comprehensive list of all findings organized by category with impact analysis")
  }).describe("Complete analysis breakdown with categorized findings and impact assessments")
}).describe("Full analysis result with structured findings and credibility impact evaluation");
```

## Available Schemas

### CredibilityAnalysisResultSchema
Complete schema for credibility analysis results including:
- Overall credibility score (0-10)
- Overview section with analysis metadata
- Strengths section highlighting positive indicators
- Criteria evaluation with detailed assessments
- Representative posts with examples
- Score justification with reasoning

### Individual Section Schemas
- `OverviewSectionSchema` - Analysis metadata and context
- `StrengthsSectionSchema` - Positive credibility indicators
- `CriteriaEvaluationSectionSchema` - Detailed criterion assessments
- `RepresentativePostsSectionSchema` - Example posts with analysis
- `ScoreJustificationSectionSchema` - Score reasoning and factors

### Example Schemas
- `ExampleUsage.simpleExampleSchema` - Basic response format
- `ExampleUsage.complexExampleSchema` - Advanced nested structure

## Testing

All schemas include comprehensive tests that verify:
- Valid data passes validation
- Invalid data fails appropriately
- Type inference works correctly
- All fields have proper descriptions
- Nested structures validate properly

Run tests with:
```bash
npm test -- app/lib/schemas/__tests__/credibility-analysis.test.ts
```

## Integration with LangChain

These schemas are designed to work seamlessly with LangChain's structured output:

1. **Provider Optimization**: LangChain automatically uses the best method for each provider (function calling, JSON mode, etc.)
2. **Automatic Retries**: LangChain handles validation failures and retries with enhanced prompts
3. **Type Safety**: Schemas provide full TypeScript type inference
4. **Error Handling**: Clear error messages when validation fails

The detailed descriptions in these schemas help LLMs understand exactly what's expected, improving first-attempt success rates and reducing the need for retries.