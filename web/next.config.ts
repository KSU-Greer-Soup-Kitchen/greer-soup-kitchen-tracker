import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The build cache stores environment variable values on disk,
    // which Netlify's secret scanner (rightly) blocks. Keep secrets out of build files.
    turbopackFileSystemCacheForBuild: false,
  },
  // For now the home page is the HTML prototype in public/.
  // Remove this once the real pages are built.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/index.html" }],
    };
  },
};

export default nextConfig;
