import { Router } from "express";
import { getMindMaps } from "../core/services/fireStoreService";
import { generateMindMapsFromCSV } from "../core/services/generateService";

export const mindMapRouter = Router();

mindMapRouter.get("/mindmaps", async (req, res) => {
  try {
    const { subject, topic } = req.query;
    const maps = await getMindMaps({
      subject: subject as string | undefined,
      topic: topic as string | undefined,
    });
    res.status(200).json({ data: maps });
  } catch (error) {
    console.error("🔥 Error fetching mindmaps:", error);
    res.status(500).json({ error: "Failed to fetch mindmaps" });
  }
});

mindMapRouter.post("/generate", async (req, res) => {
  const { inputFile } = req.body;

  if (!inputFile || typeof inputFile !== "string") {
    res.status(400).json({ error: "inputFile is required in body" });
    return;
  }

  try {
    const status = await generateMindMapsFromCSV(inputFile);
    res.status(200).json({ status });
  } catch (err) {
    console.error("❌ Generation error:", err);
    res.status(500).json({ error: "Mind map generation failed" });
  }
});
