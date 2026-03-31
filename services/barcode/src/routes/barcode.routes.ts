import { Router } from 'express';
import { scanBarcode } from '../controllers/barcode.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const barcodeRouter = Router();

barcodeRouter.post('/scan/:userId', authMiddleware, scanBarcode);
