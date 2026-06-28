import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/tmtodds1",
  trailingSlash: true,
  distDir: "dist",
};

export default nextConfig;
