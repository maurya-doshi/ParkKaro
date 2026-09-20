import { PaymentProviderStatus } from '../../models/Payment';

export interface CreatePaymentIntentParams {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResult {
  providerRef: string;
  status: PaymentProviderStatus;
}

export interface PaymentProcessResult {
  success: boolean;
  status: PaymentProviderStatus;
  providerRef: string;
  failureReason?: string;
}

export interface PaymentRefundResult {
  success: boolean;
  status: PaymentProviderStatus;
  providerRef: string;
}

/**
 * Payment Provider Abstraction Interface.
 * Allows swapping between Mock, Razorpay, Stripe, etc. without changing business logic.
 */
export interface IPaymentProvider {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  processPayment(
    paymentId: string,
    providerRef: string,
    amount: number,
    metadata?: Record<string, string>
  ): Promise<PaymentProcessResult>;
  refundPayment(
    providerRef: string,
    amount: number,
    metadata?: Record<string, string>
  ): Promise<PaymentRefundResult>;
}

/**
 * Valid state transitions for the payment lifecycle state machine.
 */
export const VALID_PAYMENT_TRANSITIONS: Record<PaymentProviderStatus, PaymentProviderStatus[]> = {
  PENDING: ['PROCESSING', 'PAID', 'FAILED'],
  PROCESSING: ['PAID', 'FAILED'],
  PAID: ['REFUNDED'],
  FAILED: ['PENDING', 'PROCESSING'], // Retry allowed
  REFUNDED: [],
};
