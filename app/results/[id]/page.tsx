'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalysisSection } from '../../lib/types/analysis';
import AnalysisVisualizer from '../../components/AnalysisVisualizer';

interface AnalysisResult {
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

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${params.id}`);

        if (!response.ok) {
          throw new Error('Analysis not found');
        }

        const data = await response.json();
        setAnalysis(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load analysis'
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Error Loading Analysis
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <p className="text-gray-600">Analysis not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Analysis
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Credibility Analysis
              </h1>
              <p className="text-gray-600">
                {analysis.username} on{' '}
                {analysis.platform === 'twitter' ? 'Twitter/X' : 'LinkedIn'}
              </p>
            </div>
            <div
              className={`text-center p-6 rounded-xl ${getScoreBackground(analysis.crediScore)} border-2 border-opacity-20`}
            >
              <div className="text-sm font-medium text-gray-600 mb-1">
                Credi Score
              </div>
              <div
                className={`text-4xl font-bold ${getScoreColor(analysis.crediScore)}`}
              >
                {analysis.crediScore}
                <span className="text-lg text-gray-500">/10</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>
              Analysis completed:{' '}
              {new Date(analysis.createdAt).toLocaleString()}
            </p>
            <p>
              Profile URL:{' '}
              <a
                href={analysis.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {analysis.profileUrl}
              </a>
            </p>
            {analysis.processingTimeMs && (
              <p>
                Processing time: {Math.round(analysis.processingTimeMs / 1000)}s
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Analysis Visualization */}
      <AnalysisVisualizer sections={analysis.sections} />

      {/* Footer */}
      <div className="mt-8 text-center">
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Analyze Another Profile
        </button>
      </div>
    </div>
  );
}
