import {
  IconHome,
  IconLogout,
  IconSettings,
  IconLayoutGrid,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authMeQueryOptions } from "@/utils/auth-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ModeToggle } from "./mode-toggle";
import { logout } from "@/lib/logout";
import { BACK_OFFICE_ROLES, EMPLOYEE_ROLES } from "@tepian-k3/constants";

export default function NavbarDropdown() {
  const navigate = useNavigate();

  const { data: user } = useSuspenseQuery(authMeQueryOptions());

  const roleNames = user?.roles?.map((role) => role.name) ?? [];
  const canAccessBackOffice =
    roleNames.some((name) =>
      (BACK_OFFICE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) =>
      (EMPLOYEE_ROLES as readonly string[]).includes(name),
    ) ||
    roleNames.some((name) => name !== "user");

  function onLogout() {
    logout();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="size-9 rounded-full">
          <AvatarImage
            src={user?.profilePictureUrl || undefined}
            alt={user?.name || ""}
          />
          <AvatarFallback className="rounded-lg">
            {user?.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={user?.profilePictureUrl || undefined}
                alt={user?.name || ""}
              />
              <AvatarFallback className="rounded-lg">
                {user?.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {canAccessBackOffice && (
            <DropdownMenuItem onSelect={() => navigate({ to: "/back-office" })}>
              <IconLayoutGrid />
              Backoffice
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => navigate({ to: "/dashboard" })}>
            <IconHome />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem>
            <ModeToggle />
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
            <IconSettings />
            Pengaturan
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <IconLogout />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
