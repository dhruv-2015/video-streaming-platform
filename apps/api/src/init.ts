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
