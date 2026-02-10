import FooterNav from './FooterNav'

const Footer = () => {
	return (
		<footer className='absolute bottom-0 left-0 w-full z-50 px-4'>
			<div className='w-full xl:w-152.5 flex flex-col gap-5 items-center pb-4 lg:pb-6 mx-auto'>
				<FooterNav />
			</div>
		</footer>
	)
}

export default Footer
