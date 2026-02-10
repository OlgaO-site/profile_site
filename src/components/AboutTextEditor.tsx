'use client'

import { db } from '@/services/firebase'

import { toast } from '../lib/toast'

import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

export type AboutFormValues = {
	firstText: string
	secondText: string
	thirdText: string
}

const AboutTextEditor = () => {
	const { register, handleSubmit, reset } = useForm<AboutFormValues>({
		defaultValues: {
			firstText: '',
			secondText: '',
			thirdText: ''
		}
	})

	// Підвантажуємо поточні контакти
	useEffect(() => {
		const loadContacts = async () => {
			const ref = doc(db, 'about_texts', 'UjlhoVtdSB1x0Mv7eCh5') // твій документ
			const snap = await getDoc(ref)
			if (snap.exists()) {
				reset(snap.data() as AboutFormValues)
			}
		}
		loadContacts()
	}, [reset])

	const onSubmit = async (data: AboutFormValues) => {
		try {
			const ref = doc(db, 'about_texts', 'UjlhoVtdSB1x0Mv7eCh5')
			await updateDoc(ref, {
				firstText: data.firstText,
				secondText: data.secondText,
				thirdText: data.thirdText
			})
			toast.success('Texts updated')
		} catch (e) {
			console.error('firebase error', e)
			toast.error('Something went wrong')
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='w-4/5 mx-auto rounded-xl border border-slate-400 shadow-2xl px-10 py-6 flex flex-col gap-4'
		>
			<h2 className='text-nav text-xl font-semibold'>About Texts</h2>

			<label className='font-semibold flex flex-col gap-y-3'>
				First text
				<input
					placeholder='First text'
					{...register('firstText', { required: true })}
					className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
				/>
			</label>

			<label className='font-semibold flex flex-col gap-y-3'>
				Second text
				<input
					placeholder='Second text'
					{...register('secondText', { required: true })}
					className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
				/>
			</label>

			<label className='font-semibold flex flex-col gap-y-3'>
				Third text
				<input
					placeholder='Third text'
					{...register('thirdText')}
					className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
				/>
			</label>

			<button type='submit' className='base-buttons w-60 h-10 mx-auto'>
				Update text
			</button>
		</form>
	)
}

export default AboutTextEditor
