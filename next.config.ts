/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	images: {
		remotePatterns: [
			// Cloudinary (як було)
			{
				protocol: 'https',
				hostname: 'res.cloudinary.com',
				pathname: '/**'
			},
			// Supabase Storage
			{
				protocol: 'https',
				hostname: 'osraueaoekoiakpdmflw.supabase.co',
				pathname: '/storage/v1/object/public/**'
			}
		]
	},
	allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev']
}

module.exports = nextConfig
