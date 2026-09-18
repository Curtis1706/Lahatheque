import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lahatheque.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/catalog',
          '/catalog/*',
          '/pricing',
          '/subscriptions',
          '/universities',
          '/partners',
          '/authors',
          '/prestations',
          '/about',
          '/contact',
          '/legal',
          '/cgu',
          '/cgv',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/student/',
          '/author/',
          '/publisher/',
          '/librarian/',
          '/legal-reviewer/',
          '/layout-artist/',
          '/chief-layout/',
          '/manager/',
          '/wholesaler/',
          '/read/',
          '/catalog/reader/',
          '/cart',
          '/checkout',
        ],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
  };
}
