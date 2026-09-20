import { apiClient } from './client';

export interface PaymentRecord {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REFUNDED';
  providerRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  currency?: string;
}

export interface ConfirmPaymentRequest {
  providerRef: string;
}

export const paymentsApi = {
  /**
   * Create a payment record for a booking (DRIVER)
   * POST /payments/create
   */
  async create(data: CreatePaymentRequest): Promise<PaymentRecord> {
    const res = await apiClient.post<PaymentRecord>('/payments/create', {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency || 'INR'
    });
    if (res && res.data) {
      return res.data;
    }
    throw new Error('Failed to initiate payment');
  },

  /**
   * Confirm/complete a payment (DRIVER)
   * POST /payments/{id}/confirm
   */
  async confirm(paymentId: string, data: ConfirmPaymentRequest): Promise<PaymentRecord> {
    const res = await apiClient.post<PaymentRecord>(`/payments/${paymentId}/confirm`, data);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Failed to confirm payment '${paymentId}'`);
  },

  /**
   * Get payment details
   * GET /payments/{id}
   */
  async getById(paymentId: string): Promise<PaymentRecord> {
    const res = await apiClient.get<PaymentRecord>(`/payments/${paymentId}`);
    if (res && res.data) {
      return res.data;
    }
    throw new Error(`Payment '${paymentId}' not found`);
  }
};
