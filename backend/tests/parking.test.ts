import request from 'supertest';
import { app } from '../src/app';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { ParkingListing } from '../src/models/ParkingListing';

jest.mock('../src/repositories/parkingRepository');

const mockListing: ParkingListing = {
  listingId: 'listing_12345',
  hostId: 'host_1',
  title: 'Covered Parking Near Forum Mall',
  description: 'Secure covered parking space with CCTV and 24/7 security guard.',
  address: '123, 4th Cross, 5th Block, Koramangala',
  area: 'Koramangala',
  city: 'Bengaluru',
  latitude: 12.9352,
  longitude: 77.6245,
  parkingType: 'COVERED',
  capacity: 2,
  vehicleTypes: ['CAR', 'SUV'],
  pricePerHour: 40,
  pricePerDay: 350,
  amenities: ['covered', 'cctv', 'security', 'lighting'],
  photos: [],
  availability: {
    monday: { open: '06:00', close: '23:00' },
  },
  cancellationPolicy: 'MODERATE',
  rating: 4.5,
  reviewCount: 12,
  status: 'ACTIVE',
  createdAt: '2026-09-18T10:00:00.000Z',
  updatedAt: '2026-09-18T10:00:00.000Z',
};

describe('Parking Listing APIs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /parking', () => {
    const validPayload = {
      title: 'Covered Parking Near Forum Mall',
      description: 'Secure covered parking space with CCTV and 24/7 security guard.',
      address: '123, 4th Cross, 5th Block, Koramangala',
      area: 'Koramangala',
      city: 'Bengaluru',
      latitude: 12.9352,
      longitude: 77.6245,
      parkingType: 'COVERED',
      capacity: 2,
      vehicleTypes: ['CAR', 'SUV'],
      pricePerHour: 40,
      pricePerDay: 350,
      amenities: ['covered', 'cctv', 'security', 'lighting'],
      photos: [],
      availability: {
        monday: { open: '06:00', close: '23:00' },
      },
      cancellationPolicy: 'MODERATE',
    };

    it('should return 401 when no auth headers are provided', async () => {
      const res = await request(app).post('/parking').send(validPayload);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 403 when authenticated as a DRIVER', async () => {
      const res = await request(app)
        .post('/parking')
        .set('x-demo-user-id', 'driver_1')
        .set('x-demo-role', 'DRIVER')
        .send(validPayload);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 when validation fails (e.g. missing required fields)', async () => {
      const res = await request(app)
        .post('/parking')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ title: 'Short' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should create a listing when valid data is provided by a HOST', async () => {
      (parkingRepository.create as jest.Mock).mockImplementation(async (item) => item);

      const res = await request(app)
        .post('/parking')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send(validPayload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listingId).toBeDefined();
      expect(res.body.data.hostId).toBe('host_1');
      expect(res.body.data.status).toBe('ACTIVE');
      expect(res.body.data.rating).toBe(0);
      expect(res.body.data.reviewCount).toBe(0);
    });

    it('should never trust client-provided hostId in the request body', async () => {
      (parkingRepository.create as jest.Mock).mockImplementation(async (item) => item);

      const res = await request(app)
        .post('/parking')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({
          ...validPayload,
          hostId: 'malicious_impersonated_host',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.hostId).toBe('host_1');
    });
  });

  describe('GET /parking/:id', () => {
    it('should return 200 with the listing data', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);

      const res = await request(app).get('/parking/listing_12345');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listingId).toBe('listing_12345');
    });

    it('should return 404 when listing does not exist', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(null);

      const res = await request(app).get('/parking/listing_99999');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PARKING_LISTING_NOT_FOUND');
    });

    it('should return 404 when listing is soft-deleted', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockListing,
        status: 'DELETED',
      });

      const res = await request(app).get('/parking/listing_12345');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PARKING_LISTING_NOT_FOUND');
    });
  });

  describe('PUT /parking/:id', () => {
    it('should return 403 when another host tries to update the listing', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);

      const res = await request(app)
        .put('/parking/listing_12345')
        .set('x-demo-user-id', 'host_other')
        .set('x-demo-role', 'HOST')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow the owner host to update listing fields', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);
      (parkingRepository.update as jest.Mock).mockResolvedValueOnce({
        ...mockListing,
        title: 'Updated Title By Owner',
      });

      const res = await request(app)
        .put('/parking/listing_12345')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ title: 'Updated Title By Owner' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Title By Owner');
    });

    it('should allow ADMIN to update any listing', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);
      (parkingRepository.update as jest.Mock).mockResolvedValueOnce({
        ...mockListing,
        title: 'Admin Edited Title',
      });

      const res = await request(app)
        .put('/parking/listing_12345')
        .set('x-demo-user-id', 'admin_1')
        .set('x-demo-role', 'ADMIN')
        .send({ title: 'Admin Edited Title' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Admin Edited Title');
    });
  });

  describe('DELETE /parking/:id', () => {
    it('should return 403 if not owner', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);

      const res = await request(app)
        .delete('/parking/listing_12345')
        .set('x-demo-user-id', 'host_other')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(403);
    });

    it('should soft delete the listing if owner', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);
      (parkingRepository.updateStatus as jest.Mock).mockResolvedValueOnce({
        ...mockListing,
        status: 'DELETED',
      });

      const res = await request(app)
        .delete('/parking/listing_12345')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe('Listing deleted successfully');
      expect(parkingRepository.updateStatus).toHaveBeenCalledWith('listing_12345', 'DELETED');
    });
  });

  describe('PATCH /parking/:id/status', () => {
    it('should allow owner host to update status to INACTIVE', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);
      (parkingRepository.updateStatus as jest.Mock).mockResolvedValueOnce({
        ...mockListing,
        status: 'INACTIVE',
      });

      const res = await request(app)
        .patch('/parking/listing_12345/status')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('should return 403 when a host tries to suspend a listing', async () => {
      (parkingRepository.findById as jest.Mock).mockResolvedValueOnce(mockListing);

      const res = await request(app)
        .patch('/parking/listing_12345/status')
        .set('x-demo-user-id', 'host_1')
        .set('x-demo-role', 'HOST')
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
