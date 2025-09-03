'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  validateSocialMediaUrl,
  getPlatformInfo,
  type ValidationResult,
  type PlatformInfo,
  type SupportedPlatform
} from './lib/validation';
import { AnalysisSection } from './lib/types/analysis';

interface ProfilePreview {
  platform: SupportedPlatform;
  username: string;
  displayName: string;
  profileTitle: string;
  isPublic: boolean;
  profilePicture?: string;
}

interface AnalysisResult {
  success: boolean;
  analysisId: string;
  message: string;
  analysis: {
    id: string;
    profileUrl: string;
    platform: string;
    username: string;
    createdAt: string;
    status: string;
  };
}

// Full analysis interface for future use when we fetch complete analysis data
interface FullAnalysisResult {
  id: string;
  profileUrl: string;
  platform: string;
  username: string;
  createdAt: string;
  expiresAt: string;
  crediScore: number;
  sections: AnalysisSection[];
  processingTimeMs?: number;
  modelUsed?: string;
  tokensUsed?: number;
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Use the validation function from lib/validation.ts

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if (newUrl.trim()) {
      const result = validateSocialMediaUrl(newUrl);
      setValidationResult(result);

      if (result.isValid) {
        // Get detailed platform info for valid URLs
        const info = getPlatformInfo(newUrl);
        setPlatformInfo(info);
      } else {
        setPlatformInfo(null);
        setProfilePreview(null);
      }
    } else {
      setValidationResult(null);
      setPlatformInfo(null);
      setProfilePreview(null);
    }
  };

  const extractProfileInfo = async (url: string, platform: SupportedPlatform): Promise<ProfilePreview> => {
    setCurrentStage('Credi is verifying that the page is public');
    await new Promise(resolve => setTimeout(resolve, 500));

    setCurrentStage('Credi is extracting profile information');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Use the platform info from validation functions
    const platformInfo = getPlatformInfo(url);
    if (!platformInfo) {
      throw new Error('Unable to extract platform information');
    }

    const { username } = platformInfo;
    let displayName = '';
    let profileTitle = '';
    let profilePicture = '';

    if (platform === 'twitter') {
      displayName = `@${username}`;
      profileTitle = `${username}'s Twitter Profile`;
      profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=1da1f2&color=fff&size=128&bold=true`;
    } else if (platform === 'linkedin') {
      displayName = username.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      profileTitle = `${displayName}'s LinkedIn Profile`;
      profilePicture = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0077b5&color=fff&size=128&bold=true`;
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

    const result = validateSocialMediaUrl(url);
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

  const handleAnalyze = async () => {
    if (!profilePreview || !url) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl: url,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start analysis');
      }

      setAnalysisResult(data);
      
      // Redirect to results page after successful analysis creation
      setTimeout(() => {
        router.push(`/results/${data.analysisId}`);
      }, 2000); // Give user time to see the success message
    } catch (error) {
      console.error('Error starting analysis:', error);
      alert(`Error starting analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
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
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationResult?.isValid === false ? 'border-red-300' :
                    validationResult?.isValid === true ? 'border-green-300' : 'border-gray-300'
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

            {/* Real-time Validation Feedback */}
            {validationResult?.isValid && platformInfo && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {platformInfo.platform === 'twitter' ? 'Twitter/X' : 'LinkedIn'} profile detected
                    </p>
                    <p className="text-sm text-green-700">
                      Username: <span className="font-mono">{platformInfo.username}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Normalized URL: <span className="font-mono">{platformInfo.normalizedUrl}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Error */}
            {validationResult?.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Invalid URL</p>
                    <p className="text-sm text-red-700">{validationResult.error}</p>
                  </div>
                </div>
              </div>
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
              disabled={isAnalyzing}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAnalyzing ? 'Starting Analysis...' : 'Start Analysis'}
            </button>
          </div>
        </div>
      )}

      {/* Analysis Success Message */}
      {analysisResult && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Analysis Started Successfully!</h3>
              <p className="text-sm text-green-600">{analysisResult.message}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-800">Analysis ID</p>
                <p className="text-sm text-green-700 font-mono bg-white px-2 py-1 rounded border">
                  {analysisResult.analysisId}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Profile</p>
                <p className="text-sm text-green-700">
                  {analysisResult.analysis.username} on {analysisResult.analysis.platform}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Status</p>
                <p className="text-sm text-green-700 capitalize">{analysisResult.analysis.status}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Created</p>
                <p className="text-sm text-green-700">
                  {new Date(analysisResult.analysis.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-green-200">
              <p className="text-xs text-green-600">
                <strong>For testing:</strong> Check your database for a new analysis record with ID: {analysisResult.analysisId}
              </p>
            </div>
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