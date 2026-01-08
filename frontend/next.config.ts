import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone", // Force static generation
  poweredByHeader: false,
};

export default nextConfig;
