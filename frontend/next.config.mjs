/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore ESLint warnings during build for Railway deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Also ignore TypeScript errors during build if needed
    ignoreBuildErrors: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig; 