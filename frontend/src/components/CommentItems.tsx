import { EllipsisVertical, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "./Button";
import { formatTimeAgo } from "@/utils/FormatTimeAgo";

interface CommentItemsProps {
  _id: string;
  createdBy: {
    username: string;
    avatar: string;
    fullname: string;
  };
  content: string;
  updatedAt: Date | string;
  hoveredCommentId: string | null;
  setHoveredCommentId: (_id: string | null) => void;
}

const CommentItems = ({
  _id,
  createdBy,
  content,
  updatedAt,
  hoveredCommentId,
  setHoveredCommentId,
}: CommentItemsProps) => {
  return (
    <div
      onMouseEnter={() => setHoveredCommentId(_id)}
      onMouseLeave={() => setHoveredCommentId(null)}
      className="flex w-full gap-4 mt-8 mb-8"
    >
      <img
        src={createdBy.avatar}
        alt={createdBy.fullname}
        className="object-cover object-center rounded-full size-12"
        loading="lazy"
      />
      <div className="flex flex-col grow relative">
        <div className="flex gap-2 items-center">
          <p className="font-semibold">{createdBy.username}</p>
          <p className="text-sm text-center text-gray-500 hover:text-gray-300 cursor-pointer">
            {formatTimeAgo(new Date(updatedAt))}
          </p>
          <div className={`flex self-center ml-auto absolute right-2 top-4`}>
            <Button variant="ghost" size="icon">
              <EllipsisVertical size={20} className="cursor-pointer" />
            </Button>
          </div>
        </div>

        <p className="w-[95%]">{content}</p>

        <div className="flex">
          <Button variant="ghost" size="icon" className="justify-normal">
            <ThumbsUp size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="justify-normal">
            <ThumbsDown size={16} />
          </Button>

          <button className="pl-4 text-xs">Reply</button>
        </div>
      </div>
    </div>
  );
};

export default CommentItems;
