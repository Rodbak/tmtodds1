import type { NextConfig } from "next";

// Previously this was a static export (`output: "export"`) with a
// `/tmtodds1` basePath, which made sense when the whole app was
// client-only (localStorage, no server). Now that there's real auth,
// API routes, and middleware, the app needs an actual Node.js server
// to run on — Vercel provides that automatically, so no special
// config is needed here anymore.
const nextConfig: NextConfig = {};

export default nextConfig;
