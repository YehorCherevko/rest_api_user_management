import { IUser } from "../types/express";

export class UserDTO {
  public nickname: string;
  public firstName: string;
  public lastName: string;
  public role: string;
  public rating: number;

  constructor(user: IUser) {
    this.nickname = user.nickname;
    this.firstName = user.firstName;
    this.lastName = user.lastName;
    this.role = user.role;
    this.rating = user.rating;
  }
}
