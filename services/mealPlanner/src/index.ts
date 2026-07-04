import bodyParser from "body-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import mongoose from "mongoose";
import cors from "cors";
import { mealPlannerRouter } from "./routes/mealPlannerRouter";
import fileRouter from "./routes/fileRouter";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { options } from "./utils/swagger";

dotenv.config();

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/mealPlanner", mealPlannerRouter);

app.use("/public/photos", express.static("public/photos"));
app.use("/file", fileRouter);

const specs = swaggerJsDoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

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
