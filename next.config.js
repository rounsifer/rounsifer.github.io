/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
    output: "export",
    images: {unoptimized: true},
    reactStrictMode: true,
    swcMinify: true,
    webpack: function (config) {
      config.module.rules.push({
        test: /\.glsl$/,
        type: "asset/source",
      });
      return config;
    },
  };

export default config;
