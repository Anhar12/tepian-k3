import { useState } from "react";
import { usePengujianOrderCart } from "@/stores/pengujian-order-cart.store";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  ShoppingCart,
} from "lucide-react";

import { Button } from "@/components/ui/button";

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

  const [companyId, setCompanyId] = useState<string>();
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [activeLocationId, setActiveLocationId] = useState<string>();
  const [locationNames, setLocationNames] = useState<Record<string, string>>(
    {},
  );

  /*
   * Flatten seluruh item cart agar lebih mudah digunakan
   * untuk perhitungan dan tampilan.
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

  const handleCompanyChange = (id?: string) => {
    setCompanyId(id);
    setLocationIds([]);
    setActiveLocationId(undefined);
  };

  const handleLocationChange = (ids: string[]) => {
    setLocationIds(ids);
    setActiveLocationId(ids[0]);
  };
  const activeLocationName = activeLocationId
    ? locationNames[activeLocationId]
    : undefined;

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
    setStep((currentStep) => currentStep - 1);
  };

  const handleNextStep = () => {
    setStep((currentStep) => currentStep + 1);
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

          <div className="flex items-end justify-between gap-4">
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
          onLocationNamesChange={(locations) =>
            setLocationNames(
              Object.fromEntries(
                locations.map((location) => [location.id, location.name]),
              ),
            )
          }
        />
      )}

      {/* Step 3: Parameters */}
      {step === 3 && canGoParameter && (
        <div className="space-y-4">
          {/* Active Location Selector */}
          <div className="flex flex-col gap-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 sm:min-w-56">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                <MapPin className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Lokasi aktif</p>
                <p className="text-xs text-slate-500">
                  Atur parameter per lokasi
                </p>
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {locationIds.map((id, index) => (
                <Button
                  key={id}
                  variant={activeLocationId === id ? "default" : "outline"}
                  className="h-auto min-h-10 max-w-full items-start px-3 py-2 text-left whitespace-normal"
                  onClick={() => setActiveLocationId(id)}
                >
                  {activeLocationId === id && <Check className="mr-1 size-3" />}

                  <span className="flex min-w-0 flex-col items-start text-left leading-tight">
                    <span className="text-[10px] opacity-70">
                      Lokasi {index + 1}
                    </span>
                    <span className="break-words whitespace-pre-line">
                      {locationNames[id] ?? "Nama lokasi"}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* Parameter Selection */}
            <div className="min-w-0">
              <ParameterSelection
                companyId={companyId}
                activeLocationId={activeLocationId}
                activeLocationName={activeLocationName}
                onAddItems={addItems}
              />
            </div>

            {/* Cart Summary */}
            <aside className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm lg:sticky lg:top-4">
              {/* Cart Header */}
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-primary">
                  <ShoppingCart className="size-5" />
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">Keranjang</h3>

                  <p className="text-xs text-slate-500">
                    Parameter yang sudah ditambahkan
                  </p>
                </div>
              </div>

              {/* Cart Items */}
              <div className="mt-5 max-h-screen space-y-3 overflow-y-auto border-y py-4">
                {selectedCartItems.length > 0 ? (
                  selectedCartItems.map((item) => (
                    <div
                      key={`${item.locationId}-${item.parameterId}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-700">
                          {item.parameterName}
                        </p>

                        <p className="text-xs text-slate-400">
                          {item.locationName} · {item.categoryName}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-semibold whitespace-nowrap text-slate-600">
                          Rp{" "}
                          {(item.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                        <div className="flex items-center rounded-lg border bg-white">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() =>
                              decrement(item.parameterId, item.locationId)
                            }
                          >
                            −
                          </Button>
                          <span className="w-6 text-center text-xs font-semibold">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() =>
                              increment(item.parameterId, item.locationId)
                            }
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-[10px] text-red-500"
                          onClick={() =>
                            remove(item.parameterId, item.locationId)
                          }
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">
                    Belum ada parameter di keranjang.
                  </p>
                )}
              </div>

              {/* Cart Summary */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total layanan</span>

                  <strong>{selectedServiceCount}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">Total biaya</span>

                  <strong className="text-primary">
                    Rp {selectedCartTotal.toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-800">
            Review & Checkout
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Periksa kembali seluruh parameter sebelum mengirim pesanan.
          </p>
          <CheckoutContent />
        </div>
      )}
    </div>
  );
}
