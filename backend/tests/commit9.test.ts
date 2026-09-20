import request from 'supertest';
import { app } from '../src/app';
import { notificationRepository } from '../src/repositories/notificationRepository';
import { conversationRepository } from '../src/repositories/conversationRepository';
import { messageRepository } from '../src/repositories/messageRepository';
import { disputeRepository } from '../src/repositories/disputeRepository';
import { reportRepository } from '../src/repositories/reportRepository';
import { bookingRepository } from '../src/repositories/bookingRepository';
import { parkingRepository } from '../src/repositories/parkingRepository';
import { paymentRepository } from '../src/repositories/paymentRepository';
import { slotLockRepository } from '../src/repositories/slotLockRepository';
import { Notification } from '../src/models/Notification';
import { Conversation } from '../src/models/Conversation';
import { Message } from '../src/models/Message';
import { Dispute } from '../src/models/Dispute';
import { Report } from '../src/models/Report';
import { Booking } from '../src/models/Booking';

import { bookingService } from '../src/services/bookingService';
import { paymentService } from '../src/services/paymentService';
import { payoutService } from '../src/services/payoutService';
import { reviewService } from '../src/services/reviewService';
import { reviewRepository } from '../src/repositories/reviewRepository';
import { payoutRepository } from '../src/repositories/payoutRepository';

jest.mock('../src/repositories/notificationRepository');
jest.mock('../src/repositories/conversationRepository');
jest.mock('../src/repositories/messageRepository');
jest.mock('../src/repositories/disputeRepository');
jest.mock('../src/repositories/reportRepository');
jest.mock('../src/repositories/bookingRepository');
jest.mock('../src/repositories/parkingRepository');
jest.mock('../src/repositories/paymentRepository');
jest.mock('../src/repositories/slotLockRepository');
jest.mock('../src/repositories/reviewRepository');
jest.mock('../src/repositories/payoutRepository');

// ─── Test Fixtures ───────────────────────────────────────────
const mockNotification: Notification = {
  userId: 'user_1',
  notificationId: '2026-09-19T00:00:00.000Z#notif_1',
  type: 'BOOKING_CONFIRMED',
  title: 'Booking Confirmed!',
  message: 'Your reservation is confirmed.',
  read: false,
  createdAt: '2026-09-19T00:00:00.000Z',
};

const mockConversation: Conversation = {
  conversationId: 'conv_123456789012',
  participants: ['user_1', 'user_2'],
  participant1: 'user_1',
  participant2: 'user_2',
  listingId: 'listing_1',
  bookingId: 'booking_1',
  lastMessageAt: '2026-09-19T00:00:00.000Z',
  lastMessagePreview: 'Hello there!',
  createdAt: '2026-09-19T00:00:00.000Z',
};

const mockMessage: Message = {
  conversationId: 'conv_123456789012',
  messageId: '2026-09-19T00:01:00.000Z#msg_1',
  senderId: 'user_1',
  content: 'Hello there!',
  createdAt: '2026-09-19T00:01:00.000Z',
};

const mockBooking: Booking = {
  bookingId: 'booking_party',
  listingId: 'listing_1',
  hostId: 'host_1',
  driverId: 'driver_1',
  vehicleId: 'vehicle_1',
  startTime: '2026-09-19T10:00:00.000Z',
  endTime: '2026-09-19T12:00:00.000Z',
  durationHours: 2,
  baseAmount: 100,
  platformFee: 10,
  tax: 0,
  totalAmount: 110,
  hostEarnings: 90,
  paymentStatus: 'PAID',
  bookingStatus: 'CONFIRMED',
  qrData: 'mockqr',
  qrVerificationCode: '1234',
  createdAt: '2026-09-19T09:00:00.000Z',
  updatedAt: '2026-09-19T09:00:00.000Z',
};

const mockDispute: Dispute = {
  disputeId: 'dispute_123456789012',
  bookingId: 'booking_party',
  reportedBy: 'driver_1',
  reason: 'Slot was occupied',
  description: 'Another car was parked in my reserved slot.',
  evidence: ['https://example.com/photo.jpg'],
  status: 'OPEN',
  createdAt: '2026-09-19T10:15:00.000Z',
  updatedAt: '2026-09-19T10:15:00.000Z',
};

const mockReport: Report = {
  reportId: 'report_123456789012',
  reportedBy: 'driver_1',
  targetType: 'LISTING',
  targetId: 'listing_1',
  reason: 'Misleading description',
  description: 'The photos do not match the location.',
  status: 'PENDING',
  createdAt: '2026-09-19T10:30:00.000Z',
  updatedAt: '2026-09-19T10:30:00.000Z',
};

describe('COMMIT 9 — Notifications, Messaging, Disputes & Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════
  // 1. NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════
  describe('Notifications API', () => {
    describe('GET /notifications', () => {
      it('should require authentication (401)', async () => {
        const res = await request(app).get('/notifications');
        expect(res.status).toBe(401);
      });

      it('should list notifications for current user', async () => {
        (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([mockNotification]);

        const res = await request(app)
          .get('/notifications')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.items).toHaveLength(1);
        expect(res.body.data.items[0].userId).toBe('user_1');
        expect(notificationRepository.findByUserId).toHaveBeenCalledWith('user_1', 50);
      });
    });

    describe('GET /notifications/unread-count', () => {
      it('should require authentication (401)', async () => {
        const res = await request(app).get('/notifications/unread-count');
        expect(res.status).toBe(401);
      });

      it('should return unread count for user', async () => {
        (notificationRepository.getUnreadCount as jest.Mock).mockResolvedValue(3);

        const res = await request(app)
          .get('/notifications/unread-count')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.unreadCount).toBe(3);
        expect(notificationRepository.getUnreadCount).toHaveBeenCalledWith('user_1');
      });
    });

    describe('PATCH /notifications/:id/read', () => {
      it('should mark single notification as read', async () => {
        (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([mockNotification]);
        (notificationRepository.markAsRead as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
          .patch(`/notifications/${encodeURIComponent(mockNotification.notificationId)}/read`)
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(notificationRepository.markAsRead).toHaveBeenCalledWith('user_1', mockNotification.notificationId);
      });

      it('should return 404 if notification not found or owned by another user', async () => {
        (notificationRepository.findByUserId as jest.Mock).mockResolvedValue([]);

        const res = await request(app)
          .patch('/notifications/non_existent/read')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(404);
      });
    });

    describe('PATCH /notifications/read-all', () => {
      it('should mark all notifications as read for current user', async () => {
        (notificationRepository.markAllAsRead as jest.Mock).mockResolvedValue(undefined);

        const res = await request(app)
          .patch('/notifications/read-all')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(notificationRepository.markAllAsRead).toHaveBeenCalledWith('user_1');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. MESSAGING
  // ═══════════════════════════════════════════════════════════
  describe('Messaging API', () => {
    describe('POST /conversations', () => {
      it('should require authentication (401)', async () => {
        const res = await request(app).post('/conversations').send({ otherUserId: 'user_2' });
        expect(res.status).toBe(401);
      });

      it('should return 400 when starting a conversation with oneself', async () => {
        const res = await request(app)
          .post('/conversations')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER')
          .send({ otherUserId: 'user_1' });

        expect(res.status).toBe(400);
      });

      it('should return existing conversation if one already exists between users', async () => {
        (conversationRepository.findByUser as jest.Mock).mockResolvedValue([mockConversation]);

        const res = await request(app)
          .post('/conversations')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER')
          .send({ otherUserId: 'user_2' });

        expect(res.status).toBe(201);
        expect(res.body.data.conversationId).toBe(mockConversation.conversationId);
        expect(conversationRepository.create).not.toHaveBeenCalled();
      });

      it('should create new conversation if none exists', async () => {
        (conversationRepository.findByUser as jest.Mock).mockResolvedValue([]);
        (conversationRepository.create as jest.Mock).mockImplementation(async (c) => c);

        const res = await request(app)
          .post('/conversations')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER')
          .send({ otherUserId: 'user_3', listingId: 'listing_1' });

        expect(res.status).toBe(201);
        expect(res.body.data.participants).toContain('user_1');
        expect(res.body.data.participants).toContain('user_3');
        expect(conversationRepository.create).toHaveBeenCalled();
      });
    });

    describe('GET /conversations', () => {
      it('should list conversations for current user', async () => {
        (conversationRepository.findByUser as jest.Mock).mockResolvedValue([mockConversation]);

        const res = await request(app)
          .get('/conversations')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
        expect(conversationRepository.findByUser).toHaveBeenCalledWith('user_1');
      });
    });

    describe('GET /conversations/:id', () => {
      it('should return conversation for participant', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

        const res = await request(app)
          .get(`/conversations/${mockConversation.conversationId}`)
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.conversationId).toBe(mockConversation.conversationId);
      });

      it('should return 403 when user is not a participant', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

        const res = await request(app)
          .get(`/conversations/${mockConversation.conversationId}`)
          .set('x-demo-user-id', 'unrelated_user')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });

      it('should return 404 when conversation not found', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(null);

        const res = await request(app)
          .get('/conversations/non_existent')
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(404);
      });
    });

    describe('POST /conversations/:id/messages', () => {
      it('should send a message and notify the other participant', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);
        (messageRepository.create as jest.Mock).mockResolvedValue(mockMessage);
        (conversationRepository.updateLastMessage as jest.Mock).mockResolvedValue(undefined);
        (notificationRepository.create as jest.Mock).mockResolvedValue({});

        const res = await request(app)
          .post(`/conversations/${mockConversation.conversationId}/messages`)
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER')
          .send({ content: 'Hello there!' });

        expect(res.status).toBe(201);
        expect(res.body.data.content).toBe('Hello there!');
        expect(messageRepository.create).toHaveBeenCalled();
        expect(conversationRepository.updateLastMessage).toHaveBeenCalledWith(
          mockConversation.conversationId,
          'Hello there!',
          expect.any(String)
        );
        // Recipient user_2 should be notified
        expect(notificationRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user_2',
            type: 'NEW_MESSAGE',
          })
        );
      });

      it('should return 403 if sender is not participant', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

        const res = await request(app)
          .post(`/conversations/${mockConversation.conversationId}/messages`)
          .set('x-demo-user-id', 'imposter')
          .set('x-demo-role', 'DRIVER')
          .send({ content: 'I should not be allowed' });

        expect(res.status).toBe(403);
      });

      it('should return 400 for empty content', async () => {
        const res = await request(app)
          .post(`/conversations/${mockConversation.conversationId}/messages`)
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER')
          .send({ content: '' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /conversations/:id/messages', () => {
      it('should return messages for participant', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);
        (messageRepository.findByConversationId as jest.Mock).mockResolvedValue([mockMessage]);

        const res = await request(app)
          .get(`/conversations/${mockConversation.conversationId}/messages`)
          .set('x-demo-user-id', 'user_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
        expect(messageRepository.findByConversationId).toHaveBeenCalledWith(mockConversation.conversationId, 100);
      });

      it('should return 403 if non-participant tries to get messages', async () => {
        (conversationRepository.findById as jest.Mock).mockResolvedValue(mockConversation);

        const res = await request(app)
          .get(`/conversations/${mockConversation.conversationId}/messages`)
          .set('x-demo-user-id', 'stalker')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. DISPUTES
  // ═══════════════════════════════════════════════════════════
  describe('Disputes API', () => {
    describe('POST /disputes', () => {
      const validPayload = {
        bookingId: 'booking_party',
        reason: 'Slot was occupied',
        description: 'Another car was parked in my reserved slot.',
      };

      it('should create dispute for valid booking driver and notify host', async () => {
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
        (disputeRepository.findByBookingId as jest.Mock).mockResolvedValue([]);
        (disputeRepository.create as jest.Mock).mockImplementation(async (d) => d);
        (notificationRepository.create as jest.Mock).mockResolvedValue({});

        const res = await request(app)
          .post('/disputes')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.disputeId).toBeDefined();
        expect(res.body.data.status).toBe('OPEN');
        expect(res.body.data.reportedBy).toBe('driver_1');

        // Notified host
        expect(notificationRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'host_1',
            type: 'DISPUTE_UPDATE',
          })
        );
      });

      it('should allow booking host to raise dispute and notify driver', async () => {
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
        (disputeRepository.findByBookingId as jest.Mock).mockResolvedValue([]);
        (disputeRepository.create as jest.Mock).mockImplementation(async (d) => d);

        const res = await request(app)
          .post('/disputes')
          .set('x-demo-user-id', 'host_1')
          .set('x-demo-role', 'HOST')
          .send({
            bookingId: 'booking_party',
            reason: 'Driver overstayed',
            description: 'Driver parked 3 hours past checkout time.',
          });

        expect(res.status).toBe(201);
        expect(notificationRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'driver_1',
            type: 'DISPUTE_UPDATE',
          })
        );
      });

      it('should return 403 when non-party user raises dispute', async () => {
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

        const res = await request(app)
          .post('/disputes')
          .set('x-demo-user-id', 'random_person')
          .set('x-demo-role', 'DRIVER')
          .send(validPayload);

        expect(res.status).toBe(403);
      });

      it('should reject dispute on cancelled booking (400)', async () => {
        (bookingRepository.findById as jest.Mock).mockResolvedValue({
          ...mockBooking,
          bookingStatus: 'CANCELLED',
        });

        const res = await request(app)
          .post('/disputes')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send(validPayload);

        expect(res.status).toBe(400);
      });

      it('should prevent duplicate open dispute on same booking (400)', async () => {
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
        (disputeRepository.findByBookingId as jest.Mock).mockResolvedValue([mockDispute]);

        const res = await request(app)
          .post('/disputes')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send(validPayload);

        expect(res.status).toBe(400);
      });
    });

    describe('GET /disputes/:id', () => {
      it('should allow booking party to get dispute', async () => {
        (disputeRepository.findById as jest.Mock).mockResolvedValue(mockDispute);
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

        const res = await request(app)
          .get(`/disputes/${mockDispute.disputeId}`)
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.disputeId).toBe(mockDispute.disputeId);
      });

      it('should allow admin to view any dispute', async () => {
        (disputeRepository.findById as jest.Mock).mockResolvedValue(mockDispute);

        const res = await request(app)
          .get(`/disputes/${mockDispute.disputeId}`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.disputeId).toBe(mockDispute.disputeId);
      });

      it('should return 403 for non-party and non-admin', async () => {
        (disputeRepository.findById as jest.Mock).mockResolvedValue(mockDispute);
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

        const res = await request(app)
          .get(`/disputes/${mockDispute.disputeId}`)
          .set('x-demo-user-id', 'outsider_user')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });
    });

    describe('PATCH /disputes/:id', () => {
      it('should allow admin to resolve dispute and notify reporter', async () => {
        (disputeRepository.findById as jest.Mock).mockResolvedValue(mockDispute);
        (disputeRepository.resolve as jest.Mock).mockResolvedValue({
          ...mockDispute,
          status: 'RESOLVED',
          resolution: 'Full refund issued to driver',
        });
        (notificationRepository.create as jest.Mock).mockResolvedValue({});

        const res = await request(app)
          .patch(`/disputes/${mockDispute.disputeId}`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN')
          .send({ status: 'RESOLVED', resolution: 'Full refund issued to driver' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('RESOLVED');
        expect(notificationRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'driver_1',
            type: 'DISPUTE_UPDATE',
          })
        );
      });

      it('should reject non-admin from resolving dispute (403)', async () => {
        (disputeRepository.findById as jest.Mock).mockResolvedValue(mockDispute);
        (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);

        const res = await request(app)
          .patch(`/disputes/${mockDispute.disputeId}`)
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send({ status: 'RESOLVED' });

        expect(res.status).toBe(403);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. REPORTS
  // ═══════════════════════════════════════════════════════════
  describe('Reports API', () => {
    describe('POST /reports', () => {
      const validPayload = {
        targetType: 'LISTING',
        targetId: 'listing_1',
        reason: 'Misleading photos',
        description: 'Photos do not match reality',
      };

      it('should create report for authenticated user', async () => {
        (reportRepository.create as jest.Mock).mockImplementation(async (r) => r);

        const res = await request(app)
          .post('/reports')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send(validPayload);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.reportId).toBeDefined();
        expect(res.body.data.reportedBy).toBe('driver_1');
        expect(res.body.data.status).toBe('PENDING');
      });

      it('should return 400 for invalid targetType', async () => {
        const res = await request(app)
          .post('/reports')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send({ ...validPayload, targetType: 'UNKNOWN_ENTITY' });

        expect(res.status).toBe(400);
      });
    });

    describe('GET /reports/me', () => {
      it('should list reports submitted by current user', async () => {
        (reportRepository.findByReportedBy as jest.Mock).mockResolvedValue([mockReport]);

        const res = await request(app)
          .get('/reports/me')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toHaveLength(1);
        expect(reportRepository.findByReportedBy).toHaveBeenCalledWith('driver_1');
      });
    });

    describe('GET /reports/all (Admin)', () => {
      it('should return 403 for non-admin', async () => {
        const res = await request(app)
          .get('/reports/all')
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });

      it('should return all reports for admin', async () => {
        (reportRepository.findByStatus as jest.Mock).mockResolvedValue([mockReport]);

        const res = await request(app)
          .get('/reports/all')
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toBeDefined();
      });
    });

    describe('GET /reports/:id', () => {
      it('should allow reporter to view report', async () => {
        (reportRepository.findById as jest.Mock).mockResolvedValue(mockReport);

        const res = await request(app)
          .get(`/reports/${mockReport.reportId}`)
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(200);
        expect(res.body.data.reportId).toBe(mockReport.reportId);
      });

      it('should return 403 for other user viewing report', async () => {
        (reportRepository.findById as jest.Mock).mockResolvedValue(mockReport);

        const res = await request(app)
          .get(`/reports/${mockReport.reportId}`)
          .set('x-demo-user-id', 'other_user')
          .set('x-demo-role', 'DRIVER');

        expect(res.status).toBe(403);
      });
    });

    describe('PATCH /reports/:id/status (Admin)', () => {
      it('should allow admin to update report status', async () => {
        (reportRepository.findById as jest.Mock).mockResolvedValue(mockReport);
        (reportRepository.updateStatus as jest.Mock).mockResolvedValue({
          ...mockReport,
          status: 'ACTIONED',
          reviewedBy: 'admin_1',
        });

        const res = await request(app)
          .patch(`/reports/${mockReport.reportId}/status`)
          .set('x-demo-user-id', 'admin_1')
          .set('x-demo-role', 'ADMIN')
          .send({ status: 'ACTIONED' });

        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('ACTIONED');
        expect(reportRepository.updateStatus).toHaveBeenCalledWith(
          mockReport.reportId,
          'ACTIONED',
          'admin_1'
        );
      });

      it('should return 403 for non-admin attempting status update', async () => {
        const res = await request(app)
          .patch(`/reports/${mockReport.reportId}/status`)
          .set('x-demo-user-id', 'driver_1')
          .set('x-demo-role', 'DRIVER')
          .send({ status: 'ACTIONED' });

        expect(res.status).toBe(403);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. BACKEND EVENT NOTIFICATION INTEGRATION
  // ═══════════════════════════════════════════════════════════
  describe('Backend Event Notification Integration', () => {
    it('booking cancellation should notify the other party', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
      (slotLockRepository.getLocksForListingAndDate as jest.Mock).mockResolvedValue([]);
      (slotLockRepository.releaseLocks as jest.Mock).mockResolvedValue(undefined);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updatePaymentStatus as jest.Mock).mockResolvedValue(mockBooking);
      (notificationRepository.create as jest.Mock).mockResolvedValue({});

      await bookingService.cancelBooking(mockBooking.bookingId, 'driver_1', 'DRIVER', {
        reason: 'Change of plans',
      });

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'host_1',
          type: 'BOOKING_CANCELLED',
        })
      );
    });

    it('booking completion should trigger review reminder notification to driver', async () => {
      (bookingRepository.findById as jest.Mock).mockResolvedValue(mockBooking);
      (bookingRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...mockBooking,
        bookingStatus: 'COMPLETED',
      });
      (notificationRepository.create as jest.Mock).mockResolvedValue({});

      await bookingService.completeBooking(mockBooking.bookingId, 'host_1', 'HOST');

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'driver_1',
          type: 'REVIEW_REMINDER',
        })
      );
    });

    it('payout creation should trigger PAYOUT_UPDATE notification to host', async () => {
      (bookingRepository.findByHostId as jest.Mock).mockResolvedValue([mockBooking]);
      (payoutRepository.findByHostId as jest.Mock).mockResolvedValue([]);
      (payoutRepository.create as jest.Mock).mockImplementation(async (p) => p);
      (notificationRepository.create as jest.Mock).mockResolvedValue({});

      await payoutService.createPayout('host_1', 'HOST');

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'host_1',
          type: 'PAYOUT_UPDATE',
        })
      );
    });

    it('review creation should trigger REVIEW_RECEIVED notification to host', async () => {
      const completedBooking: Booking = {
        ...mockBooking,
        bookingStatus: 'COMPLETED',
      };
      (bookingRepository.findById as jest.Mock).mockResolvedValue(completedBooking);
      (reviewRepository.findByBookingId as jest.Mock).mockResolvedValue(null);
      (reviewRepository.create as jest.Mock).mockImplementation(async (r) => r);
      (reviewRepository.findByListingId as jest.Mock).mockResolvedValue([]);
      (parkingRepository.findById as jest.Mock).mockResolvedValue({
        listingId: 'listing_1',
        hostId: 'host_1',
        title: 'Central Spot',
      });
      (parkingRepository.updateRating as jest.Mock).mockResolvedValue(undefined);
      (notificationRepository.create as jest.Mock).mockResolvedValue({});

      await reviewService.createReview('driver_1', {
        listingId: 'listing_1',
        bookingId: 'booking_party',
        rating: 5,
        comment: 'Great space!',
      });

      expect(notificationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'host_1',
          type: 'REVIEW_RECEIVED',
        })
      );
    });
  });
});
