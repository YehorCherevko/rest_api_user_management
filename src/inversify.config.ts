import "reflect-metadata";
import { Container } from "inversify";
import { UserController } from "./presentation/controllers/user-controller";
import { UserService } from "./application/user-service";
import { IDatabaseConnection } from "./core/database-connection";
import { MongoDBConnection } from "./infrastructure/mongodb";
import { IUserRepository } from "./repositories/user-repository-interface";
import { UserRepositoryMongoDB } from "./repositories/user-repository-mongodb";
import { UserRepository } from "./repositories/user-repository";

const container = new Container();

container.bind<UserRepository>(UserRepository).toSelf();
container.bind<UserController>(UserController).toSelf();
container.bind<UserService>(UserService).toSelf();
container
  .bind<IDatabaseConnection>(Symbol.for("IDatabaseConnection"))
  .to(MongoDBConnection)
  .inSingletonScope();
container
  .bind<IUserRepository>(Symbol.for("IUserRepository"))
  .to(UserRepositoryMongoDB);
container.bind<IUserRepository>("IUserRepository").to(UserRepository);

export default container;
