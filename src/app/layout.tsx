import "@rainbow-me/rainbowkit/styles.css";
import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import Providers from "../components/provider/rainbow-provider";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Proof ETH Balance In Zero-Knowledge",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} min-h-screen`}>
      <body className="bg-black text-white flex flex-col min-h-screen">
        <Providers>
        <Header />

          <main className="flex-1">{children}</main>
        <Footer />

        </Providers>
      </body>
    </html>
  );
}
