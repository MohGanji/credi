// Mock data generators for Twitter and LinkedIn posts and analysis results

export interface MockPost {
  id: string;
  content: string;
  timestamp: Date;
  links: string[];
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
  };
  postingPattern: {
    timeOfDay: string;
    dayOfWeek: string;
    frequency: 'high' | 'medium' | 'low';
  };
}

export interface MockProfileData {
  platform: 'twitter' | 'linkedin';
  username: string;
  displayName: string;
  bio: string;
  verified: boolean;
  followerCount: number;
  followingCount: number;
  postCount: number;
}

// Twitter mock post templates
const twitterPostTemplates = [
  'Just shipped a new feature that reduces load time by 40%. Small optimizations can have huge impact! #webdev #performance',
  "Reading 'The Lean Startup' again. The build-measure-learn cycle is still the best framework for product development.",
  "Hot take: Most 'AI' products today are just better UX around existing APIs. Real innovation is in the application layer.",
  'Debugging is like being a detective in a crime movie where you are also the murderer. 🕵️‍♂️',
  "The best code is no code. The second best code is code that's easy to delete.",
  'Spent 3 hours optimizing a function that saves 2ms. Was it worth it? Probably not. Will I do it again? Absolutely.',
  "Remote work tip: Your home office setup is an investment in your productivity and mental health. Don't cheap out.",
  "The hardest part of building a startup isn't the technical challenges - it's staying motivated through the inevitable lows.",
  "Code review feedback: 'This works but I hate it.' Sometimes that's the most honest feedback you can get.",
  'Learning in public is scary but incredibly rewarding. Share your failures, not just your successes.',
  'The best engineers I know are also great communicators. Technical skills get you in the door, communication skills get you promoted.',
  'Microservices are like teenage sex: everyone talks about it, few people actually do it well, and most who do it regret it.',
  'Your database is not a queue. Your queue is not a database. Use the right tool for the job.',
  "The most expensive code is the code you don't write but should have. Technical debt compounds faster than you think.",
  'Pair programming: Two developers, one keyboard, infinite possibilities for awkward moments.',
];

// LinkedIn mock post templates
const linkedinPostTemplates = [
  "After 10 years in tech, I've learned that the most important skill isn't coding - it's learning how to learn continuously.",
  'Just completed a fascinating project implementing AI-driven customer segmentation. Key insight: data quality matters more than algorithm sophistication.',
  "Reflecting on my journey from junior developer to tech lead. The biggest shift wasn't technical - it was learning to empower others.",
  'The future of work is hybrid, but the future of collaboration is intentional. Remote teams need structure, not just flexibility.',
  'Attended an incredible conference on sustainable technology. The intersection of environmental responsibility and innovation is where the magic happens.',
  'Mentoring junior developers has taught me more than any course or book. Teaching forces you to truly understand your craft.',
  'The best product decisions come from talking to customers, not from conference rooms. Data informs, but empathy guides.',
  "Building diverse teams isn't just the right thing to do - it's the smart thing to do. Different perspectives lead to better solutions.",
  "The most successful projects I've led had one thing in common: clear communication and shared understanding of the 'why'.",
  "Automation is not about replacing humans - it's about freeing humans to do more meaningful, creative work.",
  'The startup world glorifies the hustle, but sustainable success comes from building systems and processes that scale.',
  "Code reviews are not about finding bugs - they're about knowledge sharing and maintaining code quality standards.",
  "The best leaders I've worked with ask more questions than they give answers. Curiosity is a leadership superpower.",
  'Technical debt is like financial debt - a little can accelerate growth, but too much will crush you.',
  'The most valuable skill in tech? Learning to say no. Every yes to one thing is a no to something else.',
];

// Generate mock posts for a platform
export function generateMockPosts(
  platform: 'twitter' | 'linkedin',
  count: number = 50
): MockPost[] {
  const templates =
    platform === 'twitter' ? twitterPostTemplates : linkedinPostTemplates;
  const posts: MockPost[] = [];

  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const daysAgo = Math.floor(Math.random() * 30); // Posts from last 30 days
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - daysAgo);

    // Add some random links to some posts
    const links: string[] = [];
    if (Math.random() > 0.7) {
      // 30% chance of having links
      const linkCount = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < linkCount; j++) {
        links.push(
          `https://example.com/article-${Math.floor(Math.random() * 1000)}`
        );
      }
    }

    // Generate realistic engagement metrics based on platform
    const baseEngagement =
      platform === 'twitter'
        ? { likes: 50, shares: 10, comments: 5 }
        : { likes: 25, shares: 5, comments: 8 };

    const multiplier = Math.random() * 10 + 0.1; // 0.1x to 10x engagement variation

    posts.push({
      id: `${platform}-post-${i + 1}`,
      content: template,
      timestamp,
      links,
      engagementMetrics: {
        likes: Math.floor(baseEngagement.likes * multiplier),
        shares: Math.floor(baseEngagement.shares * multiplier),
        comments: Math.floor(baseEngagement.comments * multiplier),
      },
      postingPattern: {
        timeOfDay: ['morning', 'afternoon', 'evening'][
          Math.floor(Math.random() * 3)
        ],
        dayOfWeek: ['weekday', 'weekend'][Math.floor(Math.random() * 2)],
        frequency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as
          | 'high'
          | 'medium'
          | 'low',
      },
    });
  }

  // Sort by timestamp (newest first)
  return posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate mock profile data
export function generateMockProfileData(
  platform: 'twitter' | 'linkedin',
  username: string
): MockProfileData {
  const isTwitter = platform === 'twitter';

  return {
    platform,
    username,
    displayName: isTwitter
      ? `@${username}`
      : username.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    bio: isTwitter
      ? 'Tech entrepreneur, AI enthusiast, and coffee addict. Building the future one line of code at a time. 🚀'
      : 'Senior Software Engineer at TechCorp | AI & Machine Learning | Building scalable solutions | Mentor | Speaker',
    verified: Math.random() > 0.7, // 30% chance of being verified
    followerCount: Math.floor(Math.random() * 50000) + 1000,
    followingCount: Math.floor(Math.random() * 2000) + 100,
    postCount: Math.floor(Math.random() * 5000) + 500,
  };
}

// Generate mock analysis sections with realistic data
export function generateMockAnalysisSections(
  platform: 'twitter' | 'linkedin',
  username: string,
  posts: MockPost[]
) {
  const profileData = generateMockProfileData(platform, username);
  const platformName = platform === 'twitter' ? 'Twitter/X' : 'LinkedIn';

  // Calculate some basic metrics from posts
  const totalEngagement = posts.reduce(
    (sum, post) =>
      sum +
      post.engagementMetrics.likes +
      post.engagementMetrics.shares +
      post.engagementMetrics.comments,
    0
  );
  const avgEngagement = Math.floor(totalEngagement / posts.length);
  const postsWithLinks = posts.filter((post) => post.links.length > 0).length;
  const linkPercentage = Math.floor((postsWithLinks / posts.length) * 100);

  return {
    overview: {
      name: 'overview',
      data: {
        'Sampled Posts': posts.length.toString(),
        'Focus Areas':
          platform === 'twitter'
            ? 'Technology, entrepreneurship, software development, AI'
            : 'Professional development, leadership, industry insights, networking',
        'Analysis Date': new Date().toLocaleDateString(),
        Platform: platformName,
        'Profile Status': profileData.verified
          ? 'Verified and Active'
          : 'Active',
        'Average Engagement': `${avgEngagement} interactions per post`,
        'External Links': `${linkPercentage}% of posts contain external references`,
      },
    },
    strengths: {
      name: 'strengths',
      data: {
        'Consistent Posting': `Regular posting schedule with ${posts.length} recent posts analyzed`,
        'Engagement Quality': `Strong community interaction with average ${avgEngagement} engagements per post`,
        'Content Depth':
          'Posts demonstrate thoughtful analysis rather than surface-level commentary',
        'Professional Tone': `Maintains ${platform === 'twitter' ? 'authentic yet professional' : 'professional and insightful'} communication style`,
        'Knowledge Sharing': `${linkPercentage}% of posts include external references, showing commitment to sourcing`,
      },
    },
    criteria_evaluation: {
      name: 'criteria_evaluation',
      data: [
        {
          criterion: 'Unnecessary Complexity',
          status: 'pass' as const,
          evaluation:
            'Uses clear, accessible language appropriate for the platform audience',
        },
        {
          criterion: 'Proprietary/Pushy Selling',
          status:
            Math.random() > 0.5 ? ('pass' as const) : ('warning' as const),
          evaluation:
            Math.random() > 0.5
              ? 'No evidence of aggressive self-promotion or product pushing'
              : 'Occasional promotion of own projects, but balanced with value-driven content',
        },
        {
          criterion: 'Us vs. Them Framing',
          status: 'pass' as const,
          evaluation:
            'Promotes collaborative and inclusive discourse without divisive language',
        },
        {
          criterion: 'Overselling Narrow Interventions',
          status: 'pass' as const,
          evaluation:
            'Presents balanced perspectives without overpromising outcomes',
        },
        {
          criterion: 'Emotion/Story vs Data',
          status:
            Math.random() > 0.3 ? ('pass' as const) : ('warning' as const),
          evaluation:
            Math.random() > 0.3
              ? 'Good balance of personal experience and factual information'
              : 'Relies somewhat heavily on anecdotal evidence, could benefit from more data backing',
        },
        {
          criterion: 'Lack of Sourcing',
          status:
            linkPercentage > 20 ? ('pass' as const) : ('warning' as const),
          evaluation:
            linkPercentage > 20
              ? `Strong sourcing habits with ${linkPercentage}% of posts including external references`
              : `Limited external sourcing with only ${linkPercentage}% of posts including references`,
        },
        {
          criterion: 'Serial Contrarian',
          status: 'pass' as const,
          evaluation:
            'Aligns with industry best practices and established knowledge',
        },
        {
          criterion: 'Guru Syndrome',
          status: 'pass' as const,
          evaluation:
            'Demonstrates humility and acknowledges contributions of others in the field',
        },
      ],
    },
    representative_posts: {
      name: 'representative_posts',
      data: [
        ...posts.slice(0, 3).map((post) => ({
          category: 'Recent Highlights',
          content:
            post.content.length > 150
              ? post.content.substring(0, 150) + '...'
              : post.content,
          timestamp: post.timestamp.toLocaleDateString(),
          url: '#', // Mock URL
          reasoning:
            'Demonstrates thoughtful analysis and professional expertise',
        })),
        ...posts
          .sort(
            (a, b) =>
              b.engagementMetrics.likes +
              b.engagementMetrics.shares +
              b.engagementMetrics.comments -
              (a.engagementMetrics.likes +
                a.engagementMetrics.shares +
                a.engagementMetrics.comments)
          )
          .slice(0, 2)
          .map((post) => ({
            category: 'High Engagement',
            content:
              post.content.length > 150
                ? post.content.substring(0, 150) + '...'
                : post.content,
            timestamp: post.timestamp.toLocaleDateString(),
            url: '#', // Mock URL
            reasoning: `High community engagement (${post.engagementMetrics.likes + post.engagementMetrics.shares + post.engagementMetrics.comments} interactions)`,
          })),
      ],
    },
    score_justification: {
      name: 'score_justification',
      data: {
        'Why Not Higher': [
          linkPercentage < 30
            ? 'Could improve external sourcing and citation practices'
            : null,
          avgEngagement < 50
            ? 'Engagement levels could be higher for the follower count'
            : null,
          'Some posts rely more on personal experience than empirical evidence',
        ].filter(Boolean) as string[],
        'Why Not Lower': [
          'Consistent, professional communication style',
          `Regular posting schedule with ${posts.length} recent posts`,
          'No evidence of misleading or harmful content',
          'Demonstrates genuine expertise in stated areas',
          profileData.verified
            ? 'Verified account adds credibility'
            : 'Authentic engagement patterns',
        ],
        'Key Factors': [
          `${platformName} presence shows consistent professional engagement`,
          `${linkPercentage}% of posts include external references`,
          `Average ${avgEngagement} interactions per post indicates community trust`,
          'Content demonstrates domain expertise without overselling',
          'Maintains professional standards appropriate for platform',
        ],
      },
    },
  };
}

// Generate a complete mock analysis result
export function generateMockAnalysisResult(
  profileUrl: string,
  platform: 'twitter' | 'linkedin',
  username: string
) {
  const posts = generateMockPosts(platform, 50);
  const sections = generateMockAnalysisSections(platform, username, posts);

  // Calculate a credibility score based on the generated criteria
  let score = 7.0; // Base score

  // Adjust based on criteria evaluations
  Object.values(sections.criteria_evaluation.data).forEach((criteria) => {
    if (criteria.status === 'pass') score += 0.3;
    else if (criteria.status === 'warning') score += 0.1;
    else score -= 0.2;
  });

  // Ensure score is within bounds
  score = Math.max(0, Math.min(10, score));
  score = Math.round(score * 10) / 10; // Round to 1 decimal place

  return {
    profileUrl,
    platform,
    username,
    crediScore: score,
    sections: Object.values(sections),
    processingTimeMs: Math.floor(Math.random() * 30000) + 15000, // 15-45 seconds
    modelUsed: 'mock-consensus-v1',
    tokensUsed: Math.floor(Math.random() * 5000) + 2000,
  };
}
