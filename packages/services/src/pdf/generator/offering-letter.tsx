import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { OfferingLetter } from "../templates/offering-letter";
import type { WorksheetTransactionDetail } from "@tepian-k3/types/worksheet.types";

interface GenerateOfferingLetterOptions {
  worksheet: WorksheetTransactionDetail;
  letterNumber: string;
}

export const generateOfferingLetterPdf = async (
  options: GenerateOfferingLetterOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<OfferingLetter {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
