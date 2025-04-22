import express from "express";
import request from "supertest";
import { mindMapRouter } from "../api/mindMapApi";
import { getMindMaps } from "../core/services/fireStoreService";
import { generateMindMapsFromCSV } from "../core/services/generateService";
import { StatusCodes } from "http-status-codes";

// Mocks
jest.mock("../core/services/fireStoreService");
jest.mock("../core/services/generateService");

const mockApp = express();
mockApp.use(express.json());
mockApp.use("/", mindMapRouter);

describe("mindMapRouter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /mindmaps", () => {
    it("should return mindmaps successfully", async () => {
      (getMindMaps as jest.Mock).mockResolvedValue([
        { id: "math--algebra", subject: "Math", topic: "Algebra" },
      ]);

      const res = await request(mockApp).get(
        "/mindmaps?subject=Math&topic=Algebra"
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toHaveLength(1);
      expect(getMindMaps).toHaveBeenCalledWith({
        subject: "Math",
        topic: "Algebra",
      });
    });

    it("should return 500 on failure", async () => {
      (getMindMaps as jest.Mock).mockRejectedValue(
        new Error("Firestore failure")
      );

      const res = await request(mockApp).get(
        "/mindmaps?subject=Math&topic=Algebra"
      );

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.body).toEqual({ error: "Failed to fetch mindmaps" });
    });
  });

  describe("POST /generate", () => {
    it("should return 400 if inputFile is missing", async () => {
      const res = await request(mockApp).post("/generate").send({});
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body).toEqual({ error: "inputFile is required in body" });
    });

    it("should return 400 if inputFile is not a string", async () => {
      const res = await request(mockApp)
        .post("/generate")
        .send({ inputFile: 123 });
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.body).toEqual({ error: "inputFile is required in body" });
    });

    it("should return 200 on successful generation", async () => {
      const mockStatus = [
        { topic: "Algebra", status: "Success" },
        { topic: "Geometry", status: "Failure" },
      ];

      (generateMindMapsFromCSV as jest.Mock).mockResolvedValue(mockStatus);

      const res = await request(mockApp)
        .post("/generate")
        .send({ inputFile: "topics.csv" });

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.status).toEqual(mockStatus);
      expect(generateMindMapsFromCSV).toHaveBeenCalledWith("topics.csv");
    });

    it("should return 500 on generation error", async () => {
      (generateMindMapsFromCSV as jest.Mock).mockRejectedValue(
        new Error("OpenAI error")
      );

      const res = await request(mockApp)
        .post("/generate")
        .send({ inputFile: "topics.csv" });

      expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(res.body).toEqual({ error: "Mind map generation failed" });
    });
  });
});
