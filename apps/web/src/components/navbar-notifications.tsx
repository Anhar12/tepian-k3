import { Bell, CheckCheck, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { NotificationType } from "@tepian-k3/constants";
import { useOnOrderStatusChangedSubscription } from "@/hooks/use-notification-subscription";

const notificationTypeIcons: Record<NotificationType, string> = {
  order_status_changed: "📦",
  payment_received: "💰",
  payment_rejected: "❌",
  testing_started: "🔬",
  testing_completed: "✅",
  document_ready: "📄",
  document_signed: "✍️",
  assignment_received: "📋",
  system_announcement: "📢",
  general: "🔔",
};

export default function NavbarNotifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery(
    trpc.notifications.getUnreadCount.queryOptions(),
  );

  const { data: notifications } = useQuery(
    trpc.notifications.getAll.queryOptions({
      page: 1,
      limit: 5,
    }),
  );

  const markAsReadMutation = useMutation(
    trpc.notifications.markAsRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
      },
    }),
  );

  const markAllAsReadMutation = useMutation(
    trpc.notifications.markAllAsRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getUnreadCount.queryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: trpc.notifications.getAll.queryKey(),
        });
      },
    }),
  );

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const hasUnread = unreadCount && unreadCount > 0;

  useOnOrderStatusChangedSubscription({
    showToast: true,
    onNotification: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.getUnreadCount.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.notifications.getAll.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.order.getAllOrders.queryKey(),
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative flex size-9 items-center justify-center rounded-full">
          {hasUnread && (
            <div className="absolute top-0 -right-0.5 flex size-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-medium text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
          <Bell className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" sideOffset={4}>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifikasi</span>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="mr-1 size-3" />
              Tandai semua dibaca
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-80 overflow-y-auto">
          {notifications?.data && notifications.data.length > 0 ? (
            notifications.data.map((notification) => {
              // Only orderId navigation is currently supported
              const hasNavigation = !!notification.orderId;

              const handleClick = () => {
                // Mark as read if not already read
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id);
                }

                // Navigate to related entity (only orderId is supported)
                if (notification.orderId) {
                  navigate({
                    to: "/pengujian/status",
                    search: { orderId: notification.orderId },
                  });
                }
              };

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-1 p-3",
                    !notification.isRead && "bg-muted/50",
                  )}
                  onClick={handleClick}
                >
                  <div className="flex w-full items-start gap-2">
                    <span className="text-base">
                      {notificationTypeIcons[notification.type]}
                    </span>
                    <div className="flex-1 space-y-1">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          !notification.isRead && "font-medium",
                        )}
                      >
                        {notification.title}
                      </p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="size-2 shrink-0 rounded-full bg-primary" />
                    )}
                    {hasNavigation && (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Tidak ada notifikasi
              </p>
            </div>
          )}
        </DropdownMenuGroup>
        {notifications?.data && notifications.data.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/notifications"
                className="flex w-full items-center justify-center gap-1 text-sm text-primary"
              >
                Lihat semua
                <ExternalLink className="size-3" />
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
