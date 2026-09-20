import {
  userRepository,
  parkingRepository,
  bookingRepository,
  slotLockRepository,
  vehicleRepository,
  reviewRepository,
  favoriteRepository,
  paymentRepository,
  payoutRepository,
  notificationRepository,
  conversationRepository,
  messageRepository,
  disputeRepository,
  reportRepository,
} from '../src/repositories';
import { docClient } from '../src/config/database';

jest.mock('../src/config/database', () => ({
  docClient: {
    send: jest.fn(),
  },
}));

describe('DynamoDB Repositories', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserRepository', () => {
    it('should query user by email through GSI', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ userId: 'u-1', email: 'test@example.com', name: 'Test User' }],
      });

      const user = await userRepository.findByEmail('test@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });

    it('should find users by role', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ userId: 'u-1', role: 'DRIVER' }],
      });

      const drivers = await userRepository.findByRole('DRIVER');
      expect(drivers.length).toBe(1);
      expect(drivers[0].role).toBe('DRIVER');
    });
  });

  describe('ParkingRepository', () => {
    it('should query listings by area and price', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ listingId: 'p-1', area: 'Indiranagar', pricePerHour: 50 }],
      });

      const listings = await parkingRepository.findByArea('Indiranagar', 100);
      expect(listings.length).toBe(1);
      expect(listings[0].area).toBe('Indiranagar');
    });

    it('should query active and available listings', async () => {
      (docClient.send as jest.Mock)
        .mockResolvedValueOnce({
          Items: [{ listingId: 'p-1', status: 'ACTIVE' }],
        })
        .mockResolvedValueOnce({
          Items: [{ listingId: 'p-2', status: 'AVAILABLE' }],
        });

      const active = await parkingRepository.listActive();
      expect(active.length).toBe(2);
      expect(active[0].status).toBe('ACTIVE');
      expect(active[1].status).toBe('AVAILABLE');
    });
  });

  describe('BookingRepository', () => {
    it('should query bookings by driver ID', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ bookingId: 'b-1', driverId: 'u-1', bookingStatus: 'CONFIRMED' }],
      });

      const bookings = await bookingRepository.findByDriverId('u-1');
      expect(bookings.length).toBe(1);
      expect(bookings[0].bookingId).toBe('b-1');
    });
  });

  describe('SlotLockRepository', () => {
    it('should acquire slot locks atomically via transactWrite', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({});

      const acquired = await slotLockRepository.acquireLocks([
        {
          listingId: 'l-1',
          slotKey: '2026-09-20#20',
          bookingId: 'b-1',
          driverId: 'u-1',
          startTime: '2026-09-20T10:00:00.000Z',
          endTime: '2026-09-20T10:30:00.000Z',
          status: 'BOOKED',
          createdAt: '2026-09-20T00:00:00.000Z',
        },
      ]);

      expect(acquired).toBe(true);
      expect(docClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return false when TransactionCanceledException occurs', async () => {
      const error: any = new Error('Transaction cancelled');
      error.name = 'TransactionCanceledException';
      (docClient.send as jest.Mock).mockRejectedValueOnce(error);

      const acquired = await slotLockRepository.acquireLocks([
        {
          listingId: 'l-1',
          slotKey: '2026-09-20#20',
          bookingId: 'b-2',
          driverId: 'u-2',
          startTime: '2026-09-20T10:00:00.000Z',
          endTime: '2026-09-20T10:30:00.000Z',
          status: 'BOOKED',
          createdAt: '2026-09-20T00:00:00.000Z',
        },
      ]);

      expect(acquired).toBe(false);
    });
  });

  describe('Vehicle, Review, and Favorite Repositories', () => {
    it('should check if listing is favorite', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Item: { userId: 'u-1', listingId: 'l-1' },
      });

      const isFav = await favoriteRepository.isFavorite('u-1', 'l-1');
      expect(isFav).toBe(true);
    });

    it('should find vehicle by user ID', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ vehicleId: 'v-1', userId: 'u-1', vehicleNumber: 'KA01AB1234' }],
      });

      const vehicles = await vehicleRepository.findByUserId('u-1');
      expect(vehicles.length).toBe(1);
      expect(vehicles[0].vehicleNumber).toBe('KA01AB1234');
    });

    it('should find review by booking ID', async () => {
      (docClient.send as jest.Mock).mockResolvedValueOnce({
        Items: [{ reviewId: 'r-1', bookingId: 'b-1', rating: 5 }],
      });

      const review = await reviewRepository.findByBookingId('b-1');
      expect(review).toBeDefined();
      expect(review?.rating).toBe(5);
    });
  });
});
