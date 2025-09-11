/**
 * URL validation and platform detection for social media profiles
 * Supports Twitter/X and LinkedIn platforms
 */

export type SupportedPlatform = 'twitter' | 'linkedin';

export interface ValidationResult {
  isValid: boolean;
  platform?: SupportedPlatform;
  error?: string;
}

export interface PlatformInfo {
  platform: SupportedPlatform;
  username: string;
  normalizedUrl: string;
}

/**
 * Validates Twitter/X profile URLs
 * Supports both twitter.com and x.com domains
 */
export function validateTwitterUrl(url: string): boolean {
  const twitterPattern =
    /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
  return twitterPattern.test(url);
}

/**
 * Validates LinkedIn profile URLs
 * Supports standard LinkedIn profile format
 */
export function validateLinkedInUrl(url: string): boolean {
  const linkedinPattern =
    /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
  return linkedinPattern.test(url);
}

/**
 * Detects the platform from a URL
 * Returns the platform type if supported, null otherwise
 */
export function detectPlatform(url: string): SupportedPlatform | null {
  if (validateTwitterUrl(url)) {
    return 'twitter';
  }
  if (validateLinkedInUrl(url)) {
    return 'linkedin';
  }
  return null;
}

/**
 * Extracts username from a validated social media URL
 */
export function extractUsername(
  url: string,
  platform: SupportedPlatform
): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Validate that the URL matches the expected platform
    const detectedPlatform = detectPlatform(url);
    if (detectedPlatform !== platform) {
      throw new Error(
        `URL platform mismatch: expected ${platform}, but URL is for ${detectedPlatform || 'unknown platform'}`
      );
    }

    switch (platform) {
      case 'twitter':
        // Extract username from /username or /username/
        return pathname.replace(/^\//, '').replace(/\/$/, '');
      case 'linkedin':
        // Extract username from /in/username or /in/username/
        return pathname.replace(/^\/in\//, '').replace(/\/$/, '');
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('platform mismatch')) {
      throw error;
    }
    throw new Error(`Failed to extract username from URL: ${url}`);
  }
}

/**
 * Normalizes a social media URL to a standard format
 */
export function normalizeUrl(url: string, platform: SupportedPlatform): string {
  try {
    const urlObj = new URL(url);
    const username = extractUsername(url, platform);

    switch (platform) {
      case 'twitter':
        // Normalize to x.com format
        return `https://x.com/${username}`;
      case 'linkedin':
        // Normalize to standard LinkedIn format
        return `https://linkedin.com/in/${username}`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  } catch (error) {
    throw new Error(`Failed to normalize URL: ${url}`);
  }
}

/**
 * Main validation function that validates URL and returns platform info
 * This is the primary function to use for URL validation
 */
export function validateSocialMediaUrl(url: string): ValidationResult {
  // Check if URL is provided
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
    };
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Check if URL is empty after trimming
  if (!trimmedUrl) {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
    };
  }

  // Detect platform
  const platform = detectPlatform(trimmedUrl);

  if (!platform) {
    return {
      isValid: false,
      error:
        'Unsupported platform. Only Twitter/X and LinkedIn profiles are supported.',
    };
  }

  // Additional validation based on platform
  try {
    // Validate URL format
    new URL(trimmedUrl);

    // Extract username to ensure it's valid
    const username = extractUsername(trimmedUrl, platform);

    if (!username) {
      return {
        isValid: false,
        error: 'Invalid profile URL format. Username could not be extracted.',
      };
    }

    return {
      isValid: true,
      platform,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }
}

/**
 * Gets detailed platform information from a validated URL
 */
export function getPlatformInfo(url: string): PlatformInfo | null {
  const validation = validateSocialMediaUrl(url);

  if (!validation.isValid || !validation.platform) {
    return null;
  }

  try {
    const username = extractUsername(url, validation.platform);
    const normalizedUrl = normalizeUrl(url, validation.platform);

    return {
      platform: validation.platform,
      username,
      normalizedUrl,
    };
  } catch (error) {
    return null;
  }
}

/**
 * Gets list of supported platforms
 */
export function getSupportedPlatforms(): SupportedPlatform[] {
  return ['twitter', 'linkedin'];
}

/**
 * Checks if a platform is supported
 */
export function isPlatformSupported(
  platform: string
): platform is SupportedPlatform {
  return getSupportedPlatforms().includes(platform as SupportedPlatform);
}
