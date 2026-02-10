import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { NextResponse } from 'next/server'

const client = new S3Client({
	region: 'auto',
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
	}
})

export async function POST(req: Request) {
	try {
		const { filename, contentType } = await req.json()

		const key = `media/${Date.now()}-${filename}`

		const command = new PutObjectCommand({
			Bucket: process.env.R2_BUCKET_NAME!,
			Key: key,
			ContentType: contentType
		})

		const uploadUrl = await getSignedUrl(client, command, {
			expiresIn: 60 // секунд
		})

		return NextResponse.json({
			uploadUrl,
			publicUrl: `${process.env.R2_PUBLIC_BASE_URL}/${key}`
		})
	} catch (e) {
		console.error(e)
		return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
	}
}
