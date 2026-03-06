import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonCard } from "@/components/ui/skeleton-generator";
import { trpc } from "@/utils/trpc";
import { IconFlask } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import ParameterChemicalCard from "./parameter-chemical-card";
import CreateParameterChemicalDialog from "./create-parameter-chemical-dialog";
import useDialogs from "@/hooks/use-dialog";

interface ParameterChecmicalProps {
  parameterId: string;
}

export default function ParameterChemical({
  parameterId,
}: ParameterChecmicalProps) {
  const dialogs = useDialogs({
    create: null,
  });

  const { data: chemicals, isLoading } = useQuery(
    trpc.pengujian.parameterChemicalMaterial.getAllChemicalMaterialsByParameterId.queryOptions(
      {
        parameterId,
      },
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-row items-center justify-between gap-2 px-6">
          <div className="flex flex-col space-y-2">
            <CardTitle>Daftar Bahan Kimia Terkait Parameter</CardTitle>
            <CardDescription>
              Kelola bahan kimia yang terkait dengan parameter di sini.
            </CardDescription>
          </div>
        </div>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={() => dialogs.open("create")} disabled={isLoading}>
            Tambah Bahan Kimia
          </Button>
          {isLoading ? (
            <div className="flex flex-row flex-wrap gap-4">
              {[...Array(3)].map((_, index) => (
                <SkeletonCard className="w-60" key={index} />
              ))}
            </div>
          ) : chemicals && chemicals.length === 0 ? (
            <EmptyState
              icon={<IconFlask />}
              title="Belum ada bahan kimia yang terkait dengan parameter ini."
              description="Bahan kimia yang Anda buat akan ditampilkan di sini."
            />
          ) : (
            <div className="flex flex-row flex-wrap gap-4">
              {chemicals?.map((paramChemical) => (
                <ParameterChemicalCard
                  key={paramChemical.id}
                  parameterChemical={paramChemical}
                />
              ))}
            </div>
          )}
        </CardContent>
        <CreateParameterChemicalDialog
          parameterId={parameterId}
          isOpen={dialogs.isOpen("create")}
          setIsOpen={(open) =>
            open ? dialogs.open("create") : dialogs.close("create")
          }
        />
      </Card>
    </div>
  );
}
