import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone', // required for Docker / Cloud Run
  transpilePackages: ['@catalog-mx/core'],
}

export default nextConfig
