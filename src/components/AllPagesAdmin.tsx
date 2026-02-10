'use client'
import { fetchAllPages } from '../api/pages'
import { toast } from '../lib/toast'
import { db } from '../services/firebase'

import BaseSection from './BaseSection'
import { PageFormValues } from './PageEditor'
import Spinner from './Spinner'

import { deleteDoc, doc } from 'firebase/firestore'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type Page = PageFormValues & { id: string }
const AllPagesAdmin = () => {
	const [pages, setPages] = useState<Page[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function load() {
			setLoading(true)
			const allPages = await fetchAllPages()
			setPages(allPages)
			setLoading(false)
		}
		load()
	}, [])

	if (loading) return <Spinner />

	const handleDelete = async (id: string) => {
		try {
			const confirmDelete = confirm('Are you sure you want to delete this page?')
			if (!confirmDelete) return

			await deleteDoc(doc(db, 'pages', id))
			// оновлюємо локальний стейт, щоб сторінка зникла без перезавантаження
			setPages(prev => prev.filter(p => p.id !== id))
			toast.success('Page deleted')
		} catch (e) {
			console.error('Delete error', e)
			toast.error('Failed to delete page')
		}
	}

	const pagesSorted = pages.sort((a, b) => {
		if (a.number !== b.number) {
			return a.number - b.number
		}
		return a.title.localeCompare(b.title)
	})

	return (
		<BaseSection className='flex flex-col gap-y-10'>
			{pages.length === 0 ? (
				<p>No pages yet</p>
			) : (
				<>
					<h2 className='text-2xl text-nav text-center font-bold'>All pages</h2>
					{pagesSorted.map(page => (
						<div
							key={page.id}
							className='w-4/5 xl:3/5 flex items-center justify-between gap-x-10 mx-auto border-b border-b-dark-purple'
						>
							<Link
								href={`/${page.slug === 'home' ? '/' : page.slug}`}
								className='hover:text-nav transform duration-300'
							>
								{page.title}
							</Link>
							<div className='flex items-center gap-x-5'>
								{page.title !== 'Contact' &&
									page.title !== 'Home' &&
									page.title !== 'About' && (
										<button
											onClick={() => handleDelete(page.id)}
											className='hover:text-dark-purple transform duration-300 cursor-pointer font-semibold'
										>
											Delete
										</button>
									)}
								<Link
									href={`/admin/page_editor/${page.id}`}
									className='hover:text-nav transform duration-300 font-semibold'
								>
									Edit
								</Link>
							</div>
						</div>
					))}
				</>
			)}

			{/* <Link href='/admin/page_editor' className='w-2/5 h-10 base-buttons mx-auto mt-10'>
				Add page
			</Link> */}
		</BaseSection>
	)
}
export default AllPagesAdmin
