import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { StatusCodes } from "http-status-codes";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ error: "Missing token" });
    return;
  }

  if (token !== env.API_SECRET_TOKEN) {
    res.status(StatusCodes.FORBIDDEN).json({ error: "Invalid token" });
    return;
  }

  next();
}
