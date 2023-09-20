import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../../config/config";
import { JwtUser } from "../../types/express";
import { HttpStatusCodes } from "../../types/http-status-codes";

export const jwtAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(HttpStatusCodes.Unauthorized).json({
      message: "Authentication required. Please provide a valid JWT.",
    });
  }

  try {
    const decoded = jwt.verify(token, config.secretKey) as JwtUser;
    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(HttpStatusCodes.Unauthorized)
      .json({ message: "Invalid JWT token." });
  }
};
