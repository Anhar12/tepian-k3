import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { AssignmentLetter } from "../templates/assignment-letter";
import type { WorksheetAssignmentDetail } from "@tepian-k3/types/pengujian/worksheet-assignment.types";

interface GenerateAssignmentLetterOptions {
  companyName: string;
  companyRegency: string;
  orderDate: string;
  assignmentDateStart: string;
  assignmentDateEnd: string;
  letterNumber: string;
  assignmentLetterNumber: string;
  financingSource: string;
  assignees: WorksheetAssignmentDetail[];
}

export const generateAssignmentLetterPdf = async (
  options: GenerateAssignmentLetterOptions,
): Promise<Buffer> => {
  const stream = await renderToStream(<AssignmentLetter {...options} />);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
};
