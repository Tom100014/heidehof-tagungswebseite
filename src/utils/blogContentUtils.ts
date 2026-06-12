
/**
 * Utility functions for cleaning and formatting blog content
 */

export const cleanBlogContent = (content: string): string => {
  if (!content) return content;

  return content
    // Remove excessive dashes (3 or more consecutive dashes)
    .replace(/[-]{3,}/g, '')
    // Remove multiple consecutive line breaks (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remove trailing and leading whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remove empty paragraphs in HTML
    .replace(/<p>\s*<\/p>/g, '')
    // Remove empty divs
    .replace(/<div>\s*<\/div>/g, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Remove standalone hr tags that might have been created from dashes
    .replace(/<hr\s*\/?>\s*/g, '')
    .trim();
};

export const formatBlogContentForDisplay = (content: string): string => {
  const cleanedContent = cleanBlogContent(content);
  
  // Ensure proper paragraph spacing in HTML content
  return cleanedContent
    .replace(/(<\/p>)\s*(<p>)/g, '$1\n$2')
    .replace(/(<\/h[1-6]>)\s*(<p>)/g, '$1\n$2')
    .replace(/(<\/p>)\s*(<h[1-6]>)/g, '$1\n\n$2');
};

// Neue Funktion für saubere Titel-Generierung
export const generateCleanTitle = (topic: string, maxLength: number = 60): string => {
  return topic
    .replace(/[^\w\säöüßÄÖÜ\-.,!?()]/g, '')
    .substring(0, maxLength)
    .trim();
};

// Neue Funktion für SEO-optimierte Slugs
export const generateSeoSlug = (title: string, maxLength: number = 100): string => {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => {
      const replacements: Record<string, string> = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' };
      return replacements[char] || char;
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, maxLength);
};
