import type { DocumentType } from "@tepian-k3/constants";

/**
 * Shape of an order used by the notification config.
 * Kept minimal — only the fields the config functions actually need.
 */
export interface NotifiableOrder {
  orderNumber: string;
  status: string;
  userId: string;
  id: string;
  documents: Array<{ type: string; fileUrl: string }>;
}

/**
 * Describes how to build a document-ready notification for a given document type.
 */
export interface DocumentNotificationConfig {
  /** The document type to look up inside `order.documents`. */
  findDocType: DocumentType;
  /**
   * When true, the handler will check whether the order is in `revision` status
   * and update it back to `pending` before sending the notification.
   */
  revisionAware?: boolean;
  /** Builds the notification title. */
  buildTitle: (order: NotifiableOrder, isRevision: boolean) => string;
  /** Builds the notification body message. */
  buildMessage: (order: NotifiableOrder, isRevision: boolean) => string;
  /**
   * Builds the metadata payload attached to the notification.
   *
   * @param docUrl - The resolved public URL of the found document.
   */
  buildMetadata: (docUrl: string) => Record<string, string>;
}

/**
 * Config map for all document types that support customer notifications.
 *
 * To add support for a new document type, add a new entry here.
 * The `notifyCustomer` mutation will pick it up automatically — no schema changes needed.
 */
export const DOCUMENT_NOTIFICATION_CONFIG: Partial<
  Record<DocumentType, DocumentNotificationConfig>
> = {
  offering_document: {
    findDocType: "offering_document",
    revisionAware: true,
    buildTitle: (_order, isRevision) =>
      isRevision
        ? "Dokumen Revisi Order Anda Telah Tersedia"
        : "Dokumen Penawaran Anda Telah Tersedia",
    buildMessage: (order, isRevision) =>
      isRevision
        ? `Dokumen revisi penawaran untuk Order #${order.orderNumber} telah tersedia. Silakan cek dokumen Anda.`
        : `Dokumen penawaran untuk Order #${order.orderNumber} telah tersedia. Silakan cek dokumen Anda.`,
    buildMetadata: (docUrl) => ({ offeringLetterUrl: docUrl }),
  },

  invoice: {
    findDocType: "invoice",
    buildTitle: () => "Invoice Order Anda Telah Tersedia",
    buildMessage: (order) =>
      `Invoice untuk Order #${order.orderNumber} telah tersedia. Silakan lakukan pembayaran.`,
    buildMetadata: (docUrl) => ({ invoiceUrl: docUrl }),
  },

  cooperation_agreement: {
    findDocType: "cooperation_agreement",
    buildTitle: () => "Surat Perjanjian Kerjasama Telah Tersedia",
    buildMessage: (order) =>
      `Surat perjanjian kerjasama untuk Order #${order.orderNumber} telah tersedia. Silakan tinjau dan tanda tangani.`,
    buildMetadata: (docUrl) => ({ cooperationAgreementUrl: docUrl }),
  },
};
