"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface PregeneratedWallet {
  ethAddress: string;
  pubkey: string;
}

export const WalletPregeneration = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<PregeneratedWallet | null>(null);
  const [error, setError] = useState("");

  const generateWallet = async () => {
    if (!email) {
      setError("Please enter an email address");
      return;
    }

    setLoading(true);
    setError("");
    setWallet(null);

    try {
      const params = new URLSearchParams({
        verifier: "easy-invoice-email-verifier",
        verifierId: email,
        web3AuthNetwork:
          process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || "sapphire_devnet",
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || "",
      });

      const response = await fetch(
        `https://lookup.web3auth.io/lookup?${params}`,
      );

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();

      setWallet({
        ethAddress: data.ethAddress || data.address,
        pubkey: data.pubkey,
      });
    } catch (err) {
      console.error("Wallet generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate wallet",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Wallet Pregeneration</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your email to see the wallet address that will be generated when
        you login with Google.
      </p>

      <div className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateWallet()}
          />
        </div>

        <Button
          onClick={generateWallet}
          disabled={loading || !email}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Wallet Address"}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {wallet && (
          <div className="p-4 bg-green-50 border border-green-200 rounded space-y-2">
            <h3 className="font-medium text-green-800">Generated Wallet</h3>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Wallet Address:</p>
              <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                {wallet.ethAddress}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Public Key:</p>
              <p className="text-xs font-mono bg-white p-2 rounded border break-all">
                {wallet.pubkey}
              </p>
            </div>
            <p className="text-xs text-green-600 mt-2">
              ✅ This will be your wallet address when you login with Google
              using this email.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
