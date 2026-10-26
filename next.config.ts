import type { NextConfig } from 'next';

const authServiceUrl = process.env.INTERNAL_AUTH_SERVICE_URL || 'http://localhost:4001';
const campusServiceUrl = process.env.INTERNAL_CAMPUS_SERVICE_URL || 'http://localhost:4002';
const eventsServiceUrl = process.env.INTERNAL_EVENTS_SERVICE_URL || 'http://localhost:4003';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/auth/:path*',
        destination: `${authServiceUrl}/api/v1/auth/:path*`,
      },
      {
        source: '/api/v1/campus/:path*',
        destination: `${campusServiceUrl}/api/v1/campus/:path*`,
      },
      {
        source: '/api/v1/events/:path*',
        destination: `${eventsServiceUrl}/api/v1/events/:path*`,
      },
    ];
  },
};

export default nextConfig;
