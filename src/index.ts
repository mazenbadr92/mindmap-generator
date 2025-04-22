import express from "express";
import cors from "cors";
import { mindMapRouter } from "./api/mindMapApi";
import { authenticateToken } from "./middleware/authMiddleWare";
import { env } from "./config/env";

const app = express();
const port = Number(process.env.PORT || env.PORT) || 8080;

app.use(cors());
app.use(express.json());
app.use("/", authenticateToken, mindMapRouter);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
