'use client'

import { playfairDisplay } from '../app/layout'
import { MediaItem } from '../types/baseTypes'

import { useCallback, useEffect, useRef, useState } from 'react'

const ASPECT = 2 / 3
const MAX_HEIGHT_RATIO = 0.65
const FADE_DURATION_MS = 300

export default function VideoGalleryNative({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)

	const [containerWidth, setContainerWidth] = useState(317)
	const [containerHeight, setContainerHeight] = useState(317 / ASPECT)
	const [offsetY, setOffsetY] = useState(0)

	const [currentIndex, setCurrentIndex] = useState(0)
	const [nextIndex, setNextIndex] = useState<number | null>(null)
	const [nextOpacity, setNextOpacity] = useState(0)

	const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
	const isAnimatingRef = useRef(false)
	const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const rafRef = useRef<number | null>(null)

	// ---------- LAYOUT
	useEffect(() => {
		const updateLayout = () => {
			const viewportHeight = window.visualViewport?.height ?? window.innerHeight
			const maxHeight = viewportHeight * MAX_HEIGHT_RATIO
			const isMobile = window.matchMedia('(max-width: 768px)').matches
			const h = viewportHeight

			let baseWidth = 317

			if (isMobile) {
				setOffsetY(h <= 650 ? 10 : 0)
			} else {
				if (h <= 450) setOffsetY(-5)
				else if (h <= 550) setOffsetY(-15)
				else if (h <= 800) setOffsetY(-10)
				else if (h <= 900) setOffsetY(-20)
				else setOffsetY(-50)
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

	// ---------- ПОЧАТКОВИЙ PLAY (тільки один раз при маунті)
	useEffect(() => {
		const video = videoRefs.current[0]
		if (video && media[0]?.type === 'video') {
			video.load()
			video.play().catch(() => {})
		}

		// Preload решти відео
		media.forEach((item, i) => {
			if (i === 0 || item.type !== 'video') return
			const video = videoRefs.current[i]
			if (video) video.load()
		})
	}, [media])

	// ---------- NAVIGATE
	const navigateTo = useCallback(
		(idx: number) => {
			if (isAnimatingRef.current) return
			isAnimatingRef.current = true

			// ✅ play() СИНХРОННО з gesture — Safari вимагає це
			const nextVideo = videoRefs.current[idx]
			if (nextVideo && media[idx]?.type === 'video') {
				nextVideo.currentTime = 0
				nextVideo.play().catch(() => {})
			}

			setNextIndex(idx)
			setNextOpacity(0)

			// Два rAF — браузер рендерить елемент з opacity:0 перед transition
			rafRef.current = requestAnimationFrame(() => {
				rafRef.current = requestAnimationFrame(() => {
					setNextOpacity(1)

					transitionTimerRef.current = setTimeout(() => {
						// Transition завершено
						setCurrentIndex(idx)
						setNextIndex(null)
						setNextOpacity(0)
						isAnimatingRef.current = false

						// Pause всіх крім поточного — після завершення transition
						// щоб не конфліктувати з Safari gesture timing
						videoRefs.current.forEach((v, i) => {
							if (i !== idx) v?.pause()
						})
					}, FADE_DURATION_MS)
				})
			})
		},
		[media]
	)

	// Cleanup при розмонтуванні
	useEffect(() => {
		return () => {
			if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
			if (rafRef.current) cancelAnimationFrame(rafRef.current)
		}
	}, [])

	// ---------- CURSOR — по всьому window як в Three.js версії
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

	// ---------- CLICK — по всьому window як в Three.js версії
	useEffect(() => {
		const onClick = (e: MouseEvent) => {
			if (isAnimatingRef.current) return
			if (e.clientX < window.innerWidth / 2) {
				navigateTo((currentIndex - 1 + media.length) % media.length)
			} else {
				navigateTo((currentIndex + 1) % media.length)
			}
		}

		window.addEventListener('click', onClick)
		return () => window.removeEventListener('click', onClick)
	}, [currentIndex, media.length, navigateTo])

	// ---------- TOUCH — свайп на мобілці
	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		let startX: number | null = null
		let startY: number | null = null
		const swipeThreshold = 40
		const verticalThreshold = 30

		const onTouchStart = (e: TouchEvent) => {
			startX = e.touches[0].clientX
			startY = e.touches[0].clientY
		}

		const onTouchEnd = (e: TouchEvent) => {
			if (startX === null || startY === null || isAnimatingRef.current) return

			const endX = e.changedTouches[0].clientX
			const endY = e.changedTouches[0].clientY
			const deltaX = endX - startX
			const deltaY = endY - startY

			// Ігноруємо переважно вертикальні свайпи (скрол)
			if (Math.abs(deltaY) > verticalThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
				startX = null
				startY = null
				return
			}

			if (Math.abs(deltaX) < swipeThreshold) {
				startX = null
				startY = null
				return
			}

			navigateTo(
				deltaX > 0
					? (currentIndex - 1 + media.length) % media.length
					: (currentIndex + 1) % media.length
			)

			startX = null
			startY = null
		}

		// touchstart — passive (не блокуємо скрол)
		// touchend — без passive, щоб мати можливість preventDefault якщо потрібно
		el.addEventListener('touchstart', onTouchStart, { passive: true })
		el.addEventListener('touchend', onTouchEnd)

		return () => {
			el.removeEventListener('touchstart', onTouchStart)
			el.removeEventListener('touchend', onTouchEnd)
		}
	}, [currentIndex, media.length, navigateTo])

	return (
		<div>
			{/* Галерея */}
			<div
				ref={containerRef}
				className='relative overflow-hidden'
				style={{
					width: `${containerWidth}px`,
					height: `${containerHeight}px`,
					transform: `translateY(${offsetY}px)`,
					WebkitTapHighlightColor: 'transparent',
					touchAction: 'pan-y'
				}}
			>
				{media.map((item, i) => (
					<MediaSlide
						key={i}
						item={item}
						videoRef={el => (videoRefs.current[i] = el)}
						width={containerWidth}
						height={containerHeight}
						style={{
							display: i === currentIndex || i === nextIndex ? 'block' : 'none',
							position: 'absolute',
							inset: 0,
							zIndex: i === nextIndex ? 2 : 1,
							opacity: i === nextIndex ? nextOpacity : 1,
							transition:
								i === nextIndex
									? `opacity ${FADE_DURATION_MS}ms ease-in-out`
									: 'none'
						}}
					/>
				))}
			</div>

			{/* Підпис — точно як VideoCaption з Three.js версії */}
			<div
				className={`w-full mt-6 ${containerHeight < 400 ? 'md:mt-4' : 'md:mt-8'}`}
				style={{
					width: `${containerWidth}px`,
					transform: `translateY(${offsetY}px)`
				}}
			>
				<p
					className={`min-h-3.5 xl:text-lg text-center md:text-left w-full tracking-1 leading-none ${containerHeight < 400 ? 'md:mt-[0.5em]' : 'md:mt-[1em]'} ${playfairDisplay.className} relative z-50`}
				>
					{media[currentIndex]?.name}
				</p>
			</div>
		</div>
	)
}

function MediaSlide({
	item,
	videoRef,
	style,
	width,
	height
}: {
	item: MediaItem
	videoRef: (el: HTMLVideoElement | null) => void
	style: React.CSSProperties
	width: number
	height: number
}) {
	if (item.type === 'photo') {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={item.url}
				alt={item.name}
				draggable={false}
				style={{
					...style,
					width: `${width}px`,
					height: `${height}px`,
					objectFit: 'cover'
				}}
			/>
		)
	}

	return (
		<div style={style}>
			<video
				ref={videoRef}
				src={item.url}
				muted
				playsInline
				loop
				preload='auto'
				style={{
					position: 'absolute',
					inset: 0,
					width: `${width}px`,
					height: `${height}px`,
					objectFit: 'cover'
				}}
			/>
		</div>
	)
}
