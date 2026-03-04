import { fetchPageBySlug } from '@/src/api/pages'
import MainComponent from '@/src/components/Main'
import NewVideoGallery from '@/src/components/NewVideoGallery'
import NotFoundComponent from '@/src/components/NotFoundComponent'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { slug: string }

export default async function SlugPage({ params }: { params: Promise<Params> }) {
	const { slug } = await params
	const page = await fetchPageBySlug(slug)

	if (!page) {
		return (
			<MainComponent>
				<NotFoundComponent />
			</MainComponent>
		)
	}

	return (
		<MainComponent>
			{/* {page.media.length > 0 && <VideoGallery media={page.media} />} */}
			{page?.media.length > 0 && <NewVideoGallery media={page.media} key={slug} />}
		</MainComponent>
	)
}
