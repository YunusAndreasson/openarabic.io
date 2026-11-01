// Docs/site-plan.md `URL parity`: the old admin lines are gone, so Google can see the 404 for /login.
export const GET = () => new Response('User-agent: *\nAllow: /\n\nSitemap: https://openarabic.io/sitemap.xml\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
