"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";
import {
  calculateTotalsByCurrency,
  formatCurrencyTotals,
} from "@/lib/helpers/currency";
import type { Request } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { AUTH_CONNECTION, WALLET_CONNECTORS } from "@web3auth/modal";
import {
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthUser,
} from "@web3auth/modal/react";
import { ethers } from "ethers";
import { AlertCircle, DollarSign, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MultiCurrencyStatCard } from "../multi-currency-stat-card";
import { StatCard } from "../stat-card";
import { EmptyState } from "../ui/table/empty-state";
import { Pagination } from "../ui/table/pagination";
import { TableHeadCell } from "../ui/table/table-head-cell";
import { InvoiceRow } from "./blocks/invoice-row";

const ITEMS_PER_PAGE = 10;
const RETRIEVE_ALL_INVOICES_POLLING_INTERVAL = 3000;

const TableColumns = () => (
  <TableRow className="hover:bg-transparent border-none">
    <TableHeadCell>Invoice #</TableHeadCell>
    <TableHeadCell>Client</TableHeadCell>
    <TableHeadCell>Amount</TableHeadCell>
    <TableHeadCell>Currency</TableHeadCell>
    <TableHeadCell>Due Date</TableHeadCell>
    <TableHeadCell>Status</TableHeadCell>
    <TableHeadCell className="w-[1%]">Actions</TableHeadCell>
  </TableRow>
);

interface InvoicesSentProps {
  initialSentInvoices: Request[];
  session: any;
}

export const InvoicesSent = ({
  initialSentInvoices,
  session,
}: InvoicesSentProps) => {
  const [page, setPage] = useState(1);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signerData, setSignerData] = useState<{
    signer: ethers.Signer;
    address: string;
    ethersProvider: ethers.providers.Web3Provider;
  } | null>(null);

  // Wallet pregeneration states
  const [pregenEmail, setPregenEmail] = useState("");
  const [pregenLoading, setPregenLoading] = useState(false);
  const [pregenWallet, setPregenWallet] = useState<{
    ethAddress: string;
    pubkey: string | null;
  } | null>(null);
  const [pregenError, setPregenError] = useState("");

  const { connectTo, loading: isLoading } = useWeb3AuthConnect();
  const { userInfo } = useWeb3AuthUser();
  const { provider, isConnected: web3AuthConnected } = useWeb3Auth();

  const getWeb3AuthSigner = useCallback(async () => {
    if (!provider || !web3AuthConnected) return null;

    const ethersProvider = new ethers.providers.Web3Provider(provider);
    const signer = await ethersProvider.getSigner();
    const address = await signer.getAddress();

    return { signer, address, ethersProvider };
  }, [provider, web3AuthConnected]);

  const generateWallet = async () => {
    if (!pregenEmail) {
      setPregenError("Please enter an email address");
      return;
    }

    setPregenLoading(true);
    setPregenError("");
    setPregenWallet(null);

    try {
      const params = new URLSearchParams({
        verifier: "easy-invoice-email-verifier",
        verifierId: pregenEmail,
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

      if (!data.success || !data.data?.walletAddress) {
        throw new Error("Failed to get wallet address from Web3Auth");
      }

      setPregenWallet({
        ethAddress: data.data.walletAddress,
        pubkey:
          data.data.X && data.data.Y ? `04${data.data.X}${data.data.Y}` : null,
      });
    } catch (err) {
      console.error("Wallet generation error:", err);
      setPregenError(
        err instanceof Error ? err.message : "Failed to generate wallet",
      );
    } finally {
      setPregenLoading(false);
    }
  };

  useEffect(() => {
    if (web3AuthConnected && provider) {
      getWeb3AuthSigner().then((data) => {
        if (data) {
          setSignerData(data);
          setWalletAddress(data.address);
        }
      });
    } else {
      setSignerData(null);
      setWalletAddress(null);
    }
  }, [web3AuthConnected, provider, getWeb3AuthSigner]);

  useEffect(() => {
    const autoReconnect = async () => {
      if (session?.idToken && !web3AuthConnected && !isLoading && !userInfo) {
        try {
          await connectTo(WALLET_CONNECTORS.AUTH, {
            authConnectionId: "easy-invoice-email-verifier",
            authConnection: AUTH_CONNECTION.CUSTOM,
            idToken: session.idToken as string,
          });
        } catch (error) {
          console.error("Auto-reconnect failed:", error);
        }
      }
    };

    const timeoutId = setTimeout(autoReconnect, 1000);
    return () => clearTimeout(timeoutId);
  }, [session?.idToken, web3AuthConnected, isLoading, userInfo, connectTo]);

  const { data: invoices } = api.invoice.getAllIssuedByMe.useQuery(undefined, {
    initialData: initialSentInvoices,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchInterval: RETRIEVE_ALL_INVOICES_POLLING_INTERVAL,
  });

  const invoiceItems =
    invoices?.map((invoice) => ({
      amount: invoice.amount,
      currency: invoice.paymentCurrency,
    })) || [];

  const totalsByCurrency = calculateTotalsByCurrency(invoiceItems);
  const totalValues = formatCurrencyTotals(totalsByCurrency);

  const outstanding =
    invoices?.filter((inv) => inv.status !== "paid").length || 0;

  return (
    <div className="space-y-6">
      {/* Wallet Pregeneration Section */}
      <Card className="border border-blue-100 bg-blue-50">
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-3">
            🔮 Wallet Pregeneration
          </h3>
          <p className="text-xs text-blue-700 mb-3">
            Enter any email to see the wallet address that would be generated
            for that Google account.
          </p>

          <div className="flex gap-2 mb-3">
            <Input
              type="email"
              placeholder="Enter email address"
              value={pregenEmail}
              onChange={(e) => setPregenEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateWallet()}
              className="flex-1"
            />
            <Button
              onClick={generateWallet}
              disabled={pregenLoading || !pregenEmail}
              size="sm"
            >
              {pregenLoading ? "Generating..." : "Generate"}
            </Button>
          </div>

          {pregenError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs mb-2">
              {pregenError}
            </div>
          )}

          {pregenWallet && (
            <div className="bg-white border border-blue-200 rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-600 font-medium">
                  Generated Wallet Address:
                </span>
                <Button
                  onClick={() =>
                    navigator.clipboard.writeText(pregenWallet.ethAddress)
                  }
                  size="sm"
                  variant="outline"
                  className="text-xs h-6"
                >
                  Copy
                </Button>
              </div>
              <div className="font-mono text-xs bg-gray-50 p-2 rounded border break-all">
                {pregenWallet.ethAddress}
              </div>
              <p className="text-xs text-blue-600">
                ✅ This will be the wallet address when logging in with:{" "}
                {pregenEmail}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web3Auth Connection Status */}
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
          <p>Connecting to Web3Auth...</p>
        </div>
      ) : !web3AuthConnected || !userInfo ? (
        <div className="space-y-2">
          {session?.idToken ? (
            <p className="text-sm text-gray-600">Auto-connecting...</p>
          ) : (
            <p className="text-sm text-red-600">No session token found</p>
          )}
          <Button
            onClick={async () => {
              await connectTo(WALLET_CONNECTORS.AUTH, {
                authConnectionId: "easy-invoice-email-verifier",
                authConnection: AUTH_CONNECTION.CUSTOM,
                idToken: session.idToken as string,
              });
            }}
            disabled={!session?.idToken}
          >
            Connect to google
          </Button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <p className="text-sm font-medium text-green-800">
              Web3Auth Connected
            </p>
          </div>
          {walletAddress && (
            <div className="text-sm text-green-700 flex items-center justify-between">
              <span>
                <span className="font-medium">Wallet:</span>{" "}
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              <Button
                onClick={() => navigator.clipboard.writeText(walletAddress)}
                size="sm"
                variant="outline"
                className="text-xs h-6"
              >
                Copy Full Address
              </Button>
            </div>
          )}
          {signerData && (
            <div className="text-xs text-green-600">
              Signer ready for transactions ✅
            </div>
          )}
          {pregenWallet &&
            walletAddress &&
            pregenWallet.ethAddress &&
            pregenWallet.ethAddress.toLowerCase() ===
              walletAddress.toLowerCase() && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
                🎉 Confirmed: This matches the pregenerated address!
              </div>
            )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Invoices"
          value={invoices?.length || 0}
          icon={<FileText className="h-4 w-4 text-zinc-600" />}
        />
        <StatCard
          title="Outstanding Invoices"
          value={outstanding}
          icon={<AlertCircle className="h-4 w-4 text-zinc-600" />}
        />
        <MultiCurrencyStatCard
          title="Total Payments"
          icon={<DollarSign className="h-4 w-4 text-zinc-600" />}
          values={totalValues}
        />
      </div>

      <Card className="border border-zinc-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableColumns />
            </TableHeader>
            <TableBody>
              {!invoices || invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={<FileText className="h-6 w-6 text-zinc-600" />}
                      title="No invoices yet"
                      subtitle="Create your first invoice to get paid"
                      callToAction={
                        <Link href="/invoices/create">
                          <Button className="bg-black hover:bg-zinc-800 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                          </Button>
                        </Link>
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                invoices
                  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                  .map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      type="sent"
                    />
                  ))
              )}
            </TableBody>
          </Table>
          {invoices && invoices.length > 0 && (
            <Pagination
              page={page}
              setPage={setPage}
              totalItems={invoices.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
