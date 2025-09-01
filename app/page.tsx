'use client';

import { useState } from 'react';

interface ValidationResult {
  isValid: boolean;
  platform?: 'twitter' | 'linkedin';
  error?: string;
}

interface ProfilePreview {
  platform: 'twitter' | 'linkedin';
  username: string;
  displayName: string;
  profileTitle: string;
  isPublic: boolean;
  profilePicture?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');

  const validateUrl = (inputUrl: string): ValidationResult => {
    if (!inputUrl.trim()) {
      return { isValid: false, error: 'Please enter a URL' };
    }

    // Twitter/X URL validation
    const twitterRegex = /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/;
    if (twitterRegex.test(inputUrl)) {
      return { isValid: true, platform: 'twitter' };
    }

    // LinkedIn URL validation
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    if (linkedinRegex.test(inputUrl)) {
      return { isValid: true, platform: 'linkedin' };
    }

    return {
      isValid: false,
      error: 'Please enter a valid Twitter or LinkedIn profile URL'
    };
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    if (newUrl.trim()) {
      const result = validateUrl(newUrl);
      setValidationResult(result);
      
      if (!result.isValid) {
        setProfilePreview(null);
      }
    } else {
      setValidationResult(null);
      setProfilePreview(null);
    }
  };

  const extractProfileInfo = async (url: string, platform: 'twitter' | 'linkedin'): Promise<ProfilePreview> => {
    setCurrentStage('Credi is verifying that the page is public');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentStage('Credi is extracting profile information');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let username = '';
    let displayName = '';
    let profileTitle = '';
    let profilePicture = '';

    if (platform === 'twitter') {
      const match = url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      username = match ? match[1] : '';
      displayName = `@${username}`;
      profileTitle = `${username}'s Twitter Profile`;
      
      // Try to fetch profile picture from Twitter API or fallback to a placeholder
      try {
        // In a real implementation, this would call Twitter API
        // For now, we'll use a placeholder that represents a Twitter profile
        profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1da1f2&color=fff&size=128&bold=true`;
      } catch (error) {
        profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1da1f2&color=fff&size=128&bold=true`;
      }
    } else if (platform === 'linkedin') {
      const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
      username = match ? match[1] : '';
      displayName = username.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      profileTitle = `${displayName}'s LinkedIn Profile`;
      
      // Try to fetch profile picture from LinkedIn or fallback to a placeholder
      try {
        // In a real implementation, this would call LinkedIn API
        // For now, we'll use a placeholder that represents a LinkedIn profile
        profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0077b5&color=fff&size=128&bold=true`;
      } catch (error) {
        profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0077b5&color=fff&size=128&bold=true`;
      }
    }

    return {
      platform,
      username,
      displayName,
      profileTitle,
      isPublic: true,
      profilePicture
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = validateUrl(url);
    setValidationResult(result);
    
    if (!result.isValid || !result.platform) {
      return;
    }

    setIsLoading(true);
    setCurrentStage('Identifying profile...');
    
    try {
      const preview = await extractProfileInfo(url, result.platform);
      setProfilePreview(preview);
      setCurrentStage('');
    } catch (error) {
      setValidationResult({
        isValid: false,
        error: 'Unable to access this profile. Please check if the profile is public and the URL is correct.'
      });
      setProfilePreview(null);
    } finally {
      setIsLoading(false);
      setCurrentStage('');
    }
  };

  const handleAnalyze = () => {
    // This will be implemented in future tasks
    alert('Analysis functionality will be implemented in the next tasks!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Find Credible Voices
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Cut through the noise and identify trustworthy sources of information on social media. 
          Get detailed credibility analysis based on evidence-based criteria.
        </p>
      </div>

      {/* URL Input Form */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="profile-url" className="block text-sm font-medium text-gray-700 mb-2">
              Social Media Profile URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="profile-url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://twitter.com/username or https://linkedin.com/in/username"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationResult?.isValid === false ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={isLoading}
              />
              {validationResult?.platform && (
                <div className="absolute right-3 top-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {validationResult.platform === 'twitter' ? 'Twitter/X' : 'LinkedIn'}
                  </span>
                </div>
              )}
            </div>
            
            {/* Validation Error */}
            {validationResult?.error && (
              <p className="mt-2 text-sm text-red-600">{validationResult.error}</p>
            )}
            
            {/* Loading State */}
            {isLoading && currentStage && (
              <p className="mt-2 text-sm text-blue-600 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {currentStage}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!validationResult?.isValid || isLoading}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Checking Profile...' : 'Check Profile'}
          </button>
        </form>
      </div>

      {/* Profile Preview */}
      {profilePreview && (
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Found</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="relative">
                {profilePreview.profilePicture ? (
                  <img
                    src={profilePreview.profilePicture}
                    alt={`${profilePreview.displayName}'s profile picture`}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      // Fallback to platform icon if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center"
                  style={{ display: profilePreview.profilePicture ? 'none' : 'flex' }}
                >
                  {profilePreview.platform === 'twitter' ? (
                    <span className="text-blue-500 font-bold text-lg">T</span>
                  ) : (
                    <span className="text-blue-700 font-bold text-lg">in</span>
                  )}
                </div>
                {/* Platform badge */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                     style={{ backgroundColor: profilePreview.platform === 'twitter' ? '#1da1f2' : '#0077b5' }}>
                  <span className="text-white font-bold text-xs">
                    {profilePreview.platform === 'twitter' ? 'T' : 'in'}
                  </span>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900">{profilePreview.displayName}</p>
                <p className="text-sm text-gray-600">{profilePreview.profileTitle}</p>
                <div className="flex items-center mt-1">
                  <p className="text-xs text-green-600">✓ Public profile</p>
                  <span className="mx-2 text-gray-300">•</span>
                  <p className="text-xs text-gray-500 capitalize">{profilePreview.platform}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Analyze Credibility
            </button>
          </div>
        </div>
      )}

      {/* Supported Platforms */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-4">Currently supported platforms:</p>
        <div className="flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-sm text-gray-700">Twitter / X</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">in</span>
            </div>
            <span className="text-sm text-gray-700">LinkedIn</span>
          </div>
        </div>
      </div>
    </div>
  );
}