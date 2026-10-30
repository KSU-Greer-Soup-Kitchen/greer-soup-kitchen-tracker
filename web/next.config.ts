import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The build cache stores environment variable values on disk,
    // which Netlify's secret scanner (rightly) blocks. Keep secrets out of build files.
    turbopackFileSystemCacheForBuild: false,
  },
  // Old prototype links (e.g. on printed QR codes) still go to the right page
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/volunteer.html", destination: "/volunteer", permanent: true },
      { source: "/donate.html", destination: "/donate", permanent: true },
      { source: "/get-help.html", destination: "/get-help", permanent: true },
      { source: "/staff-login.html", destination: "/staff/login", permanent: true },
      { source: "/dashboard.html", destination: "/staff", permanent: true },
    ];
  },
};

export default nextConfig;
