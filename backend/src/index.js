import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import path from 'path';
import { fileURLToPath } from 'url';






dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Server listening on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log(`DB cant be connected `, error);
  });
