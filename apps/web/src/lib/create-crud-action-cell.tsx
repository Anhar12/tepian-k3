import DataTableActionCell from "@/components/data-table-action-cell";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { queryClient, trpc } from "@/utils/trpc";
import type { QueryKey } from "@tanstack/react-query";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { ArchiveRestore, Trash } from "lucide-react";

interface CrudActionCellConfig<T, TParams> {
  /** Resource name (singular) for display messages */
  resourceName: string;
  /**
   * @deprecated currently not being used,
   * Resource path for routing (e.g., 'clusters', 'tools') */
  resourcePath: string;
  /** Permission prefix (e.g., 'clusters', 'tools') */
  permissionPrefix: string;
  /** Delete mutation from tRPC no type because tRPC mutation types are complex */
  deleteMutation: any;
  /** Restore mutation from tRPC no type because tRPC mutation types are complex */
  restoreMutation: any;
  /** Query options to invalidate */
  getQueryOptions: (params: TParams) => { queryKey: QueryKey };
  /** Get current search params */
  useSearchParams: () => TParams;
  /** Show detail action button */
  showDetail?: boolean;
  /** Action on hover for edit button */
  onHoverEdit?: (id: string) => void;
  /** Action on hover for detail button */
  onHoverDetail?: (id: string) => void;
}

/**
 * Creates a reusable CRUD action cell component for data tables
 */
export function createCrudActionCell<
  T extends { id: string; deletedAt: string | null },
  TParams,
>(config: CrudActionCellConfig<T, TParams>) {
  const {
    resourceName,
    resourcePath,
    permissionPrefix,
    deleteMutation,
    restoreMutation,
    getQueryOptions,
    useSearchParams,
    showDetail = false,
    onHoverEdit,
    onHoverDetail,
  } = config;

  return function ActionCell({ row }: { row: Row<T> }) {
    const params = useSearchParams();
    const { data: profile } = useSuspenseQuery(
      trpc.auth.profile.queryOptions(),
    );

    const canSeeDetail = profile.permissions.includes(
      `${permissionPrefix}.read`,
    );
    const canEdit = profile.permissions.includes(`${permissionPrefix}.update`);
    const canDelete = profile.permissions.includes(
      `${permissionPrefix}.delete`,
    );

    const deleteMut = useMutation(
      deleteMutation.mutationOptions({
        onSuccess: async () => {
          globalSuccessToast(`Berhasil menghapus ${resourceName}`);
          await queryClient.invalidateQueries(getQueryOptions(params));
        },
        onError: (error: Error) => {
          globalErrorToast(
            `Gagal menghapus ${resourceName}. ${error.message ?? "Silahkan coba lagi."}`,
          );
        },
      }),
    );

    const restoreMut = useMutation(
      restoreMutation.mutationOptions({
        onSuccess: async () => {
          globalSuccessToast(`Berhasil mengembalikan ${resourceName}`);
          await queryClient.invalidateQueries(getQueryOptions(params));
        },
        onError: (error: Error) => {
          globalErrorToast(
            `Gagal mengembalikan ${resourceName}. ${error.message ?? "Silahkan coba lagi."}`,
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
        isLoading={deleteMut.isPending || restoreMut.isPending}
        editText="Edit"
        triggerText={row.original.deletedAt ? "Kembalikan" : "Hapus"}
        dialogTitle={
          row.original.deletedAt
            ? `Kembalikan data ${resourceName}`
            : `Hapus data ${resourceName}`
        }
        dialogDescription={
          row.original.deletedAt
            ? `Apakah anda yakin ingin mengembalikan data ${resourceName} ini?`
            : `Apakah anda yakin ingin menghapus data ${resourceName} ini? Data yang sudah dihapus tidak dapat dikembalikan.`
        }
        btnClassName="bg-red-600 text-white hover:bg-red-500"
        onEditAction={`${row.original.id}/edit`}
        onHoverEdit={() => onHoverEdit && onHoverEdit(row.original.id)}
        showEdit={canEdit}
        showDelete={canDelete}
        showDetail={showDetail && canSeeDetail}
        onDetailAction={showDetail ? `${row.original.id}/detail` : undefined}
        onHoverDetail={() => onHoverDetail && onHoverDetail(row.original.id)}
        onConfirm={() =>
          row.original.deletedAt
            ? (restoreMut.mutate as unknown as (input: { id: string }) => void)(
                { id: row.original.id },
              )
            : (deleteMut.mutate as unknown as (input: { id: string }) => void)({
                id: row.original.id,
              })
        }
      />
    );
  };
}
