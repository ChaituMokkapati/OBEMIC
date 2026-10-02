import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    BACKEND_API_URL: process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  },
};

export default nextConfig;
