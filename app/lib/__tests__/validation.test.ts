import { test } from 'tap';
import {
  validateTwitterUrl,
  validateLinkedInUrl,
  detectPlatform,
  extractUsername,
  normalizeUrl,
  validateSocialMediaUrl,
  getPlatformInfo,
  getSupportedPlatforms,
  isPlatformSupported,
  type SupportedPlatform,
  type ValidationResult,
  type PlatformInfo
} from '../validation';

test('validateTwitterUrl - should validate valid Twitter URLs', (t) => {
  const validUrls = [
    'https://twitter.com/username',
    'https://www.twitter.com/username',
    'http://twitter.com/username',
    'https://x.com/username',
    'https://www.x.com/username',
    'http://x.com/username',
    'https://twitter.com/user_name',
    'https://twitter.com/username123',
    'https://twitter.com/username/',
    'https://x.com/username/'
  ];

  validUrls.forEach(url => {
    t.equal(validateTwitterUrl(url), true, `Should validate ${url}`);
  });
  
  t.end();
});

test('validateTwitterUrl - should reject invalid Twitter URLs', (t) => {
  const invalidUrls = [
    'https://twitter.com/',
    'https://twitter.com/user name', // space in username
    'https://twitter.com/user@name', // invalid character
    'https://facebook.com/username',
    'https://linkedin.com/in/username',
    'not-a-url',
    '',
    'https://twitter.com/username/status/123', // status URL
    'https://twitter.com/username/following'
  ];

  invalidUrls.forEach(url => {
    t.equal(validateTwitterUrl(url), false, `Should reject ${url}`);
  });
  
  t.end();
});

test('validateLinkedInUrl - should validate valid LinkedIn URLs', (t) => {
  const validUrls = [
    'https://linkedin.com/in/username',
    'https://www.linkedin.com/in/username',
    'http://linkedin.com/in/username',
    'https://linkedin.com/in/user-name',
    'https://linkedin.com/in/username123',
    'https://linkedin.com/in/username/',
    'https://linkedin.com/in/user-name-123'
  ];

  validUrls.forEach(url => {
    t.equal(validateLinkedInUrl(url), true, `Should validate ${url}`);
  });
  
  t.end();
});

test('validateLinkedInUrl - should reject invalid LinkedIn URLs', (t) => {
  const invalidUrls = [
    'https://linkedin.com/',
    'https://linkedin.com/in/',
    'https://linkedin.com/in/user name', // space in username
    'https://linkedin.com/in/user@name', // invalid character
    'https://linkedin.com/company/company-name',
    'https://twitter.com/username',
    'not-a-url',
    '',
    'https://linkedin.com/in/username/details'
  ];

  invalidUrls.forEach(url => {
    t.equal(validateLinkedInUrl(url), false, `Should reject ${url}`);
  });
  
  t.end();
});

test('detectPlatform - should detect Twitter platform', (t) => {
  const twitterUrls = [
    'https://twitter.com/username',
    'https://x.com/username',
    'https://www.twitter.com/username',
    'https://www.x.com/username'
  ];

  twitterUrls.forEach(url => {
    t.equal(detectPlatform(url), 'twitter', `Should detect Twitter for ${url}`);
  });
  
  t.end();
});

test('detectPlatform - should detect LinkedIn platform', (t) => {
  const linkedinUrls = [
    'https://linkedin.com/in/username',
    'https://www.linkedin.com/in/username',
    'http://linkedin.com/in/user-name'
  ];

  linkedinUrls.forEach(url => {
    t.equal(detectPlatform(url), 'linkedin', `Should detect LinkedIn for ${url}`);
  });
  
  t.end();
});

test('detectPlatform - should return null for unsupported platforms', (t) => {
  const unsupportedUrls = [
    'https://facebook.com/username',
    'https://instagram.com/username',
    'https://youtube.com/channel/username',
    'https://tiktok.com/@username',
    'not-a-url',
    ''
  ];

  unsupportedUrls.forEach(url => {
    t.equal(detectPlatform(url), null, `Should return null for ${url}`);
  });
  
  t.end();
});

test('extractUsername - should extract username from Twitter URLs', (t) => {
  t.equal(extractUsername('https://twitter.com/username', 'twitter'), 'username');
  t.equal(extractUsername('https://x.com/username/', 'twitter'), 'username');
  t.equal(extractUsername('https://twitter.com/user_name', 'twitter'), 'user_name');
  t.end();
});

test('extractUsername - should extract username from LinkedIn URLs', (t) => {
  t.equal(extractUsername('https://linkedin.com/in/username', 'linkedin'), 'username');
  t.equal(extractUsername('https://linkedin.com/in/username/', 'linkedin'), 'username');
  t.equal(extractUsername('https://linkedin.com/in/user-name', 'linkedin'), 'user-name');
  t.end();
});

test('extractUsername - should throw error for invalid URLs', (t) => {
  t.throws(() => extractUsername('not-a-url', 'twitter'), 'Should throw for invalid URL');
  t.throws(() => extractUsername('https://twitter.com/username', 'linkedin' as SupportedPlatform), 'Should throw for wrong platform');
  t.end();
});

test('normalizeUrl - should normalize Twitter URLs to x.com', (t) => {
  t.equal(normalizeUrl('https://twitter.com/username', 'twitter'), 'https://x.com/username');
  t.equal(normalizeUrl('https://x.com/username/', 'twitter'), 'https://x.com/username');
  t.equal(normalizeUrl('http://www.twitter.com/username', 'twitter'), 'https://x.com/username');
  t.end();
});

test('normalizeUrl - should normalize LinkedIn URLs', (t) => {
  t.equal(normalizeUrl('https://linkedin.com/in/username', 'linkedin'), 'https://linkedin.com/in/username');
  t.equal(normalizeUrl('https://linkedin.com/in/username/', 'linkedin'), 'https://linkedin.com/in/username');
  t.equal(normalizeUrl('http://www.linkedin.com/in/user-name', 'linkedin'), 'https://linkedin.com/in/user-name');
  t.end();
});

test('normalizeUrl - should throw error for invalid inputs', (t) => {
  t.throws(() => normalizeUrl('not-a-url', 'twitter'), 'Should throw for invalid URL');
  t.end();
});

test('validateSocialMediaUrl - should validate and return platform for valid URLs', (t) => {
  const testCases: Array<{ url: string; expectedPlatform: SupportedPlatform }> = [
    { url: 'https://twitter.com/username', expectedPlatform: 'twitter' },
    { url: 'https://x.com/username', expectedPlatform: 'twitter' },
    { url: 'https://linkedin.com/in/username', expectedPlatform: 'linkedin' }
  ];

  testCases.forEach(({ url, expectedPlatform }) => {
    const result = validateSocialMediaUrl(url);
    t.equal(result.isValid, true, `Should be valid for ${url}`);
    t.equal(result.platform, expectedPlatform, `Should detect ${expectedPlatform} for ${url}`);
    t.equal(result.error, undefined, `Should have no error for ${url}`);
  });
  
  t.end();
});

test('validateSocialMediaUrl - should handle invalid inputs', (t) => {
  const invalidInputs = [
    { input: '', expectedError: 'URL is required and must be a string' },
    { input: '   ', expectedError: 'URL is required and must be a string' },
    { input: null as any, expectedError: 'URL is required and must be a string' },
    { input: undefined as any, expectedError: 'URL is required and must be a string' },
    { input: 123 as any, expectedError: 'URL is required and must be a string' }
  ];

  invalidInputs.forEach(({ input, expectedError }) => {
    const result = validateSocialMediaUrl(input);
    t.equal(result.isValid, false, `Should be invalid for ${input}`);
    t.equal(result.error, expectedError, `Should have correct error for ${input}`);
    t.equal(result.platform, undefined, `Should have no platform for ${input}`);
  });
  
  t.end();
});

test('validateSocialMediaUrl - should reject unsupported platforms', (t) => {
  const unsupportedUrls = [
    'https://facebook.com/username',
    'https://instagram.com/username',
    'https://youtube.com/channel/username',
    'https://tiktok.com/@username'
  ];

  unsupportedUrls.forEach(url => {
    const result = validateSocialMediaUrl(url);
    t.equal(result.isValid, false, `Should be invalid for ${url}`);
    t.equal(result.error, 'Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.', `Should have correct error for ${url}`);
    t.equal(result.platform, undefined, `Should have no platform for ${url}`);
  });
  
  t.end();
});

test('validateSocialMediaUrl - should reject malformed URLs', (t) => {
  const malformedUrls = [
    'not-a-url',
    'https://twitter.com/',
    'https://linkedin.com/in/',
    'https://twitter.com/user name'
  ];

  malformedUrls.forEach(url => {
    const result = validateSocialMediaUrl(url);
    t.equal(result.isValid, false, `Should be invalid for ${url}`);
    t.ok(result.error, `Should have error for ${url}`);
    t.equal(result.platform, undefined, `Should have no platform for ${url}`);
  });
  
  t.end();
});

test('validateSocialMediaUrl - should trim whitespace from URLs', (t) => {
  const result = validateSocialMediaUrl('  https://twitter.com/username  ');
  t.equal(result.isValid, true, 'Should be valid after trimming');
  t.equal(result.platform, 'twitter', 'Should detect Twitter platform');
  t.end();
});

test('getPlatformInfo - should return platform info for valid URLs', (t) => {
  const testCases: Array<{ url: string; expected: PlatformInfo }> = [
    {
      url: 'https://twitter.com/username',
      expected: {
        platform: 'twitter',
        username: 'username',
        normalizedUrl: 'https://x.com/username'
      }
    },
    {
      url: 'https://linkedin.com/in/user-name',
      expected: {
        platform: 'linkedin',
        username: 'user-name',
        normalizedUrl: 'https://linkedin.com/in/user-name'
      }
    }
  ];

  testCases.forEach(({ url, expected }) => {
    const result = getPlatformInfo(url);
    t.same(result, expected, `Should return correct info for ${url}`);
  });
  
  t.end();
});

test('getPlatformInfo - should return null for invalid URLs', (t) => {
  const invalidUrls = [
    'https://facebook.com/username',
    'not-a-url',
    '',
    'https://twitter.com/'
  ];

  invalidUrls.forEach(url => {
    t.equal(getPlatformInfo(url), null, `Should return null for ${url}`);
  });
  
  t.end();
});

test('getSupportedPlatforms - should return list of supported platforms', (t) => {
  const platforms = getSupportedPlatforms();
  t.same(platforms, ['twitter', 'linkedin'], 'Should return correct platforms');
  t.equal(platforms.length, 2, 'Should have 2 platforms');
  t.end();
});

test('isPlatformSupported - should return true for supported platforms', (t) => {
  t.equal(isPlatformSupported('twitter'), true, 'Should support Twitter');
  t.equal(isPlatformSupported('linkedin'), true, 'Should support LinkedIn');
  t.end();
});

test('isPlatformSupported - should return false for unsupported platforms', (t) => {
  t.equal(isPlatformSupported('facebook'), false, 'Should not support Facebook');
  t.equal(isPlatformSupported('instagram'), false, 'Should not support Instagram');
  t.equal(isPlatformSupported('youtube'), false, 'Should not support YouTube');
  t.equal(isPlatformSupported(''), false, 'Should not support empty string');
  t.equal(isPlatformSupported('invalid'), false, 'Should not support invalid platform');
  t.end();
});