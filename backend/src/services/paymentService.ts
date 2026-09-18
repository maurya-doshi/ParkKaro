import { v4 as uuidv4 } from 'uuid';
import { paymentRepository } from '../repositories/paymentRepository';
import { bookingRepository } from '../repositories/bookingRepository';
import { Payment, PaymentProviderStatus } from '../models/Payment';
import { getPaymentProvider } from './payment/factory';
import { VALID_PAYMENT_TRANSITIONS } from './payment/types';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors';

export class PaymentService {
  /**
   * Create a payment record for a valid booking.
   * Server calculates authoritative amount from booking record. Client amounts are ignored.
   * Idempotency guarantee: Returns existing active payment if already created for this booking.
   */
  async createPayment(
    userId: string,
    userRole: string,
    bookingId: string
  ): Promise<Payment> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking', bookingId);
    }

    if (booking.driverId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenError('You do not have permission to create a payment for this booking');
    }

    // Idempotency check: prevent duplicate payments for the same booking
    const existingPayment = await paymentRepository.findByBookingId(bookingId);
    if (existingPayment) {
      if (existingPayment.status === 'PAID' || existingPayment.status === 'PENDING') {
        return existingPayment;
      }
    }

    const provider = getPaymentProvider();
    const intent = await provider.createPaymentIntent({
      bookingId,
      userId,
      amount: booking.totalAmount,
      currency: 'INR',
    });

    const paymentId = `pay_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const timestamp = new Date().toISOString();

    const payment: Payment = {
      paymentId,
      bookingId,
      userId,
      amount: booking.totalAmount, // Server-authoritative
      currency: 'INR',
      status: intent.status || 'PENDING',
      provider: 'MOCK',
      providerRef: intent.providerRef,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return paymentRepository.create(payment);
  }

  /**
   * Retrieve payment details with strict user/host/admin authorization.
   */
  async getPaymentById(paymentId: string, userId: string, userRole: string): Promise<Payment> {
    const payment = await paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment', paymentId);
    }

    if (payment.userId !== userId && userRole !== 'ADMIN') {
      const booking = await bookingRepository.findById(payment.bookingId);
      if (!booking || (booking.hostId !== userId && userRole !== 'ADMIN')) {
        throw new ForbiddenError('You do not have permission to view this payment');
      }
    }

    return payment;
  }

  /**
   * Process and finalize payment through configured provider.
   * Enforces payment state machine transitions.
   */
  async processPayment(
    paymentId: string,
    userId: string,
    userRole: string,
    metadata?: Record<string, string>
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, userId, userRole);

    // Idempotent success: already paid
    if (payment.status === 'PAID') {
      return payment;
    }

    // State machine check
    this.assertValidTransition(payment.status, 'PAID');

    const provider = getPaymentProvider();
    const result = await provider.processPayment(
      payment.paymentId,
      payment.providerRef || '',
      payment.amount,
      metadata
    );

    const targetStatus: PaymentProviderStatus = result.success ? 'PAID' : 'FAILED';
    const updated = await paymentRepository.updateStatus(paymentId, targetStatus, result.providerRef);
    if (!updated) {
      throw new NotFoundError('Payment', paymentId);
    }

    // Synchronize booking payment status
    await bookingRepository.updatePaymentStatus(payment.bookingId, targetStatus);

    return updated;
  }

  /**
   * Refund a paid payment.
   */
  async refundPayment(
    paymentId: string,
    userId: string,
    userRole: string,
    metadata?: Record<string, string>
  ): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId, userId, userRole);

    this.assertValidTransition(payment.status, 'REFUNDED');

    const provider = getPaymentProvider();
    const result = await provider.refundPayment(payment.providerRef || '', payment.amount, metadata);

    const updated = await paymentRepository.updateStatus(paymentId, 'REFUNDED', result.providerRef);
    if (!updated) {
      throw new NotFoundError('Payment', paymentId);
    }

    await bookingRepository.updatePaymentStatus(payment.bookingId, 'REFUNDED');
    return updated;
  }

  /**
   * Enforce valid payment state transitions.
   */
  private assertValidTransition(
    currentStatus: PaymentProviderStatus,
    targetStatus: PaymentProviderStatus
  ): void {
    const allowedTransitions = VALID_PAYMENT_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid payment transition from ${currentStatus} to ${targetStatus}`
      );
    }
  }
}

export const paymentService = new PaymentService();
