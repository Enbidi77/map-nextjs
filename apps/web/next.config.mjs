/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@modern-maps/ui',
    '@modern-maps/map-engine',
    '@modern-maps/geospatial',
    '@modern-maps/types',
    '@modern-maps/validation',
    '@modern-maps/database',
    '@modern-maps/place-search',
    '@modern-maps/routing',
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };
    return config;
  },
};

export default nextConfig;
