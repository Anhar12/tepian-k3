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
import type { UserCompanyTestingLocation } from "@tepian-k3/types/user-company-testing-location.types";
import { format } from "date-fns";
import {
  ArchiveRestore,
  Building2,
  Calendar,
  Edit2,
  LoaderCircle,
  MapPin,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Route } from "../$companyId.detail";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";

interface TestingLocationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  testingLocation: UserCompanyTestingLocation;
}

export default function TestingLocationCard({
  testingLocation,
  ...props
}: TestingLocationCardProps) {
  const { showDeleted } = Route.useSearch();

  const setEditingTestingLocationId = useTestingLocationDialogStore(
    (state) => state.setEditingTestingLocationId,
  );
  const setIsEditDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsEditDialogOpen,
  );

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const isDeleted = testingLocation.deletedAt !== null;

  const deleteTestingLocationMutation = useMutation(
    trpc.userCompanyTestingLocation.userDeleteUserCompanyTestingLocation.mutationOptions(
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
              {
                companyId: testingLocation.userCompanyId,
                showDeleted: showDeleted ?? false,
              },
            ),
          );

          globalSuccessToast("Lokasi pengujian berhasil dihapus.");
          setOpenDeleteDialog(false);
        },
        onError: (error) => {
          globalErrorToast(
            "Gagal menghapus lokasi pengujian: " + error.message,
          );
        },
      },
    ),
  );

  const restoreTestingLocationMutation = useMutation(
    trpc.userCompanyTestingLocation.userRestoreUserCompanyTestingLocation.mutationOptions(
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries(
            trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
              {
                companyId: testingLocation.userCompanyId,
                showDeleted: showDeleted ?? false,
              },
            ),
          );
          globalSuccessToast("Lokasi pengujian berhasil dipulihkan.");
        },
        onError: (error) => {
          globalErrorToast(
            "Gagal memulihkan lokasi pengujian: " + error.message,
          );
        },
      },
    ),
  );

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-md ${isDeleted ? "opacity-60" : ""}`}
      {...props}
    >
      <div className="p-4">
        {/* Header with title and actions */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-foreground">
                {testingLocation.name}
              </h2>
              {isDeleted && (
                <span className="inline-block rounded bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                  Deleted
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!isDeleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  queryClient.prefetchQuery(
                    trpc.userCompanyTestingLocation.getUserCompanyTestingLocationById.queryOptions(
                      {
                        id: testingLocation.id,
                      },
                    ),
                  );
                  setEditingTestingLocationId(testingLocation.id);
                  setIsEditDialogOpen(true);
                }}
                className="h-8 w-8 p-0"
                title="Edit location"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}

            {isDeleted ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-foreground hover:text-foreground"
                title="Restore location"
                onClick={() =>
                  restoreTestingLocationMutation.mutate({
                    id: testingLocation.id,
                  })
                }
              >
                {restoreTestingLocationMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ArchiveRestore className="h-4 w-4" />
                )}
              </Button>
            ) : (
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
                      Apakah Anda yakin ingin menghapus lokasi pengujian ini?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Lokasi pengujian yang
                      dihapus akan dipindahkan ke status "Deleted".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={() =>
                        deleteTestingLocationMutation.mutate({
                          id: testingLocation.id,
                        })
                      }
                      disabled={deleteTestingLocationMutation.isPending}
                    >
                      {deleteTestingLocationMutation.isPending && (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Compact location info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs text-foreground">
              {testingLocation.district.name}, {testingLocation.regency.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate font-mono text-xs text-foreground">
              {testingLocation.userCompany.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="truncate text-xs text-muted-foreground">
              {format(new Date(testingLocation.createdAt), "dd MMMM yyyy")}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
