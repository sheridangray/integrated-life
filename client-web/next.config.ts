require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin-allow-popups'
					}
				]
			}
		]
	}
}

export default nextConfig
