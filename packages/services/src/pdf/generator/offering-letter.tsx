import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { OfferingLetter } from "../templates/offering-letter";
import type { OrderWithCompanyAndItems } from "@tepian-k3/types/order.types";

interface GenerateOfferingLetterOptions {
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

export const generateOfferingLetterPdf = async (
  options: GenerateOfferingLetterOptions
): Promise<Buffer> => {
  const stream = await renderToStream(<OfferingLetter {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
