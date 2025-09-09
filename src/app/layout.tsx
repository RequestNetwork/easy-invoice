import { BackgroundWrapper } from "@/components/background-wrapper";
import { Toaster } from "@/components/ui/sonner";
import VersionDisplay from "@/components/version-badge";
import { Web3AuthAppProvider } from "@/components/web3auth-provider";
import { TRPCReactProvider } from "@/trpc/react";
import { GoogleTagManager } from "@next/third-parties/google";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { cookieToWeb3AuthState } from "@web3auth/modal";

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
  const headersList = await headers();

  const cookieHeader = headersList.get("cookie");
  const web3authInitialState = cookieHeader
    ? cookieToWeb3AuthState(decodeURIComponent(cookieHeader))
    : undefined;

  return (
    <html lang="en">
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3AuthAppProvider initialState={web3authInitialState}>
          <TooltipProvider>
            <TRPCReactProvider cookies={cookies().toString()}>
              <BackgroundWrapper>{children}</BackgroundWrapper>
            </TRPCReactProvider>
            <Toaster />
          </TooltipProvider>
          <VersionDisplay githubRelease="https://github.com/RequestNetwork/easy-invoice/releases" />
        </Web3AuthAppProvider>
      </body>
    </html>
  );
}
