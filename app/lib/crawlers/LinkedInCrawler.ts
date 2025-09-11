/**
 * LinkedIn profile crawler
 * Currently uses mock data, but structured for real scraping implementation
 */

import { BaseCrawler } from './BaseCrawler';
import { ProfileData, Post } from './types';

export class LinkedInCrawler extends BaseCrawler {
  protected validateUrl(url: string): boolean {
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinPattern.test(url);
  }

  protected async scrapeProfile(url: string): Promise<ProfileData> {
    const username = this.extractUsername(url);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 900 + Math.random() * 500));

    // Simulate error scenarios for testing
    const errorChance = Math.random();
    
    // Test specific usernames for consistent error scenarios
    if (username.toLowerCase().includes('private')) {
      throw new Error('Profile is private or access restricted');
    }
    if (username.toLowerCase().includes('notfound') || username.toLowerCase().includes('deleted')) {
      throw new Error('Profile not found or has been deleted');
    }
    if (username.toLowerCase().includes('network') || username.toLowerCase().includes('timeout')) {
      throw new Error('Network timeout occurred while fetching profile');
    }
    
    // Random error scenarios (reduced for better UX during testing)
    if (errorChance < 0.015) { // 1.5% private
      throw new Error('Profile is private or access restricted');
    }
    if (errorChance < 0.025) { // 1% not found
      throw new Error('Profile not found or has been deleted');
    }
    if (errorChance < 0.03) { // 0.5% network error
      throw new Error('Network error occurred while fetching profile');
    }

    // Generate mock profile data
    const displayName = this.generateDisplayName(username);
    
    return {
      platform: 'linkedin',
      username,
      displayName,
      profileTitle: this.generateJobTitle(displayName),
      bio: this.generateBio(displayName),
      isPublic: true,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0077b5&color=fff&size=128&bold=true`,
      followerCount: Math.floor(Math.random() * 50000) + 500,
      verified: false, // LinkedIn doesn't have verification badges
      lastUpdated: new Date().toISOString()
    };
  }

  protected async scrapePosts(url: string, maxCount: number): Promise<Post[]> {
    const username = this.extractUsername(url);
    const displayName = this.generateDisplayName(username);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 600));

    // Simulate error scenarios
    const errorChance = Math.random();
    if (errorChance < 0.03) {
      throw new Error('Profile is private or access restricted');
    }
    if (errorChance < 0.05) {
      throw new Error('Profile not found or has been deleted');
    }

    // Generate mock posts
    const posts: Post[] = [];
    const actualCount = Math.min(maxCount, Math.floor(Math.random() * 10) + 3); // 3-12 posts (LinkedIn users post less frequently)

    for (let i = 0; i < actualCount; i++) {
      const postId = `${username}_linkedin_${Date.now()}_${i}`;
      const createdAt = new Date(Date.now() - (i * 86400000) - Math.random() * 86400000).toISOString(); // Random times in past days
      
      // LinkedIn rarely has "shares" in the same way as Twitter retweets, but we'll simulate some
      const isShare = Math.random() < 0.1; // 10% chance
      
      posts.push({
        id: postId,
        content: this.generatePostContent(i, isShare),
        createdAt,
        author: {
          username,
          displayName
        },
        metrics: {
          likes: Math.floor(Math.random() * 500) + 5,
          shares: Math.floor(Math.random() * 50) + 1,
          comments: Math.floor(Math.random() * 30) + 1,
          views: Math.floor(Math.random() * 5000) + 50
        },
        url: `https://linkedin.com/posts/${username}_${postId}`,
        isRetweet: isShare,
        originalPost: isShare ? {
          id: `original_${postId}`,
          author: {
            username: this.generateRandomUsername(),
            displayName: this.generateRandomDisplayName()
          }
        } : undefined
      });
    }

    return posts;
  }

  private extractUsername(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\/in\//, '').replace(/\/$/, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private generateDisplayName(username: string): string {
    // Convert username to display name (john-doe -> John Doe)
    return username
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateJobTitle(displayName: string): string {
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
      'VP of Engineering at Scale Corp',
      'Frontend Developer at Web Solutions',
      'DevOps Engineer at Cloud Systems'
    ];
    
    const index = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % titles.length;
    return titles[index];
  }

  private generateBio(displayName: string): string {
    const bios = [
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

    const index = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % bios.length;
    return bios[index];
  }

  private generatePostContent(index: number, isShare: boolean): string {
    if (isShare) {
      const shareContents = [
        'Excellent insights from my colleague on industry trends. Worth a read for anyone in tech leadership.',
        'This article perfectly captures the challenges we\'re facing in digital transformation. Highly recommend.',
        'Great perspective on the future of remote work. Thanks for sharing your thoughts!',
        'This research aligns with what we\'re seeing in our organization. Very valuable data.',
        'Insightful analysis on market trends. This will definitely influence our strategy discussions.'
      ];
      return shareContents[index % shareContents.length];
    }

    const contents = [
      'Excited to announce that our team has successfully completed a major digital transformation project. The results exceeded our expectations and I\'m proud of what we accomplished together. #DigitalTransformation #TeamWork',
      'Just wrapped up an insightful conference on the future of AI in business. Key takeaway: the organizations that will thrive are those that combine human creativity with AI capabilities. #AI #Innovation #Leadership',
      'Reflecting on my career journey and the mentors who shaped my path. Grateful for the guidance and now committed to paying it forward by mentoring the next generation of professionals. #Mentorship #CareerGrowth',
      'Our latest product launch has been incredibly well-received by customers. It\'s amazing what happens when you truly listen to user feedback and iterate based on real needs. #ProductManagement #CustomerFirst',
      'Attended a fascinating workshop on sustainable business practices today. It\'s clear that environmental responsibility isn\'t just good ethics—it\'s good business. #Sustainability #ESG #BusinessStrategy',
      'Celebrating our team\'s achievement in reducing system downtime by 90% this quarter. This kind of operational excellence doesn\'t happen by accident—it\'s the result of dedicated engineering and continuous improvement. #DevOps #Engineering',
      'Had the privilege of speaking at a university career fair today. The talent and enthusiasm of these students gives me so much hope for the future of our industry. #TalentDevelopment #University #Recruiting',
      'Just finished reading an excellent book on organizational psychology. The insights on team dynamics and motivation are already influencing how I approach leadership challenges. #Leadership #ContinuousLearning',
      'Proud to share that our company has been recognized as a top workplace for diversity and inclusion. This recognition reflects our ongoing commitment to creating an environment where everyone can thrive. #DiversityAndInclusion #CompanyCulture',
      'Interesting discussion with industry peers about the skills gap in tech. We need to do more to bridge the gap between academic learning and industry needs. Collaboration between education and industry is key. #SkillsGap #Education #TechIndustry'
    ];

    return contents[index % contents.length];
  }

  private generateRandomUsername(): string {
    const usernames = ['john-smith', 'sarah-johnson', 'mike-chen', 'lisa-davis', 'alex-wilson', 'emma-brown', 'david-lee'];
    return usernames[Math.floor(Math.random() * usernames.length)];
  }

  private generateRandomDisplayName(): string {
    const names = ['John Smith', 'Sarah Johnson', 'Mike Chen', 'Lisa Davis', 'Alex Wilson', 'Emma Brown', 'David Lee'];
    return names[Math.floor(Math.random() * names.length)];
  }

  // Future: Real scraping implementation would go here
  // private async scrapeProfile(url: string): Promise<ProfileData> {
  //   // Use puppeteer, playwright, or HTTP requests to scrape actual profile data
  //   // Handle LinkedIn's anti-bot measures
  //   // Parse structured data or HTML
  // }
  
  // private async scrapePosts(url: string, maxCount: number): Promise<Post[]> {
  //   // Use puppeteer, playwright, or HTTP requests to scrape recent posts
  //   // Handle LinkedIn's pagination and authentication requirements
  //   // Extract post content, engagement metrics, timestamps, etc.
  // }
}