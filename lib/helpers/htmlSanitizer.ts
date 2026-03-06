/**
 * DEPRECATED: This file is no longer used.
 * 
 * HTML sanitization now happens on the CLIENT SIDE only using htmlSanitizerClient.ts
 * 
 * - Server routes NO LONGER sanitize with isomorphic-dompurify
 * - isomorphic-dompurify has been removed from package.json
 * - Use lib/helpers/htmlSanitizerClient.ts for DOMPurify on client components
 * 
 * Migration: Import sanitizeHtmlClient from htmlSanitizerClient.ts in client components before sending to API
 */

// This file is kept for reference but should not be imported
export function sanitizeHtml(contentHtml: string | null | undefined) {
  throw new Error('sanitizeHtml is deprecated. Use sanitizeHtmlClient from htmlSanitizerClient.ts in client components instead.');
}

