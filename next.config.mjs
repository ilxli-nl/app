/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    dynamicIO: false,
    urlImports: ['https://api.pakketdienstqls.nl/pdf/labels/'],
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
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
      {
        protocol: 'https',
        hostname: 'api-parcel.bpost.be',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
      {
        protocol: 'https',
        hostname: 'api.bpost.be',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
      {
        protocol: 'https',
        hostname: 'shm-rest.bpost.cloud',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
    ],
  },
};

export default nextConfig;
