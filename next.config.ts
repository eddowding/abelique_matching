import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The pilot's admin dashboard lives on the Abelique server (Contabo, behind the Cloudflare tunnel).
  // beforeFiles, so it wins over this app's own /admin page.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/admin", destination: "https://hook.abelique.com/admin" },
        { source: "/admin/:path*", destination: "https://hook.abelique.com/admin/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
