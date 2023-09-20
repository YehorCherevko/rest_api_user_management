import { IUser } from "../types/express";

export interface IUserRepository {
  createUser(user: IUser): Promise<IUser>;
  getUserById(userId: string): Promise<IUser | null>;
  getUsersWithPagination(page: number, pageSize: number): Promise<IUser[]>;
  updateUser(userId: string, updatedUser: IUser): Promise<IUser | null>;
  getUserByNickname(userNickname: string): Promise<IUser | null>;
}
