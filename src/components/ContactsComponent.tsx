import { PageFormValues } from './PageEditor'

const ContactsComponent = ({ data }: { data: PageFormValues }) => {
	const { email, instagram, instaLink } = data

	return (
		<div className='flex flex-col justify-center w-fit xl:w-100 mt-14 xl:mt-0 mx-auto xl:mb-0'>
			<h1 className='text-[15px] xl:text-[40px] text-nav font-semibold playfair leading-none'>
				Let’s talk.
			</h1>
			<p className='text-xs xl:text-[22px] leading-none playfair my-7.5 xl:mt-11 xl:mb-10'>
				For collaborations and commissions: <br />
				<a
					href={`mailto:${email}`}
					className='hover:underline hover:underline-offset-2 hover:text-nav transform duration-300 text-nav leading-none'
				>
					{email}
				</a>
			</p>

			<p className='text-xs xl:text-[22px] leading-none playfair'>
				<span className='font-medium'>Instagram:</span> <br />
				<a
					href={instaLink}
					className='hover:underline hover:underline-offset-2 hover:text-nav transform duration-300 text-nav leading-none'
				>
					{instagram}
				</a>
			</p>
		</div>
	)
}
export default ContactsComponent
