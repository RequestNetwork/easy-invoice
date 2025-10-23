import type { BuyerInfo, CompanyInfo, ReceiptItem } from "../types";

export interface PaymentInfo {
  chain: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  transactionHash?: string;
}

export interface ReceiptMetadata {
  receiptNumber: string;
  issueDate: Date;
  notes?: string;
}

interface ReceiptBuyerInfo extends BuyerInfo {
  walletAddress: string;
}

interface ReceiptCompanyInfo extends CompanyInfo {
  walletAddress: string;
}

export interface ReceiptData {
  company: ReceiptCompanyInfo;
  buyer: ReceiptBuyerInfo;
  payment: PaymentInfo;
  items: ReceiptItem[];
  metadata: ReceiptMetadata;
  totals: {
    totalDiscount: string;
    totalTax: string;
    total: string;
    totalUSD: string;
  };
}

export const generateReceiptNumber = (prefix: string = "REC"): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `${prefix}-${timestamp}-${random}`;
};

export const formatUSDAmount = (amount: string): string => {
  const numericAmount = parseFloat(amount);

  if (Number.isNaN(numericAmount)) {
    return "$0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export const formatCryptoAmount = (
  amount: string,
  currency: string,
): string => {
  return `${amount} ${currency}`;
};

export const formatReceiptDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export interface CreateReceiptParams {
  company: ReceiptCompanyInfo;
  buyer: ReceiptBuyerInfo;
  payment: PaymentInfo;
  items: ReceiptItem[];
  totals: {
    totalDiscount: string;
    totalTax: string;
    total: string;
    totalUSD: string;
  };
  metadata: Omit<ReceiptMetadata, "issueDate">;
}

export const createReceipt = (params: CreateReceiptParams): ReceiptData => {
  const metadata: ReceiptMetadata = {
    ...params.metadata,
    issueDate: new Date(),
  };

  const receipt: ReceiptData = {
    metadata,
    company: params.company,
    buyer: params.buyer,
    payment: params.payment,
    items: params.items,
    totals: params.totals,
  };

  return receipt;
};

export const ReceiptUtils = {
  createReceipt,
  generateReceiptNumber,
  formatUSDAmount,
  formatCryptoAmount,
  formatReceiptDate,
} as const;
