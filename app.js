import express from "express";

import morgan, { format } from "morgan";

import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import AppError from "./utils/appError.js";
import { globalError } from "./controllers/globalErrorHandeler.js";
import cors from "cors";
import userRouter from "./routes/userRoutes.js";
import doctorRouter from "./routes/doctorRoutes.js";
import clinicRouter from "./routes/clinicRoute.js";
import specializationRouter from "./routes/specializationRoute.js";
import receptionistRouter from "./routes/receptionistRoute.js";
import patientRouter from "./routes/patientRoute.js";
import appointmentRouter from "./routes/appointmentRoute.js";
export const app = express();
app.use(helmet());
app.use(cors());

app.use(
  "/api",
  rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again later.",
  }),
);

app.use(express.json({ limit: "10kb" }));
///////////////////
// app.use(ExpressMongoSanitize());
// app.use(xss());

app.set("query parser", "extended");

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use(express.static("./public"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/doctors", doctorRouter);
app.use("/api/v1/clinic", clinicRouter);
app.use("/api/v1/specializations", specializationRouter);
app.use("/api/v1/receptionist", receptionistRouter);
app.use("/api/v1/patient", patientRouter);
app.use("/api/v1/appointment", appointmentRouter);
/////handel invalid routes and must be after all midlleware

app.use((req, res, next) => {
  next(new AppError("this url not found", 404));
});

app.use(globalError);
