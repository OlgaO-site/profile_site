import ResetPassword from '@/src/components/ResetPassword'

import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Login by admin panel'
}
const Login = () => {
	return (
		<main className='w-full h-full max-h-screen flex flex-col items-center justify-center'>
			<section className='w-full px-10 xl:px-14 flex flex-col gap-5 xl:gap-30 items-center justify-center mx-auto'>
				<ResetPassword />
			</section>
		</main>
	)
}
export default Login
