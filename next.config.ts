import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const watchRoot = path.join(__dirname, "private", "clakete-watch");
const watchStub = path.join(__dirname, "lib", "clakete-watch-stub");
const hasWatch = fs.existsSync(path.join(watchRoot, "package.json"));

const watchClient = hasWatch
  ? path.join(watchRoot, "src", "index.ts")
  : path.join(watchStub, "index.ts");
const watchServer = hasWatch
  ? path.join(watchRoot, "src", "server.ts")
  : path.join(watchStub, "server.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright"],
  // Dev (Turbopack): Next 15.1 uses experimental.turbo
  experimental: {
    turbo: {
      resolveAlias: {
        "@clakete/watch": watchClient,
        "@clakete/watch/server": watchServer,
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clakete/watch": watchClient,
      "@clakete/watch/server": watchServer,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com", pathname: "/**" },
      { protocol: "https", hostname: "api.personas.design", pathname: "/**" },
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/**" },
      {
        protocol: "https",
        hostname: "zeipdxuvelkraoiyxuom.supabase.co",
        pathname: "/**",
      },
      { protocol: "https", hostname: "*.tenor.com", pathname: "/**" },
      { protocol: "https", hostname: "wsrv.nl", pathname: "/**" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
