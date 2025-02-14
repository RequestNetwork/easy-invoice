import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppKit } from "@/components/app-kit";
import { Toaster } from "@/components/ui/sonner";
import VersionDisplay from "@/components/version-badge";
import { TRPCReactProvider } from "@/trpc/react";
import { cookies } from "next/headers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Easy Invoice",
  description: "Easy Invoice is a simple and secure invoice payment platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppKit>
          <TRPCReactProvider cookies={cookies().toString()}>
            {children}
          </TRPCReactProvider>
          <Toaster />
        </AppKit>
        <VersionDisplay githubRelease="https://github.com/RequestNetwork/easy-invoice/releases" />
      </body>
    </html>
  );
}
