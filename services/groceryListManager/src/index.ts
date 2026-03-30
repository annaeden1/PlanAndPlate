import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { Express } from 'express';
import mongoose from 'mongoose';
import swaggerUi from 'swagger-ui-express';
import groceryListRoutes from './routes/groceryList.routes';
import swaggerSpec from './config/swagger';

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/grocerylist', groceryListRoutes);

export const initApp = (): Promise<Express> => {
  const promise = new Promise<Express>((resolve, reject) => {
    const DBUrl: string | unknown = process.env.MONGODB_URI;

    if (!DBUrl) {
      reject('database url is undefined');
      return;
    }

    mongoose.connect(DBUrl as string, {}).then(() => {
      resolve(app);
    });

    const db = mongoose.connection;
    db.on('error', (error) => {
      console.error('connection error', error);
    });
    db.once('open', () => {
      console.log('Connected to MongoDB');
    });
  });
  return promise;
};
