import { createFileRoute, redirect } from "@tanstack/react-router";
import { Stepper } from "@/routes/-components/stepper";
import { LocationSection } from "@/routes/-components/location-section";
import { Clusters } from "@/routes/-components/parameter-categories";
import { TestingTable } from "@/routes/-components/testing-table";
import Navbar from "@/components/navbar";
import parameterSchema from "@tepian-k3/schema/parameter.schema";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/transaksi/2")({
  validateSearch: parameterSchema.getByClusterAndParameterCategorySchema,
  component: RouteComponent,
});

function RouteComponent() {
  const tableRef = useRef<HTMLDivElement>(null);

  // Save scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (tableRef.current) {
        sessionStorage.setItem(
          "testingTableScrollY",
          window.scrollY.toString(),
        );
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore scroll position
  useEffect(() => {
    const savedScrollY = sessionStorage.getItem("testingTableScrollY");
    if (savedScrollY) {
      window.scrollTo(0, parseInt(savedScrollY, 10));
    }
  }, []);

  return (
    <>
      {/* Location Section */}
      <LocationSection />

      {/* Clusters */}
      <Clusters route="/transaksi/1" />

      {/* Testing Table */}
      <TestingTable ref={tableRef} route="/transaksi/1" />
    </>
  );
}
