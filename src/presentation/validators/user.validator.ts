import Joi from "joi";
import { UserRole } from "../../types/user-roles";
import mongoose from "mongoose";

export const createUserSchema = Joi.object({
  nickname: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid(UserRole.User, UserRole.Admin, UserRole.Moderator)
    .required(),
});

export const userIdSchema = Joi.object({
  userId: Joi.string()
    .custom((value, helpers) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    }, "MongoDB ObjectID")
    .required(),
});

export const pageSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).default(10),
});

export const userNicknameSchema = Joi.object({
  userNickname: Joi.string().required(),
});

export const updateRatingSchema = Joi.object({
  userId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  vote: Joi.number().valid(1, -1).required(),
});

export const loginUserSchema = Joi.object({
  nickname: Joi.string().required(),
  password: Joi.string().required(),
});

export const userIdValidation = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required();
