import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#050505",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://fab-creations.com"),
  title: "Fab Creations | Luxury Anti-Tarnish Jewellery & B2B Portal",
  description: "Exquisite anti-tarnish waterproof jewellery collection for retail and wholesale B2B partners across India. Based in Lucknow.",
  icons: {
    icon: "/images/logo.png",
    apple: "/images/logo.png",
  },
  openGraph: {
    title: "Fab Creations | Luxury Jewellery",
    description: "Exclusive anti-tarnish jewellery for retail & wholesale.",
    url: "https://fab-creations.com",
    siteName: "Fab Creations",
    images: [
      {
        url: "https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev/fab-creations/brand-logo.png",
        width: 800,
        height: 800,
        alt: "Fab Creations Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preconnect"
          href="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://pub-ce8688bc6c654bcfb99716f7c9373bcd.r2.dev"
        />
      </head>
      <body className="bg-[#050505] text-white min-h-screen selection:bg-gold/30 selection:text-gold-light antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
