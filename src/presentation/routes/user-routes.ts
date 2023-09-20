import { Router } from "express";
import { UserController } from "../controllers/user-controller";
import { jwtAuthMiddleware } from "../../application/middlewares/jwt-auth";
import { adminAuthMiddleware } from "../../application/middlewares/admin-auth";

export class UserRouter {
  public router: Router;

  constructor(private readonly userController: UserController) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/users",
      this.userController.createUser.bind(this.userController)
    );
    this.router.get(
      "/users/:userId",
      this.userController.getUserById.bind(this.userController)
    );
    this.router.get(
      "/users",
      this.userController.getUsersWithPagination.bind(this.userController)
    );
    this.router.get(
      "/users/nickname/:userNickname",
      this.userController.getUserByNickname.bind(this.userController)
    );
    this.router.put(
      "/users/:userId",
      jwtAuthMiddleware,
      adminAuthMiddleware,
      this.userController.updateUser.bind(this.userController)
    );
    this.router.delete(
      "/users/:userId",
      jwtAuthMiddleware,
      adminAuthMiddleware,
      this.userController.deleteUser.bind(this.userController)
    );
    this.router.post(
      "/users/login",
      this.userController.loginUser.bind(this.userController)
    );
    this.router.post(
      "/users/vote",
      jwtAuthMiddleware,
      this.userController.updateRating.bind(this.userController)
    );
  }
}
