/**
 * Test error handling scenarios for profile preview
 */

import { CrawlerFactory } from '../CrawlerFactory';

describe('Profile Preview Error Handling', () => {
  beforeEach(() => {
    // Clear any cached data between tests
    jest.clearAllMocks();
  });

  test('should handle private profile error', async () => {
    const privateUrl = 'https://twitter.com/private_user';

    await expect(CrawlerFactory.fetchProfile(privateUrl)).rejects.toThrow(
      'Profile is private or access restricted'
    );
  });

  test('should handle not found profile error', async () => {
    const notFoundUrl = 'https://twitter.com/notfound_user';

    await expect(CrawlerFactory.fetchProfile(notFoundUrl)).rejects.toThrow(
      'Profile not found or has been deleted'
    );
  });

  test('should handle network error', async () => {
    const networkErrorUrl = 'https://twitter.com/network_user';

    await expect(CrawlerFactory.fetchProfile(networkErrorUrl)).rejects.toThrow(
      'Network timeout occurred while fetching profile'
    );
  });

  test('should handle invalid URL', async () => {
    const invalidUrl = 'https://facebook.com/user';

    await expect(CrawlerFactory.fetchProfile(invalidUrl)).rejects.toThrow(
      'Unsupported platform'
    );
  });

  test('should handle LinkedIn private profile', async () => {
    const privateLinkedInUrl = 'https://linkedin.com/in/private-user';

    await expect(
      CrawlerFactory.fetchProfile(privateLinkedInUrl)
    ).rejects.toThrow('Profile is private or access restricted');
  });

  test('should handle LinkedIn not found profile', async () => {
    const notFoundLinkedInUrl = 'https://linkedin.com/in/notfound-user';

    await expect(
      CrawlerFactory.fetchProfile(notFoundLinkedInUrl)
    ).rejects.toThrow('Profile not found or has been deleted');
  });

  test('should handle LinkedIn network error', async () => {
    const networkErrorLinkedInUrl = 'https://linkedin.com/in/network-user';

    await expect(
      CrawlerFactory.fetchProfile(networkErrorLinkedInUrl)
    ).rejects.toThrow('Network timeout occurred while fetching profile');
  });

  test('should return successful profile for valid URLs', async () => {
    const validUrl = 'https://twitter.com/validuser';

    const profile = await CrawlerFactory.fetchProfile(validUrl);

    expect(profile).toBeDefined();
    expect(profile.platform).toBe('twitter');
    expect(profile.username).toBe('validuser');
    expect(profile.isPublic).toBe(true);
  });

  test('should return successful LinkedIn profile for valid URLs', async () => {
    const validLinkedInUrl = 'https://linkedin.com/in/valid-user';

    const profile = await CrawlerFactory.fetchProfile(validLinkedInUrl);

    expect(profile).toBeDefined();
    expect(profile.platform).toBe('linkedin');
    expect(profile.username).toBe('valid-user');
    expect(profile.isPublic).toBe(true);
  });
});
