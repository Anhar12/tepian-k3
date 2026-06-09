import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineDot,
  TimelineContent,
  TimelineHeader,
} from "@/components/ui/timeline";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getPublicUrl } from "@/utils/url";
import { Fragment, type KeyboardEvent } from "react";
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  resolveOrderStatusFlowIndex,
  type DocumentType,
  type OrderStatus,
} from "@tepian-k3/constants";
import { type OrderStatusHistory } from "@tepian-k3/types/pengujian/order-status-history.types";
import { format } from "date-fns";
import { Printer } from "lucide-react";

/**
 * Maps each milestone status to the document type(s) generated at that step.
 * A milestone only becomes clickable (to re-open/re-print) when at least one of
 * these documents already exists with a file URL.
 */
const STATUS_DOCUMENT_TYPES: Partial<Record<OrderStatus, DocumentType[]>> = {
  penawaran_diterbitkan: ["offering_document"],
  tagihan_diterbitkan: ["invoice", "cooperation_agreement"],
  menunggu_penerbitan_spt_jadwal: ["assignment_letter"],
  laporan_diterbitkan: ["testing_report"],
};

/** Human-readable (Bahasa Indonesia) labels for the re-printable documents. */
const REPRINT_DOCUMENT_LABELS: Partial<Record<DocumentType, string>> = {
  offering_document: "Surat Penawaran",
  invoice: "Invoice",
  cooperation_agreement: "SPK",
  assignment_letter: "Surat SPT",
  testing_report: "Laporan Hasil Uji",
};

/** Minimal shape of an order document needed to re-open it from the timeline. */
export interface TimelineDocument {
  type: string;
  fileUrl: string | null;
}

/**
 * Formats a note string for display. If the note matches a known OrderStatus key,
 * returns the human-readable label. Otherwise converts snake_case to Title Case.
 *
 * @param note - Raw note string, possibly a snake_case status key
 * @returns Human-readable formatted string
 */
function formatNote(note: string): string {
  if (note in ORDER_STATUS_LABELS) {
    return ORDER_STATUS_LABELS[note as OrderStatus];
  }
  return note
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface OrderTimelineProps {
  history: OrderStatusHistory[];
  /** Optional: customize which statuses to show in the flow */
  statusFlow?: OrderStatus[];
  /**
   * Order documents. When provided, a reached milestone whose associated
   * document already exists becomes clickable to re-open/re-print it.
   */
  documents?: TimelineDocument[];
  className?: string;
}

function formatDate(dateString: string): { date: string; time: string } {
  const d = new Date(dateString);
  const date = format(d, "dd MMM yyyy");
  const time = format(d, "HH:mm");
  return { date, time };
}

export function OrderTimeline({
  history,
  statusFlow = ORDER_STATUS_FLOW,
  documents = [],
  className,
}: OrderTimelineProps) {
  // Lookup of existing documents by type (only those with a usable file URL).
  const documentByType = new Map<string, TimelineDocument>();
  documents.forEach((doc) => {
    if (doc.fileUrl) documentByType.set(doc.type, doc);
  });

  /** Resolves the re-printable documents available for a given milestone. */
  const getMilestoneDocuments = (status: OrderStatus) =>
    (STATUS_DOCUMENT_TYPES[status] ?? [])
      .map((type) => {
        const doc = documentByType.get(type);
        return doc?.fileUrl
          ? {
              fileUrl: doc.fileUrl,
              label: REPRINT_DOCUMENT_LABELS[type] ?? type,
            }
          : null;
      })
      .filter((d): d is { fileUrl: string; label: string } => d !== null);

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

  // Determine which statuses are completed (appear before current in the flow).
  // Granular in-between statuses (e.g. kaji_ulang_disetujui) are resolved to the
  // milestone they currently sit on so the active step renders blue and the
  // prior steps render as completed green checks.
  let currentIndex =
    currentStatus && !isRevisionStatus
      ? resolveOrderStatusFlowIndex(currentStatus, statusFlow)
      : -1;

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
    milestoneDocs: { fileUrl: string; label: string }[] = [],
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

    // A reached milestone with an existing document can be re-opened/re-printed.
    const isClickable =
      (variant === "completed" || variant === "current") &&
      milestoneDocs.length > 0;
    const openDocuments = () => {
      milestoneDocs.forEach((doc) =>
        window.open(getPublicUrl(doc.fileUrl), "_blank"),
      );
    };

    return (
      <TimelineItem
        key={status}
        {...(isClickable
          ? {
              role: "button",
              tabIndex: 0,
              onClick: openDocuments,
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDocuments();
                }
              },
              title: `Klik untuk membuka ulang: ${milestoneDocs
                .map((d) => d.label)
                .join(", ")}`,
              className:
                "-mx-1 cursor-pointer rounded-lg px-1 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
            }
          : {})}
      >
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
            className={`text-xs font-medium sm:text-sm ${variant === "pending" ? "text-muted-foreground" : "text-foreground"}`}
          >
            {ORDER_STATUS_LABELS[status]}
          </span>
          {record?.note && (
            <Popover>
              <PopoverTrigger asChild>
                <p
                  className="mt-0.5 line-clamp-2 max-w-24 cursor-pointer text-[10px] text-muted-foreground hover:text-foreground sm:max-w-40 sm:text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formatNote(record.note)}
                </p>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="max-w-60 sm:max-w-xs"
              >
                <p className="text-sm">{formatNote(record.note)}</p>
              </PopoverContent>
            </Popover>
          )}
          {isClickable && (
            <span className="mt-1 flex items-center gap-1 text-[10px] font-medium text-blue-600 sm:text-xs">
              <Printer className="h-3 w-3" />
              Cetak ulang
            </span>
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
              getMilestoneDocuments(status),
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
