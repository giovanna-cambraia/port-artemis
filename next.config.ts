/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: { module: { rules: { test: RegExp; type: string; }[]; }; }) => {
    // Handle shader files for Webpack builds
    config.module.rules.push({
      test: /\.(frag|vert|glsl)$/,
      type: "asset/source",
    });
    return config;
  },
  // Modern Turbopack configuration (Next.js 16+)
  turbopack: {
    rules: {
      // Match all shader file extensions
      "*.frag": {
        type: "raw",
      },
      "*.vert": {
        type: "raw",
      },
      "*.glsl": {
        type: "raw",
      },
    },
  },
};

export default nextConfig;
