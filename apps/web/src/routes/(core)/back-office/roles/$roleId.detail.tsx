import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SkeletonButton,
  SkeletonInput,
} from "@/components/ui/skeleton-generator";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/roles/$roleId/detail",
)({
  params: z.object({
    roleId: z.uuidv7(),
  }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "roles.read" }),
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.platform.role.getRoleWithPermissionsById.queryOptions({
        id: params.roleId,
      }),
    );

    context.queryClient.ensureQueryData(
      context.trpc.platform.permission.getAllPermissions.queryOptions(),
    );
  },
  head: () => pageHead("Detail Role"),
  component: RouteComponent,
  pendingComponent: LoaderComponent,
});

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Role & Izin: </CardTitle>
          <CardDescription>
            Kelola izin yang dimiliki oleh role ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <SkeletonInput className="mb-6 h-10 w-full" />

            <SkeletonButton className="w-full" />

            <Skeleton className="h-48 w-full" />

            <SkeletonButton className="w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RouteComponent() {
  const { roleId } = Route.useParams();

  const { data: role } = useSuspenseQuery(
    trpc.platform.role.getRoleWithPermissionsById.queryOptions({ id: roleId }),
  );

  const { data: allPermissions } = useSuspenseQuery(
    trpc.platform.permission.getAllPermissions.queryOptions(),
  );

  // Store original permissions as a Set for O(1) lookups
  const originalPermissions = useMemo(
    () => new Set(role?.permissions || []),
    [role?.permissions],
  );

  // Track current selected permissions
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    () => new Set(role?.permissions || []),
  );

  const [search, setSearch] = useState("");

  // Derive added/removed permissions when needed (e.g., for save button or dirty check)
  const { addedPermissions, removedPermissions, hasChanges } = useMemo(() => {
    const added = [...selectedPermissions].filter(
      (perm) => !originalPermissions.has(perm),
    );
    const removed = [...originalPermissions].filter(
      (perm) => !selectedPermissions.has(perm),
    );
    return {
      addedPermissions: added,
      removedPermissions: removed,
      hasChanges: added.length > 0 || removed.length > 0,
    };
  }, [selectedPermissions, originalPermissions]);

  const updateRolePermissionsMutation = useMutation(
    trpc.platform.permission.updateRolePermissions.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.platform.role.getRoleWithPermissionsById.queryOptions({
            id: roleId,
          }),
        );

        await queryClient.refetchQueries(
          trpc.platform.role.getRoleWithPermissionsById.queryOptions({
            id: roleId,
          }),
        );

        globalSuccessToast("Berhasil memperbarui izin role.");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui izin role: " + error.message);
      },
    }),
  );

  const filteredPermissions = useMemo(
    () =>
      search.trim()
        ? allPermissions.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()),
          )
        : allPermissions,
    [allPermissions, search],
  );

  // Check if all permissions are selected
  const allSelected = useMemo(
    () =>
      allPermissions.length > 0 &&
      allPermissions.every((p) => selectedPermissions.has(p.name)),
    [allPermissions, selectedPermissions],
  );

  function handleToggleAllPermissions() {
    if (allSelected) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allPermissions.map((p) => p.name)));
    }
  }

  function handleOnPermissionChange(
    permissionName: string,
    isChecked: boolean,
  ) {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (isChecked) {
        next.add(permissionName);
      } else {
        next.delete(permissionName);
      }
      return next;
    });
  }

  function handleUpdatePermissions() {
    updateRolePermissionsMutation.mutate({
      roleId: role.id,
      addedPermissions,
      removedPermissions,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Role & Izin: {role.name}</CardTitle>
          <CardDescription>
            Kelola izin yang dimiliki oleh role ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              <Label className="ml-1 text-sm font-bold">Nama Role</Label>
              <Input
                type="text"
                placeholder="Masukkan nama role"
                className="h-10 text-sm"
                value={role.name}
                disabled
                readOnly
              />
            </div>

            <Input
              type="text"
              placeholder="Cari izin..."
              className="h-10 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleAllPermissions}
            >
              {allSelected ? "Hapus Semua" : "Pilih Semua"}
            </Button>

            <div className="flex max-h-78 flex-col gap-4 overflow-y-auto">
              {filteredPermissions.length > 0 ? (
                filteredPermissions.map((permission) => (
                  <div key={permission.id} className="flex flex-row gap-2">
                    <Checkbox
                      checked={selectedPermissions.has(permission.name)}
                      onCheckedChange={(isChecked) =>
                        handleOnPermissionChange(
                          permission.name,
                          isChecked as boolean,
                        )
                      }
                    />
                    <Label>{permission.name}</Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "Tidak ada izin yang cocok."
                    : "Tidak ada izin yang tersedia."}
                </p>
              )}
            </div>

            <Button
              disabled={!hasChanges || updateRolePermissionsMutation.isPending}
              onClick={() => handleUpdatePermissions()}
            >
              {updateRolePermissionsMutation.isPending ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Simpan Perubahan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
