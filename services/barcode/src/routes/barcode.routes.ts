import { Router } from 'express';
import { scanBarcode } from '../controllers/barcode.controller';
import authMiddleware from '../middlewares/auth.middleware';

export const barcodeRouter = Router();
//TODO: add auth middleware
barcodeRouter.post('/scan/:userId', scanBarcode);
