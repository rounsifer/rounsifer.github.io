/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  output: "export",
  // Emit /route/index.html so nested routes work reliably on GitHub Pages and
  // other static hosts that do not provide extensionless HTML rewrites.
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  // Import *.glsl shader files as raw strings.
  // Turbopack (Next's default bundler) rule:
  turbopack: {
    rules: {
      "*.glsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
  // Webpack fallback (used when building with --webpack):
  webpack: function (config) {
    config.module.rules.push({
      test: /\.glsl$/,
      type: "asset/source",
    });
    return config;
  },
};

export default config;
