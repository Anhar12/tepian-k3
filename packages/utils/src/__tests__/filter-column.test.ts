// @ts-nocheck
import { describe, it, expect } from "vitest";
import { filterColumns } from "../filter-column";
import { pgTable, text, boolean, integer, timestamp, PgDialect } from "drizzle-orm/pg-core";
import { AnyColumn, SQL } from "drizzle-orm";

const dummyTable = pgTable("dummy", {
  id: text("id").primaryKey(),
  name: text("name"),
  isActive: boolean("is_active"),
  age: integer("age"),
  createdAt: timestamp("created_at"),
  status: text("status"),
});

// We cast dummyTable to any because filterColumns expects Table from @tepian-k3/db
// However, the underlying Drizzle Table structure is identical.
const table = dummyTable as any;

describe("filterColumns", () => {
  it("should handle iLike operator", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "name", value: "besi", variant: "text", operator: "iLike" }],
      joinOperator: "and",
    });
    
    // ilike produces SQL with parameterized value
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql.toLowerCase()).toContain("ilike");
    expect(sqlStr?.params).toContain("%besi%");
  });

  it("should ignore iLike if value is not string", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "name", value: 123, variant: "text", operator: "iLike" }],
      joinOperator: "and",
    });
    expect(result).toBeUndefined();
  });

  it("should handle eq operator for enum/text", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "status", value: "ready", variant: "text", operator: "eq" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain("=");
    expect(sqlStr?.params).toContain("ready");
  });

  it("should handle eq operator for boolean string", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "isActive", value: "true", variant: "text", operator: "eq" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain("=");
    expect(sqlStr?.params).toContain(true);
  });

  it("should handle inArray operator", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "status", value: ["a", "b"], variant: "text", operator: "inArray" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain("in");
    expect(sqlStr?.params).toEqual(["a", "b"]);
  });

  it("should ignore inArray if value is not array", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "status", value: "not_array", variant: "text", operator: "inArray" }],
      joinOperator: "and",
    });
    expect(result).toBeUndefined();
  });

  it("should handle isBetween operator for dateRange", () => {
    const now = Date.now();
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "createdAt", value: [now.toString(), now.toString()], variant: "dateRange", operator: "isBetween" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain(">=");
    expect(sqlStr?.sql).toContain("<=");
    expect(sqlStr?.params.length).toBe(2);
  });

  it("should handle isEmpty operator", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "name", value: "", variant: "text", operator: "isEmpty" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain("is null");
  });

  it("should handle isNotEmpty operator", () => {
    const result = filterColumns({
      table,
      filters: [ /* @ts-ignore */{ filterId: "f", id: "name", value: "", variant: "text", operator: "isNotEmpty" }],
      joinOperator: "and",
    });
    
    const sqlStr = new PgDialect().sqlToQuery(result as SQL);
    expect(sqlStr?.sql).toContain("not");
  });

  it("should throw error for unknown operator", () => {
    expect(() => {
      filterColumns({
        table,
        filters: [ /* @ts-ignore */{ filterId: "f", id: "name", value: "test", variant: "text", operator: "unknown" as any }],
        joinOperator: "and",
      });
    }).toThrow("Unsupported operator: unknown");
  });

  it("should join multiple conditions with AND or OR", () => {
    const resultAnd = filterColumns({
      table,
      filters: [ /* @ts-ignore */
        { id: "name", value: "test", variant: "text", operator: "eq" },
        { id: "age", value: 20, variant: "number", operator: "eq" }
      ],
      joinOperator: "and",
    });
    
    const sqlStrAnd = new PgDialect().sqlToQuery(resultAnd as SQL);expect(sqlStrAnd?.sql).toContain("and");
    expect(sqlStrAnd?.params).toEqual(["test", 20]);

    const resultOr = filterColumns({
      table,
      filters: [ /* @ts-ignore */
        { id: "name", value: "test", variant: "text", operator: "eq" },
        { id: "age", value: 20, variant: "number", operator: "eq" }
      ],
      joinOperator: "or",
    });
    
    const sqlStrOr = new PgDialect().sqlToQuery(resultOr as SQL);expect(sqlStrOr?.sql).toContain("or");
  });
});
