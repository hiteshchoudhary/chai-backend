// @ts-ignore
import ColorThief from "colorthief";

import { Button } from "@/components/Button";
import { VIEWS_FORMATTER } from "@/components/VideoGridItem";
import { useGetLikedVideosQuery } from "@/slices/likeApiSlice";
import { useGetCurrentUserQuery } from "@/slices/usersApiSlice";
import FormatDuration from "@/utils/FormatDuration";
import { formatTimeAgo } from "@/utils/FormatTimeAgo";
import { EllipsisVertical, ListVideo } from "lucide-react";
import { useEffect, useState } from "react";

interface ILikedVideo {
  _id: string;
  likedBy: string;
  video: {
    _id: string;
    duration: number;
    thumbnail: string;
    title: string;
    views: number;
    createdAt: Date;
    owner: {
      avatar: string;
      fullname: string;
      username: string;
    };
  };
}

// A simple loading skeleton
const LoadingState = () => (
  <div className="gap-14 grid grid-cols-1 lg:grid-cols-[360px,minmax(0,1fr)] animate-pulse">
    <div className="mt-2 lg:ml-10 flex flex-col px-4 py-2">
      <div className="mt-4 rounded-xl w-full h-48 bg-gray-500"></div>
      <div className="h-8 bg-gray-500 rounded w-3/4 mt-4"></div>
      <div className="h-5 bg-gray-500 rounded w-1/2 mt-4"></div>
      <div className="h-4 bg-gray-500 rounded w-1/3 mt-2"></div>
    </div>
    <div className="py-2 mt-2 mr-5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="h-32 w-56 bg-gray-500 rounded-lg"></div>
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-gray-500 rounded w-5/6"></div>
            <div className="h-4 bg-gray-500 rounded w-full"></div>
            <div className="h-3 bg-gray-500 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// A message for when there are no liked videos
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <ListVideo className="w-24 h-24 text-gray-400" />
    <h2 className="mt-4 text-2xl font-bold">No liked videos yet</h2>
    <p className="mt-2 text-gray-400">Videos you like will appear here.</p>
  </div>
);

const LikedVideosPage = () => {
  const [gradient, setGradient] = useState("");

  const { data: likedVideos, isLoading: isLikedVideosLoading } =
    useGetLikedVideosQuery({});

  const { data: loggedInUser } = useGetCurrentUserQuery(null);

  useEffect(() => {
    console.log("liked videos counts: ", likedVideos?.data);

    if (likedVideos?.data?.length > 0) {
      const img = document.createElement("img");
      img.crossOrigin = "Anonymous";
      img.src = likedVideos?.data[0]?.video.thumbnail;

      img.onload = () => {
        const colorthief = new ColorThief();
        const dominantColor = colorthief.getColor(img);
        const palette = colorthief.getPalette(img, 2);

        const gradient = `linear-gradient(
          to bottom, 
          rgba(${dominantColor.join(",")}, 0.9), 
          rgba(${palette[1].join(",")}, 0.03)
        )`;

        setGradient(gradient);
      };
    }
  }, [likedVideos]);

  // --- State Handling ---
  if (isLikedVideosLoading) {
    return <LoadingState />;
  }

  if (!likedVideos || likedVideos.data.length === 0) {
    return <EmptyState />;
  }

  const firstVideo = likedVideos?.data[0]?.video;

  return (
    <div className="lg:overflow-y-hidden gap-14 grid grid-cols-1 lg:grid-cols-[360px,minmax(0,1fr)]">
      {/* left sticky section */}
      <section
        className="mt-2 lg:ml-10 lg:sticky top-0  flex flex-col lg:px-4 px-10 py-2 rounded-2xl w-full"
        style={{ background: gradient || "transparent" }}
      >
        <a href={`/watch?v=${likedVideos?.data[0]?.video?._id}`}>
          <img
          className="mt-4 rounded-xl object-cover w-full"
          src={likedVideos?.data[0]?.video?.thumbnail}
          alt={firstVideo?.title}
        />
        </a>

        <h1 className="text-2xl font-bold mt-4 mx-1 tracking-tight">
          Liked videos
        </h1>

        <div className="mt-4 mx-1">
          <p className="text-xl lg:text-lg">
            {loggedInUser?.data?.fullname || "User"}
          </p>
          <p className="text-lg lg:text-[16px]">
            {likedVideos?.data.length} Videos
          </p>
        </div>
      </section>

      {/* Right Scrolling Section */}
      <section className="py-2 mt-2 mr-5 flex-shrink-0 overflow-y-auto">
        {likedVideos?.data?.map((item: ILikedVideo, index: number) => (
          <div
            key={item.video._id}
            className="group relative flex gap-2 w-full hover:bg-secondary-marginal p-2 rounded-xl mb-2"
          >
            <span className="text-gray-400 text-lg font-bold w-6 text-center self-center">
              {index + 1}
            </span>
            <a
              href={`/watch?v=${item.video._id}`}
              className="relative flex-shrink-0"
            >
              <img
                className="h-32 w-56 object-cover mx-2 rounded-lg"
                src={item.video.thumbnail}
                alt={item.video.title}
              />
              <div className="absolute bottom-1 right-3 bg-secondary-marginal-dark bg-opacity-90 text-white font-semibold md:text-sm px-1 py-0.5 rounded">
                {FormatDuration(item.video.duration)}
              </div>
            </a>

            <div
              className={`absolute right-1 top-1/2 -translate-y-1/2 lg:opacity-0 group-hover:opacity-100`}
            >
              <Button variant="ghost" size="icon">
                <EllipsisVertical size={20} className="cursor-pointer" />
              </Button>
            </div>

            <a
              href={`/watch?v=${item.video._id}`}
              className="flex flex-col flex-1  min-w-0"
            >
              <div className="text-base font-bold line-clamp-2">
                {item.video.title}
              </div>
              <div className="flex flex-wrap gap-0 items-start md:flex-row md:gap-2 md:items-center flex-col text-secondary-marginal-text text-xs">
                <p className="font-medium">{item.video.owner.fullname}</p>
                <div className="text-secondary-marginal-text hidden sm:block">
                  • {VIEWS_FORMATTER.format(item.video.views)} Views •{" "}
                  {formatTimeAgo(new Date(item.video.createdAt))}
                </div>
              </div>
            </a>
          </div>
        ))}
      </section>
    </div>
  );
};

export default LikedVideosPage;
