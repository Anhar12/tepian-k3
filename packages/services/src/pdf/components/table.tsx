import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { tw } from "../utils/tw";

interface TableColumn<T = any> {
  key: string;
  label: string | string[]; // single string or array for multi-line headers
  width: string; // tailwind width class like "w-1/12"
  align?: "left" | "center" | "right";
  format?: (value: any, item: T, index: number) => string | number; // custom formatter
  render?: (value: any, item: T, index: number) => React.ReactNode; // custom render function
}

interface TableProps<T = any> {
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

export const Table = <T extends Record<string, any>>({
  columns,
  data,
  showIndex = false,
  indexLabel = "No.",
  indexWidth = "w-1/12",
  headerClassName = "",
  rowClassName = "",
  cellClassName = "",
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

  const renderCellValue = (item: T, column: TableColumn<T>, index: number) => {
    const value = item[column.key];

    if (column.render) {
      return column.render(value, item, index);
    }

    if (column.format) {
      return column.format(value, item, index);
    }

    return value?.toString() || "-";
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

  return (
    <View style={tw(`mb-6 ${bordered ? "border border-black" : ""}`)}>
      {/* Header Row */}
      <View
        style={tw(
          `flex-row ${bordered ? "border-b border-black" : ""} ${headerClassName}`,
        )}
      >
        {allColumns.map((column, index) => (
          <View
            key={column.key}
            style={tw(
              `${column.width} ${bordered && index < allColumns.length - 1 ? "border-r border-black" : ""} p-2 ${getAlignClass(column.align)}`,
            )}
          >
            {Array.isArray(column.label) ? (
              column.label.map((line, i) => <Text key={i}>{line}</Text>)
            ) : (
              <Text>{column.label}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Data Rows */}
      {data.map((item, rowIndex) => (
        <View key={rowIndex} style={tw(`flex-row ${rowClassName}`)}>
          {allColumns.map((column, colIndex) => {
            const isIndexColumn = column.key === "__index__";
            const content = isIndexColumn
              ? rowIndex + 1
              : renderCellValue(item, column, rowIndex);

            return (
              <View
                key={column.key}
                style={tw(
                  `${column.width} ${bordered && colIndex < allColumns.length - 1 ? "border-r border-black" : ""} p-2 ${getAlignClass(column.align)} ${cellClassName}`,
                )}
              >
                {typeof content === "string" || typeof content === "number" ? (
                  <Text>{content}</Text>
                ) : (
                  content
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};
