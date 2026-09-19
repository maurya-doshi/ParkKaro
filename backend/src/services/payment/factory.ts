import { IPaymentProvider } from './types';
import { mockPaymentProvider } from './mockProvider';
import { env } from '../../config/env';

/**
 * Factory to retrieve the active payment provider implementation.
 */
export function getPaymentProvider(): IPaymentProvider {
  switch (env.paymentProvider) {
    case 'RAZORPAY':
    case 'STRIPE':
      // Extensible for future production provider implementations
      return mockPaymentProvider;
    case 'MOCK':
    default:
      return mockPaymentProvider;
  }
}
