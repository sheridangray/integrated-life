import path from 'path'

require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	// npm workspaces: lockfile and node_modules live at repo root; avoid inferring a parent dir (e.g. home) as root.
	turbopack: {
		root: path.join(__dirname, '..')
	},
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
