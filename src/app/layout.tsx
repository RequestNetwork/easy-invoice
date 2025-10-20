import { AppKit } from "@/components/app-kit";
import { Toaster } from "@/components/ui/sonner";
import VersionDisplay from "@/components/version-badge";
import { TRPCReactProvider } from "@/trpc/react";
import { GoogleTagManager } from "@next/third-parties/google";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/context/auth";
import { getCurrentSession } from "@/server/auth";
import { ThemeProvider } from "next-themes";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionInfo = await getCurrentSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          enableColorScheme
          disableTransitionOnChange
        >
          <AppKit>
            <TooltipProvider>
              <TRPCReactProvider cookies={cookies().toString()}>
                <AuthProvider initialSession={sessionInfo}>
                  {children}
                </AuthProvider>
              </TRPCReactProvider>
              <Toaster />
            </TooltipProvider>
          </AppKit>
          <VersionDisplay githubRelease="https://github.com/RequestNetwork/easy-invoice/releases" />
        </ThemeProvider>
      </body>
    </html>
  );
}
