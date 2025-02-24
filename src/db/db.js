import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// ======Way to Connect DB using promises / then() and catch()======

// const connectDB = () => {
//   mongoose
//     .connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     .then((resp) => {
//       console.log(
//         `Database Connection Successful !! DB_HOST: ${resp.connection.host}`
//       );
//     })
//     .catch((error) => {
//       console.log(`Connection Failed: ${error}`);
//     });
// };

// =====Way to Connect DB using async/await=====
const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `Database Connection Successful !! DB_HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
