import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sin output: 'standalone'
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.WS_URL ?? process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY:
      process.env.MP_PUBLIC_KEY ?? process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
  },
};

export default nextConfig;
