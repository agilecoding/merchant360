/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@merchant360/ui',
    '@merchant360/shared-types',
    '@merchant360/shared-utils',
  ],
};

module.exports = nextConfig;
