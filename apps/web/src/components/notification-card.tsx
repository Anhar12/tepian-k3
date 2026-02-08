import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  ChevronRight,
  Check,
  Trash2,
  Bell,
  Package,
  CreditCard,
  XCircle,
  FlaskConical,
  CheckCircle,
  FileText,
  PenTool,
  ClipboardList,
  Megaphone,
  Loader2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  NOTIFICATION_TYPE_COLORS,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from "@tepian-k3/constants";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface Notification {
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
}

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  markingAsReadIds?: Set<string>;
  deletingIds?: Set<string>;
}

const notificationTypeIcons: Record<NotificationType, React.ReactNode> = {
  order_status_changed: <Package className="size-5" />,
  payment_received: <CreditCard className="size-5" />,
  payment_rejected: <XCircle className="size-5" />,
  testing_started: <FlaskConical className="size-5" />,
  testing_completed: <CheckCircle className="size-5" />,
  document_ready: <FileText className="size-5" />,
  document_signed: <PenTool className="size-5" />,
  assignment_received: <ClipboardList className="size-5" />,
  system_announcement: <Megaphone className="size-5" />,
  general: <Bell className="size-5" />,
};

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  markingAsReadIds,
  deletingIds,
}: NotificationCardProps) {
  const navigate = useNavigate();
  const isMarkingAsRead = markingAsReadIds?.has(notification.id) ?? false;
  const isDeleting = deletingIds?.has(notification.id) ?? false;

  const badgeColorClass =
    NOTIFICATION_TYPE_COLORS[notification.type] || "bg-gray-100 text-gray-700";

  // Only orderId navigation is currently supported
  const hasNavigation = !!notification.orderId;

  const handleClick = () => {
    // Mark as read if not already read
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
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
    <Card
      className={cn(
        "p-4 transition-shadow",
        !notification.isRead && "border-primary/20 bg-primary/5",
        hasNavigation && "cursor-pointer hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            badgeColorClass,
          )}
        >
          {notificationTypeIcons[notification.type]}
        </div>

        {/* Content */}
        <div
          className="min-w-0 flex-1"
          onClick={hasNavigation ? handleClick : undefined}
          role={hasNavigation ? "button" : undefined}
          tabIndex={hasNavigation ? 0 : undefined}
          onKeyDown={
            hasNavigation
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleClick();
                  }
                }
              : undefined
          }
        >
          <div className="mb-1 flex items-center gap-2">
            <h3
              className={cn(
                "truncate text-sm",
                !notification.isRead ? "font-semibold" : "font-medium",
              )}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <div className="size-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
            {notification.message}
          </p>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn("text-xs", badgeColorClass)}
            >
              {NOTIFICATION_TYPE_LABELS[notification.type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: localeId,
              })}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {!notification.isRead && onMarkAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              disabled={isMarkingAsRead}
              title="Tandai sudah dibaca"
            >
              {isMarkingAsRead ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
            </Button>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => e.stopPropagation()}
                  disabled={isDeleting}
                  title="Hapus notifikasi"
                >
                  {isDeleting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Notifikasi</AlertDialogTitle>
                  <AlertDialogDescription>
                    Apakah Anda yakin ingin menghapus notifikasi ini? Tindakan
                    ini tidak dapat dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(notification.id)}
                    className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {hasNavigation && (
            <ChevronRight className="size-5 text-muted-foreground" />
          )}
        </div>
      </div>
    </Card>
  );
}
