import React from "react";
import Vidstack from "./Vidstack";
interface VideoPlayerType {
  src: string;
  title: string;
  poster: string;
  storyboard: string;
  subtitles: {
    src: string;
    label: string;
    language: string;
    type: string;
    default?: boolean;
  }[];
}
export const VideoPlayer = ({
  video,
  autoPlay,
  isEmbed,
}: {
  video: VideoPlayerType;
  autoPlay?: boolean;
  isEmbed?: boolean;
}) => {
  if (isEmbed) {
    return (
      <Vidstack
        autoPlay={autoPlay}
        src={video.src}
        title={video.title}
        poster={video.poster}
        storyboard={video.storyboard}
        subtitles={video.subtitles.map(subtitle => ({
          label: subtitle.label,
          language: subtitle.label,
          src: subtitle.src,
          type: subtitle.type,
          default: subtitle.default,
        }))}
      />
    );
  }

  return (
    <div className="aspect-video bg-black mb-4 rounded-lg overflow-hidden">
      <Vidstack
        // src="http://100.85.36.39:5500/output7/master.m3u8"
        autoPlay={autoPlay}
        src={video.src}
        title={video.title}
        poster={video.poster}
        storyboard={video.storyboard}
        subtitles={video.subtitles.map(subtitle => ({
          label: subtitle.label,
          language: subtitle.label,
          src: subtitle.src,
          type: subtitle.type,
          default: subtitle.default,
        }))}
      />
    </div>
  );
};
