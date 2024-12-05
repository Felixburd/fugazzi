import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure trailing slashes for static hosting
  trailingSlash: true,
}

module.exports = nextConfig 
