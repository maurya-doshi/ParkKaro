import { Request, Response, NextFunction } from 'express';
import { disputeService } from '../../services/disputeService';
import { sendSuccess, sendCreated } from '../../utils/response';

export async function createDisputeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dispute = await disputeService.createDispute(req.user!.userId, req.body);
    sendCreated(res, dispute);
  } catch (err) { next(err); }
}

export async function getDisputeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dispute = await disputeService.getDisputeById(req.params.id, req.user!.userId, req.user!.role);
    sendSuccess(res, dispute);
  } catch (err) { next(err); }
}

export async function listDisputesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await disputeService.listUserDisputes(req.user!.userId);
    sendSuccess(res, { items });
  } catch (err) { next(err); }
}

export async function updateDisputeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, resolution } = req.body;
    const dispute = await disputeService.updateDispute(
      req.params.id,
      req.user!.userId,
      req.user!.role,
      status,
      resolution
    );
    sendSuccess(res, dispute);
  } catch (err) { next(err); }
}
