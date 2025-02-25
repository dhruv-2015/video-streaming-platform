import { rmdir, rmdirSync } from "fs";
import logger from "./logger";
import { worker } from "./worker";

async function main() {
    rmdirSync("tmp", { recursive: true });
    await worker.run()
}

main().catch(err => {
    logger.error(err);
    gracefulShutdown(1);
});

async function gracefulShutdown(code?: number) {
    await worker.close();
    process.exit(code ?? 0);
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


// videoTranscoder.transcode("video.mp4", "output", {
    
// });