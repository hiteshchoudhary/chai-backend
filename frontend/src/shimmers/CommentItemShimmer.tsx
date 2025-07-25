import { Skeleton } from "@/components/ui/skeleton";

const CommentItemShimmer = () => {
  return (
    <div className="flex w-full gap-4 mt-8">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-col grow relative">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-[250px]" />
        </div>

        <Skeleton className="h-4 w-[95%] mt-2" />
        <Skeleton className="h-4 w-[95%] mt-2" />

        <div className="flex">
          <Skeleton className="h-4 w-16 mt-2" />
          <Skeleton className="h-4 w-14 mt-2  ml-2" />
        </div>
      </div>
    </div>
  );
};

export default CommentItemShimmer;
