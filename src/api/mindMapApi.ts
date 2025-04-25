import { Router } from "express";
import { getMindMaps } from "../core/services/fireStoreService";
import { generateMindMapsFromCSV } from "../core/services/generateService";
import { StatusCodes } from "http-status-codes";

export const mindMapRouter = Router();

mindMapRouter.get("/mindmaps", async (req, res) => {
  try {
    const { subject, topic } = req.query;
    const maps = await getMindMaps({
      subject: subject as string | undefined,
      topic: topic as string | undefined,
    });
    res.status(StatusCodes.OK).json({ data: maps });
  } catch (error) {
    console.error("🔥 Error fetching mindmaps:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to fetch mindmaps" });
  }
});

mindMapRouter.post("/generate", async (req, res) => {
  const { inputFile } = req.body;

  if (!inputFile || typeof inputFile !== "string") {
    res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "inputFile is required in body" });
    return;
  }

  try {
    const status = await generateMindMapsFromCSV(inputFile);
    res.status(StatusCodes.OK).json({ status });
  } catch (err) {
    console.error("❌ Generation error:", err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Mind map generation failed" });
  }
});
