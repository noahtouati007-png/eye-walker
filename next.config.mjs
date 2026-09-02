/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is run in CI/dev; don't let style warnings block the production build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
