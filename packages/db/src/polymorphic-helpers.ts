import { eq, and, SQL } from "drizzle-orm";
import { documents } from "./schema";
import type { DocumentEntityType } from "@tepian-k3/constants";

/**
 * Helper function to create a WHERE condition for polymorphic document queries
 *
 * @example
 * // Get all documents for an order
 * const orderDocuments = await db.query.documents.findMany({
 *   where: whereEntityIs("order", orderId),
 * });
 */
export const whereEntityIs = (
  entityType: DocumentEntityType,
  entityId: string,
): SQL => {
  return and(
    eq(documents.entityType, entityType),
    eq(documents.entityId, entityId),
  ) as SQL;
};

/**
 * Helper to get the correct relation name based on entity type
 * Useful for including the correct relation in queries
 *
 * @example
 * const doc = await db.query.documents.findFirst({
 *   where: whereEntityIs("order", orderId),
 *   with: {
 *     [getEntityRelationName("order")]: true,
 *   },
 * });
 */
export const getEntityRelationName = (
  entityType: DocumentEntityType,
): "order" | "testing" | "userCompany" | "user" => {
  switch (entityType) {
    case "order":
      return "order";
    case "testing":
      return "testing";
    case "user_company":
      return "userCompany";
    case "user":
      return "user";
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
};

/**
 * Type guard to check if a document belongs to a specific entity type
 */
export const isDocumentOfType = <T extends DocumentEntityType>(
  document: { entityType: DocumentEntityType },
  type: T,
): document is typeof document & { entityType: T } => {
  return document.entityType === type;
};
