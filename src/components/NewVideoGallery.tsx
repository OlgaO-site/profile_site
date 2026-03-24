/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { Canvas, useFrame } from '@react-three/fiber'

import { playfairDisplay } from '../app/layout'
import { MediaItem } from '../types/baseTypes'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const getMediaUrl = (item: MediaItem): string => {
	if (typeof window !== 'undefined' && window.innerWidth <= 768 && item.mobileUrl) {
		return item.mobileUrl
	}
	return item.url
}
interface GalleryProps {
	media: MediaItem[]
	size: { w: number; h: number }
	currentIndex: number
	setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
	setIsPlaying: (v: boolean) => void
}

interface CaptionProps {
	media: MediaItem[]
	isPlaying: boolean
	index: number
	containerHeight: number
}

const ASPECT = 2 / 3
const MAX_HEIGHT_RATIO = 0.65

const transitionShader = {
	uniforms: {
		tPrev: { value: new THREE.Texture() },
		tCurrent: { value: new THREE.Texture() },
		mixRatio: { value: 1 }
	},
	vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
	fragmentShader: `
    uniform sampler2D tPrev;
    uniform sampler2D tCurrent;
    uniform float mixRatio;
    varying vec2 vUv;
    void main() {
      vec4 texel1 = texture2D(tPrev, vUv);
      vec4 texel2 = texture2D(tCurrent, vUv);
      gl_FragColor = mix(texel1, texel2, mixRatio);
    }
  `
}

export default function NewVideoGallery({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [size, setSize] = useState({ w: 317, h: 317 / ASPECT })
	const [offsetY, setOffsetY] = useState(0)
	const [currentIndex, setCurrentIndex] = useState(0)
	const [isPlaying, setIsPlaying] = useState(false)
	const [isMounted, setIsMounted] = useState(false) // Новий стан

	useEffect(() => {
		setIsMounted(true)
	}, [])

	useEffect(() => {
		const updateLayout = () => {
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight
			const maxHeight = viewportHeight * MAX_HEIGHT_RATIO

			let w = 317
			let h = w / ASPECT

			if (h > maxHeight) {
				h = maxHeight
				w = h * ASPECT
			}

			setSize({ w, h })

			if (viewportHeight < 700) setOffsetY(-10)
			else if (viewportHeight < 900) setOffsetY(-20)
			else setOffsetY(-50)
		}

		updateLayout()
		window.addEventListener('resize', updateLayout)
		window.visualViewport?.addEventListener('resize', updateLayout)

		return () => {
			window.removeEventListener('resize', updateLayout)
			window.visualViewport?.removeEventListener('resize', updateLayout)
		}
	}, [])

	if (!isMounted) {
		return <div style={{ width: 317, height: 317 / (2 / 3) }} />
	}

	return (
		<div
			ref={containerRef}
			className='relative'
			style={{
				width: size.w,
				height: size.h,
				transform: `translateY(${offsetY}px)`
			}}
		>
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
					size={size}
					currentIndex={currentIndex}
					setCurrentIndex={setCurrentIndex}
					setIsPlaying={setIsPlaying}
				/>
			</Canvas>

			{/* --- БЛОК ДЛЯ SAFARI --- */}
			<div
				style={{
					position: 'absolute',
					opacity: 0,
					pointerEvents: 'none',
					width: 0,
					height: 0,
					overflow: 'hidden'
				}}
			>
				{media.map((item, i) => (
					<video key={i} src={getMediaUrl(item)} preload='auto' muted playsInline />
				))}
			</div>
			{/* ----------------------------------------------- */}

			<VideoCaption
				media={media}
				isPlaying={isPlaying}
				index={currentIndex}
				containerHeight={size.h}
			/>
		</div>
	)
}

function Gallery({ media, size, currentIndex, setCurrentIndex, setIsPlaying }: GalleryProps) {
	const materialRef = useRef<THREE.ShaderMaterial>(null)
	const cache = useRef<Map<string, { v: HTMLVideoElement; t: THREE.VideoTexture }>>(new Map())
	const state = useRef({ prevIndex: currentIndex, progress: 1, isTransitioning: false })
	const touchStartX = useRef<number | null>(null)
	const [isReady, setIsReady] = useState(false)

	const updateResources = (currIdx: number) => {
		const indices = [
			currIdx,
			(currIdx + 1) % media.length,
			(currIdx - 1 + media.length) % media.length
		]

		const activeUrls = indices.map(i => getMediaUrl(media[i]))

		const currentActiveUrl = getMediaUrl(media[currIdx])

		activeUrls.forEach(url => {
			if (!cache.current.has(url)) {
				const v = document.createElement('video')
				v.src = url
				v.muted = true
				v.loop = true
				v.autoplay = false
				v.playsInline = true
				// Додаємо специфічні атрибути для Safari
				v.setAttribute('playsinline', '')
				v.setAttribute('webkit-playsinline', 'true')
				v.setAttribute('muted', '')
				v.crossOrigin = 'anonymous'
				v.preload = 'auto' // Для Safari краще 'auto', ніж 'metadata'

				if (url === currentActiveUrl) {
					v.onplaying = () => setIsReady(true)
				}

				// Запускаємо відео відразу
				v.play().catch(() => {})

				const t = new THREE.VideoTexture(v)
				// Обов'язкові фільтри для стабільності GPU
				t.minFilter = THREE.LinearFilter
				t.magFilter = THREE.LinearFilter
				t.generateMipmaps = false

				cache.current.set(url, { v, t })
			} else if (url === currentActiveUrl) {
				const cached = cache.current.get(url)

				if (cached) {
					cached.v.play().catch(() => {})

					if (cached.v.readyState >= 3) {
						setIsReady(true)
					}
				}
			}
		})

		cache.current.forEach((data, url) => {
			if (!activeUrls.includes(url)) {
				// ЗАМІСТЬ ПОВНОГО ВИДАЛЕННЯ:
				// Просто ставимо на паузу, щоб не вантажити процесор
				data.v.pause()

				// Видаляємо лише якщо кеш став занадто великим (наприклад, більше 6 відео)
				if (cache.current.size > 6) {
					data.v.src = ''
					data.v.load()
					data.t.dispose()
					cache.current.delete(url)
				}
			}
		})
	}

	const disposeVideo = (data: { v: HTMLVideoElement; t: THREE.VideoTexture }) => {
		data.v.pause()
		data.v.src = ''
		data.v.load()
		data.v.remove()
		data.t.dispose()
	}

	useEffect(() => {
		return () => {
			cache.current.forEach(disposeVideo)
			cache.current.clear()
		}
	}, [media])

	useEffect(() => {
		updateResources(currentIndex)

		state.current.isTransitioning = false
		state.current.progress = 1

		setIsPlaying(true)
	}, [currentIndex, media])

	const navigate = (direction: 'next' | 'prev') => {
		if (state.current.isTransitioning) return
		const next =
			direction === 'next'
				? (currentIndex + 1) % media.length
				: (currentIndex - 1 + media.length) % media.length

		state.current.prevIndex = currentIndex
		state.current.progress = 0
		state.current.isTransitioning = true
		setCurrentIndex(next)
	}

	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			navigate(e.clientX > window.innerWidth / 2 ? 'next' : 'prev')
		}

		const onTouchStart = (e: TouchEvent) => {
			touchStartX.current = e.touches[0].clientX
		}
		const onTouchEnd = (e: TouchEvent) => {
			if (touchStartX.current === null) return
			const dx = e.changedTouches[0].clientX - touchStartX.current
			if (Math.abs(dx) > 40) navigate(dx > 0 ? 'prev' : 'next')
			touchStartX.current = null
		}

		window.addEventListener('click', onClick)
		window.addEventListener('touchstart', onTouchStart)
		window.addEventListener('touchend', onTouchEnd)

		return () => {
			window.removeEventListener('click', onClick)
			window.removeEventListener('touchstart', onTouchStart)
			window.removeEventListener('touchend', onTouchEnd)
		}
	}, [currentIndex, media.length])

	useFrame((_, delta) => {
		if (!materialRef.current) return
		if (state.current.isTransitioning) {
			state.current.progress += delta * 2.5
			if (state.current.progress >= 1) {
				state.current.progress = 1
				state.current.isTransitioning = false
			}
		}

		const prevUrl = getMediaUrl(media[state.current.prevIndex])
		const currUrl = getMediaUrl(media[currentIndex])

		const prev = cache.current.get(prevUrl)?.t
		const curr = cache.current.get(currUrl)?.t

		if (prev) materialRef.current.uniforms.tPrev.value = prev
		if (curr) materialRef.current.uniforms.tCurrent.value = curr
		materialRef.current.uniforms.mixRatio.value = state.current.progress
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

	useLayoutEffect(() => {
		setIsReady(false)
		state.current.progress = 1
		state.current.isTransitioning = false
		state.current.prevIndex = currentIndex
	}, [media])

	return (
		<mesh visible={isReady}>
			<planeGeometry args={[size.w, size.h]} />
			<shaderMaterial
				ref={materialRef}
				args={[transitionShader]}
				transparent
				toneMapped={false}
			/>
		</mesh>
	)
}

function VideoCaption({ media, isPlaying, index, containerHeight }: CaptionProps) {
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
