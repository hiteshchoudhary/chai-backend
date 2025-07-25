function VideoCardShimmer() {
  return (
    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(350px,1fr))]">
      <div className="flex flex-col gap-3 mb-9 animate-pulse">
        <div className="relative h-full w-full bg-secondary-marginal-text rounded-xl aspect-video">
          {/* <div className="absolute bottom-1 right-1 bg-secondary-marginal-dark text-white text-sm px-1 py-0.5 rounded"></div> */}
        </div>

        <div className="flex gap-2">
          <div className="rounded-full size-10 bg-secondary-marginal-text"></div>
          <div className="flex flex-col w-[80%] gap-3">
            <div className="h-5 rounded-sm w-72 bg-secondary-marginal-text"></div>

            <div className="h-4 rounded-sm bg-secondary-marginal-text w-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCardShimmer;
