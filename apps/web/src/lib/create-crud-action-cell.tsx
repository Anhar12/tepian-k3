import DataTableActionCell from "@/components/data-table-action-cell";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { useOptimisticMutation } from "@/lib/optimistic-update";
import { trpc } from "@/utils/trpc";

import type { QueryKey, UseMutationOptions } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import type { Resource } from "@tepian-k3/constants";
import { ArchiveRestore, Trash } from "lucide-react";

/** Structural type for a tRPC mutation proxy that exposes `.mutationOptions()` */
interface TRPCMutationLike<TInput> {
  mutationOptions: (
    opts?: Record<string, unknown>,
  ) => Pick<
    UseMutationOptions<unknown, Error, TInput>,
    "mutationFn" | "mutationKey"
  >;
}

interface CrudActionCellConfig<TParams> {
  /** Resource name (singular) for display messages */
  resourceName: string;
  /** Nested path route for routing (e.g., '(core)/back-office')
   * use only if the resource is nested in another resource
   * eg: "/back-office/tools/$toolId/detail/calibration"
   */
  nestedPathRoute?: string;
  /**
   * @deprecated currently not being used,
   * Resource path for routing (e.g., 'clusters', 'tools') */
  resourcePath: string;
  /** Permission prefix (e.g., 'clusters', 'tools') */
  permissionPrefix: Resource;
  /** Delete mutation from tRPC */
  deleteMutation: TRPCMutationLike<{ id: string }>;
  /** Restore mutation from tRPC */
  restoreMutation: TRPCMutationLike<{ id: string }>;
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
>(config: CrudActionCellConfig<TParams>) {
  const {
    resourceName,
    nestedPathRoute,
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

    const queryOptions = getQueryOptions(params);

    const deleteMut = useOptimisticMutation(deleteMutation.mutationOptions(), {
      queryOptions,
      operation: {
        type: "soft-delete",
        getId: (input) => input.id,
      },
      onSuccess: () => {
        globalSuccessToast(`Berhasil menghapus ${resourceName}`);
      },
      onError: (error) => {
        globalErrorToast(
          `Gagal menghapus ${resourceName}. ${error.message ?? "Silahkan coba lagi."}`,
        );
      },
    });

    const restoreMut = useOptimisticMutation(
      restoreMutation.mutationOptions(),
      {
        queryOptions,
        operation: {
          type: "update",
          getId: (input) => input.id,
          getUpdatedFields: () => ({ deletedAt: null }),
        },
        onSuccess: () => {
          globalSuccessToast(`Berhasil mengembalikan ${resourceName}`);
        },
        onError: (error) => {
          globalErrorToast(
            `Gagal mengembalikan ${resourceName}. ${error.message ?? "Silahkan coba lagi."}`,
          );
        },
      },
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
        onEditAction={`${nestedPathRoute ?? ""}${row.original.id}/edit`}
        onHoverEdit={() => onHoverEdit && onHoverEdit(row.original.id)}
        showEdit={canEdit}
        showDelete={canDelete}
        showDetail={showDetail && canSeeDetail}
        onDetailAction={
          showDetail
            ? `${nestedPathRoute ?? ""}${row.original.id}/detail`
            : undefined
        }
        onHoverDetail={() => onHoverDetail && onHoverDetail(row.original.id)}
        onConfirm={() =>
          row.original.deletedAt
            ? restoreMut.mutate({ id: row.original.id })
            : deleteMut.mutate({ id: row.original.id })
        }
      />
    );
  };
}
