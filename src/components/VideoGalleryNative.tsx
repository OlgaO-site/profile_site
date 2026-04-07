'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type MediaItem = {
	name: string
	type: 'video' | 'photo'
	url: string
}

const ASPECT = 2 / 3
const MAX_HEIGHT_RATIO = 0.65
const FADE_STEP = 0.06

export default function VideoGalleryNative({ media }: { media: MediaItem[] }) {
	const containerRef = useRef<HTMLDivElement>(null)

	const [containerWidth, setContainerWidth] = useState(224)
	const [containerHeight, setContainerHeight] = useState(224 / ASPECT)
	const [offsetY, setOffsetY] = useState(0)

	const [currentIndex, setCurrentIndex] = useState(0)
	const [nextIndex, setNextIndex] = useState<number | null>(null)
	const [fade, setFade] = useState(0)

	const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

	const nextIndexRef = useRef<number | null>(null)
	const rafRef = useRef<number | null>(null)
	const isAnimatingRef = useRef(false)

	// ---------- LAYOUT
	useEffect(() => {
		const updateLayout = () => {
			// visualViewport точніший на iOS (враховує клавіатуру, safe area)
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

	// ---------- PRELOAD
	// Програмно preload наступного відео, бо Safari ігнорує preload="auto" на мобільному
	useEffect(() => {
		media.forEach((item, i) => {
			if (item.type === 'video') {
				const video = videoRefs.current[i]
				if (video && video.readyState === 0) {
					video.load()
				}
			}
		})
	}, [media])

	// ---------- PLAY CONTROL
	// Окремий хелпер, який можна викликати синхронно з gesture
	const playVideo = useCallback(
		(index: number) => {
			const video = videoRefs.current[index]
			if (!video || media[index]?.type !== 'video') return

			// Скидаємо до початку тільки якщо вже не грає (уникаємо "мерехтіння")
			if (video.paused) {
				video.currentTime = 0
			}

			video.play().catch(() => {
				// Safari блокує — нормально, відео просто буде на паузі
			})
		},
		[media]
	)

	const pauseAll = useCallback(() => {
		videoRefs.current.forEach(v => v?.pause())
	}, [])

	// Коли currentIndex змінився — пауза всіх, play поточного
	useEffect(() => {
		pauseAll()
		playVideo(currentIndex)
	}, [currentIndex, pauseAll, playVideo])

	// ---------- NAVIGATE — центральна функція навігації
	// Викликається синхронно з gesture, щоб Safari не блокував play()
	const navigateTo = useCallback(
		(idx: number) => {
			if (isAnimatingRef.current) return

			// FIX: викликаємо play() СИНХРОННО з gesture — Safari це дозволяє
			playVideo(idx)

			nextIndexRef.current = idx
			setNextIndex(idx)
		},
		[playVideo]
	)

	// ---------- FADE ANIMATION
	useEffect(() => {
		if (nextIndex === null) return

		isAnimatingRef.current = true

		const animate = () => {
			setFade(prev => {
				const next = prev + FADE_STEP

				if (next >= 1) {
					// Завершення анімації
					const resolved = nextIndexRef.current
					setCurrentIndex(resolved!)
					setNextIndex(null)
					nextIndexRef.current = null
					isAnimatingRef.current = false
					return 0
				}

				rafRef.current = requestAnimationFrame(animate)
				return next
			})
		}

		rafRef.current = requestAnimationFrame(animate)

		return () => {
			// FIX: гарантовано скасовуємо rAF при розмонтуванні/перериванні
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current)
				rafRef.current = null
			}
		}
	}, [nextIndex])

	// ---------- CLICK (desktop + Android)
	// FIX: слухаємо click на контейнері, а не на window
	// Safari не генерує click на window для довільних елементів без cursor:pointer
	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		const onClick = (e: MouseEvent) => {
			if (isAnimatingRef.current) return

			const rect = el.getBoundingClientRect()
			const relativeX = e.clientX - rect.left

			if (relativeX < rect.width / 2) {
				navigateTo((currentIndex - 1 + media.length) % media.length)
			} else {
				navigateTo((currentIndex + 1) % media.length)
			}
		}

		el.addEventListener('click', onClick)
		return () => el.removeEventListener('click', onClick)
	}, [currentIndex, media.length, navigateTo])

	// ---------- TOUCH (mobile — iOS і Android)
	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		let startX: number | null = null
		let startY: number | null = null
		const threshold = 40
		// Якщо свайп більше вертикальний — ігноруємо (щоб не конфліктити зі скролом)
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

			// FIX: ігноруємо переважно вертикальні свайпи
			if (Math.abs(deltaY) > verticalThreshold && Math.abs(deltaY) > Math.abs(deltaX)) {
				startX = null
				startY = null
				return
			}

			if (Math.abs(deltaX) < threshold) {
				startX = null
				startY = null
				return
			}

			const idx =
				deltaX > 0
					? (currentIndex - 1 + media.length) % media.length
					: (currentIndex + 1) % media.length

			// FIX: navigateTo викликає play() синхронно з touch event — Safari пропускає
			navigateTo(idx)

			startX = null
			startY = null
		}

		// FIX: touchend без passive — щоб можна було preventDefault якщо потрібно
		el.addEventListener('touchstart', onTouchStart, { passive: true })
		el.addEventListener('touchend', onTouchEnd, { passive: true })

		return () => {
			el.removeEventListener('touchstart', onTouchStart)
			el.removeEventListener('touchend', onTouchEnd)
		}
	}, [currentIndex, media.length, navigateTo])

	return (
		<div
			ref={containerRef}
			className='relative overflow-hidden'
			style={{
				width: `${containerWidth}px`,
				height: `${containerHeight}px`,
				transform: `translateY(${offsetY}px)`,
				cursor: 'pointer',
				WebkitTapHighlightColor: 'transparent',
				touchAction: 'pan-y'
			}}
		>
			{/* CURRENT */}
			<MediaSlide
				item={media[currentIndex]}
				videoRef={el => (videoRefs.current[currentIndex] = el)}
				style={{
					opacity: nextIndex !== null ? 1 - fade : 1,
					zIndex: 1
				}}
			/>

			{/* NEXT */}
			{nextIndex !== null && (
				<MediaSlide
					item={media[nextIndex]}
					videoRef={el => (videoRefs.current[nextIndex] = el)}
					style={{
						opacity: fade,
						zIndex: 2
					}}
				/>
			)}
		</div>
	)
}

function MediaSlide({
	item,
	videoRef,
	style
}: {
	item: MediaItem
	videoRef: (el: HTMLVideoElement | null) => void
	style: React.CSSProperties
}) {
	if (item.type === 'photo') {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={item.url}
				alt={item.name}
				className='absolute inset-0 w-full h-full'
				style={{ ...style, objectFit: 'cover' }}
				draggable={false}
			/>
		)
	}

	return (
		<div className='absolute inset-0' style={style}>
			<video
				ref={videoRef}
				src={item.url}
				muted
				playsInline
				loop
				preload='metadata'
				className='absolute inset-0 w-full h-full'
				style={{ objectFit: 'cover' }}
				onLoadedMetadata={e => {
					void (e.target as HTMLVideoElement)
				}}
			/>
		</div>
	)
}
