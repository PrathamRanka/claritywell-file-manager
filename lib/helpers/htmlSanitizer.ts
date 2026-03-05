import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(contentHtml: string | null | undefined): {
  safeContentHtml: string | null;
  contentExcerpt: string | null;
} {
  if (!contentHtml) {
    return { safeContentHtml: null, contentExcerpt: null };
  }

  const safeContentHtml = DOMPurify.sanitize(contentHtml);
  const contentExcerpt = safeContentHtml
    ? safeContentHtml.replace(/<[^>]+>/g, '').substring(0, 250)
    : null;

  return { safeContentHtml, contentExcerpt };
}
