/** @type {import('next').NextConfig} */
const BACKEND = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Proxy API calls to the backend so the browser talks to one origin.
    return [{ source: '/api/:path*', destination: `${BACKEND}/api/:path*` }];
  },
  webpack: (config) => {
    // Privy declares several optional peer deps (fiat onramp, Farcaster mini-app,
    // Abstract, permissionless, etc.) that we do not use and are not installed.
    // Resolve the missing ones to an empty module so webpack does not fail the
    // build. Only the connectors configured in PrivyClientProvider are exercised.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@stripe/crypto': false,
      '@farcaster/mini-app-solana': false,
      '@abstract-foundation/agw-client': false,
      '@solana-program/memo': false,
      permissionless: false,
    };
    return config;
  },
};

export default nextConfig;
