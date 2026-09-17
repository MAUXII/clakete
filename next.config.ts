import type { NextConfig } from "next";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const optionalRoot = path.join(root, "private", "clakete-watch");
const optionalStub = path.join(root, "lib", "clakete-watch-stub");

function resolveOptional() {
  const live = fs.existsSync(path.join(optionalRoot, "package.json"));
  return {
    live,
    client: live
      ? path.join(optionalRoot, "src", "index.ts")
      : path.join(optionalStub, "index.ts"),
    server: live
      ? path.join(optionalRoot, "src", "server.ts")
      : path.join(optionalStub, "server.ts"),
  };
}

const initial = resolveOptional();

const nextConfig: NextConfig = {
  serverExternalPackages: ["playwright"],
  experimental: {
    turbo: {
      resolveAlias: {
        "@clakete/watch": initial.client,
        "@clakete/watch/server": initial.server,
      },
    },
  },
  webpack: (config) => {
    const { client, server } = resolveOptional();
    config.resolve.alias = {
      ...config.resolve.alias,
      "@clakete/watch": client,
      "@clakete/watch/server": server,
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
