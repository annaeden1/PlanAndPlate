import { Router } from 'express';
import { scanBarcode } from '../controllers/barcode.controller';

export const barcodeRouter = Router();

barcodeRouter.post('/scan/:userId', scanBarcode);
