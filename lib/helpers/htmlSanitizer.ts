import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes an HTML string and returns a truncated plaintext excerpt.
 * Copied verbatim from documents/create/route.ts and documents/[id]/route.ts.
 */
export function sanitizeHtml(contentHtml: string | null | undefined): {
  safeContentHtml: string | null;
  contentExcerpt: string | null;
} {
  if (!contentHtml) {
    return { safeContentHtml: null, contentExcerpt: null };
  }

  const safeContentHtml = DOMPurify.sanitize(contentHtml);

  // Regex is strictly for plaintext excerpt extraction. HTML content is sterilized by DOMPurify.
  const contentExcerpt = safeContentHtml
    ? safeContentHtml.replace(/<[^>]+>/g, '').substring(0, 250)
    : null;

  return { safeContentHtml, contentExcerpt };
}
