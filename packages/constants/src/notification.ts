export const NOTIFICATION_TYPES = [
  "order_status_changed",
  "payment_received",
  "payment_rejected",
  "testing_started",
  "testing_completed",
  "document_ready",
  "document_signed",
  "assignment_received",
  "system_announcement",
  "general",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  order_status_changed: "Order Status Changed",
  payment_received: "Payment Received",
  payment_rejected: "Payment Rejected",
  testing_started: "Testing Started",
  testing_completed: "Testing Completed",
  document_ready: "Document Ready",
  document_signed: "Document Signed",
  assignment_received: "Assignment Received",
  system_announcement: "System Announcement",
  general: "General Notification",
};

export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  order_status_changed: "bg-blue-100 text-blue-700",
  payment_received: "bg-green-100 text-green-700",
  payment_rejected: "bg-red-100 text-red-700",
  testing_started: "bg-purple-100 text-purple-700",
  testing_completed: "bg-green-100 text-green-700",
  document_ready: "bg-indigo-100 text-indigo-700",
  document_signed: "bg-teal-100 text-teal-700",
  assignment_received: "bg-orange-100 text-orange-700",
  system_announcement: "bg-yellow-100 text-yellow-700",
  general: "bg-gray-100 text-gray-700",
};
