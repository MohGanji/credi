'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  validateSocialMediaUrl,
  getPlatformInfo,
  type ValidationResult,
  type PlatformInfo,
  type SupportedPlatform,
} from './lib/validation';
import { AnalysisSection } from './lib/types/analysis';
import { useDebounce } from './lib/hooks/useDebounce';

interface ProfilePreview {
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

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const [lastInputTime, setLastInputTime] = useState<number>(0);
  const [profilePreview, setProfilePreview] = useState<ProfilePreview | null>(
    null
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [previewError, setPreviewError] = useState<{
    type:
      | 'private'
      | 'not_found'
      | 'network'
      | 'rate_limited'
      | 'invalid'
      | 'unknown';
    message: string;
    retryAfter?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Debounce URL input with 500ms delay
  const debouncedUrl = useDebounce(url, 500);

  // Debounce validation error display with longer delay
  const debouncedShowError = useDebounce(showValidationError, 1000);

  // Automatically fetch profile preview when debounced URL changes
  useEffect(() => {
    const fetchProfilePreview = async () => {
      if (!debouncedUrl.trim()) {
        setProfilePreview(null);
        setPreviewError(null);
        return;
      }

      // Validate URL first
      const validation = validateSocialMediaUrl(debouncedUrl);
      if (!validation.isValid || !validation.platform) {
        setProfilePreview(null);
        setPreviewError(null);
        return;
      }

      setIsLoadingPreview(true);
      setPreviewError(null);
      setProfilePreview(null);

      try {
        const response = await fetch(
          `/api/profile-preview?url=${encodeURIComponent(debouncedUrl)}`
        );
        const data = await response.json();

        if (!response.ok) {
          // Map HTTP status codes to error types
          let errorType:
            | 'private'
            | 'not_found'
            | 'network'
            | 'rate_limited'
            | 'invalid'
            | 'unknown' = 'unknown';

          switch (response.status) {
            case 400:
              errorType = 'invalid';
              break;
            case 403:
              errorType = 'private';
              break;
            case 404:
              errorType = 'not_found';
              break;
            case 429:
              errorType = 'rate_limited';
              break;
            case 502:
            case 503:
            case 504:
              errorType = 'network';
              break;
            default:
              errorType = 'unknown';
          }

          setPreviewError({
            type: errorType,
            message: data.error || 'Failed to fetch profile preview',
            retryAfter: data.retryAfter,
          });
          return;
        }

        if (data.success && data.profile) {
          setProfilePreview(data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile preview:', error);
        // Network errors (fetch failed completely)
        setPreviewError({
          type: 'network',
          message:
            'Network error occurred. Please check your connection and try again.',
        });
      } finally {
        setIsLoadingPreview(false);
      }
    };

    fetchProfilePreview();
  }, [debouncedUrl]);

  // Use the validation function from lib/validation.ts

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    const currentTime = Date.now();
    const timeSinceLastInput = currentTime - lastInputTime;

    // Detect if this was likely a paste operation (large change in short time)
    const isPasteOperation =
      newUrl.length > url.length + 10 && timeSinceLastInput < 100;

    setUrl(newUrl);
    setLastInputTime(currentTime);

    // Real-time validation for immediate feedback
    if (newUrl.trim()) {
      const result = validateSocialMediaUrl(newUrl);
      setValidationResult(result);

      if (result.isValid) {
        // Get detailed platform info for valid URLs
        const info = getPlatformInfo(newUrl);
        setPlatformInfo(info);
        setShowValidationError(false); // Hide error for valid URLs
      } else {
        setPlatformInfo(null);
        // Show error immediately for paste operations, otherwise wait
        if (isPasteOperation) {
          setShowValidationError(true);
        } else {
          // Reset and let the debounced effect handle showing the error
          setShowValidationError(false);
          setTimeout(() => setShowValidationError(true), 1000);
        }
      }
    } else {
      setValidationResult(null);
      setPlatformInfo(null);
      setShowValidationError(false);
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
      alert(
        `Error starting analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">Credi</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Find Credible Voices
        </p>
      </div>

      {/* URL Input Form */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="profile-url"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Social Media Profile URL
            </label>
            <div className="relative">
              <input
                type="url"
                id="profile-url"
                value={url}
                onChange={handleUrlChange}
                placeholder="https://twitter.com/username or https://linkedin.com/in/username"
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  validationResult?.isValid === false
                    ? 'border-red-300'
                    : validationResult?.isValid === true
                      ? 'border-green-300'
                      : 'border-gray-300'
                }`}
                disabled={isLoadingPreview}
              />
              {validationResult?.platform && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {validationResult.platform === 'twitter' ? (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-black">
                      <svg
                        className="w-4 h-4"
                        fill="#ffffff"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: '#0A66C2' }}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="#ffffff"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Validation Error - Only show if URL is invalid and user has stopped typing */}
            {validationResult?.error &&
              url.trim() &&
              !isLoadingPreview &&
              debouncedShowError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        Invalid URL
                      </p>
                      <p className="text-sm text-red-700">
                        {validationResult.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Loading State for Profile Preview */}
            {isLoadingPreview && (
              <p className="mt-2 text-sm text-blue-600 flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isRetrying
                  ? 'Retrying profile preview...'
                  : 'Loading profile preview...'}
              </p>
            )}

            {/* Helper text when no URL is entered */}
            {!url.trim() && !isLoadingPreview && (
              <p className="mt-2 text-sm text-gray-500">
                Enter a Twitter or LinkedIn profile URL to get started
              </p>
            )}

            {/* Preview Error */}
            {previewError && (
              <div
                className={`mt-3 p-4 border rounded-lg ${
                  previewError.type === 'private'
                    ? 'bg-orange-50 border-orange-200'
                    : previewError.type === 'not_found'
                      ? 'bg-red-50 border-red-200'
                      : previewError.type === 'network'
                        ? 'bg-blue-50 border-blue-200'
                        : previewError.type === 'rate_limited'
                          ? 'bg-purple-50 border-purple-200'
                          : previewError.type === 'invalid'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {previewError.type === 'private' ? (
                      <svg
                        className="h-5 w-5 text-orange-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : previewError.type === 'not_found' ? (
                      <svg
                        className="h-5 w-5 text-red-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : previewError.type === 'network' ? (
                      <svg
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm-11.85-6.674a.75.75 0 00-1.449-.39A7.003 7.003 0 00.989 9.75H4.23a.75.75 0 000 1.5H.989a.75.75 0 00-.75-.75V6.258a.75.75 0 001.5 0v2.43l.31-.31a5.5 5.5 0 019.201-2.466l.312.311h-2.433a.75.75 0 000 1.5h4.242a.75.75 0 00.75-.75V2.731a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.462 4.75z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : previewError.type === 'rate_limited' ? (
                      <svg
                        className="h-5 w-5 text-purple-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-medium ${
                        previewError.type === 'private'
                          ? 'text-orange-800'
                          : previewError.type === 'not_found'
                            ? 'text-red-800'
                            : previewError.type === 'network'
                              ? 'text-blue-800'
                              : previewError.type === 'rate_limited'
                                ? 'text-purple-800'
                                : previewError.type === 'invalid'
                                  ? 'text-red-800'
                                  : 'text-yellow-800'
                      }`}
                    >
                      {previewError.type === 'private'
                        ? 'Private Profile'
                        : previewError.type === 'not_found'
                          ? 'Profile Not Found'
                          : previewError.type === 'network'
                            ? 'Connection Error'
                            : previewError.type === 'rate_limited'
                              ? 'Rate Limited'
                              : previewError.type === 'invalid'
                                ? 'Invalid URL'
                                : 'Profile Preview Unavailable'}
                    </h4>
                    <p
                      className={`text-sm mt-1 ${
                        previewError.type === 'private'
                          ? 'text-orange-700'
                          : previewError.type === 'not_found'
                            ? 'text-red-700'
                            : previewError.type === 'network'
                              ? 'text-blue-700'
                              : previewError.type === 'rate_limited'
                                ? 'text-purple-700'
                                : previewError.type === 'invalid'
                                  ? 'text-red-700'
                                  : 'text-yellow-700'
                      }`}
                    >
                      {previewError.message}
                    </p>

                    {/* Action buttons based on error type */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(previewError.type === 'network' ||
                        previewError.type === 'unknown') && (
                        <button
                          onClick={async () => {
                            setIsRetrying(true);
                            setPreviewError(null);
                            setIsLoadingPreview(true);

                            try {
                              // Wait a moment to show the retry is happening
                              await new Promise((resolve) =>
                                setTimeout(resolve, 300)
                              );

                              // Retry the profile fetch
                              const response = await fetch(
                                `/api/profile-preview?url=${encodeURIComponent(url)}`
                              );
                              const data = await response.json();

                              if (!response.ok) {
                                // Map HTTP status codes to error types
                                let errorType:
                                  | 'private'
                                  | 'not_found'
                                  | 'network'
                                  | 'rate_limited'
                                  | 'invalid'
                                  | 'unknown' = 'unknown';

                                switch (response.status) {
                                  case 400:
                                    errorType = 'invalid';
                                    break;
                                  case 403:
                                    errorType = 'private';
                                    break;
                                  case 404:
                                    errorType = 'not_found';
                                    break;
                                  case 429:
                                    errorType = 'rate_limited';
                                    break;
                                  case 502:
                                  case 503:
                                  case 504:
                                    errorType = 'network';
                                    break;
                                  default:
                                    errorType = 'unknown';
                                }

                                setPreviewError({
                                  type: errorType,
                                  message:
                                    data.error ||
                                    'Failed to fetch profile preview',
                                  retryAfter: data.retryAfter,
                                });
                                return;
                              }

                              if (data.success && data.profile) {
                                setProfilePreview(data.profile);
                              }
                            } catch (error) {
                              console.error(
                                'Error retrying profile preview:',
                                error
                              );
                              setPreviewError({
                                type: 'network',
                                message:
                                  'Network error occurred. Please check your connection and try again.',
                              });
                            } finally {
                              setIsLoadingPreview(false);
                              setIsRetrying(false);
                            }
                          }}
                          disabled={isRetrying || isLoadingPreview}
                          className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded ${
                            previewError.type === 'network'
                              ? 'text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:bg-blue-50'
                              : 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200 disabled:bg-yellow-50'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            previewError.type === 'network'
                              ? 'focus:ring-blue-500'
                              : 'focus:ring-yellow-500'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isRetrying ? (
                            <>
                              <svg
                                className="animate-spin w-3 h-3 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Retrying...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3 h-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                              Retry
                            </>
                          )}
                        </button>
                      )}

                      {previewError.type === 'rate_limited' &&
                        previewError.retryAfter && (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs text-purple-700 bg-purple-100 rounded">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Try again in {previewError.retryAfter} seconds
                          </span>
                        )}
                    </div>

                    {/* Additional help text based on error type */}
                    {previewError.type === 'private' && (
                      <p className="text-xs text-orange-600 mt-2">
                        💡 Try a different public profile or check if the
                        profile settings allow public access.
                      </p>
                    )}

                    {previewError.type === 'not_found' && (
                      <p className="text-xs text-red-600 mt-2">
                        💡 Double-check the URL spelling or try searching for
                        the profile directly on the platform.
                      </p>
                    )}

                    {previewError.type === 'invalid' && (
                      <p className="text-xs text-red-600 mt-2">
                        💡 Make sure you're using a valid Twitter/X or LinkedIn
                        profile URL.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Preview - Show loading state or actual profile */}
      {(isLoadingPreview || profilePreview) &&
        validationResult?.isValid &&
        !previewError && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-4">
              {/* Profile Header */}
              <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="relative flex-shrink-0">
                  {isLoadingPreview ? (
                    // Loading state avatar
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center animate-pulse">
                      <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                  ) : (
                    // Actual profile picture
                    <>
                      {profilePreview?.profilePicture ? (
                        <img
                          src={profilePreview.profilePicture}
                          alt={`${profilePreview.displayName}'s profile picture`}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            // Fallback to platform icon if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback =
                              target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      {profilePreview?.platform === 'twitter' ? (
                        <div
                          className="w-16 h-16 bg-black rounded-full flex items-center justify-center shadow-sm"
                          style={{
                            display: profilePreview?.profilePicture
                              ? 'none'
                              : 'flex',
                          }}
                        >
                          <svg
                            className="w-8 h-8"
                            fill="#ffffff"
                            viewBox="0 0 24 24"
                          >
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center shadow-sm"
                          style={{
                            backgroundColor: '#0A66C2',
                            display: profilePreview?.profilePicture
                              ? 'none'
                              : 'flex',
                          }}
                        >
                          <svg
                            className="w-8 h-8"
                            fill="#ffffff"
                            viewBox="0 0 24 24"
                          >
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        </div>
                      )}
                    </>
                  )}

                  {/* Platform badge */}
                  {!isLoadingPreview && profilePreview && (
                    <div
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                      style={{
                        backgroundColor:
                          profilePreview.platform === 'twitter'
                            ? '#000000'
                            : '#0A66C2',
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="#ffffff"
                        viewBox="0 0 24 24"
                      >
                        {profilePreview.platform === 'twitter' ? (
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        ) : (
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        )}
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isLoadingPreview ? (
                    // Loading state content
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="h-5 bg-gray-300 rounded w-32"></div>
                        <div className="w-5 h-5 bg-gray-300 rounded"></div>
                      </div>
                      <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="flex items-center space-x-4">
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                        <div className="h-3 bg-gray-300 rounded w-16"></div>
                        <div className="h-3 bg-gray-300 rounded w-12"></div>
                      </div>
                    </div>
                  ) : profilePreview ? (
                    // Actual profile content
                    <>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {profilePreview.displayName}
                        </h4>
                        {profilePreview.verified && (
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {profilePreview.profileTitle}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {profilePreview.bio}
                      </p>

                      <div className="flex items-center mt-3 space-x-4 text-xs text-gray-500">
                        <span>
                          {profilePreview.isPublic
                            ? 'Public profile'
                            : 'Private profile'}
                        </span>
                        {profilePreview.followerCount && (
                          <>
                            <span>•</span>
                            <span>
                              {profilePreview.followerCount.toLocaleString()}{' '}
                              followers
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">
                          {profilePreview.platform}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                {isLoadingPreview ? (
                  <div className="bg-gray-300 text-transparent px-8 py-3 rounded-lg font-medium animate-pulse">
                    Analyze Profile
                  </div>
                ) : profilePreview ? (
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !profilePreview?.isPublic}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAnalyzing ? 'Starting Analysis...' : 'Analyze Profile'}
                  </button>
                ) : null}
              </div>

              {!isLoadingPreview &&
                profilePreview &&
                !profilePreview.isPublic && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      This profile appears to be private and cannot be analyzed.
                      Please try a public profile.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

      {/* Analysis Success Message */}
      {analysisResult && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Analysis Started Successfully!
              </h3>
              <p className="text-sm text-green-600">{analysisResult.message}</p>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Analysis ID
                </p>
                <p className="text-sm text-green-700 font-mono bg-white px-2 py-1 rounded border">
                  {analysisResult.analysisId}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Profile</p>
                <p className="text-sm text-green-700">
                  {analysisResult.analysis.username} on{' '}
                  {analysisResult.analysis.platform}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Status</p>
                <p className="text-sm text-green-700 capitalize">
                  {analysisResult.analysis.status}
                </p>
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
                <strong>For testing:</strong> Check your database for analysis
                record with ID: {analysisResult.analysisId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Supported Platforms */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500 mb-4">
          Currently supported platforms:
        </p>
        <div className="flex justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="#ffffff" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">Twitter / X</span>
          </div>
          <div className="flex items-center space-x-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: '#0A66C2' }}
            >
              <svg className="w-4 h-4" fill="#ffffff" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </div>
            <span className="text-sm text-gray-700">LinkedIn</span>
          </div>
        </div>
      </div>
    </div>
  );
}
