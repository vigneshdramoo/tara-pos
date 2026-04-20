import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "TARA Atelier POS",
    template: "%s | TARA Atelier POS",
  },
  description:
    "A local-first, premium iPad POS experience for the TARA perfume boutique.",
  applicationName: "TARA Atelier POS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/tara-mark.svg",
    apple: "/icons/tara-mark-maskable.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TARA POS",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <PwaRegister />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
