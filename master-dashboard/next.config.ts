import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Basic sanitization to strip /stats if present, ensuring we get the base API URL
    const targetUrl = process.env.NEXT_PUBLIC_PULSE_API_URL?.replace(/\/stats\/?$/, '') || 'https://pulse.xx.kg/api/v1';

    return [
      {
        source: '/api/proxy/:path*',
        destination: `${targetUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
