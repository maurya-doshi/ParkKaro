import request from 'supertest';
import { app } from '../src/app';
import { vehicleRepository } from '../src/repositories/vehicleRepository';
import { favoriteRepository } from '../src/repositories/favoriteRepository';
import { reviewRepository } from '../src/repositories/reviewRepository';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { Vehicle } from '../src/models/Vehicle';
import { Favorite } from '../src/models/Favorite';
import { Review } from '../src/models/Review';
import { Booking } from '../src/models/Booking';
import { ParkingListing } from '../src/models/ParkingListing';

jest.mock('../src/repositories/vehicleRepository');
jest.mock('../src/repositories/favoriteRepository');
jest.mock('../src/repositories/reviewRepository');
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/notificationRepository');

// ─── Mock Data ────────────────────────────────────────────────
const mockVehicle: Vehicle = {
  vehicleId: 'vehicle_abc123',
  userId: 'driver_1',
  vehicleNumber: 'KA-01-AB-1234',
  vehicleType: 'CAR',
  make: 'Hyundai',
  model: 'Creta',
  color: 'White',
  isDefault: true,
  createdAt: '2026-09-19T00:00:00.000Z',
  updatedAt: '2026-09-19T00:00:00.000Z',
};

const mockListing: ParkingListing = {
  listingId: 'listing_abc123',
  hostId: 'host_1',
  title: 'Covered Parking Near Forum Mall',
  description: 'Secure spot',
  address: 'Koramangala',
  area: 'Koramangala',
  city: 'Bengaluru',
  latitude: 12.9352,
  longitude: 77.6245,
  parkingType: 'COVERED',
  capacity: 2,
  vehicleTypes: ['CAR', 'SUV'],
  pricePerHour: 40,
  amenities: ['covered', 'cctv'],
  photos: [],
  availability: { monday: { open: '06:00', close: '23:00' } },
  cancellationPolicy: 'MODERATE',
  rating: 4.5,
  reviewCount: 10,
  status: 'ACTIVE',
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

const mockFavorite: Favorite = {
  userId: 'driver_1',
  listingId: 'listing_abc123',
  createdAt: '2026-09-19T00:00:00.000Z',
};

const mockCompletedBooking: Booking = {
  bookingId: 'booking_completed',
  listingId: 'listing_abc123',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_abc123',
  startTime: '2026-09-18T10:00:00.000Z',
  endTime: '2026-09-18T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 80,
  platformFee: 8,
  tax: 0,
  totalAmount: 88,
  hostEarnings: 72,
  paymentStatus: 'PAID',
  bookingStatus: 'COMPLETED',
  qrData: 'eyJi...',
  qrVerificationCode: 'ABCD1234',
  createdAt: '2026-09-18T09:00:00.000Z',
  updatedAt: '2026-09-18T12:00:00.000Z',
};

const mockReview: Review = {
  reviewId: 'review_xyz789',
  listingId: 'listing_abc123',
  bookingId: 'booking_completed',
  userId: 'driver_1',
  rating: 4,
  comment: 'Good parking spot, well maintained.',
  createdAt: '2026-09-19T00:00:00.000Z',
};

// ═══════════════════════════════════════════════════════════
// VEHICLE TESTS
// ═══════════════════════════════════════════════════════════
describe('Vehicle APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (vehicleRepository.findByUserId as jest.Mock).mockResolvedValue([]);
    (vehicleRepository.create as jest.Mock).mockImplementation(async (v) => v);
    (vehicleRepository.findById as jest.Mock).mockResolvedValue(mockVehicle);
    (vehicleRepository.update as jest.Mock).mockImplementation(async (id, data) => ({
      ...mockVehicle,
      ...data,
      updatedAt: new Date().toISOString(),
    }));
    (vehicleRepository.delete as jest.Mock).mockResolvedValue(undefined);
    (vehicleRepository.clearDefault as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /vehicles', () => {
    const validPayload = {
      vehicleNumber: 'KA-01-AB-1234',
      vehicleType: 'CAR',
      make: 'Hyundai',
      model: 'Creta',
      color: 'White',
    };

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/vehicles').send(validPayload);
      expect(res.status).toBe(401);
    });

    it('should create a vehicle for an authenticated driver', async () => {
      const res = await request(app)
        .post('/vehicles')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vehicleId).toBeDefined();
      expect(res.body.data.userId).toBe('driver_1');
      expect(res.body.data.vehicleNumber).toBe('KA-01-AB-1234');
      expect(res.body.data.vehicleType).toBe('CAR');
      expect(res.body.data.isDefault).toBe(true); // First vehicle auto-set as default
    });

    it('should return 400 for invalid vehicleType', async () => {
      const res = await request(app)
        .post('/vehicles')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, vehicleType: 'HELICOPTER' });

      expect(res.status).toBe(400);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/vehicles')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ vehicleType: 'CAR' });

      expect(res.status).toBe(400);
    });

    it('should not set first vehicle as default when one already exists', async () => {
      (vehicleRepository.findByUserId as jest.Mock).mockResolvedValue([mockVehicle]);

      const res = await request(app)
        .post('/vehicles')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, vehicleNumber: 'KA-01-CD-5678' });

      expect(res.status).toBe(201);
      expect(res.body.data.isDefault).toBe(false);
    });
  });

  describe('GET /vehicles', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/vehicles');
      expect(res.status).toBe(401);
    });

    it('should list vehicles for authenticated driver', async () => {
      (vehicleRepository.findByUserId as jest.Mock).mockResolvedValue([mockVehicle]);

      const res = await request(app)
        .get('/vehicles')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].vehicleId).toBe('vehicle_abc123');
    });

    it('should return empty list when no vehicles exist', async () => {
      const res = await request(app)
        .get('/vehicles')
        .set('x-demo-user-id', 'driver_new')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('GET /vehicles/:id', () => {
    it('should return a vehicle for its owner', async () => {
      const res = await request(app)
        .get('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.vehicleId).toBe('vehicle_abc123');
    });

    it('should return 403 for a different user', async () => {
      const res = await request(app)
        .get('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_2')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });

    it('should allow ADMIN to view any vehicle', async () => {
      const res = await request(app)
        .get('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN');

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent vehicle', async () => {
      (vehicleRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/vehicles/vehicle_nonexistent')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /vehicles/:id', () => {
    it('should update vehicle for its owner', async () => {
      const res = await request(app)
        .put('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ color: 'Blue', make: 'Maruti' });

      expect(res.status).toBe(200);
      expect(res.body.data.color).toBe('Blue');
      expect(res.body.data.make).toBe('Maruti');
    });

    it('should return 403 when updating another user\'s vehicle', async () => {
      const res = await request(app)
        .put('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_2')
        .set('x-demo-role', 'DRIVER')
        .send({ color: 'Red' });

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid vehicleType in update', async () => {
      const res = await request(app)
        .put('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ vehicleType: 'SPACESHIP' });

      expect(res.status).toBe(400);
    });

    it('should clear existing defaults when setting isDefault', async () => {
      const res = await request(app)
        .put('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ isDefault: true });

      expect(res.status).toBe(200);
      expect(vehicleRepository.clearDefault).toHaveBeenCalledWith('driver_1');
    });
  });

  describe('DELETE /vehicles/:id', () => {
    it('should delete vehicle for its owner', async () => {
      const res = await request(app)
        .delete('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Vehicle deleted');
      expect(vehicleRepository.delete).toHaveBeenCalledWith('vehicle_abc123');
    });

    it('should return 403 when deleting another user\'s vehicle', async () => {
      const res = await request(app)
        .delete('/vehicles/vehicle_abc123')
        .set('x-demo-user-id', 'driver_2')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).delete('/vehicles/vehicle_abc123');
      expect(res.status).toBe(401);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// FAVORITE TESTS
// ═══════════════════════════════════════════════════════════
describe('Favorite APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);
    (favoriteRepository.isFavorite as jest.Mock).mockResolvedValue(false);
    (favoriteRepository.add as jest.Mock).mockResolvedValue(mockFavorite);
    (favoriteRepository.remove as jest.Mock).mockResolvedValue(undefined);
    (favoriteRepository.findByUserId as jest.Mock).mockResolvedValue([mockFavorite]);
  });

  describe('POST /favorites/:parkingId', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/favorites/listing_abc123');
      expect(res.status).toBe(401);
    });

    it('should add a listing to favorites', async () => {
      const res = await request(app)
        .post('/favorites/listing_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(201);
      expect(res.body.data.listingId).toBe('listing_abc123');
      expect(res.body.data.message).toBe('Added to favorites');
    });

    it('should return 409 for duplicate favorite', async () => {
      (favoriteRepository.isFavorite as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/favorites/listing_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(409);
    });

    it('should return 404 when listing does not exist', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/favorites/listing_nonexistent')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /favorites/:parkingId', () => {
    it('should remove a favorite', async () => {
      (favoriteRepository.isFavorite as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .delete('/favorites/listing_abc123')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe('Removed from favorites');
      expect(favoriteRepository.remove).toHaveBeenCalledWith('driver_1', 'listing_abc123');
    });

    it('should return 404 when favorite does not exist', async () => {
      const res = await request(app)
        .delete('/favorites/listing_notfaved')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(404);
    });

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).delete('/favorites/listing_abc123');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /favorites', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/favorites');
      expect(res.status).toBe(401);
    });

    it('should list favorites with listing details', async () => {
      const res = await request(app)
        .get('/favorites')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].listingId).toBe('listing_abc123');
      expect(res.body.data.items[0].title).toBe('Covered Parking Near Forum Mall');
      expect(res.body.data.items[0].addedAt).toBeDefined();
    });

    it('should return empty list when no favorites', async () => {
      (favoriteRepository.findByUserId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/favorites')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('GET /favorites/:parkingId/check', () => {
    it('should return isFavorite: true for favorited listing', async () => {
      (favoriteRepository.isFavorite as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .get('/favorites/listing_abc123/check')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.isFavorite).toBe(true);
      expect(res.body.data.listingId).toBe('listing_abc123');
    });

    it('should return isFavorite: false for non-favorited listing', async () => {
      const res = await request(app)
        .get('/favorites/listing_other/check')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.isFavorite).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════
// REVIEW TESTS
// ═══════════════════════════════════════════════════════════
describe('Review APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bookingRepository.findById as jest.Mock).mockResolvedValue(mockCompletedBooking);
    (reviewRepository.findByBookingId as jest.Mock).mockResolvedValue(null);
    (reviewRepository.create as jest.Mock).mockImplementation(async (r) => r);
    (reviewRepository.findByListingId as jest.Mock).mockResolvedValue([mockReview]);
    (reviewRepository.findByUserId as jest.Mock).mockResolvedValue([mockReview]);
    (reviewRepository.findById as jest.Mock).mockResolvedValue(mockReview);
    (parkingRepository.findById as jest.Mock).mockResolvedValue(mockListing);
    (parkingRepository.updateRating as jest.Mock).mockResolvedValue(undefined);
  });

  describe('POST /reviews', () => {
    const validPayload = {
      listingId: 'listing_abc123',
      bookingId: 'booking_completed',
      rating: 4,
      comment: 'Good parking spot, well maintained.',
    };

    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).post('/reviews').send(validPayload);
      expect(res.status).toBe(401);
    });

    it('should create a review for a completed booking', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reviewId).toBeDefined();
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.userId).toBe('driver_1');
      expect(res.body.data.listingId).toBe('listing_abc123');
    });

    it('should return 400 for invalid rating (0)', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, rating: 0 });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid rating (6)', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, rating: 6 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when comment is missing', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, comment: '' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for incomplete booking (not COMPLETED)', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue({
        ...mockCompletedBooking,
        bookingStatus: 'CONFIRMED',
      });

      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(400);
    });

    it('should return 403 when reviewer is not the driver', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_2')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(403);
    });

    it('should return 409 for duplicate review on same booking', async () => {
      (reviewRepository.findByBookingId as jest.Mock).mockResolvedValue(mockReview);

      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(409);
    });

    it('should return 404 when booking does not exist', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(404);
    });

    it('should return 400 when listingId does not match booking', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, listingId: 'listing_different' });

      expect(res.status).toBe(400);
    });

    it('should update listing rating after review creation', async () => {
      await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      // Rating update is best-effort async, but we verify it's attempted
      expect(parkingRepository.updateRating).toHaveBeenCalled();
    });

    it('should allow rating 1 (minimum valid)', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, rating: 1 });

      expect(res.status).toBe(201);
    });

    it('should allow rating 5 (maximum valid)', async () => {
      const res = await request(app)
        .post('/reviews')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send({ ...validPayload, rating: 5 });

      expect(res.status).toBe(201);
    });
  });

  describe('GET /reviews/listing/:listingId', () => {
    it('should return reviews for a listing (public)', async () => {
      const res = await request(app).get('/reviews/listing/listing_abc123');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].reviewId).toBe('review_xyz789');
      expect(res.body.data.items[0].rating).toBe(4);
    });

    it('should return empty list for listing with no reviews', async () => {
      (reviewRepository.findByListingId as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/reviews/listing/listing_new');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(0);
    });
  });

  describe('GET /reviews/me', () => {
    it('should return 401 when unauthenticated', async () => {
      const res = await request(app).get('/reviews/me');
      expect(res.status).toBe(401);
    });

    it('should return authenticated user\'s reviews', async () => {
      const res = await request(app)
        .get('/reviews/me')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER');

      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBe(1);
      expect(res.body.data.items[0].userId).toBe('driver_1');
    });
  });

  describe('GET /reviews/:id', () => {
    it('should return a review by ID', async () => {
      const res = await request(app).get('/reviews/review_xyz789');

      expect(res.status).toBe(200);
      expect(res.body.data.reviewId).toBe('review_xyz789');
    });

    it('should return 404 for non-existent review', async () => {
      (reviewRepository.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/reviews/review_nonexistent');

      expect(res.status).toBe(404);
    });
  });
});
