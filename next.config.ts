import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // 빌드 시 타입 에러가 있어도 배포를 진행하도록 설정
    ignoreBuildErrors: true,
  },
  eslint: {
    // 빌드 시 ESLint 경고를 무시하도록 설정
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;