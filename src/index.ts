import express from "express";
import cors from "cors";
import { mindMapRouter } from "./api/mindMapApi";
import { authenticateToken } from "./middleware/authMiddleWare";
import { StatusCodes } from "http-status-codes";

const app = express();
const port = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());
app.use("/", authenticateToken, mindMapRouter);

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});

app.get("/health", (req, res) => {
  res.status(StatusCodes.OK).send("OK");
});
