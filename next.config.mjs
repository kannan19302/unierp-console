/** @type {import('next').NextConfig} */
const nextConfig = {
  // Platform Admin Console — internal tool, IP-allowlisted ingress
  // This application runs on its own origin (admin.unierp.internal)
  // with a separate IdP realm and mandatory MFA per § 3.1 and Phase 1
  reactStrictMode: true,
};

export default nextConfig;
