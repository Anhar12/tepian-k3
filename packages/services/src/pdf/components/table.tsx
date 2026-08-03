import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

type NestedKeyOf<T> = {
  [K in keyof T & string]: T[K] extends object
    ? T[K] extends unknown[]
      ? K
      : K | `${K}.${NestedKeyOf<T[K]>}`
    : K;
}[keyof T & string];

export interface TableColumn<T = Record<string, unknown>> {
  key: NestedKeyOf<T> | (string & {}); // Preserves autocomplete while allowing any string
  label: string | string[]; // single string or array for multi-line headers
  width: string; // tailwind width class like "w-1/12"
  align?: "left" | "center" | "right";
  defaultValue?: string | number; // Default value when cell is empty/undefined
  format?: (value: unknown, item: T, index: number) => string | number; // custom formatter
  render?: (value: unknown, item: T, index: number) => React.ReactNode; // custom render function
}

interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  showIndex?: boolean;
  indexLabel?: string;
  indexWidth?: string;
  headerClassName?: string;
  rowClassName?: string;
  cellClassName?: string;
  bordered?: boolean;
}

export const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  showIndex = false,
  indexLabel = "No.",
  indexWidth = "w-1/12",
  headerClassName,
  rowClassName,
  cellClassName,
  bordered = true,
}: TableProps<T>) => {
  const getAlignClass = (align?: string) => {
    switch (align) {
      case "left":
        return "text-left";
      case "right":
        return "text-right";
      case "center":
      default:
        return "text-center";
    }
  };

  // Helper function to get nested value from object using dot notation
  const getNestedValue = (
    obj: Record<string, unknown>,
    path: string,
  ): unknown => {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current != null && typeof current === "object" && key in current) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  };

  const renderCellValue = (item: T, column: TableColumn<T>, index: number) => {
    // Get value using nested key path
    const value = getNestedValue(item, column.key);

    if (column.render) {
      return column.render(value, item, index);
    }

    if (column.format) {
      return column.format(value, item, index);
    }

    // Check if value exists (not null or undefined)
    if (value != null && value !== "") {
      return String(value);
    }

    // Check if defaultValue is explicitly set (even if it's an empty string or 0)
    if (column.defaultValue !== undefined) {
      return column.defaultValue.toString();
    }

    // Final fallback
    return "-";
  };

  const allColumns = showIndex
    ? [
        {
          key: "__index__",
          label: indexLabel,
          width: indexWidth,
          align: "center" as const,
        },
        ...columns,
      ]
    : columns;

  // Helper function to build class string without empty strings
  const buildClassString = (
    ...classes: (string | false | undefined | null)[]
  ) => {
    return classes.filter((cls) => cls && cls.trim() !== "").join(" ");
  };

  const headerBorderClass = bordered
    ? "border-t border-b border-l border-r border-black"
    : "";
  const rowBorderClass = bordered
    ? "border-b border-l border-r border-black"
    : "";

  return (
    <View style={tw("mb-6")}>
      {/* Header Row */}
      <View
        style={tw(
          buildClassString("flex-row", headerBorderClass, headerClassName),
        )}
        fixed
      >
        {allColumns.map((column, index) => {
          const borderRightClass =
            bordered && index < allColumns.length - 1
              ? "border-r border-black"
              : "";

          return (
            <View
              key={column.key}
              style={tw(
                buildClassString(
                  column.width,
                  borderRightClass,
                  "p-2",
                  getAlignClass(column.align),
                ),
              )}
            >
              {Array.isArray(column.label) ? (
                column.label.map((line, i) => <Text key={i}>{line}</Text>)
              ) : (
                <Text>{column.label}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Data Rows */}
      {data.map((item, rowIndex) => {
        return (
          <View
            key={rowIndex}
            style={tw(
              buildClassString("flex-row", rowBorderClass, rowClassName),
            )}
            wrap={false}
          >
            {allColumns.map((column, colIndex) => {
              const isIndexColumn = column.key === "__index__";
              const content = isIndexColumn
                ? rowIndex + 1
                : renderCellValue(item, column, rowIndex);

              const borderRightClass =
                bordered && colIndex < allColumns.length - 1
                  ? "border-r border-black"
                  : "";

              return (
                <View
                  key={`${column.key}-${colIndex}`}
                  style={tw(
                    buildClassString(
                      column.width,
                      borderRightClass,
                      "p-2",
                      getAlignClass(column.align),
                      cellClassName,
                    ),
                  )}
                >
                  {typeof content === "string" ||
                  typeof content === "number" ? (
                    <Text>{content}</Text>
                  ) : (
                    content
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};
