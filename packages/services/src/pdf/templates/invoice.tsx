import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { Letterhead } from "../components/letterhead";
import { QRCodeImage } from "../components/qrcode";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/pengujian/order.types";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  section: {
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    textDecoration: "underline",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 150,
  },
  colon: {
    width: 20,
  },
  value: {
    flex: 1,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
    fontSize: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    fontSize: 10,
  },
  tableColNo: {
    width: "8%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  tableColParameter: {
    width: "42%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
  },
  tableColQty: {
    width: "10%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  tableColUnit: {
    width: "15%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  tableColPrice: {
    width: "25%",
    padding: 8,
    textAlign: "right",
  },
  summarySection: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    width: "50%",
    marginBottom: 5,
  },
  summaryLabel: {
    flex: 1,
    textAlign: "right",
    paddingRight: 10,
  },
  summaryValue: {
    width: "40%",
    textAlign: "right",
    paddingRight: 8,
  },
  totalRow: {
    flexDirection: "row",
    width: "50%",
    marginTop: 5,
    paddingTop: 5,
    borderTopWidth: 2,
    borderTopColor: "#000",
    fontWeight: "bold",
  },
  notes: {
    marginTop: 20,
    fontSize: 10,
    lineHeight: 1.5,
  },
  noteTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  noteItem: {
    marginLeft: 15,
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 9,
    textAlign: "center",
    color: "#666",
  },
});

interface InvoiceProps {
  order: OrderWithCompanyAndItems;
  invoiceNumber: string;
  dueDate?: string;
  logoUrl?: string;
  qrCodeDataURL?: string;
  verificationURL?: string;
}

export const Invoice: React.FC<InvoiceProps> = ({
  order,
  invoiceNumber,
  dueDate,
  logoUrl,
  qrCodeDataURL,
  verificationURL,
}) => {
  const invoiceDate = new Date(order.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // Calculate subtotal (assuming no tax for now, adjust as needed)
  const subtotal = order.totalAmount;
  const tax = 0; // Add tax calculation if needed
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Letterhead logoUrl={logoUrl} />

        {/* Invoice Title */}
        <Text style={styles.title}>INVOICE / TAGIHAN</Text>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor Invoice</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor Order</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.orderNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Invoice</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{invoiceDate}</Text>
          </View>
          {dueDate && (
            <View style={styles.row}>
              <Text style={styles.label}>Jatuh Tempo</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>{dueDate}</Text>
            </View>
          )}
        </View>

        {/* Company Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Kepada Yth.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Perusahaan</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.company?.name || "Personal Order"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Alamat</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.company?.address || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kota</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{order.company?.regency?.name || "-"}</Text>
          </View>
          {order.company?.responsibleTestingPersonPhone && (
            <View style={styles.row}>
              <Text style={styles.label}>Telepon</Text>
              <Text style={styles.colon}>:</Text>
              <Text style={styles.value}>
                {order.company?.responsibleTestingPersonPhone}
              </Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.tableColNo}>No.</Text>
            <Text style={styles.tableColParameter}>Parameter Pengujian</Text>
            <Text style={styles.tableColQty}>Qty</Text>
            <Text style={styles.tableColUnit}>Satuan</Text>
            <Text style={styles.tableColPrice}>Harga (Rp)</Text>
          </View>

          {/* Table Rows */}
          {order.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.tableColNo}>{index + 1}</Text>
              <Text style={styles.tableColParameter}>
                {item.type === "pelatihan" 
                  ? item.pelatihan?.title || "Pelatihan"
                  : item.parameter?.name || "Pengujian"}
                {item.type === "pengujian" && item.parameter?.category?.cluster && (
                  <Text style={{ fontSize: 9, color: "#666" }}>
                    {"\n"}Cluster: {item.parameter.category.cluster.name}
                  </Text>
                )}
              </Text>
              <Text style={styles.tableColQty}>{item.quantity}</Text>
              <Text style={styles.tableColUnit}>
                {item.type === "pelatihan" ? "Orang" : (item.parameter?.unit || "-")}
              </Text>
              <Text style={styles.tableColPrice}>
                {formatCurrency(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
          </View>
          {tax > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.summaryLabel}>TOTAL:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          </View>
        </View>

        {/* Payment Notes */}
        <View style={styles.notes}>
          <Text style={styles.noteTitle}>Catatan Pembayaran:</Text>
          <Text style={styles.noteItem}>
            • Pembayaran dilakukan melalui sistem billing yang akan dikirimkan
            setelah invoice ini disetujui.
          </Text>
          <Text style={styles.noteItem}>
            • Setelah pembayaran, mohon konfirmasi melalui email atau WhatsApp
            Admin Pengujian.
          </Text>
          <Text style={styles.noteItem}>
            • Penjadwalan pengujian akan dilakukan setelah pembayaran diterima.
          </Text>
          <Text style={styles.noteItem}>
            • Invoice ini berlaku sebagai tagihan resmi dari Balai K3 Samarinda.
          </Text>
        </View>

        {/* QR Code for verification */}
        {qrCodeDataURL && (
          <QRCodeImage
            qrCodeDataURL={qrCodeDataURL}
            label="Scan untuk verifikasi keaslian dokumen"
            verificationText={verificationURL}
          />
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Dokumen ini digenerate secara otomatis oleh sistem Balai K3 Samarinda
          {"\n"}
          Tanggal cetak: {new Date().toLocaleString("id-ID")}
        </Text>
      </Page>
    </Document>
  );
};
