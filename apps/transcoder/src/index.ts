import logger from "./logger";
import { VideoTranscoder, videoTranscoder } from "./transcoder";
import { worker } from "./worker";

async function main() {
    await worker.run()
}

main().catch(err => {
    logger.error(err);
    process.exit(1);
});

async function grasfullSutdown() {
    await worker.close();
    process.exit(0);
}

// videoTranscoder.transcode("video.mp4", "output", {
    
// });