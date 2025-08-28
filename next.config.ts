import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'api.dicebear.com',
      'api.personas.design',
      'image.tmdb.org',
      'zeipdxuvelkraoiyxuom.supabase.co'
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
