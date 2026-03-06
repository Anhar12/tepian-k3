import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Invoice } from "../templates/invoice";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/pengujian/order.types";

interface GenerateInvoiceOptions {
  order: OrderWithCompanyAndItems;
  invoiceNumber: string;
  dueDate?: string;
  logoUrl?: string;
  qrCodeDataURL?: string;
  verificationURL?: string;
}

export const generateInvoicePdf = async (
  options: GenerateInvoiceOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<Invoice {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
