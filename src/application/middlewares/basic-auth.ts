import basicAuth from "basic-auth";
import { Request, Response, NextFunction } from "express";
import { verifyPassword } from "../../infrastructure/authentification/password-utils";
import { UserService } from "../user-service";
import { HttpHeaders } from "../../types/http-headers";
import { HttpStatusCodes } from "../../types/http-status-codes";

// This basicAuthMiddleware is not currently used but it's kept for reference or future usage.
export const basicAuthMiddleware =
  (userService: UserService) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
      res.setHeader(
        HttpHeaders.WwwAuthenticate,
        'Basic realm="User Authentication"'
      );
      return res
        .status(HttpStatusCodes.Unauthorized)
        .send("Authentication required");
    }

    try {
      const storedUser = await userService.getUserByNickname(user.name);

      if (!storedUser) {
        return res
          .status(HttpStatusCodes.Unauthorized)
          .send("Authentication failed");
      }

      const isAuthenticated = await verifyPassword(
        user.pass,
        storedUser.password,
        storedUser.salt
      );

      if (!isAuthenticated) {
        return res
          .status(HttpStatusCodes.Unauthorized)
          .send("Authentication failed");
      }

      req.user = storedUser;

      next();
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .send("Internal Server Error");
    }
  };
