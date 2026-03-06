import { employeeCertifications } from "@tepian-k3/db/schema";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import z from "zod";

const createEmployeeCertificationSchema = createInsertSchema(
  employeeCertifications,
  {
    certificationName: z.string().min(1),
    issuedBy: z.string().min(1),
    issueDate: z.iso.datetime(),
    expiryDate: z.iso.datetime().optional(),
  },
)
  .omit({ employeeId: true, certificate_fileUrl: true })
  .extend({
    file: z.file().max(5 * 1024 * 1024), // Max file size of 5MB
  });

const updateEmployeeCertificationSchema = createUpdateSchema(
  employeeCertifications,
  {
    id: z.uuidv7(),
    certificationName: z.optional(z.string().min(1)),
    issuedBy: z.optional(z.string().min(1)),
    issueDate: z.optional(z.iso.datetime()),
    expiryDate: z.optional(z.iso.datetime()),
  },
)
  .omit({ employeeId: true, certificate_fileUrl: true })
  .extend({
    file: z
      .file()
      .max(5 * 1024 * 1024)
      .optional(), // Max file size of 5MB
  });

const employeeCertificationSchemas = {
  createEmployeeCertificationSchema,
  updateEmployeeCertificationSchema,
};

export default employeeCertificationSchemas;
