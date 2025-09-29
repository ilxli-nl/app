/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase to 10MB
    },
    // api: {
    //   bodyParser: {
    //     sizeLimit: '5mb',
    //   },
    //   responseLimit: '5mb',
    // },
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
        hostname: 'res.cloudinary.com',
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
        hostname: 'bpost.ilxli.nl',
        // port: '',
        // pathname: '/account123/**',
        // search: '',
      },
    ],
  },
};

export default nextConfig;
