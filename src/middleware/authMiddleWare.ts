import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }

  // Here you can later add JWT verification or external validation
  if (token !== env.API_SECRET_TOKEN) {
    res.status(403).json({ error: "Invalid token" });
    return;
  }

  next(); // ✅ continue request
}
