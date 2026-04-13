
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  experimental: {
    optimizePackageImports: ["openai"],
  },
};

export default nextConfig;
