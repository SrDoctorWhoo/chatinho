import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // devIndicators: {
  //   appIsrStatus: false,
  // },
  // @ts-ignore
  allowedDevOrigins: ['10.10.125.13', 'localhost:3000', 'credit-stimuli-mummy.ngrok-free.dev'],
  async rewrites() {
    return [
      {
        source: '/socket.io',
        destination: 'http://127.0.0.1:3005/socket.io',
      },
      {
        source: '/socket.io/:path*',
        destination: 'http://127.0.0.1:3005/socket.io/:path*',
      },
    ];
  },
};

export default nextConfig;
