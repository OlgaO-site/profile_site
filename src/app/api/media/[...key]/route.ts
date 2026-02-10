import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
	const { key } = await params
	const filePath = key.join('/')
	const range = req.headers.get('range')

	const r2Url = `${process.env.R2_PUBLIC_BASE_URL}/${filePath}`

	const headers: HeadersInit = {}
	if (range) {
		headers.Range = range
	}

	const r2Response = await fetch(r2Url, {
		headers
	})

	if (!r2Response.ok && r2Response.status !== 206) {
		return new NextResponse('Not found', { status: 404 })
	}

	const responseHeaders = new Headers()

	// критично для video / streaming
	const passthroughHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges']

	passthroughHeaders.forEach(h => {
		const v = r2Response.headers.get(h)
		if (v) responseHeaders.set(h, v)
	})

	return new NextResponse(r2Response.body, {
		status: range ? 206 : 200,
		headers: responseHeaders
	})
}
