import type { APIRoute } from 'astro';
export const GET: APIRoute = ({ site }) => {
  const publicSite = site && import.meta.env.PUBLIC_INDEXABLE === 'true';
  return new Response(
    publicSite
      ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
      : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
};
