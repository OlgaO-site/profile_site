import PageEditor from '@/src/components/PageEditor'
import ProtectedRoute from '@/src/components/ProtectedRoute'

import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Create page | Admin panel'
}

export default function CreatePage() {
	return (
		<ProtectedRoute>
			<PageEditor />
		</ProtectedRoute>
	)
}
