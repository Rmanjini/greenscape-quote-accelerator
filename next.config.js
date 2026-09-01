/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep pdfkit out of the bundle so its bundled font (.afm) data files resolve
  // from node_modules at runtime instead of being tree-shaken away.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

module.exports = nextConfig;
