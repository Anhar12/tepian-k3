import { useState } from "react";
import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Resource } from "@tepian-k3/constants";
import { trpc } from "@/utils/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useOptimisticMutation } from "@/lib/optimistic-update";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { ArchiveRestore, Eye, LoaderCircle, Pencil, Trash, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CustomAction } from "./data-table-action-cell";

interface TRPCMutationLike<TInput> {
  mutationOptions: (
    opts?: Record<string, unknown>,
  ) => Pick<
    UseMutationOptions<unknown, Error, TInput>,
    "mutationFn" | "mutationKey"
  >;
}

const noOpMutation: TRPCMutationLike<{ id: string }> = {
  mutationOptions: () => ({
    mutationKey: ["__noop__"],
    mutationFn: async () => {},
  }),
};

export interface CrudActionCellConfig<T, TParams> {
  resourceName: string;
  nestedPathRoute?: string;
  resourcePath: string;
  permissionPrefix: Resource;
  deleteMutation?: TRPCMutationLike<{ id: string }>;
  restoreMutation?: TRPCMutationLike<{ id: string }>;
  hardDeleteMutation?: TRPCMutationLike<{ id: string }>;
  getQueryOptions: (params: TParams) => { queryKey: QueryKey };
  useSearchParams: () => TParams;
  showDetail?: boolean;
  onHoverEdit?: (id: string) => void;
  onHoverDetail?: (id: string) => void;
  customActions?: (row: T) => CustomAction[];
  editModal?: (props: { row: T; open: boolean; onOpenChange: (open: boolean) => void }) => React.ReactNode;
}

export function useCrudRowActions<T>() {
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const handleRowClick = (row: T) => {
    setSelectedRow(row);
    setIsActionsOpen(true);
  };

  return {
    selectedRow,
    isActionsOpen,
    setIsActionsOpen,
    handleRowClick,
  };
}

export function CrudRowActionsModal<T extends { id: string; deletedAt: string | null }, TParams>({
  config,
  row,
  open,
  onOpenChange,
}: {
  config: CrudActionCellConfig<T, TParams>;
  row: T | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  // Fallback to empty if not open (hooks need to run consistently)
  const safeRow = row ?? ({} as T);
  const params = config.useSearchParams();

  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const canSeeDetail = profile.permissions.includes(`${config.permissionPrefix}.read`);
  const canEdit = profile.permissions.includes(`${config.permissionPrefix}.update`);
  const canDelete = profile.permissions.includes(`${config.permissionPrefix}.delete`);

  const resolvedDeleteMutation = config.deleteMutation ?? noOpMutation;
  const resolvedRestoreMutation = config.restoreMutation ?? noOpMutation;
  const resolvedHardDeleteMutation = config.hardDeleteMutation ?? noOpMutation;
  const hasCrudActions = !!config.deleteMutation;

  const queryOptions = config.getQueryOptions(params);

  const deleteMut = useOptimisticMutation(resolvedDeleteMutation.mutationOptions(), {
    queryOptions,
    operation: { type: "soft-delete", getId: (input) => input.id },
    onSuccess: () => {
      globalSuccessToast(`Berhasil menghapus ${config.resourceName}`);
      setIsConfirmDeleteOpen(false);
      onOpenChange(false);
    },
    onError: (error) => {
      globalErrorToast(`Gagal menghapus ${config.resourceName}. ${error.message ?? "Silahkan coba lagi."}`);
    },
  });

  const restoreMut = useOptimisticMutation(resolvedRestoreMutation.mutationOptions(), {
    queryOptions,
    operation: { type: "update", getId: (input) => input.id, getUpdatedFields: () => ({ deletedAt: null }) },
    onSuccess: () => {
      globalSuccessToast(`Berhasil mengembalikan ${config.resourceName}`);
      setIsConfirmRestoreOpen(false);
      onOpenChange(false);
    },
    onError: (error) => {
      globalErrorToast(`Gagal mengembalikan ${config.resourceName}. ${error.message ?? "Silahkan coba lagi."}`);
    },
  });

  const hardDeleteMut = useOptimisticMutation(resolvedHardDeleteMutation.mutationOptions(), {
    queryOptions,
    operation: { type: "delete", getId: (input) => input.id },
    onSuccess: () => {
      globalSuccessToast(`Berhasil menghapus permanen ${config.resourceName}`);
      setIsHardDeleteOpen(false);
      onOpenChange(false);
    },
    onError: (error) => {
      globalErrorToast(`Gagal menghapus permanen ${config.resourceName}. ${error.message ?? "Silahkan coba lagi."}`);
    },
  });

  // Only render dialogs if we actually have a row
  if (!row) return null;

  const isSoftDeleted = !!row.deletedAt;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pilihan Tindakan</DialogTitle>
            <DialogDescription>
              Silakan pilih tindakan untuk data {config.resourceName} yang dipilih.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 py-4">
            {config.showDetail && canSeeDetail && (
              <Button 
                variant="outline" 
                className="justify-start h-auto py-3 px-4" 
                asChild
                onMouseEnter={() => config.onHoverDetail && config.onHoverDetail(row.id)}
              >
                <Link to={`${config.nestedPathRoute ?? ""}${row.id}/detail` as any}>
                  <Eye className="mr-3 size-5 text-muted-foreground" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Lihat Detail</span>
                    <span className="font-normal text-xs text-muted-foreground">Lihat rincian lengkap informasi data ini</span>
                  </div>
                </Link>
              </Button>
            )}

            {canEdit && !isSoftDeleted && (
              config.editModal ? (
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4" 
                  onClick={() => {
                    setIsEditModalOpen(true);
                    onOpenChange(false); // Close main actions modal
                  }}
                >
                  <Pencil className="mr-3 size-5 text-muted-foreground" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Ubah Data</span>
                    <span className="font-normal text-xs text-muted-foreground">Perbarui informasi data ini</span>
                  </div>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4" 
                  asChild
                  onMouseEnter={() => config.onHoverEdit && config.onHoverEdit(row.id)}
                >
                  <Link to={`${config.nestedPathRoute ?? ""}${row.id}/edit` as any}>
                    <Pencil className="mr-3 size-5 text-muted-foreground" />
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-sm">Ubah Data</span>
                      <span className="font-normal text-xs text-muted-foreground">Perbarui informasi data ini</span>
                    </div>
                  </Link>
                </Button>
              )
            )}

            {hasCrudActions && canDelete && (
              isSoftDeleted ? (
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => setIsConfirmRestoreOpen(true)}
                >
                  <ArchiveRestore className="mr-3 size-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Kembalikan Data</span>
                    <span className="font-normal text-xs text-green-600/70">Pulihkan data ini agar aktif kembali</span>
                  </div>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                >
                  <Trash className="mr-3 size-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Hapus Data (Arsipkan)</span>
                    <span className="font-normal text-xs text-red-600/70">Hapus sementara data ini dari daftar aktif</span>
                  </div>
                </Button>
              )
            )}

            {config.customActions?.(row).map((action, i) => {
              if (typeof action.action === "string") {
                return (
                  <Button
                    key={i}
                    variant="outline"
                    className={`justify-start h-auto py-3 px-4 ${action.className ?? ""}`}
                    disabled={action.disabled}
                    asChild
                  >
                    <Link to={action.action as any}>
                      {action.icon}
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{action.text}</span>
                      </div>
                    </Link>
                  </Button>
                );
              }
              
              return (
                <Button
                  key={i}
                  variant="outline"
                  className={`justify-start h-auto py-3 px-4 ${action.className ?? ""}`}
                  onClick={(e) => {
                    if (typeof action.action === "function") {
                      action.action(e);
                    }
                    onOpenChange(false);
                  }}
                  disabled={action.disabled}
                >
                  {action.icon}
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">{action.text}</span>
                  </div>
                </Button>
              );
            })}

            {config.hardDeleteMutation && isSoftDeleted && canDelete && (
              <>
                <div className="border-t my-2" />
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-3 px-4 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setIsHardDeleteOpen(true)}
                >
                  <Trash2 className="mr-3 size-5" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Hapus Permanen</span>
                    <span className="font-normal text-xs opacity-70">Hapus data ini secara permanen dari sistem</span>
                  </div>
                </Button>
              </>
            )}
          </div>
          
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full mt-2">
            Tutup
          </Button>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialogs */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus data {config.resourceName}</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin menghapus data {config.resourceName} ini? Data yang sudah dihapus masih dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                deleteMut.mutate({ id: row.id });
              }}
              className="bg-red-600 text-white hover:bg-red-500"
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmRestoreOpen} onOpenChange={setIsConfirmRestoreOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kembalikan data {config.resourceName}</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah anda yakin ingin mengembalikan data {config.resourceName} ini menjadi aktif?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreMut.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                restoreMut.mutate({ id: row.id });
              }}
              disabled={restoreMut.isPending}
            >
              {restoreMut.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kembalikan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {config.hardDeleteMutation && (
        <AlertDialog open={isHardDeleteOpen} onOpenChange={setIsHardDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Permanen {config.resourceName}</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah anda yakin ingin menghapus permanen data {config.resourceName} ini? Tindakan ini tidak dapat dibatalkan dan data tidak akan dapat dipulihkan kembali.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={hardDeleteMut.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  hardDeleteMut.mutate({ id: row.id });
                }}
                className="bg-red-600 text-white hover:bg-red-500"
                disabled={hardDeleteMut.isPending}
              >
                {hardDeleteMut.isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Hapus Permanen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {config.editModal && config.editModal({
        row: row,
        open: isEditModalOpen,
        onOpenChange: setIsEditModalOpen,
      })}
    </>
  );
}
