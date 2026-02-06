import { pageHead } from "@/utils/page-head";
import { useState } from "react";
import { InfiniteScrollList } from "@/components/infinite-scroll-list";
import { NotificationCard } from "@/components/notification-card";
import { NotificationListSkeleton } from "@/components/notification-card-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/utils/trpc";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@tepian-k3/constants";
import { ArrowLeft, Bell, CheckCheck, Loader2, Trash2 } from "lucide-react";
import z from "zod";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";

const readStatusFilters = [
  { label: "Semua", value: "all" },
  { label: "Belum Dibaca", value: "unread" },
  { label: "Sudah Dibaca", value: "read" },
] as const;

type ReadStatusFilter = (typeof readStatusFilters)[number]["value"];

export const Route = createFileRoute("/(core)/notifications")({
  validateSearch: z.object({
    status: z.enum(["all", "unread", "read"]).default("all"),
    type: z.enum(["all", ...NOTIFICATION_TYPES]).default("all"),
  }),
  component: NotificationsPage,
  head: () => pageHead("Notifikasi"),
});

// Type for notification from the API
type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  orderId: string | null;
  testingId: string | null;
  documentId: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
};

function NotificationsPage() {
  const { status, type } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  // Track loading states per notification ID (using Set for multiple simultaneous operations)
  const [markingAsReadIds, setMarkingAsReadIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());

  // Convert filter values to API params
  const isReadParam =
    status === "all" ? undefined : status === "read" ? true : false;
  const typeParam = type === "all" ? undefined : (type as NotificationType);

  // Infinite query for notifications using cursor-based pagination
  const notificationsQuery = useInfiniteQuery(
    trpc.notifications.getCursorPaginated.infiniteQueryOptions(
      {
        limit: 10,
        isRead: isReadParam,
        type: typeParam,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    ),
  );

  // Mark as read mutation
  const markAsReadMutation = useMutation(
    trpc.notifications.markAsRead.mutationOptions({
      onMutate: (variables) => {
        setMarkingAsReadIds((prev) => new Set(prev).add(variables.id));
      },
      onSuccess: () => {
        notificationsQuery.refetch();
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        globalSuccessToast("Notifikasi ditandai sebagai dibaca");
      },
      onError: (data) => {
        globalErrorToast(
          `Gagal menandai notifikasi sebagai dibaca: ${data.message}`,
        );
      },
      onSettled: (_, __, variables) => {
        setMarkingAsReadIds((prev) => {
          const next = new Set(prev);
          next.delete(variables.id);
          return next;
        });
      },
    }),
  );

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({
      onSuccess: () => {
        notificationsQuery.refetch();
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        globalSuccessToast("Semua notifikasi ditandai sebagai dibaca");
      },
      onError: (data) => {
        globalErrorToast(
          `Gagal menandai semua notifikasi sebagai dibaca: ${data.message}`,
        );
      },
    }),
  );

  // Delete mutation
  const deleteMutation = useMutation(
    trpc.notifications.delete.mutationOptions({
      onMutate: (variables) => {
        setDeletingIds((prev) => new Set(prev).add(variables.id));
      },
      onSuccess: () => {
        notificationsQuery.refetch();
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        globalSuccessToast("Notifikasi dihapus");
      },
      onError: (data) => {
        globalErrorToast(`Gagal menghapus notifikasi: ${data.message}`);
      },
      onSettled: (_, __, variables) => {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(variables.id);
          return next;
        });
      },
    }),
  );

  // Delete all mutation
  const deleteAllMutation = useMutation(
    trpc.notifications.deleteAll.mutationOptions({
      onSuccess: () => {
        notificationsQuery.refetch();
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        globalSuccessToast("Semua notifikasi dihapus");
      },
      onError: (data) => {
        globalErrorToast(`Gagal menghapus semua notifikasi: ${data.message}`);
      },
    }),
  );

  // Flatten pages data for hasUnread check
  const notifications =
    notificationsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="mx-auto flex h-full max-w-3xl flex-col p-4">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-2 w-fit gap-2"
        onClick={() => navigate({ to: "/" })}
      >
        <ArrowLeft className="size-4" />
        Kembali ke Beranda
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Notifikasi</h1>
        <p className="text-sm text-muted-foreground">
          Kelola dan pantau semua notifikasi Anda
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Read Status Tabs */}
          <Tabs
            value={status}
            onValueChange={(value) => {
              navigate({
                to: "/notifications",
                search: { status: value as ReadStatusFilter, type },
              });
            }}
          >
            <TabsList className="bg-white">
              {readStatusFilters.map((s) => (
                <TabsTrigger key={s.value} value={s.value}>
                  {s.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Type Filter */}
          <Select
            value={type}
            onValueChange={(value) => {
              navigate({
                to: "/notifications",
                search: {
                  status,
                  type: value as NotificationType | "all",
                },
              });
            }}
          >
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Filter berdasarkan tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {NOTIFICATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {NOTIFICATION_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions - fixed dimensions prevent layout shift */}
        <div className="flex min-h-9 min-w-85 justify-end gap-2">
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 size-4" />
              )}
              Tandai Semua Dibaca
            </Button>
          )}
          {notifications.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteAllMutation.isPending}
                >
                  {deleteAllMutation.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Hapus Semua
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Semua Notifikasi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan
                    ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllMutation.mutate()}
                    className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  >
                    Hapus Semua
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Notification List with Virtual Scroll */}
      <InfiniteScrollList<Notification>
        queryResult={notificationsQuery}
        estimateSize={140}
        gap={12}
        height="calc(100vh - 280px)"
        className="min-h-96"
        loadingComponent={<NotificationListSkeleton count={5} />}
        emptyComponent={
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-4 size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              Tidak ada notifikasi
            </p>
            <p className="text-sm text-muted-foreground">
              {status !== "all" || type !== "all"
                ? "Coba ubah filter untuk melihat notifikasi lainnya"
                : "Notifikasi baru akan muncul di sini"}
            </p>
          </div>
        }
        endComponent={
          <p className="py-4 text-center text-sm text-muted-foreground">
            Tidak ada notifikasi lagi
          </p>
        }
        renderItem={(notification) => (
          <NotificationCard
            notification={notification}
            onMarkAsRead={(id) => markAsReadMutation.mutate({ id })}
            onDelete={(id) => deleteMutation.mutate({ id })}
            markingAsReadIds={markingAsReadIds}
            deletingIds={deletingIds}
          />
        )}
        getItemKey={(notification) => notification.id}
      />
    </div>
  );
}
