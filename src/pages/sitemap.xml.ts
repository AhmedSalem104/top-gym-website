import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const escape = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const urls =
    site && import.meta.env.PUBLIC_INDEXABLE === 'true'
      ? ['ar', 'en']
          .map((locale) => `<url><loc>${escape(new URL(`/${locale}/`, site).href)}</loc></url>`)
          .join('')
      : '';
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
