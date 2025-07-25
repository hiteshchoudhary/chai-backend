import { Button } from "./Button";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGetCurrentUserQuery } from "@/slices/usersApiSlice";
import {
  useAddCommentMutation,
  useGetVideoCommentsQuery,
} from "@/slices/commentApiSlice";
import CommentItems from "./CommentItems";
import { toast } from "react-toastify";
import CommentItemShimmer from "@/shimmers/CommentItemShimmer";
import { Skeleton } from "./ui/skeleton";

interface CommentSectionProps {
  videoId: string;
}

interface IComment {
  _id: string;
  createdBy: {
    username: string;
    avatar: string;
    fullname: string;
  };
  updatedAt: Date;
  content: string;
  data: {
    count: number;
  };
}

const CommentSection = ({ videoId }: CommentSectionProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [enteredComment, setEnteredComment] = useState("");
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [comments, setComments] = useState<IComment[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    isFetching: isCommentsFetching,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useGetVideoCommentsQuery(
    {
      videoId,
      page,
      limit: 9,
    },
    {
      skip: !videoId,
    }
  );

  const { data: loggedInUser } = useGetCurrentUserQuery(null);

  const [addComment, { isLoading: isAddingComment }] = useAddCommentMutation();

  const handleCancel = () => {
    setEnteredComment("");
    setIsFocused(false);
  };

  const handleCommentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnteredComment(e.target.value);
  };

  const handleAddComment = async () => {
    try {
      if (enteredComment.trim()) {
        await addComment({ videoId, comment: enteredComment });
        setEnteredComment("");
        setIsFocused(false);
        toast.success("comment added");
        refetchComments();
      }
    } catch (error) {
      console.log("error: ", error);
      setEnteredComment("");
      setIsFocused(false);
      toast.error("Failed to add comment");
    }
  };

  useEffect(() => {
    if (data?.data?.totalComments) {
      setComments((prev) => {
        const existingIds = new Set(prev.map((c) => c._id));
        const newComments = data.data.totalComments.filter(
          (c: IComment) => !existingIds.has(c._id)
        );
        return [...prev, ...newComments];
      });
      setHasMore(page < data.data.totalPages);
    } else if (data?.data?.totalPages === 0) {
      setHasMore(false);
    }
  }, [data, page]);

  useEffect(() => {
    const scrollContainer = document.getElementById("scroll-container");
    if (!scrollContainer || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isCommentsFetching) {
          setPage((prev) => prev + 1);
        }
      },
      {
        root: scrollContainer,
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
  }, [hasMore, isCommentsFetching]);

  const renderedComments = useMemo(
    () =>
      comments?.map((comment) => (
        <CommentItems
          key={comment._id}
          _id={comment._id}
          createdBy={comment.createdBy}
          content={comment.content}
          updatedAt={comment.updatedAt}
          hoveredCommentId={hoveredCommentId}
          setHoveredCommentId={setHoveredCommentId}
        />
      )),
    [comments, hoveredCommentId]
  );

  const noCommentsFound = !isCommentsFetching && comments.length === 0;

  return (
    <div className="pt-4">
      <h2 className="text-lg font-semibold">
        {isCommentsLoading ? (
          <>
            <Skeleton className="h-8 w-40 mt-2" />
          </>
        ) : (
          <>{data?.data?.totalDocs || 0} Comments</>
        )}
      </h2>

      {isCommentsLoading ? (
        <></>
      ) : (
        <div className="flex gap-4 pt-8">
          <img
            src={loggedInUser?.data?.avatar}
            alt={loggedInUser?.data?.fullName}
            className="object-cover object-center rounded-full size-12"
            loading="lazy"
          />
          <input
            type="text"
            className="w-full h-5 pb-1 bg-transparent border-b-2 focus:border-b-2 focus:border-gray-100 focus:outline-none field-sizing-content"
            placeholder="Add a comment..."
            value={enteredComment}
            onFocus={() => setIsFocused(true)}
            onChange={handleCommentInput}
          />
        </div>
      )}

      {isFocused && (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            className="px-4 text-sm rounded-3xl dark:hover:bg-neutral-800"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant={enteredComment.trim() === "" ? "disabled" : "ghost"}
            className={`px-4 rounded-3xl text-sm ${
              enteredComment.trim() === ""
                ? "text-gray-500"
                : "dark:bg-[#3ea6ff] text-black dark:hover:dark:bg-[#3ea5ffdd]"
            }`}
            onClick={handleAddComment}
            disabled={enteredComment.trim() === "" || isAddingComment}
          >
            Comment
          </Button>
        </div>
      )}

      {noCommentsFound ? (
        <div className="flex items-center justify-center">
          <p className="text-2xl">No comments found</p>
        </div>
      ) : (
        <>
          {isCommentsLoading && (
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <CommentItemShimmer key={i} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="">{renderedComments}</div>

      <div
        ref={loaderRef}
        className={`h-10 ${noCommentsFound ? "hidden" : ""}`}
        key="loader"
      />

      {isCommentsFetching && (
        <div className="flex items-center justify-center py-4">
          <div className="w-8 h-8 border-4 border-secondary-marginal-text rounded-full border-t-transparent animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default CommentSection;
