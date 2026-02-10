import Logo from './Logo'
import NavBar from './NavBar'

const Header = () => {
	return (
		<header className='absolute top-0 left-0 w-full z-50 px-4'>
			<div className='w-full md:min-w-152.5 xl:max-w-200 md:w-fit flex flex-col flex-wrap md:flex-nowrap md:flex-row gap-5 items-center xl:items-baseline xl:gap-14 pt-4 lg:pt-10 mx-auto md:justify-center'>
				<Logo />
				<NavBar />
			</div>
		</header>
	)
}
export default Header
