import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import {
  addFavoriteHandler,
  removeFavoriteHandler,
  listFavoritesHandler,
  checkFavoriteHandler,
} from './handlers';

export const favoriteRouter = Router();

// GET /favorites
favoriteRouter.get('/', requireAuth, listFavoritesHandler);

// GET /favorites/:parkingId/check
favoriteRouter.get('/:parkingId/check', requireAuth, checkFavoriteHandler);

// POST /favorites/:parkingId
favoriteRouter.post('/:parkingId', requireAuth, addFavoriteHandler);

// DELETE /favorites/:parkingId
favoriteRouter.delete('/:parkingId', requireAuth, removeFavoriteHandler);
