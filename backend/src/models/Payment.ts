/**
 * Payment model — corresponds to parkkaro-payments table.
 */

export type PaymentProviderStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type PaymentProvider = 'MOCK' | 'RAZORPAY' | 'STRIPE';

export interface Payment {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentProviderStatus;
  provider: PaymentProvider;
  providerRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  bookingId: string;
  amount: number;
  currency?: string;
}

/**
 * Payment provider interface — Person 3 / integration team can swap implementations.
 */
export interface IPaymentProvider {
  createPayment(amount: number, currency: string, metadata: Record<string, string>): Promise<{ providerRef: string; status: PaymentProviderStatus }>;
  confirmPayment(providerRef: string): Promise<{ status: PaymentProviderStatus }>;
  refundPayment(providerRef: string, amount: number): Promise<{ status: PaymentProviderStatus }>;
}
