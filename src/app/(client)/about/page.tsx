import { fetchPageBySlug } from '@/src/api/pages'
import AboutComponent from '@/src/components/AboutComponent'
import BaseSection from '@/src/components/BaseSection'
import NotFoundComponent from '@/src/components/NotFoundComponent'

import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
	title: 'About'
}

export default async function About() {
	const page = await fetchPageBySlug('about')

	if (!page) {
		return (
			<main className='w-full h-full flex flex-col items-center xl:justify-center'>
				<BaseSection className='flex items-center xl:justify-center'>
					<NotFoundComponent />
				</BaseSection>
			</main>
		)
	}

	return (
		<main className='w-full h-full flex flex-col items-center xl:justify-center'>
			<BaseSection className='flex items-center xl:justify-center'>
				<AboutComponent data={page} />
			</BaseSection>
		</main>
	)
}
