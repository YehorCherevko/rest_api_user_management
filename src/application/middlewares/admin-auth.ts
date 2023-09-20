import { HttpStatusCodes } from "../../types/http-status-codes";
import { Request, Response, NextFunction } from "express";
import { UserRole } from "../../types/user-roles";

export const adminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user || user.role !== UserRole.Admin) {
    return res.status(HttpStatusCodes.Forbidden).send("Acces denied");
  }
  next();
};
