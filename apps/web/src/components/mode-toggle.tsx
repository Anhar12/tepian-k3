import { Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

export function ModeToggle() {
  const [isOpen, setIsOpen] = useState(false);

  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex flex-row items-center justify-center gap-2">
        {theme === "light" ? <Sun /> : <Moon />}
        <span className="sr-only">Toggle theme</span>
        Ganti Tema
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setTheme("light");
            setIsOpen(false);
          }}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("dark");
            setIsOpen(false);
          }}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("system");
            setIsOpen(false);
          }}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
