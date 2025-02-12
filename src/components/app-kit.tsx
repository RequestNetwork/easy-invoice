"use client";

import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
import { sepolia } from "@reown/appkit/networks";
import { createAppKit } from "@reown/appkit/react";

const metadata = {
  name: "Easy Invoice",
  description: "Easy Invoice is a simple and secure invoice payment platform.",
  url: "https://easyinvoice.request.network",
  icons: ["./assets/logo.svg"],
};

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

createAppKit({
  adapters: [new Ethers5Adapter()],
  metadata,
  networks: [sepolia],
  projectId,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
});

export function AppKit({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
