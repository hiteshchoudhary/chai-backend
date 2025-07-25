import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IUser } from "@/types";
import { Button } from "../Button";
import { LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/app/hooks";
import { useLogoutMutation } from "@/slices/usersApiSlice";
import { logoutUser } from "@/slices/authSlice";
import { toast } from "react-toastify";

interface UserDropdownMenuProps {
  user: IUser | null;
}

const UserDropdownMenu = ({ user }: UserDropdownMenuProps) => {
  const dipatch = useAppDispatch();
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dipatch(logoutUser("User logged out successfully"));
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <User />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-72 mx-5 bg-secondary-marginal-dark">
        <DropdownMenuGroup>
          <Link to={""} className="flex items-center justify-start gap-2 p-4">
            <img
              src={user?.avatar}
              alt={user?.fullname}
              className="object-cover object-center size-11 rounded-full"
              loading="lazy"
            />
            <div className="flex flex-col ml-2">
              <p className="text-md font-semibold mb-1">{user?.fullname}</p>
              <p className="text-sm text-secondary-marginal-text">
                {user?.username}
              </p>
            </div>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-zinc-500" />

        <DropdownMenuItem className="">
          <Button
            onClick={handleLogout}
            className="w-full flex"
            variant="ghost"
          >
            <LogOut className="w-6 h-6 mr-5" />
            <span className="text-[1rem]">Log out</span>
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdownMenu;
