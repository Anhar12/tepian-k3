import { describe, it, expect } from "vitest";
import { getSortingStateParser, getFiltersStateParser } from "../parsers";

describe("parsers", () => {
  describe("getSortingStateParser", () => {
    it("should parse valid JSON", () => {
      const parser = getSortingStateParser<any>();
      const result = parser.parse('[{"id":"name","desc":true}]');
      expect(result).toEqual([{ id: "name", desc: true }]);
    });

    it("should return null for invalid JSON", () => {
      const parser = getSortingStateParser<any>();
      expect(parser.parse('not json')).toBeNull();
    });

    it("should return null for invalid schema", () => {
      const parser = getSortingStateParser<any>();
      expect(parser.parse('[{"id":"name","desc":"not a boolean"}]')).toBeNull();
    });

    it("should return null if columnIds are restricted and an id is invalid", () => {
      const parser = getSortingStateParser<any>(["name"]);
      expect(parser.parse('[{"id":"age","desc":true}]')).toBeNull();
    });

    it("should serialize correctly", () => {
      const parser = getSortingStateParser<any>();
      expect(parser.serialize([{ id: "name", desc: true }])).toBe('[{"id":"name","desc":true}]');
    });

    it("should test equality", () => {
      const parser = getSortingStateParser<any>();
      expect(parser.eq([{ id: "name", desc: true }], [{ id: "name", desc: true }])).toBe(true);
      expect(parser.eq([{ id: "name", desc: true }], [{ id: "name", desc: false }])).toBe(false);
      expect(parser.eq([{ id: "name", desc: true }], [])).toBe(false);
    });
  });

  describe("getFiltersStateParser", () => {
    it("should parse valid JSON", () => {
      const parser = getFiltersStateParser<any>();
      const result = parser.parse('[{"id":"name","value":"test","variant":"text","operator":"eq","filterId":"f1"}]');
      expect(result).toEqual([{ id: "name", value: "test", variant: "text", operator: "eq", filterId: "f1" }]);
    });

    it("should return null for invalid JSON", () => {
      const parser = getFiltersStateParser<any>();
      expect(parser.parse('not json')).toBeNull();
    });

    it("should return null for invalid schema", () => {
      const parser = getFiltersStateParser<any>();
      expect(parser.parse('[{"id":"name","value":"test","variant":"invalid","operator":"eq","filterId":"f1"}]')).toBeNull();
    });

    it("should return null if columnIds are restricted and an id is invalid", () => {
      const parser = getFiltersStateParser<any>(["name"]);
      expect(parser.parse('[{"id":"age","value":"test","variant":"text","operator":"eq","filterId":"f1"}]')).toBeNull();
    });

    it("should serialize correctly", () => {
      const parser = getFiltersStateParser<any>();
      const val = [{ id: "name", value: "test", variant: "text", operator: "eq", filterId: "f1" }] as any;
      expect(parser.serialize(val)).toBe('[{"id":"name","value":"test","variant":"text","operator":"eq","filterId":"f1"}]');
    });

    it("should test equality", () => {
      const parser = getFiltersStateParser<any>();
      const a = [{ id: "name", value: "test", variant: "text", operator: "eq", filterId: "f1" }] as any;
      const b = [{ id: "name", value: "test", variant: "text", operator: "eq", filterId: "f1" }] as any;
      const c = [{ id: "name", value: "test2", variant: "text", operator: "eq", filterId: "f1" }] as any;
      expect(parser.eq(a, b)).toBe(true);
      expect(parser.eq(a, c)).toBe(false);
    });
  });
});
