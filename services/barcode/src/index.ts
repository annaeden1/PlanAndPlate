import express, { Express } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { barcodeRouter } from './routes/barcode.routes';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/barcode', barcodeRouter);

export const initApp = (): Promise<Express> => {
  return Promise.resolve(app);
};
