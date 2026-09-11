/** @type {import('next').NextConfig} */
import { withEve } from "eve/next"

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withEve(nextConfig)
