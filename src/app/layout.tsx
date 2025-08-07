import { AppKit } from "@/components/app-kit";
import { BackgroundWrapper } from "@/components/background-wrapper";
import { Toaster } from "@/components/ui/sonner";
import VersionDisplay from "@/components/version-badge";
import { TRPCReactProvider } from "@/trpc/react";
import { GoogleTagManager } from "@next/third-parties/google";
import { Provider as TooltipProvider } from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { ZeroDevSmartWalletConnectors } from "@dynamic-labs/ethereum-aa";
import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";

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
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} />
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <DynamicContextProvider
          settings={{
            environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID as string,
            walletConnectors: [
              EthereumWalletConnectors,
              ZeroDevSmartWalletConnectors,
            ],
          }}
        >
          <AppKit>
            <TooltipProvider>
              <TRPCReactProvider cookies={cookies().toString()}>
                <BackgroundWrapper>{children}</BackgroundWrapper>
              </TRPCReactProvider>
              <Toaster />
            </TooltipProvider>
          </AppKit>
          <VersionDisplay githubRelease="https://github.com/RequestNetwork/easy-invoice/releases" />
        </DynamicContextProvider>
      </body>
    </html>
  );
}
