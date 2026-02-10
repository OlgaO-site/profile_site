import { playfairDisplay } from '@/src/app/(client)/layout'

import Link from 'next/link'

const Logo = () => {
	return (
		<Link
			className={`text-lg xl:text-2xl font-semibold text-nav leading-none! uppercase tracking-5! ${playfairDisplay.className}`}
			href={'/'}
		>
			Ocheretyana
		</Link>
	)
}
export default Logo
