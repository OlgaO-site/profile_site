'use client'

import { auth } from '@/services/firebase'

import { toast } from '../lib/toast'

import { sendPasswordResetEmail } from 'firebase/auth'
import { useState } from 'react'

const ResetPassword = () => {
	const [email, setEmail] = useState('')
	const [loading, setLoading] = useState(false)

	const handleReset = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(true)

		try {
			await sendPasswordResetEmail(auth, email)
			toast.info('Лист для відновлення пароля надіслано')
		} catch (err) {
			console.log(err)
			toast.error('Не вдалося надіслати лист. Спробуй пізніше.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<form
			onSubmit={handleReset}
			className='w-full xl:w-1/3 h-fit flex flex-col gap-7 mx-auto p-10 rounded-2xl shadow-2xl bg-slate-100 '
		>
			<h1 className='text-xl text-nav font-semibold text-center'>
				For reset password enter your email
			</h1>

			<input
				type='email'
				placeholder='Email'
				value={email}
				onChange={e => setEmail(e.target.value)}
				required
				className='pl-0.5 py-0.5 rounded-lg'
			/>

			<button
				type='submit'
				disabled={loading}
				className='w-60 h-10 px-4 py-2 base-buttons mx-auto'
			>
				{loading ? 'Sending' : 'Send email'}
			</button>
		</form>
	)
}

export default ResetPassword
