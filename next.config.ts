/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: {
    module: { rules: { test: RegExp; type: string }[] };
  }) => {
    config.module.rules.push({
      test: /\.(frag|vert|glsl)$/,
      type: "asset/source",
    });
    return config;
  },
  transpilePackages: ["three"],
  turbopack: {
    rules: {
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
