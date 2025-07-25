import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Categories from "../components/Categories";
import { categories } from "../data/Home";
import VideoGridItem, { VideoGridItemProps } from "../components/VideoGridItem";
import { useGetAllVideosQuery } from "@/slices/videoApiSlice";
import VideoCardShimmer from "@/shimmers/VideoCardShimmer";

// TODO: infinite scroll not working properly, need to fix it

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [page, setPage] = useState(1);
  const [videos, setVideos] = useState<VideoGridItemProps[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isFetching } = useGetAllVideosQuery(
    {
      page,
      limit: 20,
    },
    {
      skip: !hasMore,
    }
  );

  // Effect to update videos when data changes
  useEffect(() => {
    if (data?.data?.videos) {
      // setVideos((prev) => [...prev, ...data.data.videos]);
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

  // scroll handler to load more videos
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;

    if (
      scrollHeight - scrollTop <= clientHeight + 100 &&
      !isFetching &&
      hasMore
    ) {
      setPage((prev) => prev + 1);
    }
  }, [isFetching, hasMore]);

  // scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Memoized rendering of video items
  const renderedVideos = useMemo(
    () => videos?.map((video) => <VideoGridItem key={video._id} {...video} />),
    [videos]
  );

  const noVideosFound = !isFetching && videos.length === 0;

  return (
    <div ref={containerRef} className="overflow-x-hidden px-8 pb-4">
      <div className=" sticky top-0 bg-white z-10 pb-4 dark:bg-[#0F0F0F]">
        <Categories
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </div>

      {noVideosFound ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-2xl">No videos found</p>
        </div>
      ) : (
        <>
          {isLoading && (
            <div
              className={`grid gap-4 grid-cols-[repeat(auto-fill,minmax(350px,1fr))] ${
                isLoading ? "min-h-screen" : ""
              }`}
            >
              {Array.from({ length: 30 }).map((_, i) => (
                <VideoCardShimmer key={i} />
              ))}
            </div>
          )}
        </>
      )}

      <div
        className={`grid gap-4 ${
          videos?.length > 0
            ? "grid-cols-[repeat(auto-fill,minmax(350px,1fr))]"
            : ""
        }`}
      >
        {renderedVideos}
      </div>

      {isFetching && (
        <div className="flex items-center justify-center py-4">
          <div className="w-8 h-8 border-4 border-secondary-marginal-text rounded-full border-t-transparent animate-spin"></div>
          {/* <p className="ml-2 text-lg text-gray-300">
                Loading more videos...
              </p> */}
        </div>
      )}
    </div>
  );
};

export default Home;
