import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import type { WorksheetCard } from "@tepian-k3/types/worksheet.types";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/(core)/back-office/worksheets/")({
  component: RouteComponent,
});

const uuid = [
  "019bca4b-f117-7ec9-bbe2-c26c879334b1",
  "019bca4b-f117-7610-af6f-d5566949a2e1",
  "019bca4b-f117-7093-8451-db74462b394d",
  "019bca4b-f117-73ae-94f1-734fce24133e",
  "019bca4b-f117-7354-92a8-2e28fdd1c91c",
  "019bca4b-f117-7366-9dfa-7c31626753f7",
  "019bca4b-f117-7703-b797-843a034ee1e5",
  "019bca4b-f117-7311-888c-0d43054bb9ac",
  "019bca4b-f117-71fa-809f-6e460c18a720",
  "019bca4b-f117-7142-80a6-def21e67a3e8",
];

const generatedWorksheets: WorksheetCard[] = [];

const generateRandomWorksheets = () => {
  for (let i = 0; i < 10; i++) {
    generatedWorksheets.push({
      id: uuid[i],
      testing: {
        id: `test-${i + 1}`,
        testingNumber: `TEST-${1000 + i}`,
        companyId: `company-${i + 1}`,
        company: {
          id: `company-${i + 1}`,
          name: `Company ${i + 1}`,
          address: `Address ${i + 1}`,
          responsibleTestingPerson: `Person ${i + 1}`,
          responsibleTestingPersonEmail: `person${i + 1}@example.com`,
          provinceId: "",
          districtId: "",
          regencyId: "",
          villageId: "",
          responsibleTestingPersonPhone: "+62123456789",
          companyPictureUrl: null,
          province: {
            id: "added-later",
            name: "added-later",
          },
          district: {
            id: "added-later",
            name: "added-later",
          },
          regency: {
            id: "added-later",
            name: "added-later",
          },
          village: {
            id: "added-later",
            name: "added-later",
          },
        },
      },
      result: "present",
      deletedAt: null,
      createdAt: "",
      updatedAt: null,
      status: "in_progress",
      testingId: `test-${i + 1}`,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      mainSupervisorId: null,
      accompanyingSupervisorId: null,
      createdBy: "",
    });
  }
};

function RouteComponent() {
  const navigate = Route.useNavigate();

  const [worksheets, setWorksheets] = useState<WorksheetCard[]>([]);

  useEffect(() => {
    // check if generatedWorksheets is empty
    if (generatedWorksheets.length === 0) {
      generateRandomWorksheets();
    }
    setWorksheets(generatedWorksheets);
  }, []);

  return (
    <div className="flex flex-row flex-wrap gap-4">
      {worksheets.map((worksheet) => (
        <Card key={worksheet.id} className="max-w-md">
          <CardHeader>
            <CardTitle>
              {worksheet.testing.company?.name} -{" "}
              {worksheet.testing.testingNumber}
            </CardTitle>
            <CardDescription>
              Responsible Person:{" "}
              {worksheet.testing.company?.responsibleTestingPerson} <br />
              Email: {
                worksheet.testing.company?.responsibleTestingPersonEmail
              }{" "}
              <br />
              Phone: {worksheet.testing.company?.responsibleTestingPersonPhone}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Worksheet ID: {worksheet.id}</p>
            <p>Status: {worksheet.status}</p>
            <p>Result: {worksheet.result}</p>
            <p>
              Start Date: {new Date(worksheet.startDate).toLocaleDateString()}
            </p>
            <p>
              End Date:{" "}
              {new Date(worksheet?.endDate ?? "").toLocaleDateString()}
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() =>
                navigate({
                  to: `/worksheets`,
                  search: (old) => ({ ...old, worksheetId: worksheet.id }),
                })
              }
            >
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
