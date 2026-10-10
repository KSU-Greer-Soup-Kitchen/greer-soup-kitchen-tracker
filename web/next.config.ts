import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The build cache stores environment variable values on disk,
    // which Netlify's secret scanner (rightly) blocks. Keep secrets out of build files.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
