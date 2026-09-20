import { Request, Response, NextFunction } from 'express';
import { adminService } from '../../services/adminService';
import { sendSuccess } from '../../utils/response';
import { ForbiddenError } from '../../utils/errors';
import { UserRole, UserStatus } from '../../models/User';
import { ListingStatus } from '../../models/ParkingListing';
import { BookingStatus } from '../../models/Booking';
import { DisputeStatus } from '../../models/Dispute';
import { ReportStatus } from '../../models/Report';

function assertAdmin(role: string): void {
  if (role !== 'ADMIN') {
    throw new ForbiddenError('Only administrators can access this resource');
  }
}

export async function getAdminDashboardHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const data = await adminService.getAnalytics();
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getAdminActivityHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const data = await adminService.getActivity(limit);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

// ─── USER MANAGEMENT ──────────────────────────────────────────
export async function listUsersHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const role = req.query.role as UserRole | undefined;
    const status = req.query.status as UserStatus | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await adminService.listUsers(role, status, limit);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function getUserHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const user = await adminService.getUserById(req.params.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const user = await adminService.updateUserStatus(req.params.id, req.body.status);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}

// ─── LISTING MANAGEMENT ───────────────────────────────────────
export async function listListingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const status = req.query.status as ListingStatus | undefined;
    const area = req.query.area as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await adminService.listListings(status, area, limit);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function getListingHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const listing = await adminService.getListingById(req.params.id);
    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

export async function updateListingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const listing = await adminService.updateListingStatus(req.params.id, req.body.status);
    sendSuccess(res, listing);
  } catch (err) {
    next(err);
  }
}

// ─── BOOKINGS MANAGEMENT ──────────────────────────────────────
export async function listBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const status = req.query.status as BookingStatus | undefined;
    const driverId = req.query.driverId as string | undefined;
    const hostId = req.query.hostId as string | undefined;
    const listingId = req.query.listingId as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await adminService.listBookings({
      status,
      driverId,
      hostId,
      listingId,
      limit,
    });
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

// ─── DISPUTES & REPORTS ───────────────────────────────────────
export async function listDisputesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const status = req.query.status as DisputeStatus | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await adminService.listDisputes(status, limit);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}

export async function listReportsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    assertAdmin(req.user!.role);
    const status = req.query.status as ReportStatus | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const items = await adminService.listReports(status, limit);
    sendSuccess(res, { items });
  } catch (err) {
    next(err);
  }
}
