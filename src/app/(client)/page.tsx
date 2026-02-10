import { fetchPageBySlug } from '@/src/api/pages'
import MainComponent from '@/src/components/Main'
import VideoGallery from '@/src/components/VideoGallery'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Main() {
	const page = await fetchPageBySlug('home')

	if (!page) {
		return (
			<MainComponent>
				<p>Сторінку не знайдено</p>
			</MainComponent>
		)
	}

	return (
		<MainComponent>
			{page?.media.length > 0 && <VideoGallery media={page.media} />}
		</MainComponent>
	)
}
