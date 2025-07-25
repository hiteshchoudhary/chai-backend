import { useGetAllVideosQuery } from "@/slices/videoApiSlice";
import { useEffect, useRef, useState } from "react";
import { VideoGridItemProps, VIEWS_FORMATTER } from "./VideoGridItem";
import FormatDuration from "@/utils/FormatDuration";
import { FaCircleCheck } from "react-icons/fa6";
import { formatTimeAgo } from "@/utils/FormatTimeAgo";

interface SuggestedVideosProps {
  currentVideoId: string;
}

const SuggestedVideos = ({ currentVideoId }: SuggestedVideosProps) => {
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<VideoGridItemProps[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const { data, isFetching } = useGetAllVideosQuery(
    {
      page,
      limit: 9,
    },
    {
      skip: !hasMore,
    }
  );

  useEffect(() => {
    if (data?.data?.videos) {
      setVideos((prev) => {
        const existingIds = new Set(prev.map((v) => v._id));
        const newVideos = data.data.videos.filter(
          (v: VideoGridItemProps) => !existingIds.has(v._id)
        );
        return [...prev, ...newVideos];
      });
      setHasMore(page < data.data.totalPages);
    } else if (data?.data?.totalPages === 0) {
      setHasMore(false);
    }
  }, [data, page]);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container");
    if (!scrollContainer || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isFetching) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 1.0,
      }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [hasMore, isFetching]);

  return (
    <div className="relative flex flex-col gap-2 p-4 sm:p-6 md:p-8 lg:pb-4 lg:pt-0 lg:px-4">
      {videos
        ?.filter((video) => video._id !== currentVideoId)
        .map((video) => (
          <div
            className="relative flex flex-col gap-2 sm:flex-row sm:gap-4"
            key={video._id}
          >
            <a
              href={`?v=${video._id}`}
              className="relative block w-full sm:w-[40%] md:w-[45%] lg:w-[40%] aspect-video shrink-0"
            >
              <img
                src={video.thumbnail}
                className="block w-full h-full object-cover transition-[border-radius] duration-200 rounded-lg"
                loading="lazy"
              />
              <div className="absolute bottom-1 right-1 bg-secondary-marginal-dark bg-opacity-65 text-white font-semibold text-xs px-1 py-0.5 rounded">
                {FormatDuration(video.duration)}
              </div>
            </a>

            <div className="flex flex-col mt-2 sm:mt-0">
              <a
                href={`/watch?v=${video._id}`}
                className="text-sm font-semibold sm:text-[0.9rem] line-clamp-2 w-[80%]"
              >
                {video.title}
              </a>
              <a
                href={`/user/${video.owner.username}`}
                className="flex items-center gap-1 text-sm text-secondary-marginal-text"
              >
                {video.owner.fullname}
                <FaCircleCheck size={12} className="hidden sm:inline" />
              </a>
              <div className="mt-1 text-xs sm:text-sm text-secondary-marginal-text sm:mt-0">
                {VIEWS_FORMATTER.format(video.views)} Views •{" "}
                {formatTimeAgo(new Date(video.createdAt))}
              </div>
            </div>
          </div>
        ))}
      <div ref={loaderRef} className="h-10" />
      {isFetching && (
        <div className="w-full flex items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-secondary-marginal-text rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default SuggestedVideos;
