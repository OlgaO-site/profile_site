import PageEditor from '@/src/components/PageEditor'
import ProtectedRoute from '@/src/components/ProtectedRoute'

import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Edit page | Admin panel'
}

export default async function PageByID({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	return (
		<ProtectedRoute>
			<PageEditor id={id} />
		</ProtectedRoute>
	)
}
