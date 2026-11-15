import type { APIRoute } from 'astro';
import { SITE } from '@/config/site';
import { visibleProjects } from '@/lib/projects';

// Hand-written sitemap: no integration dependency for a site with a handful of routes.
export const GET: APIRoute = async () => {
  const { all } = await visibleProjects();
  const paths = ['/', '/work/', '/about/', '/contact/', ...all.map((p) => `/work/${p.id}/`)];
  const urls = paths
    .map((p) => `  <url><loc>${new URL(p, SITE.url.value).href}</loc></url>`)
    .join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
