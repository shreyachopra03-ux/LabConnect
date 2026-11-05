/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Report links carry a secret token in the URL: never leak it to other sites via Referer.
  { key: "Referrer-Policy", value: "same-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // src/instrumentation.ts starts the LIS export-folder watcher on server boot.
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
