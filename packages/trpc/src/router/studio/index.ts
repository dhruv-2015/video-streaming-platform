import { router } from "../../trpc";
import { videoRouter } from "./video";
import { channelRouter } from "./channel";

export const studioRouter = router({
  channel: channelRouter,
  video: videoRouter,
});
