/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    dynamicIO: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.s-bol.com',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
    ],
  },
}

export default nextConfig
