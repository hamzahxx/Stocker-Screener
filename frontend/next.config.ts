import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async rewrites() {
        return [
            {
                source: "/api/screener/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/:path*`,
            },
            {
                source: "/screen/:path*",
                destination: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/screen/:path*`,
            },
        ];
    },
};

export default nextConfig;
