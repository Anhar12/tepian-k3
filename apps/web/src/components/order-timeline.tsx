import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
} from "@/components/ui/timeline";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@tepian-k3/constants";
import { type OrderStatusHistory } from "@tepian-k3/types/order-status-history.types";

interface OrderTimelineProps {
  history: OrderStatusHistory[];
  /** Optional: customize which statuses to show in the flow */
  statusFlow?: OrderStatus[];
  className?: string;
}

function formatDate(dateString: string): { date: string; time: string } {
  const d = new Date(dateString);
  const date = d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
  const time = d
    .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    .replace(":", ".");
  return { date, time };
}

export function OrderTimeline({
  history,
  statusFlow = ORDER_STATUS_FLOW,
  className,
}: OrderTimelineProps) {
  // Create a map of status -> history record for quick lookup
  const historyMap = new Map<OrderStatus, OrderStatusHistory>();
  history.forEach((h) => {
    // Keep the latest record for each status
    if (
      !historyMap.has(h.status) ||
      new Date(h.createdAt) > new Date(historyMap.get(h.status)!.createdAt)
    ) {
      historyMap.set(h.status, h);
    }
  });

  // Find the current status (latest in history)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const currentStatus = sortedHistory[0]?.status;

  // Determine which statuses are completed (appear before current in the flow)
  const currentIndex = statusFlow.indexOf(currentStatus);

  return (
    <Timeline className={className}>
      {statusFlow.map((status, index) => {
        const isLast = index === statusFlow.length - 1;
        const historyRecord = historyMap.get(status);
        const hasHistory = !!historyRecord;

        // Determine variant: completed if before current, current if matching, pending otherwise
        let variant: "completed" | "current" | "pending" = "pending";
        if (currentIndex >= 0) {
          if (index < currentIndex) {
            variant = "completed";
          } else if (index === currentIndex) {
            variant = "current";
          }
        } else if (hasHistory) {
          // If status not in flow but has history, show as completed
          variant = "completed";
        }

        const { date, time } = hasHistory
          ? formatDate(historyRecord.createdAt)
          : { date: "-", time: "" };

        return (
          <TimelineItem key={status}>
            {/* Date and Time */}
            <TimelineHeader>
              <span>{date}</span>
              {time && <span>{time}</span>}
            </TimelineHeader>

            {/* Timeline Line and Dot */}
            <div className="relative flex flex-col items-center space-y-5">
              <TimelineDot variant={variant} />
              <TimelineConnector
                isLast={isLast}
                variant="dashed"
                color={variant === "pending" ? "gray" : "blue"}
              />
            </div>

            {/* Label */}
            <TimelineContent>
              <span
                className={`text-sm font-medium ${variant === "pending" ? "text-muted-foreground" : "text-foreground"}`}
              >
                {ORDER_STATUS_LABELS[status]}
              </span>
              {historyRecord?.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {historyRecord.note}
                </p>
              )}
            </TimelineContent>
          </TimelineItem>
        );
      })}
    </Timeline>
  );
}
