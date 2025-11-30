import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/icons/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
