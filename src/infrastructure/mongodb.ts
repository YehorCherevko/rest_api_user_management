import mongoose from "mongoose";
import { config } from "../config/config";
import { IDatabaseConnection } from "../core/database-connection";

const mongoUri = config.mongoUri;

export class MongoDBConnection implements IDatabaseConnection {
  async connect(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const connection = await mongoose.connect(mongoUri);
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      process.exit(1);
    }
  }
}
