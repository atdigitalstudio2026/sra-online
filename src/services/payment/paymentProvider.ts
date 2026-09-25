/**
 * Abstract Payment Provider Interface
 * Provider-agnostic abstraction for Midtrans, Xendit, and future gateways
 */

export interface ProviderTransactionParams {
  order_id: string;
  order_number: string;
  amount: number;
  customer: {
    first_name: string;
    email?: string;
    phone: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  shipping_cost?: number;
  payment_method_code?: string;
  custom_expiry_minutes?: number;
}

export interface ProviderTransactionResult {
  provider: string;
  provider_transaction_id?: string;
  payment_token?: string; // Snap token or invoice id
  payment_url?: string;   // Redirect URL
  expires_at: string;     // ISO timestamp
  raw_response: any;
}

export interface ProviderVerificationResult {
  provider: string;
  provider_transaction_id: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  paid_at?: string | null;
  failure_reason?: string | null;
  payment_method?: string;
  raw_response: any;
}

export interface ProviderWebhookPayload {
  provider: string;
  order_id?: string;
  order_number?: string;
  provider_transaction_id?: string;
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  payment_method?: string;
  amount?: number;
  paid_at?: string;
  raw_payload: any;
  is_valid_signature: boolean;
}

export interface PaymentProvider {
  readonly name: string;
  createTransaction(params: ProviderTransactionParams): Promise<ProviderTransactionResult>;
  verifyTransaction(transactionIdOrOrderId: string): Promise<ProviderVerificationResult>;
  verifyWebhookSignature(payload: any, signatureHeader?: string): Promise<boolean>;
  parseWebhookNotification(payload: any): ProviderWebhookPayload;
}
