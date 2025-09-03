import { NextRequest, NextResponse } from 'next/server';
import { AnalysisRepository } from '../../lib/repositories/analysis';
import { validateSocialMediaUrl, getPlatformInfo } from '../../lib/validation';
import { 
  OverviewSection, 
  StrengthsSection, 
  CriteriaEvaluationSection, 
  RepresentativePostsSection, 
  ScoreJustificationSection 
} from '../../lib/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileUrl } = body;

    if (!profileUrl) {
      return NextResponse.json(
        { error: 'Profile URL is required' },
        { status: 400 }
      );
    }

    // Validate the URL
    const validationResult = validateSocialMediaUrl(profileUrl);
    if (!validationResult.isValid || !validationResult.platform) {
      return NextResponse.json(
        { error: validationResult.error || 'Invalid profile URL' },
        { status: 400 }
      );
    }

    // Get platform info
    const platformInfo = getPlatformInfo(profileUrl);
    if (!platformInfo) {
      return NextResponse.json(
        { error: 'Unable to extract platform information' },
        { status: 400 }
      );
    }

    // Create basic analysis record with mock data for now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Create typed sections with proper type safety
    const overviewSection: OverviewSection = {
      name: "overview",
      data: {
        "Sampled Posts": "~50",
        "Focus Areas": "AI, entrepreneurship, innovation, technology",
        "Analysis Date": new Date().toLocaleDateString(),
        "Platform": validationResult.platform === 'twitter' ? 'Twitter/X' : 'LinkedIn',
        "Profile Status": "Verified and Active"
      }
    };

    const strengthsSection: StrengthsSection = {
      name: "strengths",
      data: {
        "Established Expertise": "Co-founder and CTO of HubSpot, providing legitimate authority in tech and business.",
        "Clear & Approachable Language": "Content is straightforward and accessible, avoiding unnecessary jargon.",
        "Transparency": "Open about investments and collaborations, providing context for opinions and endorsements.",
        "Positive Community Engagement": "High levels of interaction and positive feedback on posts.",
        "Thought Leadership in AI": "Shares insights on AI developments backed by personal experience and industry knowledge."
      }
    };

    const criteriaSection: CriteriaEvaluationSection = {
      name: "criteria_evaluation",
      data: {
        "Unnecessary Complexity": {
          status: "pass",
          evaluation: "Uses simple, clear language without jargon."
        },
        "Proprietary/Pushy Selling": {
          status: "warning",
          evaluation: "Promotes his companies but is transparent about his roles and investments."
        },
        "Us vs. Them Framing": {
          status: "pass",
          evaluation: "No divisive language; promotes collaboration and innovation."
        },
        "Overselling Narrow Interventions": {
          status: "pass",
          evaluation: "Balanced claims; does not promise unrealistic outcomes."
        },
        "Emotion/Story vs Data": {
          status: "pass",
          evaluation: "Uses personal stories to illustrate points, supported by data and examples."
        },
        "Lack of Sourcing": {
          status: "warning",
          evaluation: "Cites books and metrics but could provide more external validation."
        },
        "Serial Contrarian": {
          status: "pass",
          evaluation: "Aligns with industry trends and established knowledge, not overly contrarian."
        },
        "Guru Syndrome": {
          status: "pass",
          evaluation: "Demonstrates humility and acknowledges the contributions of others in the field."
        }
      }
    };

    const postsSection: RepresentativePostsSection = {
      name: "representative_posts",
      data: {
        "Recent Highlights": [
          {
            content: "Happy Birthday to my friend, co-founder of HubSpot",
            timestamp: "14 hours ago",
            url: "#",
            reasoning: "Celebrates collaboration and mentorship."
          },
          {
            content: "Love these picks - AI investments showing real promise",
            timestamp: "15 hours ago", 
            url: "#",
            reasoning: "Discusses AI investments and insights with transparency."
          },
          {
            content: "Fear of failure shouldn't stop us from taking calculated risks",
            timestamp: "3 days ago",
            url: "#",
            reasoning: "Shares personal philosophy on risk-taking and learning from failure."
          }
        ]
      }
    };

    const justificationSection: ScoreJustificationSection = {
      name: "score_justification",
      data: {
        "Why Not Higher": [
          "Some posts are more anecdotal than data-driven",
          "Promotes his own company regularly, though transparently"
        ],
        "Why Not Lower": [
          "Extensive real-world expertise and track record in the tech industry",
          "Consistently transparent about conflicts of interest and investments", 
          "Provides genuine technical insights from hands-on experimentation",
          "Engages positively with the community, fostering a collaborative environment"
        ],
        "Key Factors": [
          "Legitimate authority as HubSpot co-founder and CTO",
          "Transparent about business relationships and investments",
          "Balanced perspective without overpromising or fear-mongering",
          "Strong community engagement and collaborative approach"
        ]
      }
    };

    const analysisData = {
      profileUrl: platformInfo.normalizedUrl,
      platform: validationResult.platform,
      username: platformInfo.username,
      expiresAt,
      crediScore: 9.0,
      sections: [
        overviewSection,
        strengthsSection,
        criteriaSection,
        postsSection,
        justificationSection
      ],
    };

    const analysis = await AnalysisRepository.create(analysisData);

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: 'Analysis started successfully',
      analysis: {
        id: analysis.id,
        profileUrl: analysis.profileUrl,
        platform: analysis.platform,
        username: analysis.username,
        createdAt: analysis.createdAt,
        status: 'started'
      }
    });

  } catch (error) {
    console.error('Error creating analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}