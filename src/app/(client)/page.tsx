import { fetchPageBySlug } from '@/src/api/pages'
import MainComponent from '@/src/components/Main'
import NotFoundComponent from '@/src/components/NotFoundComponent'
import VideoGalleryStableFade from '@/src/components/VideoGalleryStableFade'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Main() {
	const page = await fetchPageBySlug('home')

	if (!page) {
		return (
			<MainComponent>
				<NotFoundComponent />
			</MainComponent>
		)
	}

	return (
		<MainComponent>
			{/* {page?.media.length > 0 && <VideoGallery media={page.media} />} */}
			{page?.media.length > 0 && <VideoGalleryStableFade media={page.media} />}
		</MainComponent>
	)
}
