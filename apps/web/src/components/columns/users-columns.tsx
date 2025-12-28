import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { UsersWithoutFoto } from "@tepian-k3/types/users.types";
import DataTableActionCell from "../data-table-action-cell";
import { ArchiveRestore, Text, Trash } from "lucide-react";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { format } from "date-fns";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/users";

interface UsersColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = ({ row }: { row: Row<UsersWithoutFoto> }) => {
  const params = Route.useSearch();

  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const canEdit = profile.permissions.includes("users.update");
  const canDelete = profile.permissions.includes("users.delete");

  const deleteUserMutation = useMutation(
    trpc.user.deleteUser.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil menghapus user");

        await queryClient.invalidateQueries(
          trpc.user.getUserPaginated.queryOptions(params),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal menghapus user. ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  const restoreUserMutation = useMutation(
    trpc.user.restoreUser.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil mengembalikan user");
        await queryClient.invalidateQueries(
          trpc.user.getUserPaginated.queryOptions(params),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal mengembalikan user. ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  return (
    <DataTableActionCell
      icon={
        row.original.deletedAt ? (
          <ArchiveRestore className="mr-4 size-4" />
        ) : (
          <Trash className="mr-4 size-4" />
        )
      }
      isLoading={deleteUserMutation.isPending || restoreUserMutation.isPending}
      editText="Edit"
      triggerText={row.original.deletedAt ? "Kembalikan" : "Hapus"}
      dialogTitle={
        row.original.deletedAt ? "Kembalikan data user" : "Hapus data user"
      }
      dialogDescription={
        row.original.deletedAt
          ? "Apakah anda yakin ingin mengembalikan data user ini?"
          : "Apakah anda yakin ingin menghapus data user ini? Data yang sudah dihapus tidak dapat dikembalikan."
      }
      btnClassName="bg-red-600 text-white hover:bg-red-500"
      onEditAction={`users/${row.original.id}/edit`}
      showEdit={canEdit}
      showDelete={canDelete}
      onConfirm={() =>
        row.original.deletedAt
          ? restoreUserMutation.mutate({ id: row.original.id })
          : deleteUserMutation.mutate({ id: row.original.id })
      }
    />
  );
};

export default function getUsersColumns({
  currentPage,
  perPage,
}: UsersColumnsProps): ColumnDef<UsersWithoutFoto>[] {
  return [
    {
      id: "no",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="No" label="No" />
      ),
      cell: ({ row }) => (
        <div>{row.index + 1 + (currentPage - 1) * perPage}</div>
      ),
    },
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nama" label="Nama" />
      ),
      cell: ({ row }) => (
        <div className="w-20 truncate">{row.getValue("name")}</div>
      ),
      meta: {
        label: "Nama",
        placeholder: "Cari nama...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" label="Email" />
      ),
      cell: ({ row }) => (
        <div className="w-20 truncate">{row.getValue("email")}</div>
      ),
      meta: {
        label: "Username",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dibuat" label="Dibuat" />
      ),
      cell: ({ row }) => (
        <span>
          {format(new Date(row.getValue("createdAt")), "dd/MM/yyyy HH:mm:ss")}
        </span>
      ),
    },
    {
      id: "updatedAt",
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Diubah" label="Diubah" />
      ),
      cell: ({ row }) => (
        <span>
          {row.getValue("updatedAt")
            ? format(new Date(row.getValue("updatedAt")), "dd/MM/yyyy HH:mm:ss")
            : "-"}
        </span>
      ),
    },
    {
      id: "action",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Aksi" label="Aksi" />
      ),
      cell: ({ row }) => <ActionCell row={row} />,
    },
  ];
}
