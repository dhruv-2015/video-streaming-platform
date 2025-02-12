"use client";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  MediaPlayerInstance,
  useMediaRemote,
} from "@vidstack/react";

// import {
//   PlyrLayout,
//   plyrLayoutIcons,
// } from "@vidstack/react/player/layouts/plyr";
import {
  DefaultVideoLayout,
  defaultLayoutIcons
} from "@vidstack/react/player/layouts/default";
import { useRef } from "react";
import "@vidstack/react/player/styles/plyr/theme.css";
import "@vidstack/react/player/styles/default/theme.css";
import '@vidstack/react/player/styles/default/layouts/audio.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
/**
 * define the subtitles interface
 * @param src - the subtitles source
 * @param label - the subtitles label e.g English
 * @param language - the subtitles language e.g en-US | en
 * @param type - the subtitles type e.g vtt
 * @param default - set default subtitles
 */
interface Subtitles  {
  src: string;
  label: string;
  language: string;
  type: string;
  default?: boolean;
}
/**
 * define the player options
 * @param src - the video source
 * @param title - the video title
 * @param poster - the video poster
 * @param hight - the video hight
 * @param width - the video width
 * @param storyboard - the video storyboard source e.g //example.com/storyboard.vtt
 * @param subtitles - the video subtitles
 */
interface PlayerOptions {
  src: string;
  title: string;
  poster?: string;
  hight?: number;
  width?: number;
  storyboard?: string;
  subtitles?: Subtitles[];
}

const Vidstack: React.FC<PlayerOptions> = ({
  hight,
  poster,
  src,
  title,
  width,
  subtitles,
  storyboard
}) => {
  const player = useRef<MediaPlayerInstance>(null);
  const remote = useMediaRemote(player);
  // useEffect(() => {
  //   if (!player.current) {
  //     return;
  //   }
  //   // player.current.addEventListener(
  //   //   "canplay",
  // }, [player]);
  const aspectRatio = (width && hight) ? `${width / hight}` : "16/9";
  return (
    <div className="">
      <MediaPlayer
        className="rounded-none"
        keyTarget="document"
        ref={player}
        src={src}
        viewType="video"
        streamType="on-demand"
        logLevel="warn"
        crossOrigin
        playsInline
        title={title}
        poster={poster}
      >
        <MediaProvider className="rounded-none">
          <Poster className="rounded-none vds-poster" />
          {subtitles?.map((track) => (
            <Track
              default={track.default}
              src={track.src}
              kind="subtitles"
              language={track.language}
              label={track.label}
              key={track.src}
            />
          ))}
        </MediaProvider>

        <DefaultVideoLayout
          thumbnails={storyboard}
          icons={defaultLayoutIcons}
        />
        
        {/* <PlyrLayout
          className="rounded-none"
          thumbnails="http://192.168.0.77:5500/output4/storyboard_copy.vtt"
          icons={plyrLayoutIcons}
        /> */}
      </MediaPlayer>
    </div>
  );
};

export default Vidstack;
