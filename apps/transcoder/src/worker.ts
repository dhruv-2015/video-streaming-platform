import { redis } from "@workspace/database";
import { Job, Worker } from "bullmq";
interface MyData {
    file: {
        key: string;
        bucket: string;
    };
    video_id: string;
}
export const worker = new Worker<MyData>("video_transcoder", async (job: Job) => {
    job.data
}, {
  connection: redis,
  prefix: "video_transcoder_queue",
  concurrency: 2,
  autorun: false
});

