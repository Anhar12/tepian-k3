// apps/web/src/components/audit-log-viewer.tsx

import { trpc } from "@/utils/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Audit } from "@tepian-k3/types/audit.types";
import { useQuery } from "@tanstack/react-query";

interface AuditLogViewerProps {
  entityType: string;
  entityId: string;
}

export function AuditLogViewer({ entityType, entityId }: AuditLogViewerProps) {
  const { data: logs, isLoading } = useQuery(
    trpc.audit.getEntityHistory.queryOptions({
      entityType: entityType as any,
      entityId,
    }),
  );

  if (isLoading) {
    return <div>Loading audit history...</div>;
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No audit logs found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-150">
          <div className="space-y-4">
            {logs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function AuditLogItem({ log }: { log: Audit }) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "update":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
      case "delete":
        return "bg-red-500/10 text-red-700 dark:text-red-400";
      case "status_change":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge className={getActionColor(log.action)}>
            {log.action.replace("_", " ").toUpperCase()}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {format(new Date(log.createdAt), "PPp")}
          </span>
        </div>
        {log.userEmail && (
          <span className="text-sm text-muted-foreground">{log.userEmail}</span>
        )}
      </div>

      {log.description && <p className="mb-2 text-sm">{log.description}</p>}

      {(log.changedFields as string[]) &&
        Array.isArray(log.changedFields) &&
        log.changedFields.length > 0 && (
          <div className="mt-2">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Changed fields:
            </p>
            <div className="flex flex-wrap gap-1">
              {log.changedFields.map((field) => (
                <Badge
                  key={field as string}
                  variant="outline"
                  className="text-xs"
                >
                  {field as string}
                </Badge>
              ))}
            </div>
          </div>
        )}

      {((log.oldValues as Audit) || (log.newValues as Audit)) && (
        <>
          <Separator className="my-2" />
          <ChangeDetails oldValues={log.oldValues} newValues={log.newValues} />
        </>
      )}
    </div>
  );
}

interface ChangeDetailsProps {
  oldValues: any;
  newValues: any;
}

function ChangeDetails({ oldValues, newValues }: ChangeDetailsProps) {
  const changes: Array<{ field: string; old: any; new: any }> = [];

  // Compare and find changes
  if (oldValues && newValues) {
    const allKeys = new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]);

    for (const key of allKeys) {
      if (key === "updatedAt" || key === "updated_at") continue;

      const oldVal = oldValues?.[key];
      const newVal = newValues?.[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({ field: key, old: oldVal, new: newVal });
      }
    }
  }

  if (changes.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Changes:</p>
      {changes.map(({ field, old, new: newVal }) => (
        <div key={field} className="rounded bg-muted/50 p-2 text-xs">
          <div className="font-medium">{field}</div>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Old: </span>
              <code className="text-red-600 dark:text-red-400">
                {formatValue(old)}
              </code>
            </div>
            <div>
              <span className="text-muted-foreground">New: </span>
              <code className="text-green-600 dark:text-green-400">
                {formatValue(newVal)}
              </code>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean" || typeof value === "number")
    return String(value);
  if (value instanceof Date) return format(value, "PPp");
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2).substring(0, 100) + "...";
  }
  return String(value);
}
