interface VideoPlayerProps {
  videoFile: string;
}

const VideoPlayer = ({ videoFile }: VideoPlayerProps) => {
  return (
    <div className="w-full rounded-xl aspect-video relative">
      <video
        className="w-full h-full object-cover rounded-xl dark:shadow-custom dark:shadow-neutral-900 "
        src={videoFile}
        autoPlay
        controls
      />
    </div>
  );
};

export default VideoPlayer;
