import express from "express";
import request from "supertest";
import path from "path";
import fs from "fs";

const fileRouter = require("../../../routes/fileRouter").default;

const app = express();
app.use(express.json());

process.env.DOMAIN_BASE = "localhost";
process.env.PORT = "3001";

app.use("/file", fileRouter);

describe("POST /file", () => {
  const uploadDir = path.join(process.cwd(), "public", "photos");

  beforeAll(() => {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up any uploaded test files
    const files = fs.readdirSync(uploadDir).filter((f) => f.startsWith("test"));
    files.forEach((f) => fs.unlinkSync(path.join(uploadDir, f)));
  });

  it("returns 200 with URL when a file is uploaded", async () => {
    const res = await request(app)
      .post("/file")
      .attach("file", Buffer.from("fake image content"), {
        filename: "test-image.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("url");
    expect(res.body.url).toMatch(/http:\/\/localhost:3001\/public\/photos\//);
  });

  it("returns 400 when no file is provided", async () => {
    const res = await request(app).post("/file");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("file is missing");
  });
});
