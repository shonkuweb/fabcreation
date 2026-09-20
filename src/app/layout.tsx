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
  title: "Fab Creations | B2B Jewellery Portal",
  description: "Exclusive B2B Jewellery Ecommerce Platform by Fab Creations",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#050505] text-white min-h-screen selection:bg-gold/30 selection:text-gold-light antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
