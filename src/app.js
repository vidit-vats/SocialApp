import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// app.use() is used when we want to set config or middleware

// cors() expects an object too. We have set properties "origin" and "credentials"
app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		credentials: true,
	})
);

// limit is designed as per how much load a server can handle
app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// static() is used to keep static files i.e files,folders,pdf, images
// public is set because we have made public folder
app.use(express.static("public"));

app.use(cookieParser());

// Routes
// Import statement is written here only for routers

import userRouter from "./routes/user.routes.js";

// Routes Declaration
app.use("/api/v1/users", userRouter);

export { app };
// Below is same as above
// export default app;
