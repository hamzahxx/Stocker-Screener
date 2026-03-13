import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Providers } from "./Providers";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-jetbrains-mono",
    subsets: ["latin"],
    display: "swap",
});

export const metadata: Metadata = {
    title: "Stocker | NSE Screener",
    description:
        "Discover and analyze Indian stocks effortlessly with Stocker, your intuitive NSE screener. Instantly search by symbol, filter by index, and view real-time market status—all in a sleek, dark-mode interface designed for traders and investors.",
    icons: {
        icon: "/og-image.jpg",
    },
    themeColor: "#18181b",
    openGraph: {
        title: "Stocker | NSE Screener",
        description:
            "Discover and analyze Indian stocks effortlessly with Stocker, your intuitive NSE screener. Instantly search by symbol, filter by index, and view real-time market status—all in a sleek, dark-mode interface designed for traders and investors.",
        url: "https://stocker.hamzahcodes.in/",
        siteName: "Stocker",
        images: [
            {
                url: "/og-image.jpg",
                width: 1200,
                height: 630,
                alt: "Stocker NSE Screener",
            },
        ],
        locale: "en_IN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Stocker | NSE Screener",
        description:
            "Discover and analyze Indian stocks effortlessly with Stocker, your intuitive NSE screener. Instantly search by symbol, filter by index, and view real-time market status—all in a sleek, dark-mode interface designed for traders and investors.",
        images: ["/og-image.jpg"],
        site: "@copypastecoder7",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
            >
                <Providers>{children}</Providers>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
