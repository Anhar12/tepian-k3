import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Tagihan } from "../templates/tagihan";

interface GenerateTagihanOptions {
  companyName: string;
  companyRegency: string;
  letterNumber: string;
  referenceNumber: string;
  referenceDate: string;
  billingCode: string;
  billingAmount: number;
  operationalAmount: number;
  billingExpiryDate: string;
  operationalBankAccount?: string;
  operationalBankAccountName?: string;
}

export const generateTagihanPdf = async (
  options: GenerateTagihanOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<Tagihan {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
