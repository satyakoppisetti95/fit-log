// Temporarily disabled next-pwa due to Node.js 25 compatibility issues
// TODO: Re-enable with a compatible version or alternative PWA solution
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
//   buildExcludes: [/middleware-manifest\.json$/],
// });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress hydration warnings for theme provider
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

// Temporarily disabled PWA wrapper
// module.exports = withPWA(nextConfig);
module.exports = nextConfig;
