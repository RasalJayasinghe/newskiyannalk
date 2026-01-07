import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Ensure proper output for Vercel
  output: undefined, // Let Vercel auto-detect
};

export default nextConfig;
