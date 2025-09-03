'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnalysisSection } from '../../lib/types/analysis';

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

interface CriteriaEvaluation {
  status: "pass" | "warning" | "fail";
  evaluation: string;
  examples?: string[];
}

interface RepresentativePost {
  content: string;
  timestamp: string;
  url: string;
  reasoning: string;
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnalysis();
    }
  }, [params.id]);

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

  const getCriteriaStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'fail': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const renderSectionData = (data: any): JSX.Element => {
    if (typeof data === 'string') {
      return <p className="text-gray-700">{data}</p>;
    }
    
    if (Array.isArray(data)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {data.map((item, index) => (
            <li key={index} className="text-gray-700">{item}</li>
          ))}
        </ul>
      );
    }
    
    if (typeof data === 'object' && data !== null) {
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
              <div className="ml-4">
                {renderSectionData(value)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return <span className="text-gray-700">{String(data)}</span>;
  };

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
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analysis</h2>
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
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Analysis
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Credibility Analysis</h1>
              <p className="text-gray-600">
                {analysis.username} on {analysis.platform === 'twitter' ? 'Twitter/X' : 'LinkedIn'}
              </p>
            </div>
            <div className={`text-right p-4 rounded-lg ${getScoreBackground(analysis.crediScore)}`}>
              <div className="text-sm text-gray-600 mb-1">Credi Score</div>
              <div className={`text-3xl font-bold ${getScoreColor(analysis.crediScore)}`}>
                {analysis.crediScore}/10
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>Analysis completed: {new Date(analysis.createdAt).toLocaleString()}</p>
            <p>Profile URL: <a href={analysis.profileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{analysis.profileUrl}</a></p>
            {analysis.processingTimeMs && (
              <p>Processing time: {Math.round(analysis.processingTimeMs / 1000)}s</p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Sections */}
      <div className="space-y-6">
        {analysis.sections.map((section, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize">
              {section.name.replace(/_/g, ' ')}
            </h2>
            
            {section.name === 'criteria_evaluation' ? (
              // Special rendering for criteria evaluation
              <div className="space-y-4">
                {Object.entries(section.data as Record<string, CriteriaEvaluation>).map(([criterion, evaluation]) => (
                  <div key={criterion} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{criterion}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCriteriaStatusColor(evaluation.status)}`}>
                        {evaluation.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">{evaluation.evaluation}</p>
                    {evaluation.examples && evaluation.examples.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Examples:</p>
                        <ul className="list-disc list-inside text-xs text-gray-600">
                          {evaluation.examples.map((example, idx) => (
                            <li key={idx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : section.name === 'representative_posts' ? (
              // Special rendering for representative posts
              <div className="space-y-4">
                {Object.entries(section.data as Record<string, RepresentativePost[]>).map(([category, posts]) => (
                  <div key={category}>
                    <h3 className="font-medium text-gray-900 mb-3">{category}</h3>
                    <div className="space-y-3">
                      {posts.map((post, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-800 mb-2">{post.content}</p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>{post.timestamp}</span>
                            <a href={post.url} className="text-blue-600 hover:underline">View Post</a>
                          </div>
                          <p className="text-xs text-gray-600 mt-2 italic">{post.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Default rendering for other sections
              <div className="space-y-3">
                {Object.entries(section.data).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="font-medium text-gray-900 mb-2">{key}</h3>
                    <div className="ml-4">
                      {renderSectionData(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

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