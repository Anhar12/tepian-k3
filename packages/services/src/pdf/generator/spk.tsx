import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { Spk } from "../templates/spk";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/pengujian/worksheet.types";

interface GenerateSpkOptions {
  worksheet: WorksheetTransactionDetail;
  companyName: string;
  letterNumber: string;
  agreementDate: string;
  companyRepName: string;
  companyRepPosition: string;
  companyRepAddress: string;
  companyBankName: string;
  companyBankAccount: string;
  companyBankAccountName: string;
  operationalBankName: string;
  operationalBankAccount: string;
  operationalBankAccountName: string;
}

export const generateSpkPdf = async (
  options: GenerateSpkOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<Spk {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
