/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Keep iexec / jszip in the server bundle only — they are used exclusively
  // in the /api/iexec-buy route (runtime = 'nodejs') and must not be bundled
  // into any client chunk.
  serverExternalPackages: ['iexec', 'jszip'],
}

module.exports = nextConfig
