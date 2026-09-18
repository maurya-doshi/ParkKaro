import { calculatePrice } from '../src/utils/pricing';
import { parseDate, durationInHours, timeRangesOverlap } from '../src/utils/dates';
import { generateQRData } from '../src/utils/qr';

describe('Core Utilities', () => {
  describe('dates', () => {
    it('should parse valid ISO dates and throw on invalid', () => {
      const d = parseDate('2026-09-18T10:00:00.000Z');
      expect(d).toBeInstanceOf(Date);
      expect(() => parseDate('invalid-date')).toThrow();
    });

    it('should calculate duration in hours accurately', () => {
      const start = '2026-09-18T10:00:00.000Z';
      const end = '2026-09-18T12:30:00.000Z';
      expect(durationInHours(start, end)).toBe(2.5);
    });

    it('should correctly detect overlapping and non-overlapping time ranges', () => {
      const start1 = '2026-09-18T10:00:00.000Z';
      const end1 = '2026-09-18T12:00:00.000Z';

      // Overlapping
      expect(timeRangesOverlap(start1, end1, '2026-09-18T11:00:00.000Z', '2026-09-18T13:00:00.000Z')).toBe(true);

      // Abutting (non-overlapping with half-open intervals [start, end))
      expect(timeRangesOverlap(start1, end1, '2026-09-18T12:00:00.000Z', '2026-09-18T14:00:00.000Z')).toBe(false);

      // Disjoint
      expect(timeRangesOverlap(start1, end1, '2026-09-18T14:00:00.000Z', '2026-09-18T16:00:00.000Z')).toBe(false);
    });
  });

  describe('pricing', () => {
    it('should calculate base amount, platform fee, and total accurately', () => {
      const start = '2026-09-18T10:00:00.000Z';
      const end = '2026-09-18T12:00:00.000Z';
      const breakdown = calculatePrice(100, start, end, 10, 0);

      expect(breakdown.durationHours).toBe(2);
      expect(breakdown.baseAmount).toBe(200);
      expect(breakdown.platformFee).toBe(20);
      expect(breakdown.tax).toBe(0);
      expect(breakdown.totalAmount).toBe(220);
    });
  });

  describe('qr', () => {
    it('should generate QR payload with expected fields', () => {
      const result = generateQRData({
        bookingId: 'b-123',
        listingId: 'l-456',
        driverId: 'u-789',
        startTime: '2026-09-18T10:00:00.000Z',
        endTime: '2026-09-18T12:00:00.000Z',
      });

      expect(result.payload.bookingId).toBe('b-123');
      expect(result.payload.listingId).toBe('l-456');
      expect(result.payload.driverId).toBe('u-789');
      expect(result.payload.verificationCode).toBeDefined();
      expect(result.encoded).toBeDefined();
    });
  });
});
