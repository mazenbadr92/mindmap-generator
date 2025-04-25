import request from "supertest";
import express from "express";
import { mindMapRouter } from "./mindMapApi";
import * as fireStoreService from "../core/services/fireStoreService";
import * as generateService from "../core/services/generateService";
import { StatusCodes } from "http-status-codes";

// Mock service modules
jest.mock("../core/services/fireStoreService");
jest.mock("../core/services/generateService");

describe("mindMapRouter", () => {
  let app: express.Express;
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    // Suppress console.error during tests
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    app = express();
    app.use(express.json());
    app.use("/api", mindMapRouter);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("GET /api/mindmaps", () => {
    it("returns 200 + maps when query params present", async () => {
      const fakeMaps = [{ subject: "A", topic: "B", data: {} }];
      (fireStoreService.getMindMaps as jest.Mock).mockResolvedValue(fakeMaps);

      const res = await request(app).get("/api/mindmaps?subject=A&topic=B");
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toEqual({ data: fakeMaps });
      expect(fireStoreService.getMindMaps).toHaveBeenCalledWith({
        subject: "A",
        topic: "B",
      });
    });

    it("returns 200 + maps when no query params", async () => {
      const fakeMaps: any[] = [];
      (fireStoreService.getMindMaps as jest.Mock).mockResolvedValue(fakeMaps);

      const res = await request(app).get("/api/mindmaps");
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toEqual({ data: fakeMaps });
      expect(fireStoreService.getMindMaps).toHaveBeenCalledWith({
        subject: undefined,
        topic: undefined,
      });
    });

    it("returns 500 on service error", async () => {
      (fireStoreService.getMindMaps as jest.Mock).mockRejectedValue(
        new Error("boom")
      );

      const res = await request(app).get("/api/mindmaps");
      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.body).toEqual({ error: "Failed to fetch mindmaps" });
    });
  });

  describe("POST /api/generate", () => {
    it("returns 400 if inputFile is missing", async () => {
      const res = await request(app).post("/api/generate").send({});
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body).toEqual({ error: "inputFile is required in body" });
    });

    it("returns 400 if inputFile is not a string", async () => {
      const res = await request(app)
        .post("/api/generate")
        .send({ inputFile: 42 });
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body).toEqual({ error: "inputFile is required in body" });
    });

    it("returns 200 + status when generation succeeds", async () => {
      const fakeStatus = { success: true };
      (generateService.generateMindMapsFromCSV as jest.Mock).mockResolvedValue(
        fakeStatus
      );

      const res = await request(app)
        .post("/api/generate")
        .send({ inputFile: "data.csv" });
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toEqual({ status: fakeStatus });
      expect(generateService.generateMindMapsFromCSV).toHaveBeenCalledWith(
        "data.csv"
      );
    });

    it("returns 500 on generation error", async () => {
      (generateService.generateMindMapsFromCSV as jest.Mock).mockRejectedValue(
        new Error("fail")
      );

      const res = await request(app)
        .post("/api/generate")
        .send({ inputFile: "data.csv" });
      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.body).toEqual({ error: "Mind map generation failed" });
    });
  });
});
