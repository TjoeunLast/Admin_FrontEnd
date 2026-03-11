import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // 프론트에서 /api/... 로 요청을 보내면
        source: '/api/:path*',
        // Next.js 서버가 몰래 백엔드(HTTP)로 대신 전달해줌!
        destination: 'http://barotruck.store:8080/api/:path*', 
      },
    ];
  },
};

export default nextConfig;
