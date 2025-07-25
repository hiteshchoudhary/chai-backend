import { ArrowLeft, Bell, Menu, Mic, Search, Upload } from "lucide-react";
import logo from "../assets/Logo.jpg";
import { Button } from "../components/Button";
import { useState } from "react";
import { useSideBarContext } from "../contexts/SideBarContext";
import ThemeToggle from "@/components/ThemeToggle";
import UserDropdownMenu from "@/components/dropdowns/UserDropdownMenu";
import { useAppSelector } from "@/app/hooks";

function PageHeader() {
  const [showFullWidthSearch, setShowFullWidthSearch] = useState(false); // this is for small screen sizes

  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="flex gap-10 lg:gap-20 justify-between pt-2 mb-6 mx-4">
      <PageHeaderFirstSection hidden={showFullWidthSearch} />

      <form
        className={`${
          showFullWidthSearch ? "flex" : "hidden md:flex"
        } gap-4 flex-grow justify-center`}
      >
        {showFullWidthSearch && (
          <Button
            onClick={() => setShowFullWidthSearch(false)}
            type="button"
            size="icon"
            variant="ghost"
            className="flex-shrink-0"
          >
            <ArrowLeft />
          </Button>
        )}
        <div className="flex flex-grow max-w-[600px]">
          <input
            type="search"
            placeholder="Search"
            className="rounded-l-full border border-secondary-marginal-border shadow-inner py-1 px-4 text-base w-full focus:border-blue-500 outline-none dark:bg-[#121212]"
          />
          <Button className="py-2 px-4 rounded-r-full border-secondary-marginal-border border border-l-0 flex-shrink-0">
            <Search />
          </Button>
        </div>
        <Button type="button" size="icon" className="flex-shrink-0">
          <Mic />
        </Button>
      </form>

      <div
        className={`${
          showFullWidthSearch ? "hidden" : "flex"
        } flex-shrink-0 md:gap-2`}
      >
        <Button
          onClick={() => setShowFullWidthSearch(true)}
          size="icon"
          variant="ghost"
          className="md:hidden"
        >
          <Search />
        </Button>
        <Button size="icon" variant="ghost" className="md:hidden">
          <Mic />
        </Button>

        <ThemeToggle />

        <Button size="icon" variant="ghost">
          <Upload />
        </Button>
        <Button size="icon" variant="ghost">
          <Bell />
        </Button>

        <UserDropdownMenu user={user} />
      </div>
    </div>
  );
}

export default PageHeader;

type PageHeaderFirstSectionProps = {
  hidden?: boolean;
};

export function PageHeaderFirstSection({
  hidden = false,
}: PageHeaderFirstSectionProps) {
  const { toggle } = useSideBarContext();

  return (
    <div
      className={`${
        hidden ? "hidden" : "flex"
      } gap-4 items-center flex-shrink-0`}
    >
      <Button onClick={toggle} variant="ghost" size="icon">
        <Menu />
      </Button>
      <a href="/">
        <img src={logo} className="h-6" />
      </a>
    </div>
  );
}
