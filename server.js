import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

import Mongoose from "mongoose";

process.on("uncaughtException", (err) => {
  console.log("unhandled exception 🐦‍🔥: server shutting down");
  console.log(err.name, err.message);
  process.exit(1);
});

Mongoose.connect(process.env.LOCAL_DATABASE).then(() => {
  console.log("db connect successfully");

  startServer();
});

async function startServer() {
  ///////////////////////////!!!!!!!!!!!!!!!!!!!!!!///////////////////////////
  const { app } = await import("./app.js");
  ////////////////////////////!!!!!!!!!!!!!!!!!!!!!!!///////////////////////////
  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`server running in port ${port}`);
  });

  process.on("unhandledRejection", (err) => {
    console.log("unhandled rejection 🐦‍🔥: server shutting down");
    console.log(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}
