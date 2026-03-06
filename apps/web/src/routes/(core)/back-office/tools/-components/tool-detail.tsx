import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  SkeletonInput,
  SkeletonTextArea,
} from "@/components/ui/skeleton-generator";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlertCircle } from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import {
  TOOLS_AVAILABILITY_COLORS,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS_COLORS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import { cn } from "@/lib/utils";

interface ToolDetailProps {
  toolId: string;
}

export default function ToolDetail({ toolId }: ToolDetailProps) {
  const router = useRouter();

  const { data: tool, isLoading } = useQuery(
    trpc.pengujian.tool.getToolDetails.queryOptions({
      id: toolId,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Alat</CardTitle>
            <CardDescription>
              Lihat detail informasi alat Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex flex-col gap-7">
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonTextArea />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonTextArea />
                <SkeletonInput />
                <SkeletonInput />
                <SkeletonTextArea />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tool) {
    return (
      <EmptyState
        icon={IconAlertCircle}
        title="Alat Tidak Ditemukan"
        description="Maaf, alat yang Anda cari tidak ditemukan. Silakan periksa kembali ID alat atau kembali ke daftar alat."
        actions={[
          {
            label: "Kembali ke Daftar Alat",
            onClick: () => router.history.back(),
          },
        ]}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-row justify-between px-6">
          <div className="flex flex-col gap-1">
            <CardTitle>Detail Alat</CardTitle>
            <CardDescription>
              Lihat detail informasi alat Anda di sini.
            </CardDescription>
          </div>
          <div className="flex flex-row gap-4">
            <div className="space-y-1">
              <Label className="text-sm">Kondisi</Label>
              <Badge className={cn(TOOLS_CONDITIONS_COLORS[tool.condition])}>
                {TOOLS_CONDITIONS_LABELS[tool.condition]}
              </Badge>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Ketersediaan</Label>
              <Badge
                className={cn(TOOLS_AVAILABILITY_COLORS[tool.availability])}
              >
                {TOOLS_AVAILABILITY_LABELS[tool.availability]}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col gap-7">
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Nama Alat</Label>
                <span className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.toolName}
                </span>
              </div>
              <div className="flex flex-row gap-4 space-y-1">
                <div className="w-full space-y-1">
                  <Label className="ml-1 text-sm font-bold">Kode Alat</Label>
                  <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                    {tool.toolCode?.code || "-"}
                  </div>
                </div>
                <div className="w-full space-y-1">
                  <Label className="ml-1 text-sm font-bold">
                    Kode Unik Alat
                  </Label>
                  <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                    {tool.toolUniqueCode || "-"}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Fungsi Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm whitespace-pre-wrap shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.function || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Lokasi Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.location || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Rak Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.shelf || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Nomor BMN</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.BMNnumber || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Nomor NUP</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.NUPnumber || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Brand Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.brand || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Tipe Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.type || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Serial Number Alat
                </Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.serialNumber || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Asal Perolehan Alat
                </Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.originOfAcquisition || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Koreksi Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.correction || "-"}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Kondisi Alat</Label>
                <Badge className={cn(TOOLS_CONDITIONS_COLORS[tool.condition])}>
                  {TOOLS_CONDITIONS_LABELS[tool.condition]}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">
                  Ketersediaan Alat
                </Label>
                <Badge
                  className={cn(TOOLS_AVAILABILITY_COLORS[tool.availability])}
                >
                  {TOOLS_AVAILABILITY_LABELS[tool.availability]}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="ml-1 text-sm font-bold">Informasi Alat</Label>
                <div className="block w-full rounded-md border border-input bg-muted px-3 py-2 text-sm shadow-sm disabled:cursor-not-allowed disabled:opacity-50">
                  {tool.information || "-"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
