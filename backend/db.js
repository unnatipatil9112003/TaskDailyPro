import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import { DB_NAME } from "./constants.js";
const connectToMongo = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        writeConcern: { w: "majority" },
      }
    );

    console.log(
      "MongoDB connected at DB HOST:",
      connectionInstance.connection.host
    );
  } catch (error) {
    console.log("MongoDB connection Failed:", error);
    process.exit(1);
  }
};

export default connectToMongo;
