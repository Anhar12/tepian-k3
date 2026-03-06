import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TOOLS_CONDITIONS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";
import worksheetSchema from "@tepian-k3/schema/pengujian/worksheet.schema";
import { CheckCircle2, Loader2, PackageCheck, Wrench } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

interface ReturnToolsProps {
  worksheetId: string;
}

type ReturnFormValues = Omit<
  z.infer<typeof worksheetSchema.returnToolsFromWorksheetSchema>,
  "worksheetId" | "worksheetToolId"
>;

interface ReturnToolCardProps {
  worksheetId: string;
  worksheetToolId: string;
  toolName: string;
  toolUniqueCode: string;
  condition: string;
  availability: string;
  returnedAt: string | null;
  onSuccess: () => void;
}

function ReturnToolCard({
  worksheetId,
  worksheetToolId,
  toolName,
  toolUniqueCode,
  condition,
  availability,
  returnedAt,
  onSuccess,
}: ReturnToolCardProps) {
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(
      worksheetSchema.returnToolsFromWorksheetSchema.omit({
        worksheetId: true,
        worksheetToolId: true,
      }),
    ),
    defaultValues: {
      checkAlatMenyala: false,
      checkPenyimpangan: false,
      checkKelengkapanAlat: false,
      checkKondisiFisikAlat: false,
    },
  });

  const returnToolMutation = useMutation(
    trpc.pengujian.worksheet.returnTools.mutationOptions({
      onSuccess: () => {
        globalSuccessToast(`Alat "${toolName}" berhasil dikembalikan`);
        onSuccess();
      },
      onError: (error) => {
        globalErrorToast(`Gagal mengembalikan alat: ${error.message}`);
      },
    }),
  );

  const handleSubmit = (data: ReturnFormValues) => {
    returnToolMutation.mutate({ worksheetId, worksheetToolId, ...data });
  };

  const isReturned = returnedAt !== null;

  return (
    <Card className={isReturned ? "opacity-60" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-sm font-semibold">{toolName}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {toolUniqueCode}
            </CardDescription>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge type="condition" value={condition} />
            <StatusBadge type="availability" value={availability} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isReturned ? (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>Sudah dikembalikan</span>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-2"
          >
            <FieldGroup className="gap-1.5">
              {(
                [
                  {
                    name: "checkAlatMenyala" as const,
                    label: "Alat Menyala",
                    id: `check-menyala-${worksheetToolId}`,
                  },
                  {
                    name: "checkPenyimpangan" as const,
                    label: "Penyimpangan Alat ±5% dari nilai standar",
                    id: `check-penyimpangan-${worksheetToolId}`,
                  },
                  {
                    name: "checkKelengkapanAlat" as const,
                    label: "Kelengkapan Alat",
                    id: `check-kelengkapan-${worksheetToolId}`,
                  },
                  {
                    name: "checkKondisiFisikAlat" as const,
                    label: "Kondisi Fisik Alat",
                    id: `check-kondisi-fisik-${worksheetToolId}`,
                  },
                ] as const
              ).map(({ name, label, id }) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          name={field.name}
                          aria-invalid={fieldState.invalid}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <FieldLabel htmlFor={id} className="font-normal">
                          {label}
                        </FieldLabel>
                      </div>
                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              ))}

              <Controller
                control={form.control}
                name="checkConditionResult"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="space-y-1 pt-1"
                  >
                    <FieldLabel className="ml-1 font-semibold">
                      Kondisi Alat
                    </FieldLabel>
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Pilih Kondisi Alat" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOOLS_CONDITIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {TOOLS_CONDITIONS_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Button
                type="submit"
                size="sm"
                className="mt-1 w-full"
                disabled={returnToolMutation.isPending}
              >
                {returnToolMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                Kembalikan Alat
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReturnTools({ worksheetId }: ReturnToolsProps) {
  const queryClient = useQueryClient();

  const { data: borrowedTools, isLoading } = useQuery(
    trpc.pengujian.worksheet.getBorrowedTools.queryOptions({ worksheetId }),
  );

  const handleReturnSuccess = () => {
    queryClient.invalidateQueries(
      trpc.pengujian.worksheet.getBorrowedTools.queryOptions({ worksheetId }),
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!borrowedTools || borrowedTools.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded border border-dashed p-8 text-center">
        <Wrench className="h-8 w-8 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          Tidak ada alat yang sedang dipinjam untuk worksheet ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {borrowedTools.map((wt) => (
        <ReturnToolCard
          key={wt.id}
          worksheetId={worksheetId}
          worksheetToolId={wt.id}
          toolName={wt.tool.toolName}
          toolUniqueCode={wt.tool.toolUniqueCode}
          condition={wt.tool.condition}
          availability={wt.tool.availability}
          returnedAt={wt.returnedAt}
          onSuccess={handleReturnSuccess}
        />
      ))}
    </div>
  );
}
