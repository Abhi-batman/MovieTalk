import mongoose from "mongoose";
import { DB_name } from "../constants.js";
const connectDB = async () => {
  try {
    const responseDB = await mongoose.connect(
      `${process.env.DB_URL}${DB_name}`
    );
    console.log(`Connection host is : `, responseDB.connection.host);
  } catch (error) {
    console.log("DB couldnt be connected:", error);

    process.exit(1);
  }
};
export { connectDB };
