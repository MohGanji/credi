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
                        <RenderData data={item[key]} depth={depth + 1} />
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

  return (
    <div className="space-y-6">
      {/* Dynamic Section Rendering */}
      {sections.map((section, index) => (
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
