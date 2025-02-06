

import {
  router,
} from "../trpc";
import { userRouter } from "./user";
import { channelRouter } from "./channel";
// import { tagsRouter } from "./tags";

export const trpcRouter = router({
    user: userRouter,
    channel: channelRouter,
    // tags: tagsRouter
});
