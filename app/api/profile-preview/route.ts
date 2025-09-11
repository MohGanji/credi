import { NextRequest, NextResponse } from 'next/server';
import { validateSocialMediaUrl, getPlatformInfo, type SupportedPlatform } from '../../lib/validation';

export interface ProfilePreview {
  platform: SupportedPlatform;
  username: string;
  displayName: string;
  profileTitle: string;
  bio: string;
  isPublic: boolean;
  profilePicture?: string;
  followerCount?: number;
  verified?: boolean;
}

/**
 * Mock profile data fetcher - simulates fetching real profile information
 * In a real implementation, this would call actual social media APIs
 */
async function fetchProfileInfo(url: string, platform: SupportedPlatform): Promise<ProfilePreview> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));

  const platformInfo = getPlatformInfo(url);
  if (!platformInfo) {
    throw new Error('Unable to extract platform information');
  }

  const { username } = platformInfo;

  // Mock profile data based on platform
  if (platform === 'twitter') {
    const displayName = generateMockDisplayName(username);
    return {
      platform: 'twitter',
      username,
      displayName,
      profileTitle: `${displayName} (@${username})`,
      bio: generateMockBio(platform, displayName),
      isPublic: Math.random() > 0.1, // 90% chance of being public
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1da1f2&color=fff&size=128&bold=true`,
      followerCount: Math.floor(Math.random() * 100000) + 1000,
      verified: Math.random() > 0.8 // 20% chance of being verified
    };
  } else if (platform === 'linkedin') {
    const displayName = username.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return {
      platform: 'linkedin',
      username,
      displayName,
      profileTitle: generateMockJobTitle(displayName),
      bio: generateMockBio(platform, displayName),
      isPublic: Math.random() > 0.05, // 95% chance of being public
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0077b5&color=fff&size=128&bold=true`,
      followerCount: Math.floor(Math.random() * 50000) + 500,
      verified: false // LinkedIn doesn't have verification badges like Twitter
    };
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

function generateMockDisplayName(username: string): string {
  const names = [
    'Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emily Davis', 'David Kim',
    'Jessica Wilson', 'Ryan Thompson', 'Amanda Garcia', 'Chris Lee', 'Nicole Brown'
  ];
  
  // Use username to consistently generate the same name
  const index = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % names.length;
  return names[index];
}

function generateMockJobTitle(displayName: string): string {
  const titles = [
    'Senior Software Engineer at Tech Corp',
    'Product Manager at Innovation Labs',
    'Data Scientist at Analytics Inc',
    'UX Designer at Design Studio',
    'Marketing Director at Growth Co',
    'CEO at Startup Ventures',
    'Research Scientist at University',
    'Consultant at Strategy Firm',
    'Developer Advocate at Platform Inc',
    'VP of Engineering at Scale Corp'
  ];
  
  const index = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % titles.length;
  return titles[index];
}

function generateMockBio(platform: SupportedPlatform, displayName: string): string {
  const twitterBios = [
    'Building the future of technology, one line of code at a time. Thoughts on AI, startups, and life.',
    'Passionate about sustainable tech and climate solutions. Sharing insights from the intersection of business and environment.',
    'Software engineer by day, indie hacker by night. Building tools that make developers\' lives easier.',
    'Exploring the frontiers of machine learning and data science. Always learning, always sharing.',
    'Product enthusiast helping teams build better user experiences. Coffee addict ☕',
    'Entrepreneur, investor, and mentor. Helping startups scale from idea to IPO.',
    'Designer focused on creating inclusive and accessible digital experiences.',
    'Marketing strategist helping B2B companies grow through content and community.',
    'Open source contributor and advocate for developer tools and productivity.',
    'Research scientist working on the next generation of AI systems.'
  ];

  const linkedinBios = [
    'Experienced technology leader with 10+ years building scalable systems and leading high-performing teams. Passionate about innovation and mentoring the next generation of engineers.',
    'Strategic product manager with a track record of launching successful products that drive business growth. Expertise in user research, data analysis, and cross-functional collaboration.',
    'Data science professional specializing in machine learning and predictive analytics. Helping organizations make data-driven decisions and unlock insights from complex datasets.',
    'Creative UX/UI designer with expertise in user-centered design and design systems. Committed to creating digital experiences that are both beautiful and functional.',
    'Marketing executive with deep experience in digital marketing, brand strategy, and customer acquisition. Proven ability to scale marketing operations and drive revenue growth.',
    'Serial entrepreneur and startup advisor with multiple successful exits. Passionate about helping founders navigate the challenges of building and scaling technology companies.',
    'Academic researcher and industry consultant working at the intersection of technology and society. Published author and frequent speaker on emerging technology trends.',
    'Management consultant helping Fortune 500 companies transform their operations and embrace digital innovation. Expertise in strategy, operations, and change management.',
    'Developer relations professional building communities and empowering developers to succeed. Strong background in technical writing, public speaking, and developer advocacy.',
    'Engineering leader with experience scaling teams from startup to IPO. Focused on building inclusive engineering cultures and delivering high-quality software products.'
  ];

  const bios = platform === 'twitter' ? twitterBios : linkedinBios;
  const index = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bios.length;
  return bios[index];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate the URL
    const validation = validateSocialMediaUrl(url);
    if (!validation.isValid || !validation.platform) {
      return NextResponse.json(
        { error: validation.error || 'Invalid URL' },
        { status: 400 }
      );
    }

    // Fetch profile information
    const profilePreview = await fetchProfileInfo(url, validation.platform);

    return NextResponse.json({
      success: true,
      profile: profilePreview
    });

  } catch (error) {
    console.error('Error fetching profile preview:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('private') || error.message.includes('access')) {
        return NextResponse.json(
          { error: 'This profile appears to be private or inaccessible' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Profile not found. Please check the URL and try again.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile information. Please try again.' },
      { status: 500 }
    );
  }
}