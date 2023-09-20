import { Document } from "mongoose";
import { UserRole } from "./user-roles";
import { VoteValue } from "./vote";

declare module "express-serve-static-core" {
  interface Request {
    user?: IUser;
  }
}

export interface IUser extends Document {
  nickname: string;
  firstName: string;
  lastName: string;
  password: string;
  salt: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  role: UserRole;
  // votes: IVote[];
  lastVotedAt: Date;
  rating: number;
}

export interface JwtUser extends IUser {
  userId: string;
  nickname: string;
  role: UserRole;
  raiting: string;
}

interface IVote {
  targetUserId: string;
  vote: VoteValue;
  votedAt: Date;
}
