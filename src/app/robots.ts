import { baseUrl } from '../utils/constants'

import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: ['/admin', '/api', '/reset-password', '/login']
		},
		sitemap: `${baseUrl}/sitemap.xml`
	}
}
