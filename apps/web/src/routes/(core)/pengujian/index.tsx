import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePengujianOrderCart } from "@/stores/pengujian-order-cart.store";
import parameterSchema from "@tepian-k3/schema/pengujian/parameter.schema";
import { pageHead } from "@/utils/page-head";

import { LocationSection } from "./-components/location-section";
import { ParameterSelection } from "./-components/parameter-selection";
import { CheckoutContent } from "./checkout";

export const Route = createFileRoute("/(core)/pengujian/")({
  validateSearch: parameterSchema.getAllParametersSchema,
  head: () => pageHead("Pengujian - Parameter"),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();

  const {
    items: draftItems,
    addItems,
    increment,
    decrement,
    remove,
  } = usePengujianOrderCart();

  const [step, setStep] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [companyId, setCompanyId] = useState<string>();
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>();

  const [locationNames, setLocationNames] = useState<Record<string, string>>(
    {},
  );

  /*
   * Item cart sudah berbentuk array sehingga bisa langsung
   * digunakan untuk perhitungan dan tampilan.
   */
  const selectedCartItems = draftItems;

  const selectedServiceCount = selectedCartItems.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  const selectedCartTotal = selectedCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const cartItemCount = selectedCartItems.length;

  const canGoParameter = Boolean(companyId && locationIds.length > 0);

  const activeLocationName = activeLocationId
    ? locationNames[activeLocationId]
    : undefined;

  const handleCompanyChange = (id?: string) => {
    setCompanyId(id);
    setLocationIds([]);
    setActiveLocationId(undefined);
    setLocationNames({});
  };

  const handleLocationChange = (ids: string[]) => {
    setLocationIds(ids);

    setActiveLocationId((currentLocationId) => {
      if (currentLocationId && ids.includes(currentLocationId)) {
        return currentLocationId;
      }

      return ids[0];
    });
  };

  const stepTitle =
    step === 1
      ? "Pilih Perusahaan"
      : step === 2
        ? "Pilih Lokasi Pengujian"
        : "Pilih Parameter Pengujian";

  const stepDescription =
    step === 1
      ? "Pilih perusahaan yang akan dilakukan pengujian."
      : step === 2
        ? "Pilih satu atau beberapa lokasi. Parameter diatur satu per satu untuk setiap lokasi."
        : "Pilih lokasi aktif, lalu tambahkan parameter yang sesuai untuk lokasi tersebut.";

  const currentStepTitle = step === 4 ? "Review & Checkout" : stepTitle;

  const currentStepDescription =
    step === 4
      ? "Periksa kembali parameter dan biaya sebelum melanjutkan proses pesanan."
      : stepDescription;

  const isNextButtonDisabled =
    step === 1
      ? !companyId
      : step === 2
        ? !canGoParameter
        : cartItemCount === 0;

  const handlePreviousStep = () => {
    setStep((currentStep) => Math.max(1, currentStep - 1));
  };

  const handleNextStep = () => {
    setStep((currentStep) => Math.min(4, currentStep + 1));
  };

  return (
    <div className="w-full space-y-5 md:px-2">
      {/* Header */}
      <div className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100 md:flex-row">
        {/* Sidebar */}
        <div className="flex flex-col justify-between bg-primary p-6 text-white md:w-1/3">
          <p className="text-sm opacity-80">Tepian K3</p>

          <h1 className="text-4xl font-bold">Order Pengujian</h1>

          <p className="text-sm opacity-90">Pilih data secara berurutan</p>
        </div>

        {/* Step Information */}
        <div className="flex-1 p-6">
          <div className="flex justify-between text-sm font-semibold text-primary">
            <span>Langkah {step}</span>

            <span>{step}/4 selesai</span>
          </div>

          {/* Progress */}
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${(step / 4) * 100}%`,
              }}
            />
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="mt-8 text-2xl font-bold text-slate-800 md:text-3xl">
                {currentStepTitle}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {currentStepDescription}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-end gap-3">
              {step > 1 && (
                <Button variant="outline" onClick={handlePreviousStep}>
                  <ArrowLeft className="mr-2 size-4" />
                  Kembali
                </Button>
              )}

              {step < 4 && (
                <Button
                  disabled={isNextButtonDisabled}
                  onClick={handleNextStep}
                >
                  {step === 3 ? "Checkout" : "Lanjut"}

                  <ArrowRight className="ml-2 size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Company */}
      {step === 1 && (
        <LocationSection
          mode="company"
          companyId={companyId}
          onCompanyChange={handleCompanyChange}
        />
      )}

      {/* Step 2: Testing Location */}
      {step === 2 && (
        <LocationSection
          mode="location"
          companyId={companyId}
          selectedLocationIds={locationIds}
          onLocationChange={handleLocationChange}
          onLocationNamesChange={(locations) => {
            setLocationNames(
              Object.fromEntries(
                locations.map((location) => [location.id, location.name]),
              ),
            );
          }}
        />
      )}

      {/* Step 3: Parameters */}
      {step === 3 && canGoParameter && (
        <div className="space-y-4">
          {/* Active Location Selector */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex shrink-0 items-center gap-3 lg:w-52">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <MapPin className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Lokasi aktif
                  </p>

                  <p className="text-xs text-slate-500">
                    Atur parameter per lokasi
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {locationIds.map((id, index) => (
                  <Button
                    key={id}
                    variant={activeLocationId === id ? "default" : "outline"}
                    className="h-auto min-h-12 w-full min-w-0 justify-start gap-2 px-3 py-2 text-left text-xs"
                    aria-pressed={activeLocationId === id}
                    onClick={() => setActiveLocationId(id)}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold ${activeLocationId === id ? "bg-white text-primary" : "bg-primary/20 text-slate-800"}`}
                    >
                      {index + 1}
                    </span>

                    <span className="min-w-0 leading-tight wrap-break-word whitespace-normal">
                      {locationNames[id] ?? "Nama lokasi"}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Layout */}
          <div
            className={`relative grid items-start gap-3 transition-all duration-300 ${isCartOpen ? "xl:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]" : "grid-cols-1"}`}
          >
            {/* Parameter Selection */}
            <div className="min-w-0">
              <ParameterSelection
                companyId={companyId}
                activeLocationId={activeLocationId}
                activeLocationName={activeLocationName}
                onAddItems={addItems}
                isCartOpen={isCartOpen}
                onToggleCart={() => setIsCartOpen((open) => !open)}
              />
            </div>

            {/* Cart */}
            {isCartOpen && (
              <aside className="min-w-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm xl:sticky xl:top-4">
                {/* Cart Header */}
                <div
                  className={`flex items-center gap-3 py-4 ${"justify-between px-5"}`}
                >
                  <>
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary">
                      <ShoppingCart className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-800">
                        Keranjang
                      </h3>

                      <p className="truncate text-[10px] text-slate-500">
                        Parameter yang sudah ditambahkan
                      </p>
                    </div>
                  </>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-primary"
                    aria-label="Tutup keranjang"
                    title="Tutup keranjang"
                    onClick={() => setIsCartOpen(false)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                {/* Cart Content */}
                {isCartOpen && (
                  <>
                    {/* Cart Items */}
                    <div className="max-h-130 divide-y divide-slate-100 overflow-y-auto border-y border-slate-200">
                      {selectedCartItems.length > 0 ? (
                        selectedCartItems.map((item) => (
                          <div
                            key={`${item.locationId}-${item.parameterId}`}
                            className="px-5 py-3"
                          >
                            <div className="flex gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-700">
                                  {item.parameterName}
                                </p>

                                <p className="mt-1 text-[10px] font-medium text-slate-500 uppercase">
                                  {item.clusterName} - {item.categoryName}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-primary">
                                  Rp{" "}
                                  {(item.price * item.quantity).toLocaleString(
                                    "id-ID",
                                  )}
                                </p>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                                  onClick={() =>
                                    remove(item.parameterId, item.locationId)
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>

                                <div className="flex h-7 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-none text-xs"
                                    onClick={() =>
                                      decrement(
                                        item.parameterId,
                                        item.locationId,
                                      )
                                    }
                                  >
                                    −
                                  </Button>

                                  <span className="flex w-7 items-center justify-center border-x border-slate-200 text-[11px] font-semibold text-slate-700">
                                    {item.quantity}
                                  </span>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 rounded-none text-xs"
                                    onClick={() =>
                                      increment(
                                        item.parameterId,
                                        item.locationId,
                                      )
                                    }
                                  >
                                    +
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-10 text-center">
                          <ShoppingCart className="mx-auto mb-3 size-7 text-slate-200" />

                          <p className="text-xs text-slate-400">
                            Belum ada parameter di keranjang.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="px-5 py-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Total layanan</span>

                        <span className="font-bold text-slate-700">
                          {selectedServiceCount}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-xs font-bold text-white">
                          <ShoppingCart className="size-3.5" />
                          Rp {selectedCartTotal.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </aside>
            )}
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <CheckoutContent
          companyId={companyId}
          locationNames={locationNames}
          items={selectedCartItems}
        />
      )}
    </div>
  );
}
