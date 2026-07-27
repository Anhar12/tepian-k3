import { describe, it, expect, vi } from "vitest";
import {
  getCommonPinningStyles,
  getFilterOperators,
  getDefaultFilterOperator,
  getValidFilters,
} from "../data-table";
import { dataTableConfig } from "@tepian-k3/shared/data-table.config";

describe("data-table utils", () => {
  describe("getCommonPinningStyles", () => {
    it("should return correct styles when not pinned", () => {
      const mockColumn = {
        getIsPinned: () => false,
        getIsLastColumn: () => false,
        getIsFirstColumn: () => false,
        getStart: () => 0,
        getAfter: () => 0,
        getSize: () => 100,
      } as any;

      const styles = getCommonPinningStyles({ column: mockColumn });
      expect(styles).toEqual({
        boxShadow: undefined,
        left: undefined,
        right: undefined,
        opacity: 1,
        position: "relative",
        background: "var(--background)",
        width: 100,
        zIndex: undefined,
      });
    });

    it("should return correct styles for left pinned column", () => {
      const mockColumn = {
        getIsPinned: () => "left",
        getIsLastColumn: (dir: string) => dir === "left",
        getIsFirstColumn: () => false,
        getStart: () => 50,
        getAfter: () => 0,
        getSize: () => 150,
      } as any;

      const styles = getCommonPinningStyles({ column: mockColumn, withBorder: true });
      expect(styles).toEqual({
        boxShadow: "-4px 0 4px -4px var(--border) inset",
        left: "50px",
        right: undefined,
        opacity: 0.97,
        position: "sticky",
        background: "var(--background)",
        width: 150,
        zIndex: 1,
      });
    });

    it("should return correct styles for right pinned column", () => {
      const mockColumn = {
        getIsPinned: () => "right",
        getIsLastColumn: () => false,
        getIsFirstColumn: (dir: string) => dir === "right",
        getStart: () => 0,
        getAfter: () => 50,
        getSize: () => 150,
      } as any;

      const styles = getCommonPinningStyles({ column: mockColumn, withBorder: true });
      expect(styles).toEqual({
        boxShadow: "4px 0 4px -4px var(--border) inset",
        left: undefined,
        right: "50px",
        opacity: 0.97,
        position: "sticky",
        background: "var(--background)",
        width: 150,
        zIndex: 1,
      });
    });
  });

  describe("getFilterOperators", () => {
    it("should return text operators for text variant", () => {
      expect(getFilterOperators("text")).toEqual(dataTableConfig.textOperators);
    });

    it("should return numeric operators for number variant", () => {
      expect(getFilterOperators("number")).toEqual(dataTableConfig.numericOperators);
    });

    it("should fallback to text operators for unknown variant", () => {
      expect(getFilterOperators("unknown" as any)).toEqual(dataTableConfig.textOperators);
    });
  });

  describe("getDefaultFilterOperator", () => {
    it("should return default operator for text variant", () => {
      const defaultOp = getDefaultFilterOperator("text");
      expect(defaultOp).toBe(dataTableConfig.textOperators[0]?.value);
    });

    it("should return default operator for boolean variant", () => {
      const defaultOp = getDefaultFilterOperator("boolean");
      expect(defaultOp).toBe(dataTableConfig.booleanOperators[0]?.value);
    });
  });

  describe("getValidFilters", () => {
    it("should keep filters with valid values", () => {
      const filters = [
        { id: "1", value: "test", operator: "eq" },
        { id: "2", value: ["a"], operator: "inArray" },
        { id: "3", value: 123, operator: "eq" },
      ] as any;
      expect(getValidFilters(filters)).toEqual(filters);
    });

    it("should keep filters with isEmpty and isNotEmpty operators even if value is empty", () => {
      const filters = [
        { id: "1", value: "", operator: "isEmpty" },
        { id: "2", value: [], operator: "isNotEmpty" },
      ] as any;
      expect(getValidFilters(filters)).toEqual(filters);
    });

    it("should remove filters with empty values", () => {
      const filters = [
        { id: "1", value: "", operator: "eq" },
        { id: "2", value: [], operator: "inArray" },
        { id: "3", value: null, operator: "eq" },
        { id: "4", value: undefined, operator: "eq" },
      ] as any;
      expect(getValidFilters(filters)).toEqual([]);
    });
  });
});
