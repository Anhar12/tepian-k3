import { Effect } from "effect";
import { TRPCError } from "@trpc/server";
import { eq, isNull, and } from "@tepian-k3/db";
import { db } from "@tepian-k3/db/client";
import { employeeCertifications } from "@tepian-k3/db/schema";
import type { z } from "zod";
import employeeCertificationSchemas from "@tepian-k3/schema/platform/employee-certification.schema";
import employeeQueries from "./employee.queries";
import {
  deleteStorageFile,
  replaceStorageFile,
} from "../helpers/storage.helpers";
import { logError } from "effect/Effect";

const employeeCertificationQueries = {
  /**
   * Fetches all certifications belonging to the currently authenticated user.
   * Resolves the employee record from the userId first.
   * Returns an empty array if no employee record is linked to the user yet.
   *
   * @param userId - The user ID from the JWT context.
   * @returns An Effect that resolves to an array of certifications, or [] if no employee record exists.
   */
  getMyCertifications: (userId: string) =>
    Effect.gen(function* () {
      const employee = yield* employeeQueries.getEmployeeByUserId(userId);

      if (!employee) {
        return [];
      }

      return yield* employeeCertificationQueries.getEmployeeCertificationsByEmployeeId(
        employee.id,
      );
    }),

  /**
   * Fetches all certifications for a given employee ID.
   *
   * @param employeeId - The ID of the employee whose certifications are to be fetched.
   * @returns An Effect that resolves to an array of employee certifications.
   */
  getEmployeeCertificationsByEmployeeId: (employeeId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employeeCertifications.findMany({
          where: and(
            eq(employeeCertifications.employeeId, employeeId),
            isNull(employeeCertifications.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "employeeCertificationsQueries.getEmployeeCertificationsByEmployeeId",
          "Failed to fetch employee certifications by employee ID",
          { error, employeeId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data sertifikasi karyawan",
        });
      },
    }),

  /**
   * Fetches a specific certification by its ID.
   * @param certificationId - The ID of the certification to be fetched.
   * @returns An Effect that resolves to the employee certification if found, or null if not found.
   */
  getCertificateById: (certificationId: string) =>
    Effect.tryPromise({
      try: () =>
        db.query.employeeCertifications.findFirst({
          where: and(
            eq(employeeCertifications.id, certificationId),
            isNull(employeeCertifications.deletedAt),
          ),
        }),
      catch: (error) => {
        logError(
          "employeeCertificationsQueries.getCertificateById",
          "Failed to fetch employee certification by ID",
          { error, certificationId },
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data sertifikasi karyawan",
        });
      },
    }),

  /**
   * Fetches a specific certification by its ID and verifies it belongs to the given user.
   *
   * @param certificationId - The ID of the certification to fetch.
   * @param userId - The user ID (from JWT context) to verify ownership against.
   * @returns An Effect that resolves to the certification, or fails with NOT_FOUND / FORBIDDEN.
   */
  getCertificateByIdAndVerifyOwner: (certificationId: string, userId: string) =>
    Effect.gen(function* () {
      const employee = yield* employeeQueries.getEmployeeByUserId(userId);

      if (!employee) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Karyawan tidak ditemukan",
          }),
        );
      }

      const cert =
        yield* employeeCertificationQueries.getCertificateById(certificationId);

      if (!cert) {
        return yield* Effect.fail(
          new TRPCError({
            code: "NOT_FOUND",
            message: "Sertifikasi karyawan tidak ditemukan",
          }),
        );
      }

      if (cert.employeeId !== employee.id) {
        return yield* Effect.fail(
          new TRPCError({
            code: "FORBIDDEN",
            message: "Anda tidak memiliki akses ke sertifikasi ini",
          }),
        );
      }

      return cert;
    }),

  /**
   * Creates a new employee certification record in the database.
   * @param userId - The ID of the user associated with the employee.
   * @param data - The data for the new employee certification, excluding employeeId and certificate_fileUrl.
   * @param url - The URL of the certification file to be stored in the database.
   * @returns An Effect that resolves to the newly created employee certification record.
   */
  createEmployeeCertification: (
    userId: string,
    data: z.infer<
      typeof employeeCertificationSchemas.createEmployeeCertificationSchema
    >,
    url: string,
  ) =>
    Effect.gen(function* () {
      const isEmployeeExists =
        yield* employeeQueries.getEmployeeByUserId(userId);

      if (!isEmployeeExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Karyawan tidak ditemukan",
        });
      }

      const [newCertification] = yield* Effect.tryPromise({
        try: () =>
          db
            .insert(employeeCertifications)
            .values({
              ...data,
              certificate_fileUrl: url,
              employeeId: isEmployeeExists.id,
            })
            .returning(),
        catch: (error) => {
          logError(
            "employeeCertificationsQueries.createEmployeeCertification",
            "Failed to create employee certification",
            { error, userId, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat sertifikasi karyawan",
          });
        },
      });

      if (!newCertification) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal membuat sertifikasi karyawan",
          }),
        );
      }

      return newCertification;
    }),

  /**
   * Updates an existing employee certification record in the database.
   * @param certificationId - The ID of the certification to be updated.
   * @param userId - The ID of the user associated with the employee.
   * @param data - The updated data for the employee certification, excluding employeeId and certificate_fileUrl.
   * @param url - The new URL of the certification file to be stored in the database (optional).
   * @returns An Effect that resolves to the updated employee certification record.
   */
  updateEmployeeCertification: (
    certificationId: string,
    userId: string,
    data: z.infer<
      typeof employeeCertificationSchemas.updateEmployeeCertificationSchema
    >,
    url?: string,
  ) =>
    Effect.gen(function* () {
      const isCertificationExists =
        yield* employeeCertificationQueries.getCertificateByIdAndVerifyOwner(
          certificationId,
          userId,
        );

      const [updatedCertification] = yield* Effect.tryPromise({
        try: () =>
          db
            .update(employeeCertifications)
            .set({
              ...data,
              certificate_fileUrl: url,
            })
            .where(
              and(
                eq(employeeCertifications.id, certificationId),
                eq(
                  employeeCertifications.employeeId,
                  isCertificationExists.employeeId,
                ),
                isNull(employeeCertifications.deletedAt),
              ),
            )
            .returning(),
        catch: (error) => {
          logError(
            "employeeCertificationsQueries.updateEmployeeCertification",
            "Failed to update employee certification",
            { error, certificationId, userId, data },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui sertifikasi karyawan",
          });
        },
      });

      if (!updatedCertification) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal memperbarui sertifikasi karyawan",
          }),
        );
      }

      yield* replaceStorageFile(
        url,
        isCertificationExists.certificate_fileUrl,
        "employeeCertificationsQueries.updateEmployeeCertification",
      );

      return updatedCertification;
    }),

  /**
   * Deletes an employee certification record from the database by marking it as deleted and removing the associated file from storage.
   * @param certificationId - The ID of the certification to be deleted.
   * @param userId - The ID of the user associated with the employee.
   * @returns An Effect that resolves to the deleted employee certification record, or fails with NOT_FOUND / INTERNAL_SERVER_ERROR.
   */
  delete: (certificationId: string, userId: string) =>
    Effect.gen(function* () {
      const isCertificationExists =
        yield* employeeCertificationQueries.getCertificateByIdAndVerifyOwner(
          certificationId,
          userId,
        );

      const [deletedCertification] = yield* Effect.tryPromise({
        try: () =>
          db
            .delete(employeeCertifications)
            .where(
              and(
                eq(employeeCertifications.id, certificationId),
                eq(
                  employeeCertifications.employeeId,
                  isCertificationExists.employeeId,
                ),
                isNull(employeeCertifications.deletedAt),
              ),
            )
            .returning(),
        catch: (error) => {
          logError(
            "employeeCertificationsQueries.delete",
            "Failed to delete employee certification",
            { error, certificationId, userId },
          );
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus sertifikasi karyawan",
          });
        },
      });

      if (!deletedCertification) {
        return yield* Effect.fail(
          new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menghapus sertifikasi karyawan",
          }),
        );
      }

      yield* deleteStorageFile(
        deletedCertification.certificate_fileUrl,
        "employeeCertificationsQueries.delete",
      );

      return deletedCertification;
    }),
};

export default employeeCertificationQueries;
