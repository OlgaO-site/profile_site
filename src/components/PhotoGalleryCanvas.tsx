'use client'

import { Canvas, useFrame } from '@react-three/fiber'

import { playfairDisplay } from '../app/layout'

import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export type MediaItem = {
	name: string
	type: 'video' | 'photo'
	url: string
	order: number
}

// TODO: цей компонент тільки для фото: якщо у галерею додавати відео, то якість фото виходить гіршою, відео світліше, ніж є у реальності. Для відеогалереї треба використовувати VideoGallery. Відрізняється від відео налаштуваннями канви: flat + linear

export default function PhotoGalleryCanvas({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const normalized = useMemo(() => [...media].sort((a, b) => a.order - b.order), [media])

	const [isPlaying, setIsPlaying] = useState(false)

	return (
		<div className='fixed inset-0 flex flex-col items-center justify-center z-0'>
			<div ref={containerRef} className='w-77.5 h-107.5 relative'>
				<Canvas
					orthographic
					camera={{ zoom: 1, position: [0, 0, 5] }}
					flat
					linear
					gl={{
						outputColorSpace: THREE.SRGBColorSpace,
						toneMapping: THREE.NoToneMapping
					}}
				>
					<Gallery
						media={normalized}
						containerRef={containerRef}
						setIsPlaying={setIsPlaying} // ⬅️ НОВЕ
					/>
				</Canvas>
			</div>

			<VideoCaption media={normalized} isPlaying={isPlaying} />
		</div>
	)
}

function Gallery({
	media,
	containerRef,
	setIsPlaying
}: {
	media: MediaItem[]
	containerRef: React.RefObject<HTMLDivElement | null>
	setIsPlaying: (v: boolean) => void
}) {
	const [currentIndex, setCurrentIndex] = useState(0)
	const [nextIndex, setNextIndex] = useState<number | null>(null)
	const [size, setSize] = useState({ w: 0, h: 0 })
	const [transitionProgress, setTransitionProgress] = useState(0)
	const [textures, setTextures] = useState<THREE.Texture[]>([])
	const animationSpeed = 0.05

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
		const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => ro.disconnect()
	}, [containerRef])

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
		<div className='w-77.5 mt-7'>
			<p
				className={`min-h-3.5 text-sm text-center xl:text-left w-full tracking-5 leading-none ${playfairDisplay.className}`}
			>
				{media[index]?.name}
			</p>
		</div>
	)
}
