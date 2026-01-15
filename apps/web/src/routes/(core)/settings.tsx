import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SessionsManager } from "@/components/sessions-manager";
import z from "zod";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileManager } from "@/components/profile-manager";

export const Route = createFileRoute("/(core)/settings")({
  validateSearch: z.object({
    tabs: z.enum(["profile", "sessions"]).default("profile"),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { tabs } = Route.useSearch();
  const navigation = Route.useNavigate();
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-4xl">
      {/* Back button */}
      <Button
        variant="ghost"
        className="text-sm"
        onClick={() => router.history.back()}
      >
        <IconArrowLeft className="mr-2 h-4 w-4" />
        Kembali
      </Button>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#4D4D4D]">Pengaturan</h1>
        <p className="mt-2 text-[16px] text-[#64748B]">
          Kelola pengaturan akun dan preferensi Anda di sini.
        </p>
      </div>

      <Tabs
        defaultValue={tabs}
        onValueChange={(value) => {
          navigation({
            search: (old) => ({
              ...old,
              tabs: value as "profile" | "sessions",
            }),
          });
        }}
      >
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="sessions">Sesi</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileManager />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
