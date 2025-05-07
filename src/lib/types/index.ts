export interface PaymentRoute {
  id: string;
  fee: number;
  speed: number | "FAST";
  price_impact: number;
  chain: string;
  token: string;
  isCryptoToFiat?: boolean;
}
