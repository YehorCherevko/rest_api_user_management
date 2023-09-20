import express, { Application, ErrorRequestHandler } from "express";
import http from "http";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import { config } from "./config/config";
import container from "./inversify.config";
import { UserController } from "./presentation/controllers/user-controller";
import { UserRouter } from "./presentation/routes/user-routes";
import { HttpStatusCodes } from "./types/http-status-codes";
import { IDatabaseConnection } from "./core/database-connection";
import { MongoDBConnection } from "./infrastructure/mongodb";

export class Server {
  private app: Application;
  private readonly PORT;

  constructor(private readonly databaseConnection: IDatabaseConnection) {
    this.app = express();

    this.PORT = config.port;

    const userController = container.resolve<UserController>(UserController);

    this.initializeMiddlewares();
    this.initializeRoutes(userController);
    this.connectToDatabase();
  }

  private initializeMiddlewares() {
    this.app.use(
      cors({
        credentials: true,
      })
    );
    this.app.use(compression());
    this.app.use(cookieParser());
    this.app.use(express.json());
  }

  private initializeRoutes(userController: UserController) {
    const userRouter = new UserRouter(userController);
    this.app.use("/api/", userRouter.router);
  }

  private connectToDatabase() {
    this.databaseConnection
      .connect()
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
      });
  }

  startServer() {
    const server = http.createServer(this.app);

    server.listen(this.PORT, () => {
      console.log(`Server is running on http://localhost:${this.PORT}`);
    });
  }

  private errorHandler: ErrorRequestHandler = (err, req, res) => {
    console.error(err.stack);
    res
      .status(HttpStatusCodes.InternalServerError)
      .json({ message: "Internal Server Error" });
  };
}

const databaseConnection = new MongoDBConnection();
const server = new Server(databaseConnection);
server.startServer();
