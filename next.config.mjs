/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3003';

const nextConfig = {
  // Platform Admin Console — internal tool, IP-allowlisted ingress.
  // This application runs on its own origin (admin.unierp.internal) with a
  // separate IdP realm and mandatory MFA per § 3.1 and Phase 1.
  reactStrictMode: true,

  // Transpiled, not externalised. A server-external package resolves its own
  // copy of React, so prerendering hit
  // `TypeError: Cannot read properties of null (reading 'useContext')` — two
  // React instances, one of which has no current dispatcher. Letting webpack own
  // the design system keeps a single React and processes its CSS.
  transpilePackages: ['@kannan19302/shared', '@kannan19302/ui', '@kannan19302/framework'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 800,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.next'],
      };
    }
    return config;
  },

  // The console talks to the control-plane router and backend API services
  async rewrites() {
    return [
      {
        source: '/api/platform/v1/:path*',
        destination: `${apiBaseUrl}/api/platform/v1/:path*`,
      },
      {
        source: '/api/v1/:path*',
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
