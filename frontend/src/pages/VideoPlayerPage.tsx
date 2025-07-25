import PageHeader from "@/layouts/PageHeader";
import VideoSideBar from "@/layouts/VideoSideBar";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { FaCircleCheck } from "react-icons/fa6";
import { BiLike, BiDislike, BiSolidLike, BiSolidDislike } from "react-icons/bi";
import { HiDownload } from "react-icons/hi";
import { RiShareForwardLine } from "react-icons/ri";
import { Button } from "@/components/Button";
import { useGetVideoByIdQuery } from "@/slices/videoApiSlice";
import { formatTimeAgo } from "@/utils/FormatTimeAgo";
import { VIEWS_FORMATTER } from "@/components/VideoGridItem";
import { useGetCurrentUserQuery } from "@/slices/usersApiSlice";
import SuggestedVideos from "@/components/SuggestedVideos";
import { useToggleVideoLikeMutation } from "@/slices/likeApiSlice";
import { useToggleSubscriptionMutation } from "@/slices/subscriptionApiSlice";
import { useAppDispatch } from "@/app/hooks";
import { saveUserSubscriptions } from "@/slices/subscriptionsSlice";
import { Bell, BellRing } from "lucide-react";
import { toast } from "react-toastify";
import { Skeleton } from "@/components/ui/skeleton";
import CommentSection from "@/components/CommentSection";
import VideoPlayer from "@/components/VideoPlayer";

const VideoPlayerPage = () => {
  const [videoId, setVideoId] = useState("");
  const [playlistParams, setPlaylistParams] = useState<{
    list: string | null;
    index: string | number;
  }>({
    list: null,
    index: 1,
  });

  const {
    data: video,
    isLoading: isVideoLoading,
    isFetching: isFetchingVideo,
    refetch: refetchVideo,
  } = useGetVideoByIdQuery(videoId, { skip: !videoId });

  const [isDescriptionVisible, setIsDescriptionVisible] =
    useState<boolean>(false);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isDisLiked, setIsDisLiked] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [subscribersCount, setSubscribersCount] = useState<number>(0);

  const location = useLocation();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const id = searchParams.get("v");
    const list = searchParams.get("list");
    const index = searchParams.get("index") || 1;

    if (id) {
      setVideoId(id);
    }

    if (list) {
      setPlaylistParams({ list, index });
    }
  }, [location.search]);

  const { data: loggedInUser } = useGetCurrentUserQuery(null);

  const [toggleVideoLike, { isLoading: isTogglingLike }] =
    useToggleVideoLikeMutation();

  const [toggleSubscription, { isLoading: isTogglingSubscription }] =
    useToggleSubscriptionMutation();

  useEffect(() => {
    if (video?.data?.isLiked !== undefined) {
      setIsLiked(video.data.isLiked);
    }
  }, [video]);

  useEffect(() => {
    if (video?.data?.isSubscribed !== undefined) {
      setIsSubscribed(video.data.isSubscribed);
    }

    if (video?.data?.subscribers !== undefined) {
      setSubscribersCount(video.data.subscribers);
    }
  }, [video]);

  const handleToggleLike = async () => {
    try {
      if (isLiked) {
        setIsLiked(false);
      } else {
        setIsLiked(true);
        setIsDisLiked(false);
      }
      await toggleVideoLike(videoId).unwrap();
      refetchVideo();
    } catch (error) {
      console.error("Error toggling like:", error);
      setIsLiked((prev) => !prev); // revert the like state in case of error
    }
  };

  const handleToggleDisLike = async () => {
    if (isDisLiked) {
      setIsDisLiked(false);
    } else {
      setIsDisLiked(true);
      if (isLiked) {
        setIsLiked(false);
        await toggleVideoLike(videoId);
        refetchVideo();
      }
    }
  };

  const handleToggleSubscription = async (userId: string) => {
    setIsSubscribed((prev) => !prev);
    setSubscribersCount((prev) => (isSubscribed ? prev - 1 : prev + 1));

    try {
      const response = await toggleSubscription(userId).unwrap();
      dispatch(saveUserSubscriptions(response.data?.subscribedChannels));

      toast.success(`Subscription ${isSubscribed ? "removed" : "added"}!`);
    } catch (error) {
      console.error("Error toggling subscription:", error);
      setIsSubscribed((prev: boolean) => !prev);
      setSubscribersCount((prev) => (isSubscribed ? prev + 1 : prev - 1));

      toast.error("Failed to update subscription");
    }
  };

  return (
    <div className="max-h-screen flex flex-col dark:bg-[#0F0F0F]">
      <PageHeader />

      <VideoSideBar />
      <div
        id="scroll-container"
        className="grid grid-cols-[2.5fr,1fr] flex-grow-1 overflow-y-auto overflow-x-hidden px-10 mt-4 gap-4 h-[calc(100vh-90px)]"
      >
        <div className=" h-full w-full">
          <div className="w-full relative aspect-video flex flex-col">
            <div className={`w-full rounded-xl aspect-video relative`}>
              {isVideoLoading ? (
                <Skeleton className=" w-full h-full rounded-xl" />
              ) : (
                <VideoPlayer videoFile={video?.data?.videoFile}/> 
              )}
            </div>

            <p className="mt-4 text-start text-base font-semibold sm:te.xt-lg md:text-xl line-clamp-1">
              {video?.data?.title}
            </p>

            <div className="flex w-full flex-col items-start justify-between gap-4 mt-2 lg:flex-row">
              {isVideoLoading ? (
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-80" />
                    <Skeleton className="h-4 w-72" />
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 lg:w-1/2 xl:w-2/3 sm:w-auto">
                  <Link to={``} className="flex-shrink-0">
                    <img
                      src={video?.data?.owner?.avatar}
                      className="object-cover object-center rounded-full size-11"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex items-center justify-between w-full flex-wrap gap-3">
                    <div className="flex flex-grow min-w-0 max-w-[70%] md:max-w-full">
                      <div>
                        <span className="flex items-center gap-2">
                          <Link
                            to={``}
                            className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate"
                          >
                            {video?.data?.owner?.fullname}
                          </Link>
                          <FaCircleCheck size={16} />
                        </span>

                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {subscribersCount} subscribers
                        </p>
                      </div>

                      {loggedInUser?.data?._id !== video?.data?.owner?._id && (
                        <div className="ml-7 flex items-center justify-center">
                          <Button
                            className={`px-5 flex items-center justify-center py-2 text-[1rem] font-semibold rounded-3xl w-max flex-shrink-0 
                          ${
                            isSubscribed
                              ? "text-gray-100"
                              : "text-gray-900 bg-gray-100 hover:bg-gray-300"
                          }`}
                            onClick={() =>
                              handleToggleSubscription(video?.data?.owner?._id)
                            }
                            disabled={isTogglingSubscription}
                          >
                            {isSubscribed ? (
                              <BellRing size={20} />
                            ) : (
                              <Bell size={20} />
                            )}
                            &nbsp;
                            <span>
                              {isSubscribed ? "Subscribed" : "Subscribe"}
                            </span>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap justify-start gap-2 sm:gap-3 lg:flex-nowrap lg:w-2 xl:w-5 w-full">
                      <div className="flex items-center bg-[#31302f] rounded-full">
                        <Button
                          variant="default"
                          className="flex gap-1 items-center bg-[#31302f] hover:bg-[#454A47] rounded-full rounded-r-none px-2 sm:px-3 text-xs sm:text-sm"
                          onClick={handleToggleLike}
                          disabled={isTogglingLike}
                        >
                          {isLiked ? (
                            <BiSolidLike size={20} />
                          ) : (
                            <BiLike size={20} />
                          )}
                          <p className="text-gray-200 font-semibold ml-1 min-w-[24px] text-center">
                            {video?.data?.likes}
                          </p>
                        </Button>

                        <div className="border-l border-gray-500 h-5 bg-[#31302f]" />

                        <Button
                          variant="default"
                          className="flex gap-1 items-center bg-[#31302f] hover:bg-[#454A47] rounded-full rounded-l-none px-2 sm:px-3"
                          onClick={handleToggleDisLike}
                        >
                          {isDisLiked ? (
                            <BiSolidDislike size={20} />
                          ) : (
                            <BiDislike size={20} />
                          )}
                        </Button>
                      </div>

                      <Button
                        variant="dark"
                        className="bg-[#31302f] hover:bg-[#454A47] flex gap-1 items-center justify-center rounded-full px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <RiShareForwardLine
                          size={24}
                          className="text-gray-200"
                        />
                        <p className="hidden sm:inline text-gray-200 font-semibold">
                          Share
                        </p>
                      </Button>
                      <Button
                        variant="dark"
                        className="bg-[#31302f] hover:bg-[#454A47] flex gap-1 items-center rounded-full justify-center px-2 sm:px-3 text-xs sm:text-sm"
                      >
                        <HiDownload size={24} className="text-gray-200" />
                        <p className="hidden sm:inline text-gray-200 font-semibold">
                          Download
                        </p>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isVideoLoading ? (
              <div className="space-y-3 mt-10 ml-10">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            ) : (
              <div className="description border bg-secondary-marginal p-4 my-4 rounded-md text-md dark:bg-[#2A2A29]">
                <p className=" font-semibold">
                  {VIEWS_FORMATTER.format(video?.data?.views)} views &nbsp;
                  {formatTimeAgo(new Date(video?.data?.createdAt))}
                </p>
                <p
                  className={`mt-2 ${
                    isDescriptionVisible ? "" : "line-clamp-1 cursor-pointer"
                  }`}
                  onClick={() => setIsDescriptionVisible(true)}
                >
                  {video?.data?.description ||
                    "No description available for this video."}
                </p>

                <button
                  onClick={() =>
                    setIsDescriptionVisible((descVisible) => !descVisible)
                  }
                  className="mt-4"
                >
                  {isDescriptionVisible ? "Show Less" : "...more"}
                </button>
              </div>
            )}
          </div>

          <CommentSection videoId={videoId} />
        </div>

        <div className="w-full">
          <SuggestedVideos currentVideoId={videoId} />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerPage;
