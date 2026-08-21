/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/collectors", destination: "/reliability", permanent: false },
      { source: "/companies", destination: "/reliability", permanent: false },
      { source: "/history", destination: "/reliability", permanent: false },
      { source: "/incidents", destination: "/reliability", permanent: false },
      { source: "/incidents/:path*", destination: "/reliability", permanent: false },
      { source: "/settings", destination: "/", permanent: false },
      { source: "/help", destination: "/reliability", permanent: false },
    ];
  },
};

export default nextConfig;
