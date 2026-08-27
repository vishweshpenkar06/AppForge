import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://appforge.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const publicPages = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/compiler', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/demo', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.7 },
  ]

  return publicPages.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}
