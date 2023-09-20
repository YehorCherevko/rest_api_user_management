import { UserModel } from "../core/user-model";
import { IUser } from "../types/express";
import { injectable } from "inversify";
import { IUserRepository } from "./user-repository-interface";

@injectable()
export class UserRepository implements IUserRepository {
  public async createUser(user: IUser): Promise<IUser> {
    return UserModel.create(user);
  }

  public async getUserById(userId: string): Promise<IUser | null> {
    return UserModel.findById(userId);
  }

  public async getUsersWithPagination(
    page: number,
    pageSize: number
  ): Promise<IUser[]> {
    const query = { deleted_at: null };

    const skip = (page - 1) * pageSize;
    return UserModel.find(query).skip(skip).limit(pageSize).exec();
  }

  public async updateUser(
    userId: string,
    updatedUser: IUser
  ): Promise<IUser | null> {
    updatedUser.updated_at = new Date();
    return UserModel.findByIdAndUpdate(userId, updatedUser, { new: true });
  }

  public async getUserByNickname(userNickname: string): Promise<IUser | null> {
    return UserModel.findOne({ nickname: userNickname });
  }
}
