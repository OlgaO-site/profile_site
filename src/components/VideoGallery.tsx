/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { Canvas, useFrame } from '@react-three/fiber'

import { playfairDisplay } from '../app/layout'
import { MediaItem } from '../types/baseTypes'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const ASPECT = 2 / 3
const MAX_HEIGHT_RATIO = 0.65

export default function VideoGallery({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const canvasWrapperRef = useRef<HTMLDivElement>(null)

	const [containerWidth, setContainerWidth] = useState(224)
	const [containerHeight, setContainerHeight] = useState(224 / ASPECT)
	const [isPlaying, setIsPlaying] = useState(false)
	const [offsetY, setOffsetY] = useState(0)
	const [currentIndex, setCurrentIndex] = useState(0)

	useEffect(() => {
		const updateLayout = () => {
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight

			const maxHeight = viewportHeight * MAX_HEIGHT_RATIO
			const isMobile = window.matchMedia('(max-width: 768px)').matches
			const h = viewportHeight

			let baseWidth = 317

			if (isMobile) {
				if (h <= 550) {
					setOffsetY(10)
				} else if (h <= 650) {
					setOffsetY(10)
				} else if (h <= 750) {
					setOffsetY(0)
				} else {
					setOffsetY(0)
				}
			} else {
				if (h <= 450) {
					setOffsetY(-5)
				} else if (h <= 550) {
					setOffsetY(-15)
				} else if (h <= 700) {
					setOffsetY(-10)
				} else if (h <= 800) {
					setOffsetY(-10)
				} else if (h <= 900) {
					setOffsetY(-20)
				} else {
					setOffsetY(-50)
				}
			}

			let calculatedHeight = baseWidth / ASPECT

			if (calculatedHeight > maxHeight) {
				calculatedHeight = maxHeight
				baseWidth = calculatedHeight * ASPECT
			}

			setContainerWidth(baseWidth)
			setContainerHeight(calculatedHeight)
		}

		updateLayout()
		window.addEventListener('resize', updateLayout)
		window.visualViewport?.addEventListener('resize', updateLayout)

		return () => {
			window.removeEventListener('resize', updateLayout)
			window.visualViewport?.removeEventListener('resize', updateLayout)
		}
	}, [])

	return (
		<div
			ref={containerRef}
			className='relative'
			style={{
				width: `${containerWidth}px`,
				height: `${containerHeight}px`,
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
							canvasRef={canvasWrapperRef}
							setIsPlaying={setIsPlaying}
							currentIndex={currentIndex}
							setCurrentIndex={setCurrentIndex}
						/>
					</Canvas>
				</div>

				<VideoCaption
					media={media}
					isPlaying={isPlaying}
					index={currentIndex}
					containerHeight={containerHeight}
				/>
			</div>
		</div>
	)
}

function Gallery({
	media,
	containerRef,
	canvasRef,
	setIsPlaying,
	currentIndex,
	setCurrentIndex
}: {
	media: MediaItem[]
	containerRef: React.RefObject<HTMLDivElement | null>
	canvasRef: React.RefObject<HTMLDivElement | null>
	setIsPlaying: (v: boolean) => void
	currentIndex: number
	setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
}) {
	const [nextIndex, setNextIndex] = useState<number | null>(null)
	const [size, setSize] = useState({ w: 0, h: 0 })
	const [transitionProgress, setTransitionProgress] = useState(0)
	const [textures, setTextures] = useState<THREE.Texture[]>([])
	const animationSpeed = 0.05
	const touchStartX = useRef<number | null>(null)
	const playingReportedRef = useRef(false)

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

	useEffect(() => {
		if (!containerRef.current) return
		const el = containerRef.current

		const update = () => {
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight
			const maxHeight = viewportHeight * MAX_HEIGHT_RATIO

			let w = el.clientWidth
			let h = w / ASPECT

			if (h > maxHeight) {
				h = maxHeight
				w = h * ASPECT
			}

			setSize({ w, h })
		}

		update()
		const ro = new ResizeObserver(update)
		ro.observe(el)
		return () => ro.disconnect()
	}, [containerRef])

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

	useEffect(() => {
		const el = canvasRef.current
		if (!el) return

		const threshold = 40

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

function VideoCaption({
	media,
	isPlaying,
	index,
	containerHeight
}: {
	media: MediaItem[]
	isPlaying: boolean
	index: number
	containerHeight: number
}) {
	if (!isPlaying) return null

	return (
		<div className={`w-full mt-6 ${containerHeight < 400 ? 'md:mt-4' : 'md:mt-8'}`}>
			<p
				className={`min-h-3.5 xl:text-lg text-center md:text-left w-full tracking-1 leading-none ${containerHeight < 400 ? 'md:mt-[0.5em]' : 'md:mt-[1em]'} ${playfairDisplay.className} relative z-50`}
			>
				{media[index]?.name}
			</p>
		</div>
	)
}
