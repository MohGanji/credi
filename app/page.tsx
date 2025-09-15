'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  validateSocialMediaUrl,
  type ValidationResult,
} from './lib/validation';

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

interface AnalysisError {
  success: false;
  error: string;
  details: string;
  type: string;
}

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [analysisError, setAnalysisError] = useState<AnalysisError | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    // Real-time validation for immediate feedback
    if (newUrl.trim()) {
      const result = validateSocialMediaUrl(newUrl);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!validationResult?.isValid || !url) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);

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
        // Handle API error response
        setAnalysisError(data);
        return;
      }

      setAnalysisResult(data);
      setIsRedirecting(true);

      // Redirect to results page after successful analysis creation
      setTimeout(() => {
        router.push(`/results/${data.analysisId}`);
      }, 800); // Shorter delay for better UX
    } catch (error) {
      console.error('Error starting analysis:', error);
      // Handle network or other errors
      setAnalysisError({
        success: false,
        error: 'Network error occurred',
        details: 'Please check your connection and try again.',
        type: 'network_error',
      });
    } finally {
      if (!isRedirecting) {
        setIsAnalyzing(false);
      }
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
                className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationResult?.isValid === false
                  ? 'border-red-300'
                  : validationResult?.isValid === true
                    ? 'border-green-300'
                    : 'border-gray-300'
                  }`}
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

            {/* Validation Error */}
            {validationResult?.error && url.trim() && (
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

            {/* Helper text when no URL is entered */}
            {!url.trim() && (
              <p className="mt-2 text-sm text-gray-500">
                Enter a Twitter or LinkedIn profile URL to get started
              </p>
            )}
          </div>

          {/* Analyze Button */}
          {validationResult?.isValid && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isRedirecting}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRedirecting
                  ? 'Opening Results...'
                  : isAnalyzing
                    ? 'Analyzing...'
                    : 'Analyze Profile'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading Animation */}
      {isAnalyzing && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex flex-col items-center space-y-4">
            {/* Spinner Animation */}
            <div className="relative">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>

            {/* Loading Text */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Analyzing Profile
              </h3>
              <p className="text-sm text-gray-500">
                This usually takes around a minute to complete
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message for Redirect */}
      {isRedirecting && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center justify-center space-x-3">
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
            <div className="text-center">
              <h3 className="text-lg font-semibold text-green-800">
                Analysis Complete!
              </h3>
              <p className="text-sm text-green-600">
                Redirecting to your results...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Error Message */}
      {analysisError && (
        <div className="bg-white rounded-lg shadow-md p-8 mt-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">
                Analysis Failed
              </h3>
              <p className="text-sm text-red-600">{analysisError.error}</p>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="mb-3">
              <p className="text-sm font-medium text-red-800 mb-2">
                What happened?
              </p>
              <p className="text-sm text-red-700">{analysisError.details}</p>
            </div>

            <div className="pt-3 border-t border-red-200">
              <p className="text-sm font-medium text-red-800 mb-2">
                What can you do?
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Check that the profile URL is correct and accessible</li>
                <li>• Wait a few minutes and try again</li>
                <li>• Try a different profile if the issue persists</li>
              </ul>
            </div>

            <div className="mt-4 flex justify-center">
              <button
                onClick={() => {
                  setAnalysisError(null);
                  setUrl('');
                  setValidationResult(null);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
              >
                Try Another Profile
              </button>
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
