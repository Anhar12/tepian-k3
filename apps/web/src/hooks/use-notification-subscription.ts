import { globalInfoToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { useSubscription } from "@trpc/tanstack-react-query";

type NotificationSubscriptionOptions = {
  /** Whether to show toast notifications. Defaults to true */
  showToast?: boolean;
  /** Custom callback when notification is received */
  onNotification?: (message: string) => void;
};

/**
 * Hook to subscribe to real-time notifications
 *
 * @example
 * // Basic usage - shows toast automatically
 * useNotificationSubscription();
 *
 * @example
 * // With custom handler
 * useNotificationSubscription({
 *   onNotification: (message) => {
 *     console.log('Received:', message);
 *   },
 * });
 *
 * @example
 * // Disable toast, handle manually
 * useNotificationSubscription({
 *   showToast: false,
 *   onNotification: (message) => {
 *     // Custom handling
 *   },
 * });
 */
export function useNotificationSubscription(
  options: NotificationSubscriptionOptions = {},
) {
  const { showToast = true, onNotification } = options;

  useSubscription({
    ...trpc.platform.event.onNotification.subscriptionOptions(),
    onData: (data) => {
      if (showToast) {
        globalInfoToast(data.message);
      }

      onNotification?.(data.message);
    },
  });
}

/**
 * Hook to subscribe to real-time order status change notifications
 *
 * @example
 * // Basic usage - shows toast automatically
 * useOnOrderStatusChangedSubscription();
 *
 * @example
 * // With custom handler
 * useOnOrderStatusChangedSubscription({
 *   onNotification: (message) => {
 *     console.log('Received:', message);
 *   },
 * });
 *
 * @example
 * // Disable toast, handle manually
 * useOnOrderStatusChangedSubscription({
 *   showToast: false,
 *   onNotification: (message) => {
 *     // Custom handling
 *   },
 * });
 *
 */
export function useOnOrderStatusChangedSubscription(
  options: NotificationSubscriptionOptions = {},
) {
  const { showToast = true, onNotification } = options;

  useSubscription({
    ...trpc.platform.event.onOrderStatusChanged.subscriptionOptions(),
    onData: (data) => {
      if (showToast) {
        globalInfoToast(
          `Status order ${data.orderNumber} berubah dari ${data.oldStatus} ke ${data.newStatus}`,
        );
      }

      onNotification?.(
        `Status order ${data.orderNumber} berubah dari ${data.oldStatus} ke ${data.newStatus}`,
      );
    },
  });
}
