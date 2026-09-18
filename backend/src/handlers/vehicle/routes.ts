import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validation';
import { createVehicleSchema, updateVehicleSchema } from '../../validators/vehicleValidator';
import {
  createVehicleHandler,
  listVehiclesHandler,
  getVehicleHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
} from './handlers';

export const vehicleRouter = Router();

// POST /vehicles
vehicleRouter.post('/', requireAuth, validate(createVehicleSchema, 'body'), createVehicleHandler);

// GET /vehicles
vehicleRouter.get('/', requireAuth, listVehiclesHandler);

// GET /vehicles/:id
vehicleRouter.get('/:id', requireAuth, getVehicleHandler);

// PUT /vehicles/:id
vehicleRouter.put('/:id', requireAuth, validate(updateVehicleSchema, 'body'), updateVehicleHandler);

// DELETE /vehicles/:id
vehicleRouter.delete('/:id', requireAuth, deleteVehicleHandler);
