import { useSideBarContext } from "@/contexts/SideBarContext";
import { PageHeaderFirstSection } from "./PageHeader";
import { LargeSidebarItem, LargeSidebarSection } from "./SideBar";
import {
  Clapperboard,
  Clock,
  Home,
  PlaySquare,
  History,
  ListVideo,
  Flame,
  ShoppingBag,
  Music2,
  Film,
  Radio,
  Gamepad2,
  Newspaper,
  Trophy,
  Lightbulb,
  Shirt,
  Podcast,
} from "lucide-react";
import { subscriptions } from "@/data/SideBar";
import { BiLike } from "react-icons/bi";

const VideoSideBar = () => {
  const { isLargeOpen, isSmallOpen, close } = useSideBarContext();

  return (
    <>
      {isSmallOpen && (
        <div
          onClick={close}
          className="lg:hidden fixed inset-0 z-[999] bg-secondary-marginal-dark opacity-50"
        ></div>
      )}
      {isLargeOpen && (
        <div
          onClick={close}
          className="lg:flex hidden fixed inset-0 z-[999] bg-secondary-marginal-dark opacity-50"
        ></div>
      )}

      <aside
        className={`w-56 absolute top-0 overflow-y-auto scrollbar-hidden pb-4 flex-col gap-2 px-2  z-[999] bg-white dark:bg-[#0F0F0F] max-h-screen ${
          isLargeOpen ? "lg:flex" : "lg:hidden flex"
        } ${isSmallOpen ? "flex" : "hidden"}`}
      >
        <div className="pt-2 pb-4 px-2 sticky top-0 bg-white dark:bg-[#0F0F0F]">
          <PageHeaderFirstSection />
        </div>
        <LargeSidebarSection>
          <LargeSidebarItem isActive IconOrImgUrl={Home} title="Home" url="/" />
          <LargeSidebarItem
            IconOrImgUrl={Clapperboard}
            title="Subscriptions"
            url="/subscriptions"
          />
        </LargeSidebarSection>
        <hr />
        <LargeSidebarSection visibleItemCount={5}>
          <LargeSidebarItem
            IconOrImgUrl={History}
            title="History"
            url="/history"
          />
          <LargeSidebarItem
            IconOrImgUrl={ListVideo}
            title="Playlists"
            url={`/feed/playlists`}
          />
          <LargeSidebarItem
            IconOrImgUrl={PlaySquare}
            title="Your Videos"
            url="/your-videos"
          />
          <LargeSidebarItem
            IconOrImgUrl={Clock}
            title="Watch Later"
            url="/playlist?list=WL"
          />
          <LargeSidebarItem
            IconOrImgUrl={BiLike}
            title="Liked videos"
            url="/playlist?list=LL"
          />
        </LargeSidebarSection>
        <hr />
        <LargeSidebarSection title="Subscriptions">
          {subscriptions.map((subscription) => (
            <LargeSidebarItem
              key={subscription.id}
              IconOrImgUrl={subscription.imgUrl}
              title={subscription.channelName}
              url={`/@${subscription.id}`}
            />
          ))}
        </LargeSidebarSection>
        <hr />
        <LargeSidebarSection title="Explore">
          <LargeSidebarItem
            IconOrImgUrl={Flame}
            title="Trending"
            url="/trending"
          />
          <LargeSidebarItem
            IconOrImgUrl={ShoppingBag}
            title="Shopping"
            url="/shopping"
          />
          <LargeSidebarItem IconOrImgUrl={Music2} title="Music" url="/music" />
          <LargeSidebarItem
            IconOrImgUrl={Film}
            title="Movies & TV"
            url="/movies-tv"
          />
          <LargeSidebarItem IconOrImgUrl={Radio} title="Live" url="/live" />
          <LargeSidebarItem
            IconOrImgUrl={Gamepad2}
            title="Gaming"
            url="/gaming"
          />
          <LargeSidebarItem IconOrImgUrl={Newspaper} title="News" url="/news" />
          <LargeSidebarItem
            IconOrImgUrl={Trophy}
            title="Sports"
            url="/sports"
          />
          <LargeSidebarItem
            IconOrImgUrl={Lightbulb}
            title="Learning"
            url="/learning"
          />
          <LargeSidebarItem
            IconOrImgUrl={Shirt}
            title="Fashion & Beauty"
            url="/fashion-beauty"
          />
          <LargeSidebarItem
            IconOrImgUrl={Podcast}
            title="Podcasts"
            url="/podcasts"
          />
        </LargeSidebarSection>
      </aside>
    </>
  );
};

export default VideoSideBar;
