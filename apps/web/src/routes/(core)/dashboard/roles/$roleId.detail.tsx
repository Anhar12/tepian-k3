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
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import z from "zod";

export const Route = createFileRoute("/(core)/dashboard/roles/$roleId/detail")({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "roles.read" }),
  params: z.object({
    roleId: z.uuidv7(),
  }),
  loader: async ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.role.getRoleWithPermissionsById.queryOptions({
        id: params.roleId,
      }),
    );

    context.queryClient.ensureQueryData(
      context.trpc.permission.getAllPermissions.queryOptions(),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { roleId } = Route.useParams();

  const { data: role } = useSuspenseQuery(
    trpc.role.getRoleWithPermissionsById.queryOptions({ id: roleId }),
  );

  const { data: allPermissions } = useSuspenseQuery(
    trpc.permission.getAllPermissions.queryOptions(),
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
    trpc.permission.updateRolePermissions.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.role.getRoleWithPermissionsById.queryOptions({ id: roleId }),
        );

        await queryClient.refetchQueries(
          trpc.role.getRoleWithPermissionsById.queryOptions({ id: roleId }),
        );

        globalSuccessToast("Berhasil memperbarui izin role.");
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui izin role: " + error.message);
      },
    }),
  );

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
          <CardTitle>Buat Alat Baru</CardTitle>
          <CardDescription>
            Isi form di bawah untuk membuat alat baru.
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

            <div className="flex max-h-90 flex-col gap-4 overflow-y-auto">
              {/* Permissions List */}
              {allPermissions.length > 0 ? (
                allPermissions.map((permission) => (
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
                <p>Tidak ada izin yang tersedia.</p>
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
