import path from 'node:path';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
// Provider Admin Console — internal control-plane tooling (L4 Presentation).
// Updated to invalidate CSS cache.
// API default matches the canonical port map (api=3001). In compose the env
// sets API_URL=http://api:3001 and IDP_URL=http://idp:3005.
const apiBaseUrl = process.env.API_URL || 'http://localhost:3001';
const idpBaseUrl = process.env.IDP_URL || 'http://localhost:3005';

const nextConfig = {
  // Allow verification builds to run without replacing a running dev server's chunks.
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  outputFileTracingRoot: path.resolve(process.cwd(), '..'),
  reactStrictMode: true,

  // Transpiled, not externalised (single React instance + CSS ownership).
  transpilePackages: ['@kannan19302/shared', '@kannan19302/ui', '@kannan19302/framework'],

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  webpack: (config, { dev }) => {


    if (dev) {
      const isDocker = Boolean(process.env.DOCKER_CONTAINER || process.env.WATCHPACK_POLLING);
      config.watchOptions = {
        ...(config.watchOptions || {}),
        aggregateTimeout: 200,
        ...(isDocker ? { poll: 1000 } : {}),
        ignored: /[\\/](node_modules|\.git|\.next|dist|\.turbo|coverage|test-results|playwright-report|\.stryker-tmp)[\\/]/,
      };
    }
    return config;
  },

  async redirects() {
    return [
      { source: '/operations', destination: '/ops', permanent: false },
      { source: '/security-center', destination: '/security', permanent: false },
      { source: '/identity-governance', destination: '/access', permanent: false },
      { source: '/revenue-billing', destination: '/billing', permanent: false },
      { source: '/platform-configuration', destination: '/settings', permanent: false },
      { source: '/developer-ecosystem', destination: '/developers', permanent: false },
      { source: '/platform-intelligence', destination: '/analytics', permanent: false },
      { source: '/marketplace-operations', destination: '/marketplace', permanent: false },
      { source: '/organizations', destination: '/tenants', permanent: false },
      { source: '/cloud-infrastructure', destination: '/infrastructure', permanent: false },
      { source: '/connector-operations', destination: '/integrations', permanent: false },
      { source: '/ai-platform', destination: '/ai', permanent: false },
      { source: '/service-operations', destination: '/support', permanent: false },
    ];
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

export default withBundleAnalyzer(nextConfig);
