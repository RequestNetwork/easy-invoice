# Payment Widget

A React component for accepting cryptocurrency payments using the Request Network protocol. This widget provides a complete payment flow with wallet connection, currency selection, buyer information collection, and payment processing.

## Overview

The Payment Widget is a comprehensive solution for integrating cryptocurrency payments into React applications. It handles the entire payment process from wallet connection to payment confirmation, with support for multiple currencies and networks through the Request Network.

## Features

- **Multi-wallet support** - Compatible with MetaMask, WalletConnect, Coinbase Wallet, and Safe
- **Currency flexibility** - Supports multiple cryptocurrencies with automatic conversion rates
- **Receipt generation** - Built-in PDF receipt generation and download
- **Network support** - Works across Ethereum mainnet, Arbitrum, Base, Optimism, Polygon, and Sepolia
- **Customizable UI** - Configurable display options and Tailwind CSS theming
- **TypeScript support** - Fully typed for enhanced developer experience
- **Works with your Viem accounts** - if your users are already logged in, you can use their logged in Viem account.

## Installation

Install the required dependencies:

```bash
npm install wagmi viem @tanstack/react-query react-hook-form lucide-react html2pdf.js
```

Add the Payment Widget to your project using shadcn/ui:

```bash
npx shadcn add payment-widget
```

## Basic Usage

```tsx
import { PaymentWidget } from "@/components/payment-widget/payment-widget";

function App() {
  return (
    <PaymentWidget
      amountInUsd="100.00"
      recipientWallet="0x742d35Cc6639C0532c29e54F3D4B48E4d7d5f1E0"
      paymentConfig={{
        walletConnectProjectId: "your-project-id",
        network: "mainnet",
        rnApiClientId: "your-rn-api-client-id",
      }}
      receiptInfo={{
        companyInfo: {
          name: "Your Company",
          address: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            postalCode: "10001",
          },
          email: "contact@yourcompany.com",
          taxId: "123-45-6789",
          walletAddress: "0x742d35Cc6639C0532c29e54F3D4B48E4d7d5f1E0",
        },
        items: [
          {
            id: "1",
            description: "Product or Service",
            quantity: 1,
            unitPrice: "100.00",
            total: "100.00",
          },
        ],
        totals: {
          total: 100,
          totalUSD: 100.00,
          totalDiscount: 0.00,
          totalTax: 0.00,
        },
      }}
      onPaymentSuccess={(requestId, transactionReceipts) => console.log("Payment successful:", requestId, transactionReceipts)}
      onPaymentError={(error) => console.error("Payment failed:", error)}
    />
  );
}
```

## Props Reference

### Core Props

#### `amountInUsd` (required)
- **Type**: `string`
- **Description**: The payment amount in USD. This is the base amount that will be converted to the selected cryptocurrency at current exchange rates.
- **Example**: `"100.00"`

#### `recipientWallet` (required)
- **Type**: `string`
- **Description**: The Ethereum wallet address that will receive the payment. Must be a valid Ethereum address.
- **Example**: `"0x742d35Cc6639C0532c29e54F3D4B48E4d7d5f1E0"`

#### `paymentConfig` (required)
- **Type**: `PaymentConfig`
- **Description**: Configuration object containing payment-related settings.

##### PaymentConfig Properties

###### `walletConnectProjectId` (optional)
- **Type**: `string`
- **Description**: WalletConnect v2 project ID for wallet connection. Obtain from [WalletConnect Cloud](https://cloud.walletconnect.com/).

###### `network` (required)
- **Type**: `"arbitrum" | "base" | "mainnet" | "optimism" | "polygon" | "sepolia"`
- **Description**: The blockchain network to process payments on.

###### `rnApiClientId` (required)
- **Type**: `string`
- **Description**: Request Network API client ID for accessing conversion rates and processing payments. Obtain from Request Network.

###### `feeInfo` (optional)
- **Type**: `FeeInfo`
- **Description**: Fee configuration for the payment. Defines any additional fees to be applied.

###### `supportedCurrencies` (optional)
- **Type**: `string[]`
- **Description**: Array of cryptocurrency IDs to limit currency selection. If not provided, all available currencies for the network will be shown.
- **Example**: `["ethereum-mainnet", "usdc-ethereum"]`

#### `receiptInfo` (required)
- **Type**: `ReceiptInfo`
- **Description**: Comprehensive receipt information for PDF generation and payment records.

##### ReceiptInfo Properties

###### `companyInfo` (required)
- **Type**: `CompanyInfo`
- **Description**: Your company's information for the receipt.

**CompanyInfo Structure:**
```typescript
{
  name: string;                    // Company name
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  email?: string;                  // Company email
  taxId: string;                   // Tax identification number
  walletAddress: string;           // Company wallet address
}
```

###### `items` (required)
- **Type**: `ReceiptItem[]`
- **Description**: Array of line items for the receipt.

**ReceiptItem Structure:**
```typescript
{
  id: string;                      // Unique item identifier
  description: string;             // Item description
  quantity: number;                // Quantity of items
  unitPrice: string;               // Price per unit in USD
  total: string;                   // Total price for this line item
  currency?: string;               // Currency override (defaults to USD)
  discount?: number;               // Discount percentage (0-100)
  tax?: number;                    // Tax percentage (0-100)
}
```

###### `totals` (required)
- **Type**: `ReceiptTotals`
- **Description**: Summary totals for the receipt.

**ReceiptTotals Structure:**
```typescript
{
  total: string;                   // Total amount in base currency
  totalUSD: string;                // Total amount in USD
  totalDiscount: string;           // Total discount amount
  totalTax: string;                // Total tax amount
}
```

###### `buyerInfo` (optional)
- **Type**: `BuyerInfo`
- **Description**: Pre-filled buyer information. If provided, the buyer info form will be pre-populated.

###### `receiptNumber` (optional)
- **Type**: `string`
- **Description**: Custom receipt number. If not provided, a default will be generated.

### Configuration Props

#### `uiConfig` (optional)
- **Type**: `UiConfig`
- **Description**: UI behavior configuration options.

##### UiConfig Properties

###### `showRequestScanUrl` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to show a link to view the payment on Request Scan after successful payment.

###### `showReceiptDownload` (optional)
- **Type**: `boolean`
- **Default**: `true`
- **Description**: Whether to show the receipt PDF download button after successful payment.

#### `walletAccount` (optional)
- **Type**: `WalletClient`
- **Description**: Pre-connected wallet client (using Viem/Wagmi). If provided, the wallet connection step will be skipped. Useful when you already manage wallet connection in your application.

### Event Handlers

#### `onPaymentSuccess` (optional)
- **Type**: `(requestId: string) => void | Promise<void>`
- **Description**: Callback function called when payment is successfully completed. Receives the Request Network request ID.

#### `onPaymentError` (optional)
- **Type**: `(error: PaymentError) => void | Promise<void>`
- **Description**: Callback function called when payment fails. Receives detailed error information.

### Children

#### `children` (optional)
- **Type**: `ReactNode`
- **Description**: Custom trigger element for the payment widget. If not provided, defaults to "Pay with crypto" button.
- **Example**: 
```tsx
<PaymentWidget {...props}>
  <button className="custom-pay-button">
    Pay Now
  </button>
</PaymentWidget>
```

## PaymentWidget Props

### onComplete
Optional callback that fires when the user closes the payment widget from the success screen. Use this to handle post-payment cleanup or navigation.

```tsx
<PaymentWidget
  // ... other props
  onComplete={() => {
    // Close modal, redirect user, etc.
    console.log("Payment flow completed");
  }}
/>
```

### PaymentConfig.reference
Optional string to associate with the payment request for your own tracking purposes. This reference will be stored with the Request Network payment data.

```tsx
<PaymentWidget
  paymentConfig={{
    rnApiClientId: "your-client-id",
    reference: "invoice-12345", // Your internal reference
    supportedCurrencies: ["ETH-sepolia-sepolia"]
  }}
  // ... other props
/>
```

## Styling and Theming

The Payment Widget uses Tailwind CSS and respects your application's design system through CSS custom properties. The following variables can be customized:

```css
:root {
  --primary: #your-primary-color;
  --primary-foreground: #your-primary-text-color;
  --secondary: #your-secondary-color;
  --secondary-foreground: #your-secondary-text-color;
  --muted: #your-muted-color;
  --muted-foreground: #your-muted-text-color;
  --accent: #your-accent-color;
  --accent-foreground: #your-accent-text-color;
  --background: #your-background-color;
  --foreground: #your-text-color;
  --border: #your-border-color;
  --radius: 0.5rem;
}
```

## Using Your Existing Wallet Client

If your application already manages wallet connections using Viem/Wagmi, you can pass your existing wallet client to skip the built-in wallet connection flow. This is perfect for applications that have their own wallet connection UI or state management.

### With Wagmi

```tsx
import { useWalletClient } from "wagmi";
import { PaymentWidget } from "@/components/payment-widget/payment-widget";

function PaymentWithExistingWallet() {
  const { data: walletClient } = useWalletClient();

  return (
    <PaymentWidget
      amountInUsd="100.00"
      recipientWallet="0x742d35Cc6639C0532c29e54F3D4B48E4d7d5f1E0"
      walletAccount={walletClient} // Pass your existing wallet client
      paymentConfig={{
        network: "mainnet",
        rnApiClientId: "your-rn-api-client-id",
      }}
      receiptInfo={{
        // ... your receipt info
      }}
      onPaymentSuccess={(requestId) => console.log("Payment successful:", requestId)}
      onPaymentError={(error) => console.error("Payment failed:", error)}
    >
      Pay with My Connected Wallet
    </PaymentWidget>
  );
}
```

### With Direct Viem Client

You can also pass any Viem wallet client directly. For more information on creating wallet clients, see the [Viem documentation](https://viem.sh/docs/clients/wallet).

```tsx
import { createWalletClient, custom } from "viem";
import { mainnet } from "viem/chains";

// Create wallet client directly with Viem
const walletClient = createWalletClient({
  chain: mainnet,
  transport: custom(window.ethereum),
});

// Use with Payment Widget
<PaymentWidget
  walletAccount={walletClient}
  // ... other props
/>
```

### Benefits of Using Existing Wallet Client

- **Consistent UX** - Users don't see multiple wallet connection prompts
- **Shared State** - Wallet connection state is managed in one place
- **Better Performance** - Reuses existing connection instead of creating new ones
- **Simplified Flow** - Skips wallet selection step in the payment widget

When `walletAccount` is provided, the Payment Widget will:
- Skip the wallet connection step entirely
- Use the provided wallet for all transactions
- Display payment options immediately
- Maintain your application's wallet connection state

## Error Handling

The widget includes comprehensive error handling for common scenarios:

- **Network connectivity issues**
- **Insufficient wallet balance**
- **Transaction rejection**
- **Invalid wallet addresses**
- **API rate limiting**

All errors are passed to the `onPaymentError` callback with detailed error information for debugging and user feedback.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

The Payment Widget requires these peer dependencies:

- `react` 
- `wagmi` 
- `viem` 
- `@tanstack/react-query` 
- `react-hook-form` 
- `lucide-react`
- `html2pdf.js`

## Security Considerations

- Always validate payment amounts on your backend
- Verify wallet addresses before processing
- Implement proper rate limiting for payment requests
- Store sensitive configuration (API keys) securely
- Use HTTPS in production environments

## Support

For technical support and bug reports, please visit the [Request Network documentation](https://docs.request.network) or raise an issue in the repository.