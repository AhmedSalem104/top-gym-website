import type { APIRoute } from 'astro';
import { business } from '../config/business';
export const GET: APIRoute = ({ site }) => {
  const escape = (s: string) =>
    s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const locales = ['ar', 'en'] as const;
  const urls =
    site && import.meta.env.PUBLIC_INDEXABLE === 'true'
      ? locales
          .map((locale) => {
            const loc = escape(new URL(`/${locale}/`, site).href);
            const alternates = [
              ...locales.map(
                (language) =>
                  `<xhtml:link rel="alternate" hreflang="${language === 'ar' ? 'ar-EG' : 'en'}" href="${escape(new URL(`/${language}/`, site).href)}"/>`,
              ),
              `<xhtml:link rel="alternate" hreflang="x-default" href="${escape(new URL(`/${business.defaultLocale}/`, site).href)}"/>`,
            ].join('');
            return `<url><loc>${loc}</loc>${alternates}</url>`;
          })
          .join('')
      : '';
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
