import path from 'node:path';

/** @type {import('next').NextConfig} */
// Provider Admin Console — internal control-plane tooling (L4 Presentation).
// API default matches the canonical port map (api=3001). In compose the env
// sets API_URL=http://api:3001 and IDP_URL=http://idp:3005.
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';
const idpBaseUrl = process.env.IDP_URL || 'http://localhost:3005';

const nextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  reactStrictMode: true,

  // Transpiled, not externalised (single React instance + CSS ownership).
  transpilePackages: ['@kannan19302/shared', '@kannan19302/ui', '@kannan19302/framework'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }
    return config;
  },

  // The console talks to the control-plane router and the IdP.
  async rewrites() {
    return [
      // IdP auth lives on the identity service (3005).
      {
        source: '/api/v1/auth/:path*',
        destination: `${idpBaseUrl}/api/v1/auth/:path*`,
      },
      // Everything else → the business API (3001), mounted under /api/v1.
      {
        source: '/api/v1/:path*',
        destination: `${apiBaseUrl}/api/v1/:path*`,
      },
    ];
  },
  env: {
    // Browser-facing issuer URL. Must be reachable from the user's
    // browser (host port mapping in Docker), never the container-internal
    // service name idp:3005 that IDP_URL/OIDC_ISSUER resolve to for
    // server-to-server calls — see infra/platform-wizard/next.config.js
    // for the same distinction made there first (W4).
    NEXT_PUBLIC_OIDC_ISSUER:
      process.env.NEXT_PUBLIC_OIDC_ISSUER || 'http://localhost:3005',
  },

};

export default nextConfig;