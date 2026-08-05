import { LayoutGrid, LogOut, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authMeQueryOptions } from "@/utils/auth-query";
import { logout } from "@/lib/logout";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";

export default function MainHeader() {
  const navigate = useNavigate();
  const { data: user } = useQuery(authMeQueryOptions());

  const roleNames = user?.roles?.map((role) => role.name) ?? [];
  const canAccessBackOffice =
    roleNames.some((name) =>
      (BACK_OFFICE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) =>
      (EMPLOYEE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) => name !== "user");

  function handleLogout() {
    logout();
  }

  return (
    <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-950/80">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div>
          <h1 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back!</p>
        </div>

        {/* Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user?.profilePictureUrl || undefined}
                  alt={user?.name || "User"}
                />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canAccessBackOffice && (
              <DropdownMenuItem
                onClick={() => navigate({ to: "/back-office" })}
              >
                <LayoutGrid className="mr-2 h-4 w-4" />
                <span>Backoffice</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
