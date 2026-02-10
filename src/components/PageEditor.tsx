'use client'

import { db } from '@/services/firebase'

import { toast } from '../lib/toast'

import { addDoc, collection, doc, getDoc, updateDoc } from 'firebase/firestore'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'

export type PageType = 'default' | 'about' | 'contacts'

export type MediaItemForm = {
	name: string
	type: 'video' | 'photo'
	url: string | File
}

export type PageValues = {
	title: string
	slug: string
	seo_title: string
	seo_description: string
	description: string
	isPublish: boolean
	isFooter: boolean
	number: number
}

export type PageFormValues = PageValues & {
	media?: MediaItemForm[]

	// about
	firstText?: string
	secondText?: string
	thirdText?: string

	// contacts
	email?: string
	instagram?: string
	instaLink?: string
}

const PageEditor = ({ id }: { id?: string }) => {
	const {
		register,
		control,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { defaultValues, errors }
	} = useForm<PageFormValues>({
		defaultValues: {
			title: '',
			slug: '',
			seo_title: '',
			seo_description: '',
			description: '',
			isPublish: true,
			isFooter: false,
			number: 1,
			media: [{ name: '', type: 'video', url: '' }],
			firstText: '',
			secondText: '',
			thirdText: '',
			email: '',
			instagram: '',
			instaLink: ''
		}
	})

	const [replaceMode, setReplaceMode] = useState<Record<number, boolean>>({})
	const [isUploading, setIsUploading] = useState(false)
	const [isLoaded, setIsLoaded] = useState(!id)
	const fileRefs = useRef<(HTMLInputElement | null)[]>([])

	const slug = watch('slug')

	const isAbout = slug === 'about'
	const isContacts = slug === 'contact' || slug === 'contacts'
	const isDefaultPage = !isAbout && !isContacts

	// slug автогенерація
	useEffect(() => {
		const subscription = watch((value, { name }) => {
			if (name === 'title') {
				const title = value.title ?? ''
				const slug = title
					.toLowerCase()
					.trim()
					.replace(/\s+/g, '-')
					.replace(/[^\w-]+/g, '')
				setValue('slug', slug)
			}
		})
		return () => subscription.unsubscribe()
	}, [watch, setValue])

	const {
		fields: mediaFields,
		append: addMedia,
		remove: removeMedia
	} = useFieldArray({
		control,
		name: 'media'
	})

	// Завантаження для редагування
	useEffect(() => {
		if (!id) return
		async function load() {
			const ref = doc(db, 'pages', id as string)
			const snap = await getDoc(ref)
			if (snap.exists()) {
				const data = snap.data() as PageFormValues
				reset(data)
				setIsLoaded(true)
				const initialReplace: Record<number, boolean> = {}

				if (data.media) {
					data.media.forEach((_, idx) => {
						initialReplace[idx] = false
					})
				}

				setReplaceMode(initialReplace)
			}
		}
		load()
	}, [id, reset])

	const uploadToR2 = async (file: File): Promise<string> => {
		const res = await fetch('/api/r2/upload-url', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				filename: file.name,
				contentType: file.type
			})
		})

		if (!res.ok) throw new Error('Failed to get upload URL')

		const { uploadUrl, publicUrl } = await res.json()

		const uploadRes = await fetch(uploadUrl, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type
			}
		})

		if (!uploadRes.ok) throw new Error('Upload failed')

		return publicUrl
	}

	const onSubmit = async (data: PageFormValues) => {
		// validation for about page
		if (isAbout) {
			if (!data.firstText && !data.secondText && !data.thirdText) {
				toast.error('About page must contain at least one text block')
				setIsUploading(false)
				return
			}
		}

		// validation for contacts page
		if (isContacts) {
			if (!data.email && !data.instagram && !data.instaLink) {
				toast.error('Contacts page must contain at least one contact field')
				setIsUploading(false)
				return
			}
		}

		try {
			setIsUploading(true)

			let preparedMedia: MediaItemForm[] | undefined = undefined

			if (isDefaultPage && data.media) {
				preparedMedia = await Promise.all(
					data.media.map(async m => {
						if (m.url instanceof File) {
							const uploadedUrl = await uploadToR2(m.url)
							return { ...m, url: uploadedUrl }
						}
						return m
					})
				)
			}

			// const preparedData: PageFormValues = {
			// 	...data,
			// 	...(isDefaultPage ? { media: preparedMedia } : {})
			// }

			const preparedData: PageFormValues = {
				title: data.title,
				slug: data.slug,
				seo_title: data.seo_title,
				seo_description: data.seo_description,
				description: data.description,
				isPublish: data.isPublish,
				isFooter: data.isFooter,
				number: data.number
			}

			if (isDefaultPage) {
				preparedData.media = preparedMedia
			}

			if (isAbout) {
				if (data.firstText) preparedData.firstText = data.firstText
				if (data.secondText) preparedData.secondText = data.secondText
				if (data.thirdText) preparedData.thirdText = data.thirdText
			}

			if (isContacts) {
				if (data.email) preparedData.email = data.email
				if (data.instagram) preparedData.instagram = data.instagram
				if (data.instaLink) preparedData.instaLink = data.instaLink
			}

			if (id) {
				await updateDoc(doc(db, 'pages', id), preparedData)
				toast.success('Page updated')
			} else {
				await addDoc(collection(db, 'pages'), preparedData)
				toast.success('Page created')
			}

			reset(preparedData)
		} catch (e) {
			console.error('submit error', e)
			toast.error('Something went wrong')
		} finally {
			setIsUploading(false)
		}
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='w-4/5 mx-auto rounded-xl border border-slate-400 shadow-2xl px-10 py-6 flex flex-col gap-4'
		>
			<h2 className='text-nav text-xl font-semibold'>
				Base info about: {defaultValues?.title + ' page' || 'New page'}
			</h2>

			<label className='font-semibold flex flex-col gap-y-3'>
				Page title (required field)
				<input
					placeholder='Title'
					{...register('title', { required: true })}
					className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
				/>
			</label>

			{defaultValues && defaultValues.slug !== 'home' && (
				<label className='font-semibold flex flex-col gap-y-3'>
					Slug (required field)
					<input
						placeholder='Slug'
						{...register('slug', { required: true })}
						className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
					/>
				</label>
			)}

			<label className='font-semibold flex flex-col gap-y-3'>
				Description
				<textarea
					placeholder='Description'
					{...register('description')}
					className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
				/>
			</label>

			{defaultValues && defaultValues.slug !== 'home' && (
				<label className='font-semibold flex gap-3 my-3'>
					Serial number (from 1 and up)
					<input
						type='number'
						{...register('number', {
							valueAsNumber: true,
							min: {
								value: 1,
								message: 'Serial number must be greater than 0'
							}
						})}
						className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
					/>
					{errors.number && (
						<span className='text-red-500 text-sm font-medium italic'>
							{errors.number.message}
						</span>
					)}
				</label>
			)}

			{isLoaded && isDefaultPage && (
				<>
					<h2 className='text-nav text-xl font-semibold'>Media</h2>

					{mediaFields.map((field, index) => {
						const isUploaded = typeof field.url === 'string' && field.url.length > 0

						return (
							<div
								key={field.id}
								className='mb-4 flex items-center justify-between gap-3'
							>
								<select
									{...register(`media.${index}.type` as const)}
									className='mb-1 w-1/4 outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
								>
									<option value='video'>Video</option>
									<option value='photo'>Photo</option>
								</select>

								{watch(`media.${index}.type`) === 'video' && (
									<div className='flex flex-col gap-1 w-1/4'>
										{isUploaded && !replaceMode[index] ? (
											<div className='flex items-center justify-center gap-4'>
												<span className='text-sm text-green-600'>File</span>
												<button
													type='button'
													className='text-sm text-blue-500 hover:underline'
													onClick={() => {
														setReplaceMode(prev => ({
															...prev,
															[index]: true
														}))
														setTimeout(() => {
															fileRefs.current[index]?.click()
														}, 0)
													}}
												>
													Update
												</button>
											</div>
										) : (
											<input
												type='file'
												accept='video/*'
												ref={el => {
													fileRefs.current[index] = el
												}}
												onChange={e => {
													const file = e.target.files?.[0]
													if (!file) return
													setValue(`media.${index}.url`, file)
												}}
												className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
											/>
										)}
									</div>
								)}

								{watch(`media.${index}.type`) === 'photo' && (
									<div className='flex flex-col gap-1 w-1/4'>
										{isUploaded && !replaceMode[index] ? (
											<div className='flex items-center justify-center gap-4'>
												<Image
													src={field.url as string}
													width={100}
													height={100}
													alt='preview'
													className='w-24 h-24 object-cover rounded'
												/>
												<button
													type='button'
													className='text-sm text-blue-500 hover:underline'
													onClick={() =>
														setReplaceMode(prev => ({
															...prev,
															[index]: true
														}))
													}
												>
													Update
												</button>
											</div>
										) : (
											<input
												type='file'
												accept='image/*'
												onChange={e => {
													const file = e.target.files?.[0]
													if (!file) return
													setValue(`media.${index}.url`, file)
												}}
												className='outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
											/>
										)}
									</div>
								)}

								<input
									placeholder='description'
									{...register(`media.${index}.name` as const)}
									className='mb-1 w-1/4 outline-none border-b border-b-nav active:border-b-dark-purple focus:border-b-dark-purple transition-all duration-300 ease-in-out focus:outline-none'
								/>

								<button
									type='button'
									onClick={() => removeMedia(index)}
									className='hover:text-nav transform duration-300 cursor-pointer'
								>
									Delete
								</button>
							</div>
						)
					})}

					<button
						type='button'
						onClick={() =>
							addMedia({
								type: 'video',
								url: '',
								name: ''
							})
						}
						className='hover:text-nav transform duration-300 cursor-pointer'
					>
						+ media item
					</button>
				</>
			)}

			{isLoaded && isAbout && (
				<>
					<h2 className='text-nav text-xl font-semibold'>About page content</h2>

					<label className='font-semibold flex flex-col gap-y-3'>
						First text
						<input
							{...register('firstText')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>

					<label className='font-semibold flex flex-col gap-y-3'>
						Second text
						<input
							{...register('secondText')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>

					<label className='font-semibold flex flex-col gap-y-3'>
						Third text
						<input
							{...register('thirdText')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>
				</>
			)}

			{isLoaded && isContacts && (
				<>
					<label className='font-semibold flex flex-col gap-y-3'>
						Email
						<input
							type='email'
							{...register('email')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>

					<label className='font-semibold flex flex-col gap-y-3'>
						Instagram
						<input
							{...register('instagram')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>

					<label className='font-semibold flex flex-col gap-y-3'>
						Instagram link
						<input
							{...register('instaLink')}
							className='outline-none border-b border-b-nav focus:border-b-dark-purple transition-all duration-300 ease-in-out'
						/>
					</label>
				</>
			)}

			<div className='grid grid-cols-2 items-center mt-10'>
				<label className='font-semibold flex gap-3 mx-auto'>
					<input type='checkbox' {...register('isPublish')} />
					Publish
				</label>
				<label className='font-semibold flex gap-3 mx-auto'>
					<input type='checkbox' {...register('isFooter')} />
					Show in footer
				</label>
			</div>
			<button type='submit' className='base-buttons w-60 h-10 mx-auto' disabled={isUploading}>
				{isUploading ? 'Uploading...' : id ? 'Update page' : 'Create page'}
			</button>
		</form>
	)
}

export default PageEditor
