import { injectable, inject } from "inversify";
import { IUser } from "../types/express";
import crypto from "crypto";
import { hashPassword } from "../infrastructure/authentification/password-utils";
import UserModel from "../core/user-model";
import { IUserRepository } from "../repositories/user-repository-interface";
import { VoteValue } from "../types/vote";
import {
  InvalidVoteValueError,
  VoterNotFoundError,
  UserToVoteForNotFoundError,
  CannotVoteForYourselfError,
  VotingRateLimitExceededError,
} from "../core/errors";

@injectable()
export class UserService {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async createUser(user: IUser): Promise<IUser> {
    const { nickname, firstName, lastName, password, role } = user;

    const existingUser = await this.userRepository.getUserByNickname(nickname);
    if (existingUser) {
      throw new Error("User with this nickname already exists");
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await hashPassword(password, salt);

    const newUser: IUser = new UserModel({
      nickname,
      firstName,
      lastName,
      password: hashedPassword,
      salt,
      created_at: new Date(),
      updated_at: new Date(),
      deleted_at: null,
      role,
    });

    await newUser.save();

    return this.userRepository.createUser(newUser);
  }

  public async getUserById(userId: string): Promise<IUser | null> {
    return this.userRepository.getUserById(userId);
  }

  public async getUsersWithPagination(
    page: number,
    pageSize: number
  ): Promise<IUser[]> {
    return this.userRepository.getUsersWithPagination(page, pageSize);
  }

  public async updateUser(
    userId: string,
    updatedUser: IUser
  ): Promise<IUser | null> {
    return this.userRepository.updateUser(userId, updatedUser);
  }

  public async deleteUser(userId: string): Promise<IUser | null> {
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      return null;
    }

    user.deleted_at = new Date();
    await user.save();

    return user;
  }

  public async getUserByNickname(userNickname: string): Promise<IUser | null> {
    return this.userRepository.getUserByNickname(userNickname);
  }

  public async updateRating(
    voterId: string,
    userId: string,
    vote: number
  ): Promise<void> {
    const userWhoVotes = await this.userRepository.getUserById(voterId);
    if (!userWhoVotes || userWhoVotes.deleted_at != null) {
      throw new VoterNotFoundError("Voter not found or deleted.");
    }

    const userToVoteFor = await this.userRepository.getUserById(userId);
    if (!userToVoteFor || userToVoteFor.deleted_at != null) {
      throw new UserToVoteForNotFoundError(
        "User to vote for not found or deleted."
      );
    }

    if (userId === voterId) {
      throw new CannotVoteForYourselfError("You cannot vote for yourself.");
    }

    const canVote = this.canUserVote(userWhoVotes.lastVotedAt);
    if (!canVote) {
      throw new VotingRateLimitExceededError(
        "You can only vote once per hour."
      );
    }

    if (!this.isValidVote(vote)) {
      throw new InvalidVoteValueError(
        "Invalid vote value. Vote must be 1 (positive) or -1 (negative)."
      );
    }

    userToVoteFor.rating += vote;
    userWhoVotes.lastVotedAt = new Date();

    await this.userRepository.updateUser(userId, userToVoteFor);
    await this.userRepository.updateUser(voterId, userWhoVotes);
  }

  public canUserVote(lastVotedAt: Date | null): boolean {
    const now = new Date();
    const hour = 3600000; // 1 hour in milliseconds
    return !lastVotedAt || now.getTime() - lastVotedAt.getTime() >= hour;
  }

  private isValidVote(vote: number): boolean {
    return vote === VoteValue.Positive || vote === VoteValue.Negative;
  }
}
