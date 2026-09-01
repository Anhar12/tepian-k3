import type { ColumnDef } from "@tanstack/react-table";
import type { UsersWithoutFoto } from "@tepian-k3/types/platform/users.types";
import { Route } from "@/routes/(core)/back-office/users";
import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { XCircle } from "lucide-react";
import {
  createCompactDateColumn,
  createNumberColumn,
  createMergedTextColumn,
  createTextColumn,
} from "@/lib/column-helpers";
import type { CrudActionCellConfig } from "@/components/crud-row-actions";
import type { CustomAction } from "@/components/data-table-action-cell";

interface UsersColumnsProps {
  currentPage: number;
  perPage: number;
}

export const getUserActionConfig = (
  hasVerificationRole: boolean,
  onReject: (userId: string) => void,
): CrudActionCellConfig<
  UsersWithoutFoto,
  (typeof Route)["types"]["searchSchema"]
> => ({
  resourceName: "pengguna",
  resourcePath: "users",
  permissionPrefix: "users",
  deleteMutation: trpc.platform.user.deleteUser,
  restoreMutation: trpc.platform.user.restoreUser,
  hardDeleteMutation: trpc.platform.user.hardDeleteUser,
  getQueryOptions: (params) =>
    trpc.platform.user.getUserPaginated.queryOptions(params),
  useSearchParams: () => Route.useSearch(),
  showDetail: true,
  customActions: (row) => {
    const actions: CustomAction[] = [];
    if (hasVerificationRole && !row.deletedAt) {
      if (row.verificationStatus === "pending") {
        actions.push({
          icon: <XCircle className="mr-3 size-5 text-red-600" />,
          text: "Tolak Verifikasi",
          action: () => onReject(row.id),
        });
      }
    }
    return actions;
  },
});

export default function getUsersColumns({
  currentPage,
  perPage,
}: UsersColumnsProps): ColumnDef<UsersWithoutFoto>[] {
  return [
    createNumberColumn<UsersWithoutFoto>(currentPage, perPage),
    createMergedTextColumn<UsersWithoutFoto>("name", "Nama User", {
      width: "w-64",
      enableFilter: true,
      placeholder: "Cari nama user...",
      secondaryId: "email",
      secondaryMaskType: "email",
    }),
    createTextColumn<UsersWithoutFoto>("verificationStatus", "Verifikasi", {
      width: "w-36",
      cellRenderer: (value, row) => {
        const status = value as string;
        const reason = row.original.verificationRejectionReason;

        return (
          <div className="w-36">
            {status === "approved" && (
              <Badge
                variant="secondary"
                className="border-none bg-green-100 text-green-800 hover:bg-green-100"
              >
                Terverifikasi
              </Badge>
            )}
            {status === "pending" && (
              <Badge
                variant="secondary"
                className="border-none bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
              >
                Menunggu Verifikasi
              </Badge>
            )}
            {status === "rejected" && (
              <div
                title={`Alasan penolakan: ${reason ?? "Tidak ada alasan spesifik"}`}
              >
                <Badge
                  variant="secondary"
                  className="cursor-help border-none bg-red-100 text-red-800 hover:bg-red-100"
                >
                  Ditolak
                </Badge>
              </div>
            )}
          </div>
        );
      },
    }),
    createCompactDateColumn<UsersWithoutFoto>("createdAt", "Dibuat"),
  ];
}

// ##################
// end authored
// ##################
