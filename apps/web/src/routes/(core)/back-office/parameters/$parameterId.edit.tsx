import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRedirectBackWithTimeout } from "@/lib/redirect-back-with-timeout";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { requirePermission } from "@/utils/require-permission";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import parameterSchema from "@tepian-k3/schema/parameter.schema";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute(
  "/(core)/back-office/parameters/$parameterId/edit",
)({
  beforeLoad: async ({ context }) =>
    await requirePermission(context, {
      permission: "parameters.update",
    }),
  params: z.object({
    parameterId: z.uuidv7(),
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(
      context.trpc.parameter.getParameterById.queryOptions({
        id: params.parameterId,
      }),
    );
    context.queryClient.ensureQueryData(
      context.trpc.parameterCategories.getAllParameterCategories.queryOptions(),
    );
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { parameterId } = Route.useParams();
  const redirectBack = useRedirectBackWithTimeout();

  const { data: parameter } = useSuspenseQuery(
    trpc.parameter.getParameterById.queryOptions({
      id: parameterId,
    }),
  );

  const { data: parameterCategories } = useSuspenseQuery(
    trpc.parameterCategories.getAllParameterCategories.queryOptions(),
  );

  const [parameterCategoryOpen, setParameterCategoryOpen] = useState(false);

  const form = useForm<z.infer<typeof parameterSchema.updateParameterSchema>>({
    resolver: zodResolver(parameterSchema.updateParameterSchema),
    defaultValues: {
      id: parameter.id,
      parameterCategoryId: parameter.parameterCategoryId,
      name: parameter.name,
      price: parameter.price,
      reference: parameter.reference ?? undefined,
      unit: parameter.unit,
    },
  });

  const updateParameterMutation = useMutation(
    trpc.parameter.updateParameter.mutationOptions({
      onSuccess: async () => {
        globalSuccessToast("Berhasil memperbarui parameter");
        await redirectBack();
      },
      onError: (error) => {
        globalErrorToast("Gagal memperbarui parameter: " + error.message);
      },
    }),
  );

  function handleSubmit(
    data: z.infer<typeof parameterSchema.updateParameterSchema>,
  ) {
    updateParameterMutation.mutate(data);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Perbarui Parameter</CardTitle>
          <CardDescription>
            Isi form di bawah untuk memperbarui parameter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-4"
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="parameterCategoryId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Kategori Parameter
                    </FieldLabel>
                    <Popover
                      open={parameterCategoryOpen}
                      onOpenChange={setParameterCategoryOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={parameterCategoryOpen}
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? parameterCategories.find(
                                (c) => c.id === field.value,
                              )?.name
                            : "Pilih kategori parameter..."}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="popover-content-width-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Cari kategori parameter..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              Tidak ada kategori parameter yang ditemukan.
                            </CommandEmpty>
                            <CommandGroup>
                              {parameterCategories.map((category) => (
                                <CommandItem
                                  value={category.name}
                                  key={category.id}
                                  onSelect={() => {
                                    field.onChange(category.id);
                                    setParameterCategoryOpen(false);
                                  }}
                                >
                                  {category.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      field.value === category.id
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Nama Parameter
                    </FieldLabel>
                    <Input
                      type="text"
                      placeholder="Masukkan nama parameter"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="price"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Harga Parameter
                    </FieldLabel>
                    <CurrencyInput
                      placeholder="Masukkan harga parameter"
                      className="h-10 text-left text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="reference"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Referensi Parameter
                    </FieldLabel>
                    <Input
                      placeholder="Masukkan referensi parameter"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="unit"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Satuan Parameter
                    </FieldLabel>
                    <Input
                      placeholder="Masukkan satuan parameter"
                      className="h-10 text-sm"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                className="mt-2 h-10 w-full text-sm"
                disabled={updateParameterMutation.isPending}
              >
                {updateParameterMutation.isPending ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Perbarui Parameter
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
