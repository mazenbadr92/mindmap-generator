import express from "express";
import cors from "cors";
import { mindMapRouter } from "./api/mindMapApi";
import { authenticateToken } from "./middleware/authMiddleWare";

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use("/", authenticateToken, mindMapRouter);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
