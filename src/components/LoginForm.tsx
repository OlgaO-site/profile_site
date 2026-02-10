'use client'

import { login } from '../services/auth'

import { toast } from '@/src/lib/toast'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'

type FormValues = {
	email: string
	password: string
}

export function LoginForm() {
	const { register, handleSubmit } = useForm<FormValues>()
	const router = useRouter()

	const onSubmit = async (data: FormValues) => {
		try {
			const user = await login(data.email, data.password)
			toast.success('Авторизація успішна:')
			console.log(user)
			// наприклад, можна робити редірект в адмінку
			router.push('/admin')
		} catch (error) {
			toast.error(`Помилка авторизації: Не правильний логін або пароль`)
			console.error('Помилка авторизації:', error)
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='w-full xl:w-1/3 h-fit flex flex-col gap-6 mx-auto p-10 rounded-2xl shadow-2xl bg-slate-100 '
		>
			<label className='flex flex-col gap-2 font-semibold'>
				Email
				<input
					placeholder='Email'
					{...register('email', { required: true })}
					className='pl-2 py-0.5 rounded-lg'
				/>
			</label>
			<label className='flex flex-col gap-2 font-semibold'>
				Password
				<input
					placeholder='Password'
					type='password'
					{...register('password', { required: true })}
					className='pl-2 py-0.5 rounded-lg'
				/>
			</label>
			<button type='submit' className='w-40 h-10 px-4 py-2 base-buttons mx-auto'>
				Login
			</button>
			<Link href='/reset-password' className='w-60 h-10 px-4 py-2 base-buttons mx-auto'>
				Reset password
			</Link>
		</form>
	)
}
