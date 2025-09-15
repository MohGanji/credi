import { test } from 'tap';
import { CredibilityAnalyzer } from '../CredibilityAnalyzer';

test('CredibilityAnalyzer - Configurable Execution Strategies', async (t) => {
  const originalEnv = { ...process.env };

  t.test('Single Model Execution', async (t) => {
    // Set up environment for single execution
    process.env.AGENT_EXECUTION_TYPE = 'single';
    process.env.AGENT_DEFAULT_MODEL = 'claude-3-haiku-20240307';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.MOCK_AGENT_CALL = 'false';
    process.env.CREDIBILITY_ANALYSIS_PROMPT = 'test-analysis-prompt';
    process.env.CREDIBILITY_SCORING_PROMPT = 'test-scoring-prompt';

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(
      config.executionType,
      'single',
      'should be configured for single execution'
    );
    t.equal(config.configured, true, 'should be properly configured');
    t.ok(
      config.configuredModels.includes('claude-3-haiku-20240307'),
      'should include configured model'
    );

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('Consensus Model Execution', async (t) => {
    // Set up environment for consensus execution
    process.env.AGENT_EXECUTION_TYPE = 'consensus';
    process.env.AGENT_MODELS = 'claude-3-haiku-20240307,gpt-4o-mini';
    process.env.AGENT_CONSENSUS_MODEL = 'claude-3-haiku-20240307';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.MOCK_AGENT_CALL = 'false';
    process.env.CREDIBILITY_ANALYSIS_PROMPT = 'test-analysis-prompt';
    process.env.CREDIBILITY_SCORING_PROMPT = 'test-scoring-prompt';

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(
      config.executionType,
      'consensus',
      'should be configured for consensus execution'
    );
    t.equal(config.configured, true, 'should be properly configured');
    t.ok(
      config.configuredModels.includes('claude-3-haiku-20240307'),
      'should include first configured model'
    );
    t.ok(
      config.configuredModels.includes('gpt-4o-mini'),
      'should include second configured model'
    );
    t.equal(
      config.consensusAggregatorModel,
      'claude-3-haiku-20240307',
      'should have correct aggregator model'
    );

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('Fallback Handling', async (t) => {
    // Set up environment with unavailable models
    process.env.AGENT_EXECUTION_TYPE = 'consensus';
    process.env.AGENT_MODELS = 'unavailable-model-1,unavailable-model-2';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    process.env.MOCK_AGENT_CALL = 'false';
    process.env.CREDIBILITY_ANALYSIS_PROMPT = 'test-analysis-prompt';
    process.env.CREDIBILITY_SCORING_PROMPT = 'test-scoring-prompt';

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(
      config.executionType,
      'consensus',
      'should maintain consensus execution type'
    );
    t.equal(
      config.configured,
      true,
      'should still be configured with available models'
    );
    t.ok(
      config.availableModels.includes('claude-3-haiku-20240307'),
      'should fallback to available model'
    );

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('No API Keys Configuration', async (t) => {
    // Remove all API keys
    process.env.AGENT_EXECUTION_TYPE = 'single';
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    process.env.MOCK_AGENT_CALL = 'false';

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(
      config.configured,
      false,
      'should not be configured without API keys'
    );
    t.equal(
      config.availableModels.length,
      0,
      'should have no available models'
    );
    t.equal(
      config.configuredModels.length,
      0,
      'should have no configured models'
    );

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('Mock Mode', async (t) => {
    // Set up mock mode
    process.env.MOCK_AGENT_CALL = 'true';
    // Don't need prompts in mock mode, but set them to avoid configuration errors
    process.env.CREDIBILITY_ANALYSIS_PROMPT = 'mock-analysis-prompt';
    process.env.CREDIBILITY_SCORING_PROMPT = 'mock-scoring-prompt';

    const analyzer = new CredibilityAnalyzer();
    const posts = [
      { content: 'Test post', timestamp: '2024-01-01', links: [] },
    ];
    const profileInfo = {
      username: 'testuser',
      displayName: 'Test User',
      bio: 'Test bio',
      verified: false,
    };

    const result = await analyzer.analyzeProfile(posts, profileInfo);

    t.equal(result.crediScore, 7.4, 'should return calculated mock score');
    t.equal(result.modelUsed, 'mock-model', 'should use mock model');
    t.ok(result.sections.length > 0, 'should have analysis sections');

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('Environment Variable Parsing', async (t) => {
    // Test model list parsing
    process.env.AGENT_EXECUTION_TYPE = 'consensus';
    process.env.AGENT_MODELS =
      'claude-3-haiku-20240307, gpt-4o-mini , gemini-2.5-flash';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.GOOGLE_API_KEY = 'test-google-key';
    process.env.CREDIBILITY_ANALYSIS_PROMPT = 'test-analysis-prompt';
    process.env.CREDIBILITY_SCORING_PROMPT = 'test-scoring-prompt';

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(config.configuredModels.length, 3, 'should parse all three models');
    t.ok(
      config.configuredModels.includes('claude-3-haiku-20240307'),
      'should include claude model'
    );
    t.ok(
      config.configuredModels.includes('gpt-4o-mini'),
      'should include gpt model'
    );
    t.ok(
      config.configuredModels.includes('gemini-2.5-flash'),
      'should include gemini model'
    );
    t.equal(config.promptsConfigured, true, 'should have prompts configured');
    t.equal(config.missingPrompts.length, 0, 'should have no missing prompts');

    // Restore environment
    process.env = { ...originalEnv };
  });

  t.test('Prompt Configuration Validation', async (t) => {
    // Test missing prompts
    process.env.AGENT_EXECUTION_TYPE = 'single';
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    delete process.env.CREDIBILITY_ANALYSIS_PROMPT;
    delete process.env.CREDIBILITY_SCORING_PROMPT;

    const analyzer = new CredibilityAnalyzer();
    const config = analyzer.checkConfiguration();

    t.equal(
      config.configured,
      false,
      'should not be configured without prompts'
    );
    t.equal(
      config.promptsConfigured,
      false,
      'should indicate prompts not configured'
    );
    t.equal(config.missingPrompts.length, 2, 'should have two missing prompts');
    t.ok(
      config.missingPrompts.includes('CREDIBILITY_ANALYSIS_PROMPT'),
      'should include analysis prompt'
    );
    t.ok(
      config.missingPrompts.includes('CREDIBILITY_SCORING_PROMPT'),
      'should include scoring prompt'
    );

    // Restore environment
    process.env = { ...originalEnv };
  });

  // Restore original environment after all tests
  t.teardown(() => {
    process.env = originalEnv;
  });
});
