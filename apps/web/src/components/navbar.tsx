import { ShoppingCart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500">
              <span className="text-xl font-bold text-white">T</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-black tracking-tighter text-[#0056B3]">
                TEPIAN K3
              </span>
              <span className="text-[10px] font-medium text-slate-500">
                Sistem Pelayanan Pengujian dan Pelatihan K3
              </span>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {["Beranda", "Transaksi", "FAQ", "PPID"].map((item) => (
              <a
                key={item}
                href="#"
                className={`text-sm font-semibold ${item === "Beranda" ? "text-[#0056B3]" : "text-slate-500 hover:text-[#0056B3]"} transition-colors`}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#0056B3] hover:bg-blue-50"
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-[10px] font-bold text-white">
              1
            </span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative text-[#0056B3] hover:bg-blue-50"
          >
            <Bell className="h-6 w-6" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-orange-500 text-[10px] font-bold text-white">
              1
            </span>
          </Button>
          <div className="h-10 w-10 cursor-pointer overflow-hidden rounded-full border-2 border-slate-200 transition-colors hover:border-blue-400">
            <img
              src="/diverse-user-avatars.png"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
