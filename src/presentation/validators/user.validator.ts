import Joi from "joi";
import { UserRole } from "../../types/user-roles";

export const createUserSchema = Joi.object({
  nickname: Joi.string().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string()
    .valid(UserRole.User, UserRole.Admin, UserRole.Moderator)
    .required(),
});

export const userIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .required();

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
