import express from "express";
import { User } from "./models/user.model.js";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Serve static files
app.use(express.static(path.join(__dirname, '../../frontend')));

// Send index.html on root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});



app.use(
  cors({
    origin: "http://localhost:5000",
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());

//importing the routes

import userRouter from "./routes/user.route.js";
import postRouter from "./routes/post.route.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/post", postRouter);

export { app };
