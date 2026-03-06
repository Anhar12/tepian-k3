import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pageHead } from "@/utils/page-head";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ENTITY_TYPE_LABELS,
} from "@tepian-k3/constants";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import z from "zod";

export const Route = createFileRoute("/(core)/back-office/audits/$auditId")({
  params: z.object({ auditId: z.string().uuid() }),
  beforeLoad: async ({ context }) =>
    await requirePermission(context, { permission: "audits.view" }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.platform.audit.getAuditLogById.queryOptions({
        id: params.auditId,
      }),
    );
  },
  head: () => pageHead("Detail Log Audit"),
  component: RouteComponent,
  pendingComponent: LoaderComponent,
});

// ─── helpers ────────────────────────────────────────────────────────────────

const ACTION_BADGE_CLASSES: Record<string, string> = {
  create: "bg-green-100 text-green-800",
  update: "bg-blue-100 text-blue-800",
  delete: "bg-red-100 text-red-800",
  status_change: "bg-yellow-100 text-yellow-800",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

// ─── diff component ──────────────────────────────────────────────────────────

interface DiffViewProps {
  action: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  changedFields: string[] | null;
}

function DiffView({
  action,
  oldValues,
  newValues,
  changedFields,
}: DiffViewProps) {
  const allKeys = useMemo(() => {
    const keys = new Set<string>();
    if (oldValues) Object.keys(oldValues).forEach((k) => keys.add(k));
    if (newValues) Object.keys(newValues).forEach((k) => keys.add(k));
    return [...keys].sort();
  }, [oldValues, newValues]);

  const changedSet = useMemo(
    () => new Set(changedFields ?? []),
    [changedFields],
  );

  if (allKeys.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak ada data perubahan yang tersimpan.
      </p>
    );
  }

  // For create: only newValues — show as single-column "Nilai"
  if (action === "create") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Field</TableHead>
            <TableHead>Nilai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allKeys.map((key) => (
            <TableRow key={key}>
              <TableCell className="font-mono text-sm font-medium">
                {key}
              </TableCell>
              <TableCell className="font-mono text-sm whitespace-pre-wrap">
                {formatValue(newValues?.[key])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // For delete: only oldValues — show as single-column "Nilai Dihapus"
  if (action === "delete") {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-48">Field</TableHead>
            <TableHead>Nilai Dihapus</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allKeys.map((key) => (
            <TableRow key={key} className="bg-red-50/50">
              <TableCell className="font-mono text-sm font-medium">
                {key}
              </TableCell>
              <TableCell className="font-mono text-sm whitespace-pre-wrap text-red-700">
                {formatValue(oldValues?.[key])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  // For update / status_change: side-by-side diff
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-48">Field</TableHead>
          <TableHead>Nilai Lama</TableHead>
          <TableHead>Nilai Baru</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {allKeys.map((key) => {
          const isChanged = changedSet.has(key);
          return (
            <TableRow key={key} className={cn(isChanged && "bg-yellow-50/60")}>
              <TableCell className="font-mono text-sm font-medium">
                {key}
                {isChanged && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-yellow-100 text-xs text-yellow-700"
                  >
                    berubah
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className={cn(
                  "font-mono text-sm whitespace-pre-wrap",
                  isChanged && "text-muted-foreground line-through",
                )}
              >
                {formatValue(oldValues?.[key])}
              </TableCell>
              <TableCell
                className={cn(
                  "font-mono text-sm whitespace-pre-wrap",
                  isChanged && "font-semibold text-green-700",
                )}
              >
                {formatValue(newValues?.[key])}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function LoaderComponent() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-36 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

function RouteComponent() {
  const { auditId } = Route.useParams();

  const { data: audit } = useSuspenseQuery(
    trpc.platform.audit.getAuditLogById.queryOptions({ id: auditId }),
  );

  const entityLabel =
    (AUDIT_ENTITY_TYPE_LABELS as Record<string, string>)[audit.entityType] ??
    audit.entityType;

  const actionLabel =
    (AUDIT_ACTION_LABELS as Record<string, string>)[audit.action] ??
    audit.action;

  const oldValues = audit.oldValues as Record<string, unknown> | null;
  const newValues = audit.newValues as Record<string, unknown> | null;
  const changedFields = audit.changedFields as string[] | null;
  const metadata = audit.metadata as Record<string, unknown> | null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/back-office/audits">
            <ArrowLeft className="mr-1 size-4" />
            Kembali ke Log Audit
          </Link>
        </Button>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Log Audit</CardTitle>
          {audit.description && (
            <CardDescription>{audit.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="font-medium text-muted-foreground">
                Tipe Entitas
              </dt>
              <dd className="mt-1">
                <Badge variant="secondary">{entityLabel}</Badge>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">ID Entitas</dt>
              <dd className="mt-1 font-mono text-xs">{audit.entityId}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Aksi</dt>
              <dd className="mt-1">
                <Badge
                  variant="secondary"
                  className={cn(ACTION_BADGE_CLASSES[audit.action])}
                >
                  {actionLabel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">
                Email Pengguna
              </dt>
              <dd className="mt-1">{audit.userEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Waktu</dt>
              <dd className="mt-1">
                {format(new Date(audit.createdAt), "dd/MM/yyyy HH:mm:ss")}
              </dd>
            </div>
            {changedFields && changedFields.length > 0 && (
              <div className="col-span-full">
                <dt className="font-medium text-muted-foreground">
                  Field yang Berubah
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {changedFields.map((f) => (
                    <Badge
                      key={f}
                      variant="outline"
                      className="font-mono text-xs"
                    >
                      {f}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Diff card */}
      {(oldValues ?? newValues) && (
        <Card>
          <CardHeader>
            <CardTitle>Perubahan Data</CardTitle>
            <CardDescription>
              {audit.action === "create" && "Data yang dibuat"}
              {audit.action === "delete" && "Data yang dihapus"}
              {(audit.action === "update" ||
                audit.action === "status_change") &&
                "Perbandingan nilai sebelum dan sesudah perubahan"}
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <DiffView
              action={audit.action}
              oldValues={oldValues}
              newValues={newValues}
              changedFields={changedFields}
            />
          </CardContent>
        </Card>
      )}

      {/* Metadata card */}
      {metadata && Object.keys(metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
            <CardDescription>Informasi konteks tambahan</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
