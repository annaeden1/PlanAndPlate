import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";

dotenv.config();

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

export const initApp = (): Promise<Express> => {
  return Promise.resolve(app);
};
