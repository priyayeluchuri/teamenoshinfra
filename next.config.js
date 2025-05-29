/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true, // disables ESLint in production builds
  },
};

module.exports = nextConfig;
