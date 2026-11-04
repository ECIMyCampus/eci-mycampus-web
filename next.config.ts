import type { NextConfig } from 'next';

// Next.js resuelve los rewrites al compilar: esta variable debe existir durante `next build`.
const backendUrl = process.env.INTERNAL_API_URL || 'http://localhost:4000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
