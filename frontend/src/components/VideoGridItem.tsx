// import { Link } from "lucide-react";
import { Link } from "react-router-dom";
import FormatDuration from "../utils/FormatDuration";
import { formatTimeAgo } from "../utils/FormatTimeAgo";
import { useEffect, useRef, useState } from "react";

export interface VideoGridItemProps {
  _id: string;
  title: string;
  owner: {
    _id: string;
    username: string;
    fullname: string;
    avatar: string;
  };
  views: number;
  createdAt: Date;
  duration: number;
  thumbnail: string;
  videoFile: string;
}

export const VIEWS_FORMATTER = new Intl.NumberFormat(undefined, {
  notation: "compact",
});

const VideoGridItem = ({
  _id,
  title,
  owner,
  views,
  createdAt,
  duration,
  thumbnail,
  videoFile,
}: VideoGridItemProps) => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current == null) return;

    if (isVideoPlaying) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isVideoPlaying]);

  return (
    <div
      className="flex flex-col gap-3 mb-5 cursor-pointer"
      onMouseEnter={() => setIsVideoPlaying(true)}
      onMouseLeave={() => setIsVideoPlaying(false)}
    >
      <Link to={`/watch?v=${_id}`} className="relative aspect-video">
        <img
          src={thumbnail}
          className={`block w-full h-full object-cover transition-[border-radius] aspect-video duration-200 ${
            isVideoPlaying ? "rounded-none" : "rounded-xl"
          }`}
        />
        {/* TIME STAMPS */}
        <div className="absolute bottom-1 right-1 bg-secondary-marginal-dark text-secondary-marginal text-sm px-0.5 rounded dark:text-secondary-marginal-text-hover">
          {FormatDuration(duration)}
        </div>
        {/* VIDEO */}
        <video
          src={videoFile}
          ref={videoRef}
          muted
          playsInline
          className={` aspect-video block h-full object-cover absolute inset-0 transition-opacity duration-200 ${
            isVideoPlaying ? "opacity-100 delay-200" : "opacity-0"
          }  `}
        />
      </Link>

      <div className="flex gap-2">
        <Link to={``} className="flex-shrink-0">
          <img
            src={owner.avatar}
            className="w-12 h-12 rounded-full object-cover"
          />
        </Link>
        <div className="flex flex-col">
          <Link to={`/:${_id}`} className="font-bold">
            {title}
          </Link>

          <Link
            to={`/:owner/:${owner._id}`}
            className="text-secondary-marginal-text text-sm hover:text-secondary-marginal-text-hover"
          >
            {owner.fullname}
          </Link>

          <div className="text-secondary-marginal-text text-sm">
            {VIEWS_FORMATTER.format(views)} views •{" "}
            {formatTimeAgo(new Date(createdAt))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGridItem;
