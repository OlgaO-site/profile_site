import { PageFormValues } from './PageEditor'

const AboutComponent = ({ data }: { data: PageFormValues }) => {
	const { firstText, secondText, thirdText } = data

	return (
		<div className='flex flex-col w-56.5 xl:w-152.5 mx-auto mt-45 xl:mb-0 xl:mt-0 playfair tracking-3!'>
			{firstText && (
				<p className='text-[15px] xl:text-[40px] font-semibold text-nav leading-none'>
					{firstText}
				</p>
			)}
			{secondText && (
				<p className='text-xs xl:text-[22px] leading-none my-7.5 xl:mt-11 xl:mb-10'>
					{secondText}
				</p>
			)}

			{secondText && <p className='text-xs xl:text-[22px] leading-none'>{thirdText}</p>}
		</div>
	)
}
export default AboutComponent
