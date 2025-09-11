'use client';

import React from 'react';
import { AnalysisSection } from '../lib/types/analysis';

interface AnalysisVisualizerProps {
  sections: AnalysisSection[];
  crediScore: number;
}

interface RenderDataProps {
  data: any;
  depth?: number;
}

export default function AnalysisVisualizer({
  sections,
  crediScore,
}: AnalysisVisualizerProps) {
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

  const RenderData: React.FC<RenderDataProps> = ({ data, depth = 0 }) => {
    // Handle null or undefined
    if (data == null) {
      return null;
    }

    // Handle strings - render as paragraphs
    if (typeof data === 'string') {
      return <p className="text-gray-700 leading-relaxed">{data}</p>;
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
      {/* Prominent Credi Score Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Credibility Analysis Results
            </h2>
            <p className="text-gray-600">
              Based on comprehensive content evaluation
            </p>
          </div>
          <div
            className={`text-center p-6 rounded-xl ${getScoreBackground(crediScore)} border-2 border-opacity-20`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">
              Credi Score
            </div>
            <div className={`text-4xl font-bold ${getScoreColor(crediScore)}`}>
              {crediScore}
              <span className="text-lg text-gray-500">/10</span>
            </div>
          </div>
        </div>
      </div>

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
