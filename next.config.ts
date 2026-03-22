import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source : "/:path*",
        headers : [
          {
            key : "Cross-Origin-Embedder-Policy",
            value : "credentialless"
          },
          {
            key : "Cross-Origin-Opener-Policy",
            value : "same-origin"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
