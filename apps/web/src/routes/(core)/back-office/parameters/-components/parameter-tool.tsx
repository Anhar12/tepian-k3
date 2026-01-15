import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { IconTools } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import ParameterToolCard from "./parameter-tool-card";
import { useParameterToolDialogStore } from "@/stores/parameter-tool-dialog.stores";
import { SkeletonCard } from "@/components/ui/skeleton-generator";
import { EmptyState } from "@/components/ui/empty-state";

interface ParameterToolsProps {
  parameterId: string;
}

export default function ParameterTools({ parameterId }: ParameterToolsProps) {
  const { data: tools, isLoading } = useQuery(
    trpc.parameterTool.getAllParameterToolsByParameterId.queryOptions({
      parameterId,
    }),
  );

  const setIsCreateDialogOpen = useParameterToolDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-row items-center justify-between gap-2 px-6">
          <div className="flex flex-col space-y-2">
            <CardTitle>Daftar Alat Terkait Parameter</CardTitle>
            <CardDescription>
              Kelola alat-alat yang terkait dengan parameter di sini.
            </CardDescription>
          </div>
        </div>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            disabled={isLoading}
          >
            Tambah Alat
          </Button>
          {isLoading ? (
            <div className="flex flex-row flex-wrap gap-4">
              {[...Array(3)].map((_, index) => (
                <SkeletonCard className="w-60" key={index} />
              ))}
            </div>
          ) : tools && tools.length === 0 ? (
            <EmptyState
              icon={<IconTools />}
              title="Belum ada alat yang terkait dengan parameter ini."
              description="Alat yang Anda buat akan ditampilkan di sini."
            />
          ) : (
            <div className="flex flex-row flex-wrap gap-4">
              {tools?.map((paramTool) => (
                <ParameterToolCard
                  key={paramTool.id}
                  parameterTool={paramTool}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
