/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { Canvas, useFrame } from '@react-three/fiber'

import { playfairDisplay } from '../app/layout'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

export type MediaItem = {
	name: string
	type: 'video' | 'photo'
	url: string
}

const ASPECT = 2 / 3

// TODO: цей компонент тільки для відео: якщо у галерею додавати фото, то якість фото виходить гіршою, зображення темніші, ніж є у реальності. Для фотогалереї треба використовувати PhotoGalleryCanvas. Відрізняється від фото налаштуваннями канви: немає flat + linear

export default function VideoGallery({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasWrapperRef = useRef<HTMLDivElement>(null)

	const [containerWidth, setContainerWidth] = useState(224)
	const [isPlaying, setIsPlaying] = useState(false)

	const [offsetY, setOffsetY] = useState(0)

	useEffect(() => {
		const updateLayout = () => {
			const h = window.visualViewport?.height ?? window.innerHeight
			const isMobile = window.matchMedia('(max-width: 768px)').matches

			if (isMobile) {
				if (h <= 550) {
					setContainerWidth(280)
					setOffsetY(10)
				} else if (h <= 650) {
					setContainerWidth(300)
					setOffsetY(10)
				} else if (h <= 750) {
					setContainerWidth(320)
					setOffsetY(0)
				} else {
					setContainerWidth(320)
					setOffsetY(0)
				}
			} else {
				if (h <= 400) {
					setContainerWidth(200)
					setOffsetY(50)
				} else if (h <= 550) {
					setContainerWidth(240)
					setOffsetY(0)
				} else if (h <= 700) {
					setContainerWidth(280)
					setOffsetY(-10)
				} else if (h <= 800) {
					setContainerWidth(280)
					setOffsetY(-10)
				} else if (h <= 900) {
					setContainerWidth(300)
					setOffsetY(-20)
				} else {
					setContainerWidth(320)
					setOffsetY(-50)
				}
			}
		}

		updateLayout()
		window.addEventListener('resize', updateLayout)
		window.visualViewport?.addEventListener('resize', updateLayout)

		return () => {
			window.removeEventListener('resize', updateLayout)
			window.visualViewport?.removeEventListener('resize', updateLayout)
		}
	}, [])
	console.log('containerWidth', containerWidth, 'offsetY', offsetY)
	return (
		<div
			ref={containerRef}
			className='aspect-2/3 h-auto relative'
			style={{
				width: `${containerWidth}px`,
				transform: `translateY(${offsetY}px)`
			}}
		>
			<div className='w-full h-full pointer-events-auto relative'>
				<div ref={canvasWrapperRef} className='w-full h-full'>
					<Canvas
						orthographic
						camera={{ zoom: 1, position: [0, 0, 5] }}
						gl={{
							outputColorSpace: THREE.SRGBColorSpace,
							toneMapping: THREE.NoToneMapping
						}}
					>
						<Gallery
							media={media}
							containerRef={containerRef}
							setIsPlaying={setIsPlaying}
							canvasRef={canvasWrapperRef}
						/>
					</Canvas>
				</div>

				<VideoCaption media={media} isPlaying={isPlaying} />
			</div>
		</div>
	)
}

function Gallery({
	media,
	containerRef,
	canvasRef,
	setIsPlaying
}: {
	media: MediaItem[]
	containerRef: React.RefObject<HTMLDivElement | null>
	canvasRef: React.RefObject<HTMLDivElement | null>
	setIsPlaying: (v: boolean) => void
}) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [nextIndex, setNextIndex] = useState<number | null>(null)
	const [size, setSize] = useState({ w: 0, h: 0 })
	const [transitionProgress, setTransitionProgress] = useState(0)
	const [textures, setTextures] = useState<THREE.Texture[]>([])
	const animationSpeed = 0.05
	const touchStartX = useRef<number | null>(null)
	// ⬅️ щоб не викликати setIsPlaying багато разів
	const playingReportedRef = useRef(false)

	// 1️⃣ Завантаження текстур
	useEffect(() => {
		if (media.length === 0) return

		const loader = new THREE.TextureLoader()
		const texs: THREE.Texture[] = []
		const videos: HTMLVideoElement[] = []

		const loadAll = async () => {
			for (let i = 0; i < media.length; i++) {
				const item = media[i]

				if (item.type === 'photo') {
					const texture = await loader.loadAsync(item.url)
					texture.colorSpace = THREE.SRGBColorSpace
					texture.needsUpdate = true
					texs.push(texture)

					// якщо перший елемент — фото, можна вважати готовим одразу
					if (i === 0 && !playingReportedRef.current) {
						playingReportedRef.current = true
						setIsPlaying(true)
					}
				} else {
					const video = document.createElement('video')
					video.src = item.url
					video.crossOrigin = 'anonymous'
					video.loop = true
					video.muted = true
					video.playsInline = true
					video.preload = 'auto'

					if (i === 0) {
						video.requestVideoFrameCallback(() => {
							if (!playingReportedRef.current) {
								playingReportedRef.current = true
								setIsPlaying(true)
							}
						})
					}

					await video.play().catch(() => {})
					const texture = new THREE.VideoTexture(video)

					texs.push(texture)
					videos.push(video)
				}
			}

			setTextures(texs)
		}

		loadAll()

		return () => {
			texs.forEach(tex => tex?.dispose())
			videos.forEach(video => {
				video.pause()
				video.src = ''
				video.load()
			})
		}
	}, [media, setIsPlaying])

	// 2️⃣ Click navigation
	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (nextIndex !== null) return
			if (e.clientX < window.innerWidth / 2) {
				setNextIndex((currentIndex - 1 + media.length) % media.length)
			} else {
				setNextIndex((currentIndex + 1) % media.length)
			}
		}
		window.addEventListener('click', onClick)
		return () => window.removeEventListener('click', onClick)
	}, [currentIndex, nextIndex, media.length])

	// 3️⃣ Resize
	useEffect(() => {
		if (!containerRef.current) return
		const el = containerRef.current
		const update = () => {
			const w = el.clientWidth
			const h = w / ASPECT
			setSize({ w, h })
		}
		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => ro.disconnect()
	}, [containerRef])

	// 2.5️⃣ Swipe navigation (mobile)
	useEffect(() => {
		const el = canvasRef.current
		if (!el) return

		const threshold = 40 // px

		const onTouchStart = (e: TouchEvent) => {
			touchStartX.current = e.touches[0].clientX
		}

		const onTouchEnd = (e: TouchEvent) => {
			if (touchStartX.current === null || nextIndex !== null) return

			const endX = e.changedTouches[0].clientX
			const deltaX = endX - touchStartX.current

			if (Math.abs(deltaX) < threshold) return

			if (deltaX > 0) {
				setNextIndex((currentIndex - 1 + media.length) % media.length)
			} else {
				setNextIndex((currentIndex + 1) % media.length)
			}

			touchStartX.current = null
		}

		el.addEventListener('touchstart', onTouchStart, { passive: true })
		el.addEventListener('touchend', onTouchEnd)

		return () => {
			el.removeEventListener('touchstart', onTouchStart)
			el.removeEventListener('touchend', onTouchEnd)
		}
	}, [currentIndex, nextIndex, media.length])

	// 4️⃣ Transition animation
	useFrame(() => {
		if (nextIndex !== null) {
			setTransitionProgress(p => {
				const nextP = p + animationSpeed
				if (nextP >= 1) {
					setCurrentIndex(nextIndex)
					setNextIndex(null)
					return 0
				}
				return nextP
			})
		}
	})

	// 5️⃣ Cursor
	useEffect(() => {
		const onMouseMove = (e: MouseEvent) => {
			if (e.clientX < window.innerWidth / 2) {
				document.body.style.cursor = 'url(/images/left.png) 16 16, auto'
			} else {
				document.body.style.cursor = 'url(/images/right.png) 16 16, auto'
			}
		}
		window.addEventListener('mousemove', onMouseMove)
		return () => {
			window.removeEventListener('mousemove', onMouseMove)
			document.body.style.cursor = 'auto'
		}
	}, [])

	return (
		<>
			{textures[currentIndex] && size.w > 0 && (
				<mesh>
					<planeGeometry args={[size.w, size.h]} />
					<meshBasicMaterial map={textures[currentIndex]} toneMapped={false} />
				</mesh>
			)}

			{nextIndex !== null && textures[nextIndex] && size.w > 0 && (
				<mesh>
					<planeGeometry args={[size.w, size.h]} />
					<meshBasicMaterial
						map={textures[nextIndex]}
						opacity={transitionProgress}
						transparent
						toneMapped={false}
					/>
				</mesh>
			)}
		</>
	)
}

function VideoCaption({ media, isPlaying }: { media: MediaItem[]; isPlaying: boolean }) {
	const [index, setIndex] = useState(0)

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (e.clientX < window.innerWidth / 2) {
				setIndex(prev => (prev - 1 + media.length) % media.length)
			} else {
				setIndex(prev => (prev + 1) % media.length)
			}
		}
		window.addEventListener('click', onClick)
		return () => window.removeEventListener('click', onClick)
	}, [media.length])

	// ⬅️ ЄДИНА УМОВА
	if (!isPlaying) return null

	return (
		<div className='w-full mt-6 xl:mt-8'>
			<p
				className={`min-h-3.5 xl:text-lg text-center xl:text-left w-full tracking-1 leading-none xl:mt-[1em] ${playfairDisplay.className} relative z-50`}
			>
				{media[index]?.name}
			</p>
		</div>
	)
}
