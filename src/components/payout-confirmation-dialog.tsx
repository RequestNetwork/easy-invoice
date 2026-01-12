"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyLabel } from "@/lib/constants/currencies";
import { CheckCircle, Info, ShieldCheck, Wallet } from "lucide-react";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface PayoutConfirmationData {
  mode: "direct" | "batch";
  amount?: number;
  currency?: string;
  recipient?: string;
  currencyTotals?: Record<string, number>;
  platformFee?: {
    percentage: string;
    address: string;
  };
  protocolFee?: {
    percentage: string;
    address: string;
  };
  walletAddress?: string;
}

export interface PayoutConfirmationDialogRef {
  show: (data: PayoutConfirmationData) => void;
  close: () => void;
  onConfirm: (callback: () => void) => void;
}

export const PayoutConfirmationDialog = forwardRef<
  PayoutConfirmationDialogRef,
  unknown
>(function PayoutConfirmationDialog(_, ref) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<PayoutConfirmationData | null>(null);
  const [confirmCallback, setConfirmCallback] = useState<(() => void) | null>(
    null,
  );

  useImperativeHandle(ref, () => ({
    show: (newData: PayoutConfirmationData) => {
      setData(newData);
      setOpen(true);
    },
    close: () => {
      setOpen(false);
    },
    onConfirm: (callback: () => void) => {
      setConfirmCallback(() => callback);
    },
  }));

  const {
    mode,
    amount,
    currency,
    currencyTotals,
    platformFee,
    protocolFee,
    walletAddress,
  } = data ?? {};

  const platformFeePct = platformFee
    ? Number.parseFloat(platformFee.percentage)
    : 0;
  const protocolFeePct = protocolFee
    ? Number.parseFloat(protocolFee.percentage)
    : 0;

  const validatedPlatformFeePct = Number.isNaN(platformFeePct)
    ? 0
    : platformFeePct;
  const validatedProtocolFeePct = Number.isNaN(protocolFeePct)
    ? 0
    : protocolFeePct;

  const hasPlatformFee = validatedPlatformFeePct > 0;
  const hasProtocolFee = validatedProtocolFeePct > 0;
  const hasAnyFee = hasPlatformFee || hasProtocolFee;

  const formatAddress = (addr: string) => {
    if (!addr || addr.length < 10) {
      return addr;
    }
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const formatAmount = (val: number, currencyKey: string) => {
    const decimals = val < 1 ? 6 : 2;
    const formatted = val.toFixed(decimals);
    return `${formatted} ${formatCurrencyLabel(currencyKey)}`;
  };

  const formatAmountRaw = (val: number, decimals = 6) => {
    return val.toFixed(decimals);
  };

  const isDirectValid =
    mode === "direct" &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    !!currency;

  const isBatchValid =
    mode === "batch" &&
    !!currencyTotals &&
    Object.keys(currencyTotals).length > 0 &&
    Object.values(currencyTotals).every(
      (v) => typeof v === "number" && Number.isFinite(v),
    );

  const canConfirm = isDirectValid || isBatchValid;

  const handleConfirm = () => {
    if (!canConfirm) return;
    setOpen(false);
    confirmCallback?.();
  };

  const renderFeeRow = (amountValue: number, currencyKey: string) => {
    const platformFeeAmount = hasPlatformFee
      ? (amountValue * validatedPlatformFeePct) / 100
      : 0;
    const protocolFeeAmount = hasProtocolFee
      ? (amountValue * validatedProtocolFeePct) / 100
      : 0;
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium text-muted-foreground">
            Initial Payout Amount
          </span>
          <span className="text-lg font-bold font-mono">
            {formatAmount(amountValue, currencyKey)}
          </span>
        </div>

        {hasAnyFee && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              {hasPlatformFee && platformFee && (
                <div className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      Platform Fee ({validatedPlatformFeePct}%)
                    </span>
                    <div className="relative group/info">
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/info:block w-64 p-3 text-xs bg-popover border rounded shadow-lg z-50 break-all">
                        {platformFee.address}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-medium text-amber-600 dark:text-amber-400">
                      -{formatAmountRaw(platformFeeAmount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                      to {formatAddress(platformFee.address)}
                    </div>
                  </div>
                </div>
              )}

              {hasProtocolFee && protocolFee && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      Protocol Fee ({validatedProtocolFeePct}%)
                    </span>
                    <div className="relative group/info">
                      <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-0 mb-2 hidden group-hover/info:block w-64 p-3 text-xs bg-popover border rounded shadow-lg z-50 break-all">
                        {protocolFee.address}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400">
                      +{formatAmountRaw(protocolFeeAmount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono tracking-tighter">
                      to {formatAddress(protocolFee.address)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <Separator className="my-4" />

        {hasPlatformFee ? (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Recipient receives</span>
            <span className="font-medium">
              {(amountValue - platformFeeAmount).toFixed(
                amountValue - platformFeeAmount < 1 ? 6 : 2,
              )}{" "}
              {formatCurrencyLabel(currencyKey)}
            </span>
          </div>
        ) : null}

        <div className="flex justify-between items-center">
          <span className="font-medium">Total to pay</span>
          <span className="text-lg font-semibold">
            {(amountValue + protocolFeeAmount).toFixed(
              amountValue + protocolFeeAmount < 1 ? 6 : 2,
            )}{" "}
            {formatCurrencyLabel(currencyKey)}
          </span>
        </div>
      </div>
    );
  };

  const renderDirectMode = () => {
    if (!isDirectValid || !amount || !currency) return null;

    return <div className="space-y-4">{renderFeeRow(amount, currency)}</div>;
  };

  const renderBatchMode = () => {
    if (!isBatchValid || !currencyTotals) return null;

    const entries = Object.entries(currencyTotals);
    const isSingleCurrency = entries.length === 1;

    const totalsByCurrency = entries.map(([currencyKey, amountValue]) => {
      const platformFeeAmount = hasPlatformFee
        ? (amountValue * validatedPlatformFeePct) / 100
        : 0;
      const protocolFeeAmount = hasProtocolFee
        ? (amountValue * validatedProtocolFeePct) / 100
        : 0;
      const recipientReceives = hasPlatformFee
        ? amountValue - platformFeeAmount
        : amountValue;
      const totalToPay = amountValue + protocolFeeAmount;
      return {
        currencyKey,
        amountValue,
        platformFeeAmount,
        protocolFeeAmount,
        recipientReceives,
        totalToPay,
      };
    });

    const totalProtocolFee = totalsByCurrency.reduce(
      (sum, item) => sum + item.protocolFeeAmount,
      0,
    );

    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Currencies ({entries.length})
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-wider pl-1">
              <span>Currency</span>
              <div className="flex items-center gap-3">
                <span className="w-20 text-right">Amount</span>
                {hasAnyFee && <span className="w-20 text-right">Fee</span>}
              </div>
            </div>
            {totalsByCurrency.map(
              ({
                currencyKey,
                amountValue,
                platformFeeAmount,
                protocolFeeAmount,
              }) => {
                const totalFee = platformFeeAmount + protocolFeeAmount;
                return (
                  <div
                    key={currencyKey}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatCurrencyLabel(currencyKey)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground w-20 text-right">
                        {amountValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {hasAnyFee && (
                        <span className="font-mono text-xs text-amber-600 dark:text-amber-400 w-20 text-right">
                          {totalFee > 0
                            ? formatAmountRaw(totalFee)
                            : "0.000000"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>

        {hasAnyFee && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {hasPlatformFee && platformFee && (
              <span className="flex items-center gap-1">
                Platform Fee: {validatedPlatformFeePct}%
                <div className="relative group/info">
                  <Info className="w-3 h-3 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover/info:block w-48 p-2 text-xs bg-popover border rounded shadow z-50 break-all">
                    {platformFee.address}
                  </div>
                </div>
              </span>
            )}
            {hasProtocolFee && protocolFee && (
              <span className="flex items-center gap-1">
                Protocol Fee: {validatedProtocolFeePct}%
                <div className="relative group/info">
                  <Info className="w-3 h-3 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover/info:block w-48 p-2 text-xs bg-popover border rounded shadow z-50 break-all">
                    {protocolFee.address}
                  </div>
                </div>
              </span>
            )}
          </div>
        )}

        <Separator className="my-2" />

        {isSingleCurrency ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Recipient receives
              </span>
              <span className="font-medium">
                {totalsByCurrency[0].recipientReceives.toFixed(
                  totalsByCurrency[0].recipientReceives < 1 ? 6 : 2,
                )}{" "}
                {formatCurrencyLabel(totalsByCurrency[0].currencyKey)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total to pay</span>
              <span className="text-lg font-semibold">
                {totalsByCurrency[0].totalToPay.toFixed(
                  totalsByCurrency[0].totalToPay < 1 ? 6 : 2,
                )}{" "}
                {formatCurrencyLabel(totalsByCurrency[0].currencyKey)}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <span className="text-sm font-semibold">Recipients receive</span>
              <div className="space-y-1 mt-1">
                {totalsByCurrency.map(({ currencyKey, recipientReceives }) => (
                  <div
                    key={currencyKey}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-muted-foreground">
                      {formatCurrencyLabel(currencyKey)}
                    </span>
                    <span className="font-medium">
                      {recipientReceives.toFixed(recipientReceives < 1 ? 6 : 2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total to pay</span>
              <span className="text-lg font-semibold">
                {totalProtocolFee > 0 ? "+" : ""}
                {formatAmountRaw(totalProtocolFee)}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!data) {
      return (
        <div className="p-6 text-center text-muted-foreground">
          No payment data available
        </div>
      );
    }

    return mode === "direct" ? renderDirectMode() : renderBatchMode();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl p-0 overflow-hidden [&>button]:hidden">
        <div className="bg-muted/50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">
              {mode === "batch"
                ? "Batch Payout Fee Summary"
                : "Payout Fee Summary"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Review
              </span>
            </div>
            <div className="w-8 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                2
              </div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Confirm
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {renderContent()}

          <Card className="bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50">
            <CardContent className="p-4 flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                  Secure Transaction
                </h4>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1 leading-relaxed">
                  This payment is secured using Request Network. Your
                  transaction will be processed safely and transparently on the
                  blockchain.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleConfirm}
              disabled={!canConfirm}
              className="flex-1 h-11 font-semibold"
            >
              Confirm & Send Payment
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="px-6 h-11 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        </div>

        {walletAddress && (
          <div className="px-6 py-3 bg-muted/50 border-t flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Connected: {formatAddress(walletAddress)}
            </div>
            <div className="text-xs text-muted-foreground">
              © 2026 EasyInvoice
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});
