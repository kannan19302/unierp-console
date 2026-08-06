/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';

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
  transpilePackages: ['@unerp/shared', '@unerp/ui', '@unerp/framework'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // The console talks to the control-plane router, never to /api/v1. Keeping the
  // proxy explicit means a console page cannot reach a tenant endpoint by
  // accident — the boundary § 3.1 describes is only real if it is wired.
  async rewrites() {
    return [
      {
        source: '/api/platform/v1/:path*',
        destination: `${apiBaseUrl}/api/platform/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
