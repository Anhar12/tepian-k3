import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authMeQueryOptions } from "@/utils/auth-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import ImageWithFallback from "./image-with-fallback";
import NavbarDropdown from "./navbar-dropdown";
import NavbarNotifications from "./navbar-notifications";

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
  const { data: user } = useSuspenseQuery(authMeQueryOptions());
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 mx-auto flex h-16 max-h-16 min-h-16 w-full items-center justify-between bg-white/80 px-4 backdrop-blur-sm md:px-5 dark:bg-neutral-950/80">
      {/* Logo */}
      <a href="/" className="text-xl font-bold text-primary">
        <ImageWithFallback
          src="/assets/logo-tepiank3.webp"
          alt="Tepian K3 Logo"
          className="w-32 object-contain sm:w-44"
        />
      </a>

      {/* Desktop Navigation */}
      <div className="hidden items-center gap-4 md:flex">
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

      {/* Desktop User Section */}
      {user ? (
        <div className="hidden flex-row gap-10 md:flex">
          <NavbarNotifications />
          <NavbarDropdown />
        </div>
      ) : (
        <div className="hidden items-center gap-4 md:flex">
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

      {/* Mobile Menu */}
      <div className="flex items-center gap-2 md:hidden">
        {user && <NavbarNotifications />}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-72 flex-col">
            <SheetHeader className="text-left">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            {/* Navigation Links */}
            <nav className="mt-6 flex flex-1 flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Footer - User Section */}
            <div className="border-t pt-4">
              {user ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <NavbarDropdown />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {user.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <a
                    href="/login"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-input bg-background text-sm font-medium transition-colors hover:bg-muted"
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    onClick={() => setOpen(false)}
                  >
                    Sign Up
                  </a>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
