import CartSheet from "@/components/cart-sheet";
import PengujianNavbar from "@/components/pengujian-navbar";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/pengujian")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-screen overflow-scroll bg-primary-foreground">
      <div className="relative z-10">
        <PengujianNavbar />

        <div className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          <Outlet />
        </div>
      </div>
      <CartSheet />
    </div>
  );
}
