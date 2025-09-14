/**
 * Utility functions for filtering analysis data for frontend display
 */

/**
 * Filter out score fields from analysis sections for frontend display
 * Keeps the descriptive status but removes numerical scores to improve UX
 */
export function filterScoresFromSections(sections: any[]): any[] {
  return sections.map((section) => {
    if (section.name === 'criteria_evaluation' && Array.isArray(section.data)) {
      // Filter out score field from criteria evaluation items
      return {
        ...section,
        data: section.data.map((item: any) => {
          const { score, ...itemWithoutScore } = item;
          return itemWithoutScore;
        }),
      };
    }
    return section;
  });
}

/**
 * Check if sections contain score fields that should be filtered
 */
export function sectionsContainScores(sections: any[]): boolean {
  return sections.some(
    (section) =>
      section.name === 'criteria_evaluation' &&
      Array.isArray(section.data) &&
      section.data.some((item: any) => item.hasOwnProperty('score'))
  );
}
