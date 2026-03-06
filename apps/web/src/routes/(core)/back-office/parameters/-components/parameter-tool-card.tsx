import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar, LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ParameterTools } from "@tepian-k3/types/pengujian/parameter-tool.types";
import { IconTools } from "@tabler/icons-react";

interface ParameterToolCardProps extends React.HTMLAttributes<HTMLDivElement> {
  parameterTool: ParameterTools;
}

export default function ParameterToolCard({
  parameterTool,
  ...props
}: ParameterToolCardProps) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const deleteParameterToolMutation = useMutation(
    trpc.pengujian.parameterTool.deleteParameterTool.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pengujian.parameterTool.getAllParameterToolsByParameterId.queryOptions(
            {
              parameterId: parameterTool.parameterId,
            },
          ),
        );

        globalSuccessToast("Alat berhasil dihapus dari parameter.");
        setOpenDeleteDialog(false);
      },
      onError: (error) => {
        globalErrorToast(
          "Gagal menghapus alat dari parameter: " + error.message,
        );
      },
    }),
  );

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md`}
      {...props}
    >
      <div className="p-4">
        {/* Header with title and actions */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {parameterTool.tool.toolName} - (
                {parameterTool.tool.toolCode.code})
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <AlertDialog
              open={openDeleteDialog}
              onOpenChange={setOpenDeleteDialog}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete location"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Apakah Anda yakin ingin menghapus alat parameter ini?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini tidak dapat dibatalkan. Alat parameter yang
                    dihapus akan hilang dari sistem.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() =>
                      deleteParameterToolMutation.mutate({
                        id: parameterTool.id,
                      })
                    }
                    disabled={deleteParameterToolMutation.isPending}
                  >
                    {deleteParameterToolMutation.isPending && (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconTools className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs text-foreground">
              {parameterTool.tool.toolCode.code} - {parameterTool.tool.toolName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs text-muted-foreground">
              {format(new Date(parameterTool.createdAt), "dd MMMM yyyy")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
