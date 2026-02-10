'use client'

import { Page, fetchAllPages } from '../api/pages'

import VideoGallery from './VideoGallery'

import { useEffect, useState } from 'react'

const ContactsGallery = () => {
	const [pages, setPages] = useState<Page[]>([])
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function load() {
			setLoading(true)
			const allPages = await fetchAllPages()
			setPages(allPages)
			setLoading(false)
		}
		load()
	}, [])

	const media = pages.find(page => page.slug === 'contacts')?.media

	if (!media) return null

	return media && <VideoGallery media={media} />
}
export default ContactsGallery
