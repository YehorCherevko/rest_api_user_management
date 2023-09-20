import jwt from "jsonwebtoken";
import { IUser } from "../../types/express";
import { config } from "../../config/config";

export function generateJWTToken(user: IUser): string {
  const secretKey = config.secretKey || "my-default-secret-key";
  const expiresIn = "24h";

  const iat = Math.floor(Date.now() / 1000) - 30;

  const payload = {
    userId: user._id,
    nickname: user.nickname,
    role: user.role,
    iat,
  };

  const options: jwt.SignOptions = {
    algorithm: "HS256",
    expiresIn,
  };

  return jwt.sign(payload, secretKey, options);
}
