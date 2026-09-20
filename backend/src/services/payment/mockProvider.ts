import { v4 as uuidv4 } from 'uuid';
import {
  IPaymentProvider,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  PaymentProcessResult,
  PaymentRefundResult,
} from './types';

/**
 * MockPaymentProvider for testing and local/hackathon demo development.
 */
export class MockPaymentProvider implements IPaymentProvider {
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const providerRef = `mock_txn_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    return {
      providerRef,
      status: 'PENDING',
    };
  }

  async processPayment(
    paymentId: string,
    providerRef: string,
    amount: number,
    metadata?: Record<string, string>
  ): Promise<PaymentProcessResult> {
    // Check if test intentionally requested a failure simulation
    if (metadata?.force_failure === 'true' || amount <= 0) {
      return {
        success: false,
        status: 'FAILED',
        providerRef,
        failureReason: metadata?.failure_reason || 'Card declined / Mock payment failed',
      };
    }

    return {
      success: true,
      status: 'PAID',
      providerRef: providerRef || `mock_txn_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
    };
  }

  async refundPayment(
    providerRef: string,
    amount: number,
    _metadata?: Record<string, string>
  ): Promise<PaymentRefundResult> {
    return {
      success: true,
      status: 'REFUNDED',
      providerRef: `mock_ref_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
