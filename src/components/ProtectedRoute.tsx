'use client'

import { useAuth } from '../contexts/AuthContext'

import Spinner from './Spinner'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth()
	const router = useRouter()

	useEffect(() => {
		if (!loading && !user) {
			router.replace('/login')
		}
	}, [user, loading, router])

	if (loading) return <Spinner />

	if (!user) return null

	return <>{children}</>
}
