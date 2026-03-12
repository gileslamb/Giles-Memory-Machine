import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "unpdf"],
  async headers() {
    return [
      { source: "/", headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }] },
      {
        source: "/:path((?!_next|api|favicon|logo).*)",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
