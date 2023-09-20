import { IUser } from "../types/express";
import { IUserRepository } from "./user-repository-interface";
import { UserModel } from "../core/user-model";

// This UserRepositoryMongoDB is not currently used but it's kept for reference or future usage.
export class UserRepositoryMongoDB implements IUserRepository {
  async createUser(user: IUser): Promise<IUser> {
    return UserModel.create(user);
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }

  async getUsersWithPagination(
    page: number,
    pageSize: number
  ): Promise<IUser[]> {
    const skip = (page - 1) * pageSize;
    return UserModel.find().skip(skip).limit(pageSize).exec();
  }

  async updateUser(userId: string, updatedUser: IUser): Promise<IUser | null> {
    return UserModel.findByIdAndUpdate(userId, updatedUser, { new: true });
  }

  async getUserByNickname(userNickname: string): Promise<IUser | null> {
    return UserModel.findOne({ nickname: userNickname });
  }
}
