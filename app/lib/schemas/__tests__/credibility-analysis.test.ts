import { test } from 'tap';
import {
  CredibilityAnalysisResultSchema,
  OverviewSectionSchema,
  StrengthsSectionSchema,
  WeaknessesSection,
  CriteriaEvaluationSectionSchema,
  RepresentativePostsSectionSchema,
  ScoreJustificationSectionSchema,
  ExampleUsage,
  type CredibilityAnalysisResult,
} from '../credibility-analysis';

test('OverviewSectionSchema validation', async (t) => {
  const validOverview = {
    'Sampled Posts': '15 Posts',
    'Focus Area': 'Health advice, Nutrition claims, Personal anecdotes',
    'Analysis Date': 'January 15, 2024',
    Platform: 'Twitter/X',
  };

  const result = OverviewSectionSchema.safeParse(validOverview);
  t.ok(result.success, 'Valid overview should pass validation');

  if (result.success) {
    t.equal(
      result.data['Sampled Posts'],
      '15 Posts',
      'Sampled Posts should be preserved'
    );
    t.equal(result.data.Platform, 'Twitter/X', 'Platform should be preserved');
    t.equal(
      result.data['Focus Area'],
      'Health advice, Nutrition claims, Personal anecdotes',
      'Focus Area should be preserved'
    );
  }

  // Test missing required field
  const invalidOverview = {
    'Sampled Posts': '15 Posts',
    // Missing other required fields
  };

  const invalidResult = OverviewSectionSchema.safeParse(invalidOverview);
  t.notOk(invalidResult.success, 'Invalid overview should fail validation');
});

test('StrengthsSectionSchema validation', async (t) => {
  const validStrengths = {
    'Content Quality': 'Demonstrates clear, well-structured analysis',
    'Source Citations':
      'Frequently cites peer-reviewed studies and medical journals',
    'Balanced Perspective':
      'Acknowledges limitations and uncertainties in health advice',
    'Communication Style': 'Uses professional and respectful tone',
    'Evidence Usage': 'Consistently supports claims with research data',
  };

  const result = StrengthsSectionSchema.safeParse(validStrengths);
  t.ok(result.success, 'Valid strengths should pass validation');

  if (result.success) {
    t.equal(
      Object.keys(result.data).length,
      5,
      'Should preserve all strength categories'
    );
    t.ok(
      result.data['Source Citations'],
      'Should preserve source citations strength'
    );
    t.ok(
      result.data['Content Quality'],
      'Should preserve content quality strength'
    );
  }

  // Test empty object (should be valid)
  const emptyStrengths = {};
  const emptyResult = StrengthsSectionSchema.safeParse(emptyStrengths);
  t.ok(emptyResult.success, 'Empty strengths object should be valid');
});

test('WeaknessesSection validation', async (t) => {
  const validWeaknesses = {
    'Content Quality':
      'Some posts could benefit from more structured analysis and clearer organization',
    'Source Citations':
      'Opportunities exist to improve consistency in citing credible sources for health claims',
    'Balanced Perspective':
      'Could enhance credibility by acknowledging limitations and alternative viewpoints more frequently',
    'Communication Style':
      'Occasional use of emotional language where data-driven arguments would be more effective',
    'Evidence Usage':
      'Some claims would benefit from stronger research support and more robust evidence',
  };

  const result = WeaknessesSection.safeParse(validWeaknesses);
  t.ok(result.success, 'Valid weaknesses should pass validation');

  if (result.success) {
    t.equal(
      Object.keys(result.data).length,
      5,
      'Should preserve all weakness categories'
    );
    t.ok(
      result.data['Source Citations'],
      'Should preserve source citations weakness'
    );
    t.ok(
      result.data['Content Quality'],
      'Should preserve content quality weakness'
    );
  }

  // Test empty object (should be valid)
  const emptyWeaknesses = {};
  const emptyResult = WeaknessesSection.safeParse(emptyWeaknesses);
  t.ok(emptyResult.success, 'Empty weaknesses object should be valid');

  // Test partial weaknesses (should be valid)
  const partialWeaknesses = {
    'Source Citations': 'Could improve citation practices',
  };
  const partialResult = WeaknessesSection.safeParse(partialWeaknesses);
  t.ok(partialResult.success, 'Partial weaknesses object should be valid');
});

test('CriteriaEvaluationSectionSchema validation', async (t) => {
  const validCriteria = [
    {
      criterion: 'Unnecessary Complexity',
      score: 8.5,
      status: 'strong' as const,
      evaluation:
        'Uses clear, accessible language when explaining health concepts. This demonstrates good communication practices.',
      examples: [
        'Explains metabolism in simple terms',
        'Avoids medical jargon',
      ],
    },
    {
      criterion: 'Lack of Sourcing',
      score: 6.2,
      status: 'adequate' as const,
      evaluation:
        'Sometimes provides sources but not consistently. There is room for improvement in citation practices.',
    },
  ];

  const result = CriteriaEvaluationSectionSchema.safeParse(validCriteria);
  t.ok(result.success, 'Valid criteria evaluation should pass validation');

  if (result.success) {
    t.equal(result.data.length, 2, 'Should preserve all criteria evaluations');
    t.equal(result.data[0].status, 'strong', 'Should preserve status values');
    t.equal(result.data[0].score, 8.5, 'Should preserve score values');
    t.ok(result.data[0].examples, 'Should preserve examples when provided');
    t.notOk(result.data[1].examples, 'Should handle missing examples');
  }

  // Test invalid status
  const invalidCriteria = [
    {
      criterion: 'Test Criterion',
      score: 5.0,
      status: 'invalid-status',
      evaluation: 'Test evaluation',
    },
  ];

  const invalidResult =
    CriteriaEvaluationSectionSchema.safeParse(invalidCriteria);
  t.notOk(invalidResult.success, 'Invalid status should fail validation');
});

test('RepresentativePostsSectionSchema validation', async (t) => {
  const validPosts = [
    {
      category: 'Health Claim',
      content:
        '[Jan 15, 2024][https://twitter.com/user/status/123456789]\nNew study shows vitamin D deficiency linked to immune issues. Always consult your doctor before supplementing. Source: NEJM 2024',
      reasoning:
        'Demonstrates good sourcing practices and includes appropriate medical disclaimers',
    },
    {
      category: 'Personal Anecdote',
      content:
        '[Jan 10, 2024][]\nMy personal experience with intermittent fasting - results may vary for everyone!',
      reasoning:
        'Shows appropriate caveats about personal experiences not being universal',
    },
  ];

  const result = RepresentativePostsSectionSchema.safeParse(validPosts);
  t.ok(result.success, 'Valid representative posts should pass validation');

  if (result.success) {
    t.equal(result.data.length, 2, 'Should preserve all posts');
    t.equal(
      result.data[0].category,
      'Health Claim',
      'Should preserve post categories'
    );
    t.ok(result.data[0].reasoning, 'Should preserve reasoning for each post');
  }

  // Test missing required field
  const invalidPosts = [
    {
      category: 'Health Claim',
      content: 'Some content',
      // Missing reasoning
    },
  ];

  const invalidResult =
    RepresentativePostsSectionSchema.safeParse(invalidPosts);
  t.notOk(
    invalidResult.success,
    'Missing required fields should fail validation'
  );
});

test('ScoreJustificationSectionSchema validation', async (t) => {
  const validJustification = {
    'Why Not Higher': [
      'Occasional lack of source citations for health claims',
      'Sometimes uses emotional language instead of data-driven arguments',
    ],
    'Why Not Lower': [
      'Generally provides balanced perspectives',
      'Acknowledges limitations in personal anecdotes',
    ],
    'Key Factors': [
      'Strong professional credentials and experience',
      'Inconsistent sourcing practices',
      'Good use of appropriate disclaimers',
    ],
  };

  const result = ScoreJustificationSectionSchema.safeParse(validJustification);
  t.ok(result.success, 'Valid score justification should pass validation');

  if (result.success) {
    t.ok(
      Array.isArray(result.data['Why Not Higher']),
      'Why Not Higher should be an array'
    );
    t.equal(
      result.data['Why Not Higher']?.length,
      2,
      'Should preserve all reasons'
    );
  }

  // Test with only some fields (all are optional)
  const partialJustification = {
    'Key Factors': ['Main factor influencing the score'],
  };

  const partialResult =
    ScoreJustificationSectionSchema.safeParse(partialJustification);
  t.ok(partialResult.success, 'Partial justification should be valid');
});

test('Complete CredibilityAnalysisResultSchema validation', async (t) => {
  const validAnalysis: CredibilityAnalysisResult = {
    crediScore: 7.5,
    overview: {
      'Sampled Posts': '20 Posts',
      'Focus Area': 'Health advice, Nutrition science, Fitness tips',
      'Analysis Date': 'January 15, 2024',
      Platform: 'Twitter/X',
    },
    criteriaEvaluation: [
      {
        criterion: 'Unnecessary Complexity',
        score: 8.0,
        status: 'strong',
        evaluation:
          'Explains complex topics in accessible language with clear examples',
        examples: ['Breaks down metabolism concepts clearly'],
      },
      {
        criterion: 'Lack of Sourcing',
        score: 6.5,
        status: 'adequate',
        evaluation:
          'Usually provides sources but not always. Could improve consistency in citation practices.',
      },
    ],
    representativePosts: [
      {
        category: 'Educational Content',
        content:
          "[Jan 10, 2024][https://twitter.com/user/status/123]\nHere's what the latest research says about protein timing...",
        reasoning: 'Demonstrates evidence-based approach to nutrition advice',
      },
    ],
    strengths: {
      'Source Citations': 'Regularly cites peer-reviewed research',
      'Content Quality': 'Demonstrates clear expertise and structured analysis',
    },
    weaknesses: {
      'Communication Style':
        'Occasional use of overly technical language that could be simplified',
      'Evidence Usage':
        'Some claims could benefit from additional research support',
    },
    scoreJustification: {
      'Key Factors': [
        'Strong scientific background',
        'Generally good sourcing practices',
        'Occasional unsupported claims',
      ],
    },
  };

  const result = CredibilityAnalysisResultSchema.safeParse(validAnalysis);
  t.ok(result.success, 'Complete valid analysis should pass validation');

  if (result.success) {
    t.equal(result.data.crediScore, 7.5, 'Should preserve credibility score');
    t.equal(
      result.data.overview.Platform,
      'Twitter/X',
      'Should preserve nested data'
    );
    t.equal(
      result.data.criteriaEvaluation.length,
      2,
      'Should preserve criteria evaluations'
    );
  }

  // Test invalid score (outside 0-10 range)
  const invalidScoreAnalysis = {
    ...validAnalysis,
    crediScore: 15, // Invalid: outside 0-10 range
  };

  const invalidResult =
    CredibilityAnalysisResultSchema.safeParse(invalidScoreAnalysis);
  t.notOk(invalidResult.success, 'Invalid score should fail validation');
});

test('Schema descriptions are comprehensive', async (t) => {
  // Test that all schemas have descriptions
  t.ok(
    CredibilityAnalysisResultSchema.description,
    'Main schema should have description'
  );
  t.ok(
    OverviewSectionSchema.description,
    'Overview schema should have description'
  );
  t.ok(
    StrengthsSectionSchema.description,
    'Strengths schema should have description'
  );
  t.ok(
    WeaknessesSection.description,
    'Weaknesses schema should have description'
  );
  t.ok(
    CriteriaEvaluationSectionSchema.description,
    'Criteria evaluation schema should have description'
  );
  t.ok(
    RepresentativePostsSectionSchema.description,
    'Representative posts schema should have description'
  );
  t.ok(
    ScoreJustificationSectionSchema.description,
    'Score justification schema should have description'
  );

  // Test that individual fields have descriptions
  const overviewShape = OverviewSectionSchema.shape;
  t.ok(
    overviewShape['Sampled Posts'].description,
    'Sampled Posts field should have description'
  );
  t.ok(
    overviewShape['Focus Area'].description,
    'Focus Area field should have description'
  );
  t.ok(
    overviewShape.Platform.description,
    'Platform field should have description'
  );

  // Test that nested schemas have descriptions
  const mainShape = CredibilityAnalysisResultSchema.shape;
  t.ok(
    mainShape.crediScore.description,
    'crediScore field should have description'
  );
  t.ok(
    mainShape.overview.description,
    'overview field should have description'
  );
});

test('Example usage schemas validation', async (t) => {
  // Test simple example schema
  const validSimpleExample = {
    message: 'This is a test response',
    confidence: 0.85,
    sources: ['https://example.com/source1', 'https://example.com/source2'],
  };

  const simpleResult =
    ExampleUsage.simpleExampleSchema.safeParse(validSimpleExample);
  t.ok(simpleResult.success, 'Valid simple example should pass validation');

  // Test complex example schema
  const validComplexExample = {
    analysis: {
      summary: 'Analysis found several key issues and strengths.',
      details: [
        {
          category: 'Content Quality',
          findings: ['High-quality sourcing', 'Clear explanations'],
          severity: 'low' as const,
        },
        {
          category: 'Technical Issues',
          findings: ['Occasional broken links'],
          severity: 'medium' as const,
        },
      ],
      recommendations: [
        'Improve link maintenance',
        'Continue current sourcing practices',
      ],
    },
    metadata: {
      analysisDate: '2024-01-15T10:30:00Z',
      dataPoints: 150,
      processingTime: 2500,
    },
  };

  const complexResult =
    ExampleUsage.complexExampleSchema.safeParse(validComplexExample);
  t.ok(complexResult.success, 'Valid complex example should pass validation');

  if (complexResult.success) {
    t.equal(
      complexResult.data.analysis.details.length,
      2,
      'Should preserve all detail categories'
    );
    t.equal(
      complexResult.data.metadata.dataPoints,
      150,
      'Should preserve metadata'
    );
  }
});

test('Type inference works correctly', async (t) => {
  // This test verifies that TypeScript types are correctly inferred
  const analysis: CredibilityAnalysisResult = {
    crediScore: 8.0,
    overview: {
      'Sampled Posts': '25 Posts',
      'Focus Area': 'Science communication, Research analysis',
      'Analysis Date': 'January 15, 2024',
      Platform: 'Twitter/X',
    },
    criteriaEvaluation: [
      {
        criterion: 'Lack of Sourcing',
        score: 9.2,
        status: 'exemplary',
        evaluation:
          'Consistently provides high-quality sources and sets a positive example for evidence-based communication',
      },
    ],
    representativePosts: [
      {
        category: 'Research Summary',
        content:
          '[Jan 12, 2024][https://twitter.com/user/status/456]\nNew meta-analysis shows...',
        reasoning: 'Exemplifies evidence-based communication style',
      },
    ],
    strengths: {
      'Source Citations': 'Always provides peer-reviewed sources',
    },
    scoreJustification: {
      'Key Factors': [
        'Exceptional sourcing quality',
        'Clear communication style',
      ],
    },
  };

  // If this compiles without TypeScript errors, the type inference is working
  t.equal(
    typeof analysis.crediScore,
    'number',
    'crediScore should be typed as number'
  );
  t.equal(
    typeof analysis.overview['Sampled Posts'],
    'string',
    'Overview fields should be typed as string'
  );
  t.ok(
    Array.isArray(analysis.criteriaEvaluation),
    'criteriaEvaluation should be typed as array'
  );
  t.ok(
    Array.isArray(analysis.representativePosts),
    'representativePosts should be typed as array'
  );
});

test('Optional strengths and weaknesses sections', async (t) => {
  // Test analysis without strengths section
  const analysisWithoutStrengths: CredibilityAnalysisResult = {
    crediScore: 5.0,
    overview: {
      'Sampled Posts': '10 Posts',
      'Focus Area': 'General content',
      'Analysis Date': 'January 15, 2024',
      Platform: 'Twitter/X',
    },
    criteriaEvaluation: [
      {
        criterion: 'Unnecessary Complexity',
        score: 5.0,
        status: 'adequate',
        evaluation: 'Average complexity level',
      },
    ],
    representativePosts: [
      {
        category: 'General',
        content: '[Jan 10, 2024][]\nGeneral post content',
        reasoning: 'Representative of overall content quality',
      },
    ],
    weaknesses: {
      'Content Quality': 'Could improve structure and clarity',
    },
    scoreJustification: {
      'Key Factors': ['Average content quality'],
    },
  };

  const resultWithoutStrengths = CredibilityAnalysisResultSchema.safeParse(
    analysisWithoutStrengths
  );
  t.ok(
    resultWithoutStrengths.success,
    'Analysis without strengths should be valid'
  );

  // Test analysis without weaknesses section
  const analysisWithoutWeaknesses: CredibilityAnalysisResult = {
    crediScore: 9.0,
    overview: {
      'Sampled Posts': '15 Posts',
      'Focus Area': 'High-quality content',
      'Analysis Date': 'January 15, 2024',
      Platform: 'LinkedIn',
    },
    criteriaEvaluation: [
      {
        criterion: 'Lack of Sourcing',
        score: 9.0,
        status: 'exemplary',
        evaluation: 'Excellent sourcing practices',
      },
    ],
    representativePosts: [
      {
        category: 'Educational',
        content: '[Jan 10, 2024][]\nHigh-quality educational content',
        reasoning: 'Demonstrates excellent practices',
      },
    ],
    strengths: {
      'Source Citations': 'Consistently provides excellent sources',
    },
    scoreJustification: {
      'Key Factors': ['Exceptional content quality'],
    },
  };

  const resultWithoutWeaknesses = CredibilityAnalysisResultSchema.safeParse(
    analysisWithoutWeaknesses
  );
  t.ok(
    resultWithoutWeaknesses.success,
    'Analysis without weaknesses should be valid'
  );

  // Test analysis without both strengths and weaknesses
  const analysisWithoutBoth: CredibilityAnalysisResult = {
    crediScore: 6.0,
    overview: {
      'Sampled Posts': '12 Posts',
      'Focus Area': 'Mixed content',
      'Analysis Date': 'January 15, 2024',
      Platform: 'Twitter/X',
    },
    criteriaEvaluation: [
      {
        criterion: 'Unnecessary Complexity',
        score: 6.0,
        status: 'adequate',
        evaluation: 'Adequate complexity level',
      },
    ],
    representativePosts: [
      {
        category: 'Mixed',
        content: '[Jan 10, 2024][]\nMixed quality content',
        reasoning: 'Representative of overall patterns',
      },
    ],
    scoreJustification: {
      'Key Factors': ['Mixed content quality'],
    },
  };

  const resultWithoutBoth =
    CredibilityAnalysisResultSchema.safeParse(analysisWithoutBoth);
  t.ok(
    resultWithoutBoth.success,
    'Analysis without both strengths and weaknesses should be valid'
  );
});
