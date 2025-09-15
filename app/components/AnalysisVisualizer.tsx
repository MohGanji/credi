'use client';

import React from 'react';
import { AnalysisSection } from '../lib/types/analysis';

interface AnalysisVisualizerProps {
  sections: AnalysisSection[];
}

interface RenderDataProps {
  data: any;
  depth?: number;
}

// Helper function to format strings with clickable links
const formatStringWithLinks = (text: string): React.ReactNode => {
  // Pattern to match [timestamp][url] or [timestamp][] at the beginning of a line
  const urlPattern = /^(\[.*?\])(\[([^\]]*)\])/;
  const match = text.match(urlPattern);

  if (match) {
    const [fullMatch, timestamp, , url] = match;
    const remainingText = text.slice(fullMatch.length);

    return (
      <>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-600 text-sm">{timestamp}</span>
          {url && url.startsWith('http') ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
            >
              Link
            </a>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-md">
              No Link
            </span>
          )}
        </div>
        {remainingText && (
          <div className="whitespace-pre-wrap">{remainingText}</div>
        )}
      </>
    );
  }

  // For regular strings without the URL pattern, preserve line breaks
  return <div className="whitespace-pre-wrap">{text}</div>;
};

// Custom Overview Component
const OverviewSection: React.FC<{ data: any }> = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const sampledPosts = data['Sampled Posts'] || '';
  const analysisDate = data['Analysis Date'] || '';
  const platform = data['Platform'] || '';
  const focusArea = data['Focus Area'] || '';

  // Get platform icon/logo (smaller size to match tags)
  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('twitter') || platformLower.includes('x')) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 bg-black text-white rounded-full text-sm font-medium">
          <span className="font-bold">𝕏</span>
        </div>
      );
    } else if (platformLower.includes('linkedin')) {
      return (
        <div className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-full text-sm font-medium">
          <span className="font-bold">in</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center px-3 py-1.5 bg-gray-400 text-white rounded-full text-sm font-medium">
        <span className="font-bold">{platform.charAt(0)}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Tags row with platform icon after date */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sampled Posts Tag */}
        {sampledPosts && (
          <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Sampled {sampledPosts}
          </div>
        )}

        {/* Analysis Date Tag */}
        {analysisDate && (
          <div className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <svg
              className="w-4 h-4 mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {analysisDate}
          </div>
        )}

        {/* Platform Icon - now inline with tags */}
        {platform && getPlatformIcon(platform)}
      </div>

      {/* Focus Area Section */}
      {focusArea && (
        <div>
          <p className="text-gray-700 leading-relaxed">
            <span className="font-medium text-gray-900">Focus Area:</span>{' '}
            {focusArea}
          </p>
        </div>
      )}
    </div>
  );
};

export default function AnalysisVisualizer({
  sections,
}: AnalysisVisualizerProps) {
  const RenderData: React.FC<RenderDataProps> = ({ data, depth = 0 }) => {
    // Handle null or undefined
    if (data == null) {
      return null;
    }

    // Handle strings - render as paragraphs with URL formatting
    if (typeof data === 'string') {
      return (
        <div className="text-gray-700 leading-relaxed">
          {formatStringWithLinks(data)}
        </div>
      );
    }

    // Handle numbers - render as text
    if (typeof data === 'number') {
      return <span className="text-gray-700">{data}</span>;
    }

    // Handle booleans - render as text
    if (typeof data === 'boolean') {
      return <span className="text-gray-700">{data ? 'Yes' : 'No'}</span>;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      // Arrays of strings become bullet lists
      if (data.length > 0 && typeof data[0] === 'string') {
        return (
          <ul className="list-disc list-inside space-y-1 ml-4">
            {data.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        );
      }

      // Arrays of objects become tables
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        // Get all unique keys from all objects for table headers
        const allKeys = Array.from(
          new Set(data.flatMap((obj) => Object.keys(obj)))
        );

        return (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  {allKeys.map((key) => (
                    <th
                      key={key}
                      className="px-4 py-2 text-left text-sm font-medium text-gray-900 border-b border-gray-200"
                    >
                      {key.charAt(0).toUpperCase() +
                        key.slice(1).replace(/_/g, ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    {allKeys.map((key) => (
                      <td
                        key={key}
                        className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200"
                      >
                        {key === 'criterion' && typeof item[key] === 'string' ? (
                          <span>No {item[key]}</span>
                        ) : (
                          <RenderData data={item[key]} depth={depth + 1} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // Arrays of mixed types - render each item
      return (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index}>
              <RenderData data={item} depth={depth + 1} />
            </div>
          ))}
        </div>
      );
    }

    // Handle objects - become headings with nested content
    if (typeof data === 'object') {
      return (
        <div className="space-y-4">
          {Object.entries(data).map(([key, value]) => {
            // Determine heading level based on depth
            const HeadingTag =
              depth === 0
                ? 'h3'
                : depth === 1
                  ? 'h4'
                  : depth === 2
                    ? 'h5'
                    : 'h6';
            const headingClasses =
              depth === 0
                ? 'text-lg font-semibold text-gray-900 mb-3'
                : depth === 1
                  ? 'text-base font-medium text-gray-800 mb-2'
                  : 'text-sm font-medium text-gray-700 mb-2';

            return (
              <div key={key} className={depth > 0 ? 'ml-4' : ''}>
                <HeadingTag className={headingClasses}>
                  {key.charAt(0).toUpperCase() +
                    key.slice(1).replace(/_/g, ' ')}
                </HeadingTag>
                <div className="ml-2">
                  <RenderData data={value} depth={depth + 1} />
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Fallback for any other type
    return <span className="text-gray-700">{String(data)}</span>;
  };

  // Find overview section data
  const overviewSection = sections.find(
    (section) => section.name.toLowerCase() === 'overview'
  );

  // Filter out overview section from regular sections
  const regularSections = sections.filter(
    (section) => section.name.toLowerCase() !== 'overview'
  );

  return (
    <div className="space-y-6">
      {/* Overview content at the top */}
      {overviewSection && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <OverviewSection data={overviewSection.data} />
        </div>
      )}

      {/* Dynamic Section Rendering */}
      {regularSections.map((section, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 capitalize border-b border-gray-200 pb-2">
            {section.name.replace(/_/g, ' ')}
          </h2>

          <div className="mt-4">
            <RenderData data={section.data} />
          </div>
        </div>
      ))}
    </div>
  );
}
