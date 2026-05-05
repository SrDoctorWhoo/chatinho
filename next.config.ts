import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3005/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
