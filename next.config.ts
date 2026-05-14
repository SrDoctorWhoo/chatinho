import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // devIndicators: {
  //   appIsrStatus: false,
  // },
  // @ts-ignore
  allowedDevOrigins: ['10.10.125.13', 'localhost:3000', 'credit-stimuli-mummy.ngrok-free.dev'],
};

export default nextConfig;
