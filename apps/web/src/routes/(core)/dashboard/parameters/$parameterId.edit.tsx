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
  "/(core)/dashboard/parameters/$parameterId/edit",
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
      context.trpc.cluster.getAllClusters.queryOptions(),
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

  const { data: clusters } = useSuspenseQuery(
    trpc.cluster.getAllClusters.queryOptions(),
  );

  const { data: parameterCategories } = useSuspenseQuery(
    trpc.parameterCategories.getAllParameterCategories.queryOptions(),
  );

  const [clusterOpen, setClusterOpen] = useState(false);
  const [parameterCategoryOpen, setParameterCategoryOpen] = useState(false);

  const form = useForm<z.infer<typeof parameterSchema.updateParameterSchema>>({
    resolver: zodResolver(parameterSchema.updateParameterSchema),
    defaultValues: {
      id: parameter.id,
      clusterId: parameter.clusterId,
      parameterCategoryId: parameter.parameterCategoryId,
      name: parameter.name,
      price: parameter.price,
      reference: parameter.reference ?? undefined,
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
                name="clusterId"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1"
                  >
                    <FieldLabel className="ml-1 text-sm font-bold">
                      Cluster
                    </FieldLabel>
                    <Popover open={clusterOpen} onOpenChange={setClusterOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={clusterOpen}
                          aria-invalid={fieldState.invalid}
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value
                            ? clusters.find((c) => c.id === field.value)?.name
                            : "Pilih cluster..."}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="popover-content-width-full p-0">
                        <Command>
                          <CommandInput
                            placeholder="Cari cluster..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>
                              Tidak ada cluster yang ditemukan.
                            </CommandEmpty>
                            <CommandGroup>
                              {clusters.map((cluster) => (
                                <CommandItem
                                  value={cluster.name}
                                  key={cluster.id}
                                  onSelect={() => {
                                    field.onChange(cluster.id);
                                    setClusterOpen(false);
                                  }}
                                >
                                  {cluster.name}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      field.value === cluster.id
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
