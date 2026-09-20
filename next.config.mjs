/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
