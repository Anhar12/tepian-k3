import { trpc } from "@/utils/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate, type LinkProps } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  IconHome,
  IconLogout,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react";
import { ModeToggle } from "./mode-toggle";
import { logout } from "@/lib/logout";
import NavbarDropdown from "./navbar-dropdown";

const navItems: {
  label: string;
  href: string | LinkProps["to"];
}[] = [
  { label: "Beranda", href: "/" },
  { label: "Katalog", href: "/katalog" },
  { label: "FAQ", href: "/#faq" },
  { label: "PPID", href: "#" },
];

export default function Navbar() {
  const navigate = useNavigate();

  const { data: user } = useSuspenseQuery(trpc.auth.me.queryOptions());

  function onLogout() {
    logout();
  }

  return (
    <nav className="sticky top-0 z-50 mx-auto flex h-16 max-h-16 min-h-16 w-full items-center justify-between bg-white/80 px-5 backdrop-blur-sm dark:bg-neutral-950/80">
      <a href="/" className="text-xl font-bold text-primary">
        {/* image */}
        <img
          src="/assets/logo-tepiank3.png"
          alt="Tepian K3 Logo"
          className="w-44 object-contain"
        />
      </a>
      <div className="flex items-center gap-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="text-lg font-medium text-primary hover:cursor-pointer hover:underline"
          >
            {item.label}
          </Link>
        ))}
      </div>
      {user ? (
        <div className="flex flex-row gap-10">
          <div className="flex flex-row gap-4">
            <Button className="relative flex size-9 items-center justify-center rounded-full">
              <div className="absolute top-0 -right-0.5 flex size-3 items-center justify-center rounded-full bg-orange-500 text-xs" />
              <Bell className="size-5" />
            </Button>
          </div>
          <NavbarDropdown />
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Login
          </a>
          <a
            href="/register"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign Up
          </a>
        </div>
      )}
    </nav>
  );
}
