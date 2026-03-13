import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s3.spaysm.com", // 👈 에러가 난 도메인 추가
        pathname: "/**", // 해당 도메인의 모든 경로 허용
      },
    ],
  },
};

export default nextConfig;
