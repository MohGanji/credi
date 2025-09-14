'use client';

import AnalysisVisualizer from '../components/AnalysisVisualizer';
import { AnalysisSection } from '../lib/types/analysis';

export default function TestVisualizerPage() {
  // Test data with various structures to demonstrate flexible rendering
  const testSections: AnalysisSection[] = [
    {
      name: 'overview',
      data: {
        'Sampled Posts': '50',
        'Analysis Date': '2025-01-09',
        Platform: 'Twitter/X',
        'Profile Status': 'Active and Verified',
        'Average Engagement': '125 interactions per post',
      },
    },
    {
      name: 'strengths',
      data: {
        'Content Quality':
          'Consistently provides well-researched insights with proper citations',
        Engagement: 'Strong community interaction with thoughtful responses',
        Expertise: 'Demonstrates deep knowledge in stated areas of focus',
        Transparency: 'Clear about limitations and acknowledges when uncertain',
      },
    },
    {
      name: 'criteria_evaluation',
      data: [
        {
          criterion: 'Unnecessary Complexity',
          status: 'pass',
          evaluation:
            'Uses clear, accessible language appropriate for the platform audience',
          examples: [
            'Explains technical concepts in simple terms',
            'Avoids jargon when possible',
          ],
        },
        {
          criterion: 'Proprietary Selling',
          status: 'warning',
          evaluation:
            'Occasional promotion of own products, but balanced with value-driven content',
          examples: [
            '2 out of 50 posts mention paid courses',
            'Always provides free value alongside promotions',
          ],
        },
        {
          criterion: 'Emotional Manipulation',
          status: 'fail',
          evaluation:
            'Frequently uses fear-based messaging to drive engagement',
          examples: [
            "'This ONE mistake will DESTROY your career'",
            "'Everyone is doing this WRONG'",
          ],
        },
      ],
    },
    {
      name: 'representative_posts',
      data: [
        {
          category: 'High Quality Posts',
          content:
            'Great analysis of the new React features. The concurrent rendering improvements are game-changing for UX.',
          timestamp: '2025-01-08',
          url: 'https://twitter.com/example/status/123',
          reasoning: 'Shows technical depth and balanced perspective',
        },
        {
          category: 'High Quality Posts',
          content:
            "Sharing my experience with microservices migration. Here's what worked and what didn't...",
          timestamp: '2025-01-07',
          url: 'https://twitter.com/example/status/124',
          reasoning: 'Provides practical insights from real experience',
        },
        {
          category: 'Concerning Posts',
          content:
            'URGENT: This coding practice will RUIN your career! Everyone is doing it wrong!',
          timestamp: '2025-01-06',
          url: 'https://twitter.com/example/status/125',
          reasoning: 'Uses fear-based language and absolute statements',
        },
      ],
    },
    {
      name: 'score_justification',
      data: {
        'Why Not Higher': [
          'Occasional use of sensationalized language in headlines',
          'Some posts lack external citations for claims made',
          'Tendency to present personal opinions as universal truths',
        ],
        'Why Not Lower': [
          'Generally provides valuable, actionable content',
          'Demonstrates genuine expertise in stated areas',
          'Engages constructively with community feedback',
          'Acknowledges mistakes and corrections when pointed out',
        ],
        'Key Factors': [
          'Strong technical knowledge base',
          'Active community engagement',
          'Mix of educational and promotional content',
          'Occasional lapses in sourcing standards',
        ],
      },
    },
    {
      name: 'engagement_metrics',
      data: {
        'Average Likes': 245,
        'Average Retweets': 67,
        'Average Comments': 23,
        'Engagement Rate': '4.2%',
        'Peak Posting Hours': ['9 AM', '2 PM', '7 PM'],
        'Most Engaging Content Types': [
          'Technical tutorials',
          'Industry insights',
          'Personal experiences',
        ],
      },
    },
    {
      name: 'content_analysis',
      data: {
        'Topics Covered': [
          'Web Development',
          'React/JavaScript',
          'Software Architecture',
          'Career Advice',
          'Industry Trends',
        ],
        'Posting Frequency': 'Daily',
        'Content Mix': {
          Educational: '60%',
          Personal: '25%',
          Promotional: '10%',
          'Industry News': '5%',
        },
        'External Links': {
          Frequency: '30% of posts',
          Quality: 'High - mostly to reputable sources',
          Types: [
            'Documentation',
            'Research papers',
            'Industry reports',
            'Personal blog',
          ],
        },
      },
    },
    {
      name: 'comparison_table',
      data: [
        {
          Metric: 'Follower Count',
          'This Profile': '15,234',
          'Industry Average': '8,500',
          Percentile: '75th',
        },
        {
          Metric: 'Engagement Rate',
          'This Profile': '4.2%',
          'Industry Average': '2.8%',
          Percentile: '85th',
        },
        {
          Metric: 'Posts per Week',
          'This Profile': '7',
          'Industry Average': '4',
          Percentile: '90th',
        },
        {
          Metric: 'External Citations',
          'This Profile': '30%',
          'Industry Average': '15%',
          Percentile: '80th',
        },
      ],
    },
    {
      name: 'nested_analysis',
      data: {
        'Content Quality': {
          'Technical Accuracy': {
            Score: '8.5/10',
            Notes: 'Generally accurate with occasional minor errors',
            Examples: [
              'Correctly explains React hooks',
              'Minor confusion about async/await edge cases',
            ],
          },
          Clarity: {
            Score: '9/10',
            Notes: 'Excellent at explaining complex concepts simply',
            Examples: [
              'Great analogies for technical concepts',
              'Step-by-step breakdowns',
            ],
          },
          Originality: {
            Score: '7/10',
            Notes: 'Good mix of original insights and curated content',
            Examples: [
              'Unique perspective on team dynamics',
              'Some content similar to other influencers',
            ],
          },
        },
        'Community Impact': {
          Helpfulness:
            'High - frequently answers questions and provides guidance',
          Mentorship: 'Active in helping junior developers',
          Collaboration: "Often promotes others' work and gives credit",
          Controversy:
            'Minimal - avoids divisive topics and maintains professional tone',
        },
      },
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          AnalysisVisualizer Test Page
        </h1>
        <p className="text-gray-600 mb-6">
          This page demonstrates the flexible rendering capabilities of the
          AnalysisVisualizer component with various data structures and types.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-blue-900 mb-2">
            Rendering Rules Demonstrated:
          </h2>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>
              • <strong>Objects</strong> → Headings with nested content
            </li>
            <li>
              • <strong>Strings</strong> → Paragraphs
            </li>
            <li>
              • <strong>Arrays of strings</strong> → Bullet lists
            </li>
            <li>
              • <strong>Arrays of objects</strong> → Tables
            </li>
            <li>
              • <strong>Nested objects</strong> → Recursive subsections
            </li>
            <li>
              • <strong>Mixed data types</strong> → Appropriate rendering for
              each type
            </li>
          </ul>
        </div>
      </div>

      <AnalysisVisualizer sections={testSections} />

      <div className="mt-8 text-center">
        <button
          onClick={() => (window.location.href = '/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
