export type MediaItem = {
	name: string
	type: 'video' | 'photo'
	url: string
}

export type MediaItemForm = {
	name: string
	type: 'video' | 'photo'
	url: string | File
}

export type PageType = 'default' | 'about' | 'contacts'
