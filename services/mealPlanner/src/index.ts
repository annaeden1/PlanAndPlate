import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { mealPlannerRouter } from "./routes/mealPlannerRouter";
import fileRouter from "./routes/fileRouter";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/mealPlanner", mealPlannerRouter);

app.use("/public/photos", express.static("public/photos"));
app.use("/file", fileRouter);
app.use('/public/client', express.static('public/client'));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.static(path.join(__dirname, '../../public/client')));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/client', 'index.html'));
});

export const initApp = (): Promise<Express> => {
  const promise = new Promise<Express>((resolve, reject) => {
    const DBUrl: string | unknown = process.env.MONGODB_URI;

    if (!DBUrl) {
      reject("database url is undefined");
      return;
    }

    mongoose.connect(DBUrl as string, {}).then(() => {
      resolve(app);
    });

    const db = mongoose.connection;
    db.on("error", (error) => {
      console.error("connection error", error);
    });
    db.once("open", () => {
      console.log("Connected to MongoDB");
    });
  });
  return promise;
};
