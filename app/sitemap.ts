import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://mertcin.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const lastModified = now.toISOString();

  const routes = [
    '',
    '/about',
    '/collaborations',
    '/login',
    '/verify',
  ];

  return routes.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
