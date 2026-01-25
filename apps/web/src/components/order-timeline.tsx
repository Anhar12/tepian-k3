import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
} from "@/components/ui/timeline";
import { Fragment } from "react";
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
  const isRevisionStatus = currentStatus === "revision";

  // Determine which statuses are completed (appear before current in the flow)
  let currentIndex = currentStatus ? statusFlow.indexOf(currentStatus) : -1;

  // If current status is "revision" (not in flow), find the last completed status in the flow
  if (currentIndex < 0 && isRevisionStatus) {
    // Find the highest index in statusFlow that has history
    for (let i = statusFlow.length - 1; i >= 0; i--) {
      const status = statusFlow[i];
      if (status && historyMap.has(status)) {
        currentIndex = i;
        break;
      }
    }
  }

  // Build timeline items - insert revision after the last completed status
  const revisionRecord = historyMap.get("revision");
  const revisionInsertIndex = isRevisionStatus ? currentIndex + 1 : -1;

  const renderTimelineItem = (
    status: OrderStatus,
    variant: "completed" | "current" | "pending" | "revision",
    isLast: boolean,
    record?: OrderStatusHistory,
    overrideConnectorColor?: "blue" | "gray" | "green" | "yellow",
  ) => {
    const { date, time } = record
      ? formatDate(record.createdAt)
      : { date: "-", time: "" };

    const connectorColor =
      overrideConnectorColor ??
      (variant === "pending"
        ? "gray"
        : variant === "revision"
          ? "yellow"
          : "blue");

    return (
      <TimelineItem key={status}>
        <TimelineHeader>
          <span>{date}</span>
          {time && <span>{time}</span>}
        </TimelineHeader>
        <div className="relative flex flex-col items-center space-y-5">
          <TimelineDot variant={variant} />
          <TimelineConnector
            isLast={isLast}
            variant="dashed"
            color={connectorColor}
          />
        </div>
        <TimelineContent>
          <span
            className={`text-sm font-medium ${variant === "pending" ? "text-muted-foreground" : "text-foreground"}`}
          >
            {ORDER_STATUS_LABELS[status]}
          </span>
          {record?.note && (
            <p className="mt-0.5 max-h-4 w-32 overflow-y-auto text-xs text-muted-foreground">
              {record.note}
            </p>
          )}
        </TimelineContent>
      </TimelineItem>
    );
  };

  return (
    <Timeline className={className}>
      {statusFlow.map((status, index) => {
        const historyRecord = historyMap.get(status);
        const hasHistory = !!historyRecord;

        // Determine variant
        let variant: "completed" | "current" | "pending" = "pending";
        if (currentIndex >= 0) {
          if (index < currentIndex) {
            variant = "completed";
          } else if (index === currentIndex) {
            variant = isRevisionStatus ? "completed" : "current";
          }
        } else if (hasHistory) {
          variant = "completed";
        }

        // Check if revision should be inserted after this item
        const shouldInsertRevision =
          isRevisionStatus &&
          revisionRecord &&
          index + 1 === revisionInsertIndex;

        // Determine if this is the last item (considering revision insertion)
        const isLast = index === statusFlow.length - 1 && !shouldInsertRevision;

        // Override connector color to yellow if revision follows this item
        const connectorColor = shouldInsertRevision
          ? "yellow"
          : variant === "pending"
            ? "gray"
            : "blue";

        // Revision is not the last item - there are still pending items after it
        const isRevisionLast = index === statusFlow.length - 1;

        return (
          <Fragment key={status}>
            {renderTimelineItem(
              status,
              variant,
              isLast,
              historyRecord,
              connectorColor,
            )}
            {shouldInsertRevision &&
              renderTimelineItem(
                "revision",
                "revision",
                isRevisionLast,
                revisionRecord,
              )}
          </Fragment>
        );
      })}
    </Timeline>
  );
}
