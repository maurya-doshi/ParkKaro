import { Request, Response, NextFunction } from 'express';
import { vehicleService } from '../../services/vehicleService';
import { sendSuccess, sendCreated } from '../../utils/response';

/**
 * POST /vehicles
 */
export async function createVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.createVehicle(req.user!.userId, req.body);
    sendCreated(res, vehicle);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /vehicles
 */
export async function listVehiclesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicles = await vehicleService.listVehicles(req.user!.userId);
    sendSuccess(res, { items: vehicles });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /vehicles/:id
 */
export async function getVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.getVehicle(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );
    sendSuccess(res, vehicle);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /vehicles/:id
 */
export async function updateVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const vehicle = await vehicleService.updateVehicle(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      req.body
    );
    sendSuccess(res, vehicle);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /vehicles/:id
 */
export async function deleteVehicleHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await vehicleService.deleteVehicle(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, { message: 'Vehicle deleted' });
  } catch (err) {
    next(err);
  }
}
