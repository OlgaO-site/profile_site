import AllPagesAdmin from '@/src/components/AllPagesAdmin'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function AdminPage() {
	return (
		<ProtectedRoute>
			<AllPagesAdmin />
		</ProtectedRoute>
	)
}
