export interface FeeInfo {
  feePercentage: string;
  feeAddress: string;
}

// TODO check out if we want to rework all numbers to strings

export interface PaymentError {
  type: "wallet" | "transaction" | "api" | "unknown";
  error: Error;
}

export interface Transaction {
  to: string;
  data: string;
  value: { hex: string };
}

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
  discount?: string;
  tax?: string;
  total: string;
  currency?: string;
}

export interface CompanyInfo {
  name: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface BuyerInfo {
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface ReceiptTotals {
  totalDiscount: string;
  totalTax: string;
  total: string;
  totalUSD: string;
}

export interface ReceiptInfo {
  buyerInfo?: BuyerInfo;
  companyInfo: CompanyInfo;
  items: ReceiptItem[];
  totals: ReceiptTotals;
  receiptNumber?: string;
}
