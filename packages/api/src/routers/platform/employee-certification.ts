import { z } from "zod";
import { Effect } from "effect";
import {
  createTRPCRouter,
  formDataInput,
  formDataProcedure,
  withPermission,
  withAnyRole,
} from "../..";
import employeeCertificationQueries from "@tepian-k3/queries/platform/employee-certification.queries";
import { runEffect } from "../../utils/run-effect";
import employeeCertificationSchemas from "@tepian-k3/schema/platform/employee-certification.schema";
import {
  processAndUploadFile,
  processAndUploadFileIfPresent,
} from "../../utils/image-upload";

export const employeeCertificationRouter = createTRPCRouter({
  getMyCertifications: withAnyRole(["employee", "sample_collector"]).query(
    async ({ ctx }) =>
      await runEffect(
        employeeCertificationQueries.getMyCertifications(ctx.user.id),
      ),
  ),

  getByEmployee: withPermission("employees.read")
    .input(z.object({ employeeId: z.uuidv7() }))
    .query(
      async ({ input }) =>
        await runEffect(
          employeeCertificationQueries.getEmployeeCertificationsByEmployeeId(
            input.employeeId,
          ),
        ),
    ),

  create: withAnyRole(["employee", "sample_collector"])
    .input(formDataInput)
    .use(
      formDataProcedure(
        employeeCertificationSchemas.createEmployeeCertificationSchema,
      ),
    )
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadFile(
            ctx.input.data.file,
            {
              folder: "employee-certifications",
            },
          );

          const result =
            yield* employeeCertificationQueries.createEmployeeCertification(
              ctx.user.id,
              ctx.input.data,
              uploadedFile.key,
            );

          return result;
        }),
      ),
    ),

  update: withAnyRole(["employee", "sample_collector"])
    .input(formDataInput)
    .use(
      formDataProcedure(
        employeeCertificationSchemas.updateEmployeeCertificationSchema,
      ),
    )
    .mutation(async ({ ctx }) =>
      runEffect(
        Effect.gen(function* () {
          const uploadedFile = yield* processAndUploadFileIfPresent(
            ctx.input.data.file,
            {
              folder: "employee-certifications",
            },
          );

          const result =
            yield* employeeCertificationQueries.updateEmployeeCertification(
              ctx.input.data.id,
              ctx.user.id,
              ctx.input.data,
              uploadedFile,
            );

          return result;
        }),
      ),
    ),

  delete: withAnyRole(["employee", "sample_collector"])
    .input(z.object({ certificationId: z.uuidv7() }))
    .mutation(async ({ ctx, input }) =>
      runEffect(
        employeeCertificationQueries.delete(input.certificationId, ctx.user.id),
      ),
    ),
});
