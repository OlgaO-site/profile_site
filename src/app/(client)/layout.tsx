import '../globals.css'

import Footer from '@/src/components/Footer'
import Header from '@/src/components/Header'

import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'

export const playfairDisplay = Playfair_Display({
	variable: '--font-playfair-display',
	subsets: ['latin']
})

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Ocheretyana Olga | Videographer | Slow Travel | Europe',
	description: 'Videographer | Slow Travel | Europe'
}

export default function ClientRootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<div
			className={`${inter.variable} ${playfairDisplay.variable} antialiased flex flex-col h-dvh xl:h-full relative`}
		>
			<Header />
			{children}
			<Footer />
		</div>
	)
}
