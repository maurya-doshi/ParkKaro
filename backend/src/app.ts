import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { sendError } from './utils/response';

// Import route modules (added incrementally as features are built)
import { parkingRouter } from './handlers/parking/routes';
import { bookingRouter } from './handlers/booking/routes';
import { availabilityRouter } from './handlers/availability/routes';
import { vehicleRouter } from './handlers/vehicle/routes';
import { reviewRouter } from './handlers/review/routes';
import { favoriteRouter } from './handlers/favorite/routes';
import { paymentRouter } from './handlers/payment/routes';
import { payoutRouter } from './handlers/payout/routes';
import { notificationRouter } from './handlers/notification/routes';
import { messageRouter } from './handlers/message/routes';
import { disputeRouter } from './handlers/dispute/routes';
import { reportRouter } from './handlers/report/routes';
import { dashboardRouter } from './handlers/dashboard/routes';
import { adminRouter } from './handlers/admin/routes';
import { aiRouter } from './handlers/ai/routes';

const app = express();

// ─── Global Middleware ───────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ──────────────────────────────────────────────
app.use('/parking', parkingRouter);
app.use('/bookings', bookingRouter);
app.use('/parking', availabilityRouter); // /parking/:id/availability
app.use('/vehicles', vehicleRouter);
app.use('/reviews', reviewRouter);
app.use('/favorites', favoriteRouter);
app.use('/payments', paymentRouter);
app.use('/host', payoutRouter);
app.use('/notifications', notificationRouter);
app.use('/conversations', messageRouter);
app.use('/disputes', disputeRouter);
app.use('/reports', reportRouter);
app.use('/', dashboardRouter); // /host/dashboard, /driver/dashboard
app.use('/admin', adminRouter);
app.use('/ai', aiRouter);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((_req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'The requested endpoint does not exist');
});

// ─── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────
if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`🅿️  ParkShare Backend running on port ${env.port}`);
    console.log(`   Environment: ${env.nodeEnv}`);
    console.log(`   Auth mode: ${env.authMode}`);
    console.log(`   DynamoDB: ${env.dynamoDbEndpoint || 'AWS (production)'}`);
  });
}

export { app };
