import Link from 'next/link'

const NotFoundComponent = () => {
	return (
		<div className='flex flex-col items-center'>
			<h1 className='text-[15px] xl:text-[40px] text-nav font-semibold playfair leading-none text-center'>
				Sorry!
			</h1>

			<p className='text-xs xl:text-[22px] leading-none playfair my-7.5 xl:mt-5 xl:mb-10 text-center '>
				Page not found
			</p>
			<Link
				href='/'
				className='text-xs xl:text-[22px] leading-none playfair text-center text-nav border border-nav py-2 px-4 rounded-lg hover:bg-nav hover:text-white transition-colors duration-300'
			>
				Go to Home
			</Link>
		</div>
	)
}
export default NotFoundComponent
