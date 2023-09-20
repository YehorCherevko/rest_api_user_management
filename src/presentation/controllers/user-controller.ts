import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { HttpHeaders } from "../../types/http-headers";
import * as UserValidator from "../validators/user.validator";
import * as Errors from "../../core/errors";

import { UserService } from "../../application/user-service";
import { HttpStatusCodes } from "../../types/http-status-codes";
import { UserDTO } from "../../core/user-dto";
import { JwtUser } from "../../types/express";

const {
  InvalidVoteValueError,
  VoterNotFoundError,
  UserToVoteForNotFoundError,
  CannotVoteForYourselfError,
  VotingRateLimitExceededError,
  UserNotFoundError,
  PreconditionFailedError,
} = Errors;

const {
  createUserSchema,
  userIdSchema,
  pageSchema,
  userNicknameSchema,
  updateRatingSchema,
  loginUserSchema,
  userIdValidation,
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
      const { error } = userIdSchema.validate(req.params);

      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
        });
      }

      const userId = req.params.userId;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        return res.status(HttpStatusCodes.NotFound).json({
          message: "User not found",
        });
      }

      const userDataTransferObject = new UserDTO(user);
      res.setHeader("Last-Modified", user.updated_at.toUTCString());
      res.json(userDataTransferObject);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        console.error(error);
        return res.status(HttpStatusCodes.NotFound).json({
          message: error.message,
        });
      }

      console.error(error);
      res
        .status(HttpStatusCodes.InternalServerError)
        .json({ message: "Error fetching user" });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;
      const updatedUser = req.body;
      const ifUnmodifiedSince = req.get(HttpHeaders.IfUnmodifiedSince) || "";

      const { error: userIdValidationError } =
        userIdValidation.validate(userId);

      if (userIdValidationError) {
        return res.status(HttpStatusCodes.BadRequest).json({
          [HttpHeaders.ContentType]: "application/json",
          message: userIdValidationError.details[0].message,
        });
      }

      const updatedUserResult = await this.userService.updateUser(
        userId,
        updatedUser,
        ifUnmodifiedSince
      );

      if (!updatedUserResult) {
        return res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      }

      res.setHeader(
        "Last-Modified",
        updatedUserResult.updated_at.toUTCString()
      );

      res.json(updatedUserResult);
    } catch (error) {
      console.error(error);
      if (error instanceof UserNotFoundError) {
        res
          .status(HttpStatusCodes.NotFound)
          .json({ message: "User not found" });
      } else if (error instanceof PreconditionFailedError) {
        res
          .status(HttpStatusCodes.PreconditionFailed)
          .json({ message: "Resource has been modified" });
      } else {
        res
          .status(HttpStatusCodes.InternalServerError)
          .json({ message: "Error updating user" });
      }
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

      const userDTOs = await this.userService.getUsersWithPagination(
        page,
        pageSize
      );

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
      const { error } = userNicknameSchema.validate(req.params);

      if (error) {
        return res.status(400).json({
          message: error.details[0].message,
        });
      }

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
      if (error instanceof UserNotFoundError) {
        res.status(HttpStatusCodes.NotFound).json({ message: error.message });
      } else {
        res
          .status(HttpStatusCodes.InternalServerError)
          .json({ message: "Error fetching user" });
      }
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

      const token = await this.userService.loginUser(nickname, password);

      if (!token) {
        return res
          .status(HttpStatusCodes.Unauthorized)
          .json({ message: "Authentication failed" });
      }

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
          console.error(error);
          return res.status(HttpStatusCodes.NotFound).json({
            message: error.message,
          });
        } else if (error instanceof UserToVoteForNotFoundError) {
          console.error(error);
          return res.status(HttpStatusCodes.NotFound).json({
            message: error.message,
          });
        } else if (error instanceof CannotVoteForYourselfError) {
          console.error(error);
          return res.status(HttpStatusCodes.BadRequest).json({
            message: error.message,
          });
        } else if (error instanceof VotingRateLimitExceededError) {
          console.error(error);
          return res.status(HttpStatusCodes.BadRequest).json({
            message: error.message,
          });
        } else if (error instanceof InvalidVoteValueError) {
          console.error(error);
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
