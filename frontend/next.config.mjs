/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    // Optional same-origin proxy to the backend (avoids CORS in production).
    // Set NEXT_PUBLIC_API_URL for direct calls; this rewrite is a fallback.
    return [];
  },
};

export default nextConfig;
