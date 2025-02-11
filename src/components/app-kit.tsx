"use client";

import { createAppKit } from "@reown/appkit/react";
import { Ethers5Adapter } from "@reown/appkit-adapter-ethers5";
import { sepolia } from "@reown/appkit/networks";

const metadata = {
	name: "Easy Invoice",
	description: "Easy Invoice is a simple and secure invoice payment platform.",
	url: "https://easyinvoice.request.network",
	icons: ["./assets/logo.svg"],
};

createAppKit({
	adapters: [new Ethers5Adapter()],
	metadata,
	networks: [sepolia],
	projectId: process.env.NEXT_PUBLIC_REOWN_PROJECT_ID as string,
	features: {
		analytics: false,
		email: false,
		socials: false,
	},
});

export function AppKit({ children }: { children: React.ReactNode }) {
	return <>{children}</>;
}
