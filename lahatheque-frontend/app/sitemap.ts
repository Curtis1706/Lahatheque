import { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lahatheque.com').replace(/\/$/, '');
const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Pages institutionnelles et vitrines prioritaires
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/subscriptions`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/universities`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/partners`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/authors`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/prestations`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/legal`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cgu`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cgv`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Récupération dynamique des ouvrages publiés du catalogue
  try {
    const res = await fetch(`${API_URL}/v1/catalog/books/?page_size=200`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const json = await res.json();
      const books = Array.isArray(json) ? json : json.data || json.results || [];

      const bookRoutes: MetadataRoute.Sitemap = books
        .filter((b: any) => b && b.id)
        .map((b: any) => ({
          url: `${SITE_URL}/catalog/${b.slug || b.id}`,
          lastModified: b.updated_at ? new Date(b.updated_at) : currentDate,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));

      return [...staticRoutes, ...bookRoutes];
    }
  } catch (error) {
    // Fallback silencieux vers les routes statiques si le backend n'est pas joignable au moment du build
    console.warn('[Sitemap] Impossible de charger les livres dynamiques:', error);
  }

  return staticRoutes;
}
