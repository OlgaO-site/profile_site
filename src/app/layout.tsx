import './globals.css'

import { Inter, Playfair_Display } from 'next/font/google'

export const playfairDisplay = Playfair_Display({
	variable: '--font-playfair-display',
	subsets: ['latin']
})

const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang='en' className={inter.className}>
			<body
				className={`${inter.variable} ${playfairDisplay.variable} antialiased h-screen overflow-hidden relative`}
			>
				{children}
			</body>
		</html>
	)
}
