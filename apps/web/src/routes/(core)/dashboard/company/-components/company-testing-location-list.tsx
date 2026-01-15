import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import TestingLocationCard from "./testing-location-card";
import { useTestingLocationDialogStore } from "@/stores/testing-location-dialog.stores";
import CreateCompanyLocationDialog from "./create-company-location-dialog";
import { History, MapPin } from "lucide-react";
import { Route } from "../$companyId.detail";
import EditCompanyLocationDialog from "./edit-company-location-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonGenerator } from "@/components/ui/skeleton-generator";

interface CompanyTestingLocationListProps {
  companyId: string;
}

export default function CompanyTestingLocationList({
  companyId,
}: CompanyTestingLocationListProps) {
  const { showDeleted } = Route.useSearch();

  const navigate = Route.useNavigate();

  const setIsCreateDialogOpen = useTestingLocationDialogStore(
    (state) => state.setIsCreateDialogOpen,
  );

  const { data: testingLocations, isLoading } = useQuery(
    trpc.userCompanyTestingLocation.getAllUserCompanyTestingLocationsByCompanyIdAndUserId.queryOptions(
      { companyId, showDeleted: showDeleted ?? false },
    ),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-row items-center justify-between gap-2 px-6">
          <div className="flex flex-col space-y-2">
            <CardTitle>Lokasi Pengujian Perusahaan</CardTitle>
            <CardDescription>
              Daftar lokasi pengujian yang terkait dengan perusahaan Anda.
            </CardDescription>
          </div>
          {/* Show deleted Button */}
          <Button
            variant={showDeleted ? "default" : "outline"}
            disabled={isLoading}
            onClick={() => {
              navigate({
                search: (old) => ({
                  ...old,
                  showDeleted: !showDeleted,
                }),
              });
            }}
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="flex flex-col gap-4">
          {!showDeleted && (
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              disabled={isLoading}
            >
              Tambah Lokasi Pengujian
            </Button>
          )}
          {isLoading ? (
            <div className="flex flex-row flex-wrap gap-4">
              {[...Array(3)].map((_, index) => (
                <SkeletonGenerator
                  key={index}
                  variant="card"
                  className="w-60"
                />
              ))}
            </div>
          ) : testingLocations && testingLocations.length === 0 ? (
            <EmptyState
              icon={<MapPin />}
              title={
                showDeleted
                  ? "Tidak ada lokasi pengujian yang dihapus."
                  : "Belum ada lokasi pengujian."
              }
              description="Lokasi pengujian yang Anda buat akan ditampilkan di sini."
            />
          ) : (
            <div className="flex flex-row flex-wrap gap-4">
              {testingLocations?.map((location) => (
                <TestingLocationCard
                  key={location.id}
                  testingLocation={location}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <CreateCompanyLocationDialog companyId={companyId} />
      <EditCompanyLocationDialog companyId={companyId} />
    </div>
  );
}
