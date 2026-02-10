'use client'

import { Page, fetchAllPages } from '../api/pages'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const FooterNav = () => {
	const [pages, setPages] = useState<Page[]>([])
	const pathName = usePathname()

	useEffect(() => {
		async function load() {
			const allPages = await fetchAllPages()
			setPages(allPages)
		}
		load()
	}, [])

	if (!pages.length) return null

	const isActive = (url: string) => pathName === `/${url}`

	const navItems = pages
		.filter(p => p.isPublish && p.isFooter)
		.sort((a, b) => {
			if (a.number !== b.number) {
				return a.number - b.number
			}
			return a.title.localeCompare(b.title)
		})

	return (
		<nav className='w-full flex flex-wrap items-center gap-x-8 xl:gap-x-12 gap-y-3 xl:min-w-78 justify-center mx-auto'>
			{navItems.map(item => (
				<Link
					key={item.title}
					href={item.slug}
					className={`tracking-5 xl:text-lg hover:text-nav leading-none transform duration-300 ${
						isActive(item.slug) ? 'text-nav' : ''
					}`}
				>
					{item.title}
				</Link>
			))}
		</nav>
	)
}

export default FooterNav
