import { Request, Response } from "express";
import { UserService } from "../../application/user-service";
import { HttpStatusCodes } from "../../types/http-status-codes";
import Joi from "joi";
import { injectable, inject } from "inversify";
import { HttpHeaders } from "../../types/http-headers";
import { UserDTO } from "../../core/user-dto";
import { verifyPassword } from "../../infrastructure/authentification/password-utils";
import { generateJWTToken } from "../../infrastructure/authentification/jwt-utils";
import { JwtUser } from "../../types/express";
import * as UserValidator from "../validators/user.validator";
import {
  InvalidVoteValueError,
  VoterNotFoundError,
  UserToVoteForNotFoundError,
  CannotVoteForYourselfError,
  VotingRateLimitExceededError,
} from "../../core/errors";

const {
  createUserSchema,
  userIdSchema,
  pageSchema,
  updateRatingSchema,
  loginUserSchema,
} = UserValidator;

@injectable()
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  async createUser(req: Request, res: Response) {
    try {
      const { error } = createUserSchema.validate(req.body);
      if (error) {
        return res.status(HttpStatusCodes.BadRequest).json({
          message: error.details[0].message,
        });
      }

      const newUser = await this.userService.createUser(req.body);

      res.status(HttpStatusCodes.Created).json(newUser);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error creating user" });
    }
  }

  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.userId;

      const user = await this.userService.getUserById(userId);

      if (!user || user?.deleted_at != null) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }

      const userDataTransferObject = new UserDTO(user);
      res.setHeader("Last-Modified", user.updated_at.toUTCString());
      res.json(userDataTransferObject);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error fetching user" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const ifUnmodifiedSince = req.get(HttpHeaders.IfUnmodifiedSince);

      const user = await this.userService.getUserById(userId);
      if (!user) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }

      if (ifUnmodifiedSince) {
        const lastModified = new Date(user.updated_at);
        const ifUnmodifiedSinceDate = new Date(ifUnmodifiedSince);

        if (lastModified > ifUnmodifiedSinceDate) {
          return res
            .status(HttpStatusCodes.PreconditionFailed)
            .json({ message: "Resource has been modified" });
        }
      }

      const userIdValidation = Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required();

      const { error: userIdValidationError } =
        userIdValidation.validate(userId);

      if (userIdValidationError) {
        return res.status(HttpStatusCodes.BadRequest).json({
          [HttpHeaders.ContentType]: "application/json",
          message: userIdValidationError.details[0].message,
        });
      }

      const updatedUser = await this.userService.updateUser(userId, req.body);

      if (!updatedUser || updatedUser?.deleted_at != null) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error updating user" });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { error } = userIdSchema.validate({ userId: req.params.userId });

      if (error) {
        return res.status(HttpStatusCodes.BadRequest).json({
          message: error.details[0].message,
        });
      }

      const userId = req.params.userId;
      const deletedUser = await this.userService.deleteUser(userId);
      if (!deletedUser) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }
      res.json(deletedUser);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error deleting user" });
    }
  }

  async getUsersWithPagination(req: Request, res: Response) {
    try {
      const { error } = pageSchema.validate(req.query);

      if (error) {
        return res.status(HttpStatusCodes.BadRequest).json({
          message: error.details[0].message,
        });
      }

      const page = parseInt(req.query.page as string, 10) || 1;
      const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

      const users = await this.userService.getUsersWithPagination(
        page,
        pageSize
      );
      const userDTOs = users.map((user) => new UserDTO(user));

      res.json(userDTOs);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error fetching users" });
    }
  }

  async getUserByNickname(req: Request, res: Response) {
    try {
      const nickname = req.params.userNickname;
      const user = await this.userService.getUserByNickname(nickname);
      if (!user || user?.deleted_at != null) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }
      const userDataTransferObject = new UserDTO(user);
      res.json(userDataTransferObject);
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error fetching user" });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const { error } = loginUserSchema.validate(req.body);

      if (error) {
        return res.status(HttpStatusCodes.BadRequest).json({
          message: error.details[0].message,
        });
      }

      const { nickname, password } = req.body;
      const user = await this.userService.getUserByNickname(nickname);

      if (!user || user.deleted_at != null) {
        return res
          .status(HttpStatusCodes.Unauthorized)
          .json({ message: "Authentication failed" });
      }

      const isPasswordValid = await verifyPassword(
        password,
        user.password,
        user.salt
      );

      if (!isPasswordValid) {
        return res
          .status(HttpStatusCodes.Unauthorized)
          .json({ message: "Authentication failed" });
      }

      const token = generateJWTToken(user);

      res.json({ token });
    } catch (error) {
      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error logging in" });
    }
  }

  async updateRating(req: Request, res: Response) {
    try {
      const { error } = updateRatingSchema.validate(req.body);

      if (error) {
        return res.status(HttpStatusCodes.BadRequest).json({
          message: error.details[0].message,
        });
      }

      const { userId, vote } = req.body;
      const voterId = (req.user as JwtUser)?.userId;

      if (!voterId) {
        return res.status(HttpStatusCodes.Unauthorized).json({
          message: "Invalid user authentication data.",
        });
      }

      try {
        await this.userService.updateRating(voterId, userId, vote);
        return res.json({ message: "Vote recorded successfully." });
      } catch (error) {
        if (error instanceof VoterNotFoundError) {
          console.error(error); // Log the error
          return res.status(HttpStatusCodes.NotFound).json({
            message: error.message,
          });
        } else if (error instanceof UserToVoteForNotFoundError) {
          console.error(error); // Log the error
          return res.status(HttpStatusCodes.NotFound).json({
            message: error.message,
          });
        } else if (error instanceof CannotVoteForYourselfError) {
          console.error(error); // Log the error
          return res.status(HttpStatusCodes.BadRequest).json({
            message: error.message,
          });
        } else if (error instanceof VotingRateLimitExceededError) {
          console.error(error); // Log the error
          return res.status(HttpStatusCodes.BadRequest).json({
            message: error.message,
          });
        } else if (error instanceof InvalidVoteValueError) {
          console.error(error); // Log the error
          return res.status(HttpStatusCodes.BadRequest).json({
            message: error.message,
          });
        }

        console.error(error);

        return res.status(HttpStatusCodes.InternalServerError).json({
          message: "Error updating user's rating",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(HttpStatusCodes.InternalServerError).json({
        message: "Error validating request data",
      });
    }
  }
}
