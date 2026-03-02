import { baseUrl } from '../utils/constants'

import { fetchAllPages } from '@/src/api/pages'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const staticPages = [
		{
			url: baseUrl,
			lastModified: new Date()
		}
	]

	const pages = await fetchAllPages()

	const dynamicPages = pages
		.filter(page => page.slug && page.slug !== 'home')
		.map(page => ({
			url: `${baseUrl}/${page.slug}`,
			lastModified: new Date()
		}))

	const allPages = [...staticPages, ...dynamicPages]

	const uniquePages = Array.from(new Map(allPages.map(page => [page.url, page])).values())

	return uniquePages
}
