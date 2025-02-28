import { VideoPlayer } from "@/components/player/Player";
import { trpcServerClient } from "@/trpc/server";

export default async function Player({
  params
}: {
  params: { video_id: string };
}) {
  try {
    const video = await trpcServerClient.video.getVideo.query({
      video_id: params.video_id,
    });

    return (
      <VideoPlayer
        //  autoPlay
        video={{
          poster: video.thumbnail,
          src: video.stream.m3u8,
          storyboard: video.stream.storyboard,
          title: video.title,
          subtitles: video.stream.subtitles.map(subtitle => ({
            src: subtitle.src,
            label: subtitle.language,
            language: subtitle.language,
            type: subtitle.type,
            default: subtitle.default,
          })),
        }}
        isEmbed
      />
    );
  } catch (error) {
    throw error;
  }
}
