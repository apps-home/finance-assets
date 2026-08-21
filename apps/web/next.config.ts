import '@finance-assets-web/env/web'

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
	output: 'standalone',
	typedRoutes: true,
	reactCompiler: true,
	cacheComponents: true,
	transpilePackages: ['@t3-oss/env-nextjs', '@t3-oss/env-core', '@lib/db'],
	...(process.env.NODE_ENV === 'development' && {
		allowedDevOrigins: ['10.0.2.124', 'local.dev.terraviva', '192.168.0.4']
	})
}

export default nextConfig
