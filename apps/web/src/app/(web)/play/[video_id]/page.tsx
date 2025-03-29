import { VideoPlayer } from "@/components/player/Player";
import { VideoInfo } from "@/components/player/VideoInfo";
import { VideoDescription } from "@/components/player/VideoDescription";
import { CommentSection } from "@/components/player/VideoComments";
import { VideoRecommendations } from "@/components/player/VideoRecomandation";
import { trpcServerClient } from "@/trpc/server";
import { VideoPlaylist } from "@/components/player/VideoPlaylist";



// const RECOMMENDATIONS = [
//   {
//     id: 1,
//     thumbnail:
//       "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=320&h=180",
//     title:
//       "The Ultimate Guide to Alchemy The Ultimate Guide to AlchemyThe Ultimate Guide to AlchemyThe Ultimate Guide to AlchemyThe Ultimate Guide to AlchemyThe Ultimate Guide to Alchemy",
//     channelName: "Anime World",
//     views: "250K",
//     uploadTime: "2 days ago",
//   },
// ];

export default async function Home({ params,searchParams }: { params: { video_id: string }, searchParams?: { [key: string]: string | string[] | undefined } }) {
  try {
    const video = await trpcServerClient.video.getVideo.query({
      video_id: params.video_id,
    });
    
    
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="max-w-[1800px] mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <VideoPlayer
               autoPlay
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
                  default: subtitle.default
                }))
                }}/>
              <VideoInfo
                title={video.title}
                channelName={video.channel.name}
                channelslug={video.channel.slug}
                channelAvatar={video.channel.image}
                subscribers={video.channel.subscriber_count}
                likes={video.like_count}
                videoId={video.id}
              />
              <VideoDescription
                description={video.description}
                views={video.view_count}
                uploadDate={video.upload_at}
              />
              <CommentSection video_id={video.id} channelId={video.channel.id} />
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-1">
              <VideoPlaylist video_id={video.id} playlist_id={searchParams && searchParams['playlist']?.toString()} />
              <VideoRecommendations video_id={video.id} />
            </div>
          </div>
        </div>
      </main>
    );
  } catch (error) {
    throw error;
  }
}
