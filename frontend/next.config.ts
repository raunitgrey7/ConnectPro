import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow external images from Google (used in seed data avatars) */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
