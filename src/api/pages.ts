import { db } from '@/services/firebase'

import { MediaItem } from '../components/VideoGallery'
import { PageValues } from '../components/PageEditor'

import { collection, getDocs, query, where } from 'firebase/firestore'

export type Page = PageValues & { id: string; media: MediaItem[] }

export async function fetchAllPages(): Promise<Page[]> {
	const querySnap = await getDocs(collection(db, 'pages'))
	const allPages = querySnap.docs.map(doc => ({
		id: doc.id,
		...doc.data()
	})) as Page[]
	return allPages
}

export async function fetchPageBySlug(slug: string): Promise<Page | null> {
	const pagesRef = collection(db, 'pages')
	const q = query(pagesRef, where('slug', '==', slug))
	const querySnap = await getDocs(q)

	if (querySnap.empty) {
		return null // сторінка не знайдена
	}

	const docData = querySnap.docs[0]
	const page: Page = {
		id: docData.id,
		...docData.data()
	} as Page

	return page
}
