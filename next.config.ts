import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
const repo = "/a-letter-in-the-torah";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isPages ? repo : undefined,
  assetPrefix: isPages ? repo : undefined,
};

export default nextConfig;
