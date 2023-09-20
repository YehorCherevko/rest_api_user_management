import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/express";
import { UserRole } from "../types/user-roles";

const userSchema = new Schema<IUser>({
  nickname: {
    type: String,
    unique: true,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null },
  role: {
    type: String,
    enum: [UserRole.User, UserRole.Moderator, UserRole.Admin],
    default: UserRole.User,
  },
  rating: {
    type: Number,
    default: 0,
  },
  lastVotedAt: { type: Date, default: null },
});

export const UserModel = mongoose.model<IUser>("User", userSchema);

export default UserModel;
