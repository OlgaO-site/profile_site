export type MediaItem = {
	name: string
	type: 'video' | 'photo'
	url: string
	mobileUrl?: string
}

export type MediaItemForm = {
	name: string
	type: 'video' | 'photo'
	url: string | File
	mobileUrl?: string | File
}

export type PageType = 'default' | 'about' | 'contacts'
