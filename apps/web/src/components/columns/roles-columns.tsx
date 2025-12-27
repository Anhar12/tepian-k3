import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import type { ColumnDef, Row } from "@tanstack/react-table";
import type { Roles } from "@tepian-k3/types/roles.types";
import DataTableActionCell from "../data-table-action-cell";
import { ArchiveRestore, Text, Trash } from "lucide-react";
import { DataTableColumnHeader } from "../data-table/data-table-column-header";
import { format } from "date-fns";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { queryClient, trpc } from "@/utils/trpc";
import { Route } from "@/routes/(core)/dashboard/roles";

interface RolesColumnsProps {
  currentPage: number;
  perPage: number;
}

const ActionCell = ({ row }: { row: Row<Roles> }) => {
  const params = Route.useSearch();

  const { data: profile } = useSuspenseQuery(trpc.auth.profile.queryOptions());

  const canEdit = profile.permissions.includes("roles.update");
  const canDelete = profile.permissions.includes("roles.delete");

  const deleteMutation = useMutation(
    trpc.role.deleteRole.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil menghapus role");

        await queryClient.invalidateQueries(
          trpc.role.getPaginatedRoles.queryOptions(params),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal menghapus role. ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    }),
  );

  const restoreMutation = useMutation(
    trpc.role.restoreRole.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil mengembalikan role");
        await queryClient.invalidateQueries(
          trpc.role.getPaginatedRoles.queryOptions(params),
        );
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal mengembalikan role. ${error.message ?? "Silahkan coba lagi."}`,
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
      isLoading={deleteMutation.isPending || restoreMutation.isPending}
      editText="Edit"
      triggerText={row.original.deletedAt ? "Kembalikan" : "Hapus"}
      dialogTitle={
        row.original.deletedAt ? "Kembalikan data role" : "Hapus data role"
      }
      dialogDescription={
        row.original.deletedAt
          ? "Apakah anda yakin ingin mengembalikan data role ini?"
          : "Apakah anda yakin ingin menghapus data role ini? Data yang sudah dihapus tidak dapat dikembalikan."
      }
      btnClassName="bg-red-600 text-white hover:bg-red-500"
      onEditAction={`roles/${row.original.id}/edit`}
      showEdit={canEdit}
      showDelete={canDelete}
      onConfirm={() =>
        row.original.deletedAt
          ? restoreMutation.mutate({ id: row.original.id })
          : deleteMutation.mutate({ id: row.original.id })
      }
    />
  );
};

export default function getRolesColumns({
  currentPage,
  perPage,
}: RolesColumnsProps): ColumnDef<Roles>[] {
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
        <DataTableColumnHeader
          column={column}
          title="Nama Role"
          label="Nama Role"
        />
      ),
      cell: ({ row }) => (
        <div className="w-20 truncate">{row.getValue("name")}</div>
      ),
      meta: {
        label: "Nama Role",
        placeholder: "Cari nama role...",
        variant: "text",
        icon: Text,
      },
      enableColumnFilter: true,
    },
    {
      id: "description",
      accessorKey: "description",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Deskripsi"
          label="Deskripsi"
        />
      ),
      cell: ({ row }) => (
        <div className="w-20 truncate">{row.getValue("description")}</div>
      ),
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
