import { fetchPageBySlug } from '@/src/api/pages'
import MainComponent from '@/src/components/Main'
import VideoGallery from '@/src/components/VideoGallery'


export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { slug: string }

export default async function SlugPage({ params }: { params: Promise<Params> }) {
	const { slug } = await params
	const page = await fetchPageBySlug(slug)

	if (!page) {
		return (
			<MainComponent>
				<p>Сторінку не знайдено</p>
			</MainComponent>
		)
	}

	return (
		<MainComponent>
			{page.media.length > 0 && <VideoGallery media={page.media} />}
		</MainComponent>
	)
}
