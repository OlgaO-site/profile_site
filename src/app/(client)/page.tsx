import { fetchPageBySlug } from '@/src/api/pages'
import MainComponent from '@/src/components/Main'
import NewVideoGallery from '@/src/components/NewVideoGallery'
import NotFoundComponent from '@/src/components/NotFoundComponent'

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
			{page?.media.length > 0 && <NewVideoGallery media={page.media} key={'home'} />}
		</MainComponent>
	)
}
