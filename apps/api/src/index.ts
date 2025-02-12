import { env } from "@workspace/env";
import express from "express";
import cors from "cors";
import morgan from "morgan";
// @ts-ignore
import { expressAuth } from "@workspace/auth";
import { logger } from "@workspace/logger";
import { prisma, redis } from "@workspace/database";
// @ts-ignore
import { trpcExpress, expressTrpcOpenApi, openApiUi } from "@workspace/trpc";

// process.exit()
redis.disconnect(); // because i dont have redis db setup
logger.info("Starting server...");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(cors())

app.set("trust proxy", true);
app.get("/", (req, res) => res.redirect("/api"));

app.use("/exit", (req, res) => {
  res.send("Exiting process...");
  process.exit(0);
});

app.use("/api/auth/*", expressAuth);
app.use("/api/trpc", trpcExpress);
app.use("/api", openApiUi);

const server = app.listen(env.PORT, () => {
  redis.disconnect();
  logger.info(`✅ Server listening on port ${env.PORT}`);
  env.NODE_ENV == "production" && console.log(`✅ Server listening on port ${env.PORT}`);

  redis.disconnect(false)
});

// app.use("/api");

async function gracefulShutdown() {
  logger.info("Received shutdown signal, shutting down gracefully...");
  logger.info(`PID: ${process.pid}`);
  logger.info(`Platform: ${process.platform}`);
  logger.info(`Node Version: ${process.version}`);
  logger.info(`Process uptime: ${process.uptime()} seconds`);

  logger.info("Closing Express server...");

if (env.NODE_ENV == "production") {
  console.info("Received shutdown signal, shutting down gracefully...");
  console.info(`PID: ${process.pid}`);
  console.info(`Platform: ${process.platform}`);
  console.info(`Node Version: ${process.version}`);
  console.info(`Process uptime: ${process.uptime()} seconds`);

  console.info("Closing Express server...");
}


  
  server?.close(err => {
    if (err) {
      console.error("Error shutting down server:", err);
      process.exit(1);
    }
    logger.info("Express server closed");
    env.NODE_ENV == "production" && console.log("Express server closed");
    
  });
  // logger.info("Exiting process closed.");
  // env.NODE_ENV == "production" && console.log("Express server closed");


  try {
    // logger.info("Closing Redis connection...");
    // redis.disconnect();
    // logger.info("Redis connection closed");
    await prisma.$disconnect();
    logger.info("MongoDB prisma connection closed");
    env.NODE_ENV == "production" && console.log("MongoDB prisma connection closed");

  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
  logger.info("✅ Shutdown complete");
    env.NODE_ENV == "production" && console.log("✅ Shutdown complete");

  process.exit(0);
}

// Handle various shutdown signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown();
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});
