import { DataTable } from "@/components/data-table/data-table";
import { DataTableFilterMenu } from "@/components/data-table/data-table-filter-menu";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { PermissionGate } from "@/components/permission-gate";
import { Button } from "@/components/ui/button";
import { SoftDeleteToggle } from "@/components/soft-delete-toggle";
import getUsersColumns, { getUserActionConfig } from "@/components/columns/users-columns";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import userSchema from "@tepian-k3/schema/platform/users.schema";
import { LoaderCircle, PlusCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useDataTableRouter } from "@/hooks/use-data-table-router";
import { CrudRowActionsModal, useCrudRowActions } from "@/components/crud-row-actions";
import type { UsersWithoutFoto } from "@tepian-k3/types/platform/users.types";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/(core)/back-office/users/")({
  validateSearch: (search) => userSchema.getAllUsersSchema.parse(search),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "users.view" }),
  component: RouteComponent,
  head: () => pageHead("Manajemen Pengguna"),
});

function RouteComponent() {
  const params = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data: profile } = useSuspenseQuery(
    trpc.platform.auth.profile.queryOptions(),
  );

  const hasVerificationRole = profile.roles.some((role) =>
    ["super_admin", "admin", "admin_pelatihan"].includes(role.name),
  );

  const {
    data: users,
    isLoading,
    error,
  } = useQuery(trpc.platform.user.getUserPaginated.queryOptions(params));

  const [showDeleted, setShowDeleted] = useState(params.showDeleted);
  const { selectedRow, isActionsOpen, setIsActionsOpen, handleRowClick } = useCrudRowActions<UsersWithoutFoto>();

  const [rejectDialogUserId, setRejectDialogUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const verifyUserMutation = useMutation(
    trpc.platform.user.verifyUser.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Pengguna berhasil diverifikasi");
        void queryClient.invalidateQueries(trpc.platform.user.getUserPaginated.queryOptions(params));
        setIsActionsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal memverifikasi pengguna: " + error.message);
      },
    }),
  );

  const rejectUserMutation = useMutation(
    trpc.platform.user.rejectUser.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Pengguna berhasil ditolak");
        setRejectDialogUserId(null);
        setRejectionReason("");
        void queryClient.invalidateQueries(trpc.platform.user.getUserPaginated.queryOptions(params));
        setIsActionsOpen(false);
      },
      onError: (error) => {
        globalErrorToast("Gagal menolak pengguna: " + error.message);
      },
    }),
  );

  const userActionConfig = useMemo(() => getUserActionConfig(
    hasVerificationRole,
    (userId) => verifyUserMutation.mutate({ userId }),
    (userId) => {
      setRejectionReason("");
      setRejectDialogUserId(userId);
    }
  ), [hasVerificationRole, verifyUserMutation]);

  const columns = useMemo(
    () =>
      getUsersColumns({
        currentPage: params.page,
        perPage: params.perPage,
      }),
    [params.page, params.perPage],
  );

  const { table } = useDataTableRouter({
    data: users?.data ?? [],
    columns,
    pageCount: users?.pageCount ?? 0,
    search: params,
    navigate: ({ search: updater }) => {
      navigate({ search: updater });
    },
    initialState: {
      sorting: [{ id: "createdAt", desc: false }],
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex items-center justify-between gap-4">
        <SoftDeleteToggle
          checked={showDeleted ?? false}
          onCheckedChange={(checked) => {
            navigate({
              to: "/back-office/users",
              search: {
                ...params,
                showDeleted: checked,
              },
            });
            setShowDeleted(checked);
          }}
        />
        <PermissionGate permission="users.create">
          <Button onClick={() => navigate({ to: "/back-office/users/create" })}>
            <PlusCircle className="size-4" />
            Tambah Pengguna
          </Button>
        </PermissionGate>
      </div>
      <DataTable
        table={table}
        isLoading={isLoading}
        error={error}
        emptyMessage="Tidak ada pengguna ditemukan."
        emptyDescription="Coba sesuaikan filter atau kata kunci pencarian Anda."
        onRowClick={handleRowClick}
      >
        <DataTableToolbar table={table}>
          <DataTableFilterMenu table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
      </DataTable>

      <CrudRowActionsModal
        config={userActionConfig}
        row={selectedRow}
        open={isActionsOpen}
        onOpenChange={setIsActionsOpen}
      />

      <AlertDialog
        open={!!rejectDialogUserId}
        onOpenChange={(open) => {
          if (!open) setRejectDialogUserId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Verifikasi Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Masukkan alasan penolakan verifikasi. Alasan ini akan
              dikirimkan kepada pengguna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Textarea
              placeholder="Contoh: Nomor telepon tidak valid atau berkas tidak lengkap."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason("")}>
              Batal
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectDialogUserId) {
                  rejectUserMutation.mutate({
                    userId: rejectDialogUserId,
                    reason: rejectionReason,
                  });
                }
              }}
              disabled={
                !rejectionReason.trim() || rejectUserMutation.isPending
              }
            >
              {rejectUserMutation.isPending && (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tolak Verifikasi
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
