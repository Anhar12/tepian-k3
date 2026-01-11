import React from "react";
import { View, Image, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 10,
  },
  qrImage: {
    width: 120,
    height: 120,
  },
  label: {
    fontSize: 8,
    marginTop: 5,
    textAlign: "center",
    color: "#666",
  },
  verificationText: {
    fontSize: 6,
    marginTop: 3,
    textAlign: "center",
    color: "#999",
    maxWidth: 500,
    hyphenationCallback: (word: string) => [word],
  },
});

interface QRCodeImageProps {
  /**
   * The QR code data URL (base64 encoded image)
   */
  qrCodeDataURL: string;
  /**
   * Optional label to display below the QR code
   */
  label?: string;
  /**
   * Optional verification text/URL to display
   */
  verificationText?: string;
  /**
   * Custom width for the QR code (default: 120)
   */
  width?: number;
  /**
   * Custom height for the QR code (default: 120)
   */
  height?: number;
}

/**
 * QRCode component for PDF templates
 * Displays a QR code image with optional label and verification text
 */
export const QRCodeImage: React.FC<QRCodeImageProps> = ({
  qrCodeDataURL,
  label = "Scan untuk verifikasi dokumen",
  verificationText,
  width = 120,
  height = 120,
}) => {
  return (
    <View style={styles.container}>
      <Image src={qrCodeDataURL} style={[styles.qrImage, { width, height }]} />
      {label && <Text style={styles.label}>{label}</Text>}
      {verificationText && (
        <Text style={styles.verificationText}>{verificationText}</Text>
      )}
    </View>
  );
};
