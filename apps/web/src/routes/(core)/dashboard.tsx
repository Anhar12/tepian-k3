import { Button } from "@/components/ui/button";
import { globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/(core)/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  async function handleLogout() {
    localStorage.removeItem("token");

    globalSuccessToast("Logout berhasil");

    await queryClient.refetchQueries(trpc.auth.me.queryFilter());

    navigate({ to: "/login" });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Button onClick={handleLogout}>Logout</Button>
    </div>
  );
}
