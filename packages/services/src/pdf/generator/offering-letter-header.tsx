import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/order.types";
import { OfferingLetterHeader } from "../templates/offering-letter-header";

interface GenerateOfferingLetterHeaderOptions {
  order: OrderWithCompanyAndItems;
  letterNumber: string;
  referenceNumber: string;
  referenceDate: string;
  adminEmail: string;
  adminContact: string;
  logoUrl?: string;
  qrCodeDataURL?: string;
  verificationURL?: string;
}

export const generateOfferingLetterHeaderPdf = async (
  options: GenerateOfferingLetterHeaderOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<OfferingLetterHeader {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
