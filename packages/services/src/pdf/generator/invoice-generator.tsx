import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { OrderWithHistory } from "@tepian-k3/types/order.types";

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { marginBottom: 20 },
  table: { display: "flex", width: "auto", marginVertical: 10 },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableHeader: { backgroundColor: "#f0f0f0", fontWeight: "bold" },
  tableCell: { padding: 5, fontSize: 10 },
});

const InvoiceDocument: React.FC<{ order: OrderWithHistory }> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Invoice #{order.orderNumber}</Text>
        <Text>Date: {new Date(order.createdAt).toLocaleDateString()}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { width: "25%" }]}>Cluster</Text>
          <Text style={[styles.tableCell, { width: "25%" }]}>Parameter</Text>
          <Text style={[styles.tableCell, { width: "25%" }]}>Qty</Text>
          <Text style={[styles.tableCell, { width: "25%" }]}>Amount</Text>
        </View>
        {/* Add order items here */}
        {order.items.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {item.parameter.category.cluster.name}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {item.parameter.name}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              {item.quantity}
            </Text>
            <Text style={[styles.tableCell, { width: "25%" }]}>
              Rp {item.subTotal.toLocaleString("id-ID")}
            </Text>
          </View>
        ))}
      </View>

      <View>
        <Text>Total: Rp {order.totalAmount.toLocaleString("id-ID")}</Text>
      </View>
    </Page>
  </Document>
);

export const generateInvoicePdf = async (
  order: OrderWithHistory
): Promise<Buffer> => {
  const stream = await renderToStream(<InvoiceDocument order={order} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
