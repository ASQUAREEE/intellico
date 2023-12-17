/** @type {import('next').NextConfig} */
const nextConfig = {

  webpack: (config, {buildId, dev, isServer, defaultLoaders, webppack}) => {
    config.resolve.alias.canvas = false;

    config.resolve.alias.encoding = false;
    return config

  }
   

}

module.exports = nextConfig
