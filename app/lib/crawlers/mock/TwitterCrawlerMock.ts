/**
 * Mock Twitter/X profile crawler for testing
 * Contains the original mock implementation moved from TwitterCrawler.ts
 */

import { BaseCrawler } from '../BaseCrawler';
import { ProfileData, Post } from '../types';

export class TwitterCrawlerMock extends BaseCrawler {
  protected validateUrl(url: string): boolean {
    const twitterPattern =
      /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
    return twitterPattern.test(url);
  }

  protected async scrapeProfile(url: string): Promise<ProfileData> {
    const username = this.extractUsername(url);

    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 800 + Math.random() * 600)
    );

    // Simulate error scenarios for testing
    const errorChance = Math.random();

    // Test specific usernames for consistent error scenarios
    if (username.toLowerCase().includes('private')) {
      throw new Error('Profile is private or access restricted');
    }
    if (
      username.toLowerCase().includes('notfound') ||
      username.toLowerCase().includes('deleted')
    ) {
      throw new Error('Profile not found or has been deleted');
    }
    if (
      username.toLowerCase().includes('network') ||
      username.toLowerCase().includes('timeout')
    ) {
      throw new Error('Network timeout occurred while fetching profile');
    }

    // Random error scenarios (reduced for better UX during testing)
    if (errorChance < 0.02) {
      // 2% private
      throw new Error('Profile is private or access restricted');
    }
    if (errorChance < 0.03) {
      // 1% not found
      throw new Error('Profile not found or has been deleted');
    }
    if (errorChance < 0.035) {
      // 0.5% network error
      throw new Error('Network error occurred while fetching profile');
    }

    // Generate mock profile data
    const displayName = this.generateDisplayName(username);

    return {
      platform: 'twitter',
      username,
      displayName,
      profileTitle: `${displayName} (@${username})`,
      bio: this.generateBio(displayName),
      isPublic: true,
      profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=1da1f2&color=fff&size=128&bold=true`,
      followerCount: Math.floor(Math.random() * 100000) + 1000,
      verified: Math.random() > 0.8, // 20% chance
      lastUpdated: new Date().toISOString(),
    };
  }

  protected async scrapePosts(url: string, maxCount: number): Promise<Post[]> {
    const username = this.extractUsername(url);
    const displayName = this.generateDisplayName(username);

    // Simulate network delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 800)
    );

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
    const actualCount = Math.min(maxCount, Math.floor(Math.random() * 15) + 5); // 5-20 posts

    for (let i = 0; i < actualCount; i++) {
      const postId = `${username}_${Date.now()}_${i}`;
      const createdAt = new Date(
        Date.now() - i * 3600000 - Math.random() * 3600000
      ).toISOString(); // Random times in past hours

      // 20% chance of retweet
      const isRetweet = Math.random() < 0.2;

      posts.push({
        id: postId,
        content: this.generatePostContent(i, isRetweet),
        createdAt,
        author: {
          username,
          displayName,
        },
        metrics: {
          likes: Math.floor(Math.random() * 1000) + 10,
          shares: Math.floor(Math.random() * 200) + 1,
          comments: Math.floor(Math.random() * 100) + 1,
          views: Math.floor(Math.random() * 10000) + 100,
        },
        url: `https://x.com/${username}/status/${postId}`,
        isRetweet,
        originalPost: isRetweet
          ? {
              id: `original_${postId}`,
              author: {
                username: this.generateRandomUsername(),
                displayName: this.generateRandomDisplayName(),
              },
            }
          : undefined,
      });
    }

    return posts;
  }

  private extractUsername(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/^\//, '').replace(/\/$/, '');
    } catch {
      throw new Error('Invalid URL format');
    }
  }

  private generateDisplayName(username: string): string {
    const names = [
      'Alex Johnson',
      'Sarah Chen',
      'Michael Rodriguez',
      'Emily Davis',
      'David Kim',
      'Jessica Wilson',
      'Ryan Thompson',
      'Amanda Garcia',
      'Chris Lee',
      'Nicole Brown',
      'Marcus Williams',
      'Lisa Zhang',
      'James Martinez',
      'Rachel Green',
      'Kevin Park',
    ];

    const index =
      username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      names.length;
    return names[index];
  }

  private generateBio(displayName: string): string {
    const bios = [
      'Building the future of technology, one line of code at a time. Thoughts on AI, startups, and life.',
      'Passionate about sustainable tech and climate solutions. Sharing insights from the intersection of business and environment.',
      "Software engineer by day, indie hacker by night. Building tools that make developers' lives easier.",
      'Exploring the frontiers of machine learning and data science. Always learning, always sharing.',
      'Product enthusiast helping teams build better user experiences. Coffee addict ☕',
      'Entrepreneur, investor, and mentor. Helping startups scale from idea to IPO.',
      'Designer focused on creating inclusive and accessible digital experiences.',
      'Marketing strategist helping B2B companies grow through content and community.',
      'Open source contributor and advocate for developer tools and productivity.',
      'Research scientist working on the next generation of AI systems.',
    ];

    const index =
      displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      bios.length;
    return bios[index];
  }

  private generatePostContent(index: number, isRetweet: boolean): string {
    if (isRetweet) {
      const retweetContents = [
        'This is exactly what I was thinking about earlier today. Great insights!',
        "Couldn't agree more with this perspective. Worth reading.",
        'This thread is gold. Everyone should read this.',
        'Sharing this because it perfectly captures my thoughts on the matter.',
        'Important points raised here. Thanks for sharing!',
      ];
      return retweetContents[index % retweetContents.length];
    }

    const contents = [
      "Just shipped a new feature that I'm really excited about. The team did an amazing job bringing this vision to life! 🚀",
      "Interesting discussion at today's conference about the future of AI and its impact on software development. Lots to think about.",
      "Working on some exciting projects lately. Can't share details yet, but stay tuned for some big announcements! 👀",
      "Coffee shop coding session today. There's something about the ambient noise that helps me focus. ☕️ #coding",
      'Just finished reading an excellent book on system design. Highly recommend it to anyone building scalable applications.',
      'Debugging is like being a detective in a crime movie where you are also the murderer. 🕵️‍♂️ #programming',
      'The best part about working in tech is the constant learning. Every day brings new challenges and opportunities to grow.',
      "Shoutout to my team for crushing it this quarter. Couldn't ask for better colleagues to work with! 🙌",
      "Sometimes the simplest solution is the best solution. Don't overcomplicate things. #KISS",
      "Late night coding session. When you're in the flow, time just disappears. Anyone else experience this? 🌙",
    ];

    return contents[index % contents.length];
  }

  private generateRandomUsername(): string {
    const usernames = [
      'techguru',
      'codemaster',
      'devlife',
      'buildthings',
      'innovator',
      'creator',
      'maker',
      'hacker',
    ];
    return (
      usernames[Math.floor(Math.random() * usernames.length)] +
      Math.floor(Math.random() * 1000)
    );
  }

  private generateRandomDisplayName(): string {
    const names = [
      'Sam Wilson',
      'Jordan Lee',
      'Taylor Swift',
      'Morgan Davis',
      'Casey Johnson',
    ];
    return names[Math.floor(Math.random() * names.length)];
  }
}
