import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

import "dotenv/config";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`App listening on port: ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.log("Not able to talk");
      throw error;
    });
  })
  .catch((err) => {
    console.log(`MongoDB Connection Failed: ${err}`);
  });

// =================Way to Connect DB using IIFE==============
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.PORT}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("Not able to talk");
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on PORT: ${process.env.PORT}`);
//     });
//   } catch (error) {
//     console.log(`Error: ${error}`);
//   }
// })();
