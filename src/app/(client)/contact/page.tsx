import { fetchPageBySlug } from '@/src/api/pages'
import BaseSection from '@/src/components/BaseSection'
import ContactsComponent from '@/src/components/ContactsComponent'
import NotFoundComponent from '@/src/components/NotFoundComponent'

import { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
	title: 'Contacts'
}

export default async function Contacts() {
	const page = await fetchPageBySlug('contact')

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
		<main className='w-full h-full flex flex-col gap-y-10 items-center xl:justify-center'>
			<BaseSection className='flex items-center mt-25 xl:mt-0'>
				<ContactsComponent data={page} />
			</BaseSection>
		</main>
	)
}
