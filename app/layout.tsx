import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PharmaCycle.AI - Share. Save. Save Lives.",
  description:
    "PharmaCycle.AI helps pharmacies reduce waste, share excess inventory, and save lives through smart medicine transfers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
