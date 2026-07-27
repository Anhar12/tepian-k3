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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { trpc } from "@/utils/trpc";
import { TOOLS_CONDITIONS, TOOLS_CONDITIONS_LABELS } from "@tepian-k3/constants";
import { PackageCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

interface BatchReturnToolsDialogProps {
  worksheetId: string;
}

type FormState = Record<string, {
  checkAlatMenyala: boolean;
  checkPenyimpangan: boolean;
  checkKelengkapanAlat: boolean;
  checkKondisiFisikAlat: boolean;
  checkConditionResult: "baik" | "rusak" | "diperingatkan" | "tidak_menyala";
}>;

export function BatchReturnToolsDialog({ worksheetId }: BatchReturnToolsDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: borrowedTools, isLoading } = useQuery(
    trpc.pengujian.worksheet.getBorrowedTools.queryOptions({ worksheetId })
  );

  const batchReturnMutation = useMutation(
    trpc.pengujian.worksheet.batchReturnTools.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Alat berhasil dikembalikan");
        setOpen(false);
        queryClient.invalidateQueries(trpc.pengujian.worksheet.getBorrowedTools.queryOptions({ worksheetId }));
        queryClient.invalidateQueries(trpc.pengujian.worksheet.getWorksheetById.queryOptions({ worksheetId }));
      },
      onError: (error: any) => {
        globalErrorToast(`Gagal mengembalikan alat: ${error.message}`);
      },
    })
  );

  const [formState, setFormState] = useState<FormState>({});

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && borrowedTools) {
      // Initialize form state
      const initial: FormState = {};
      borrowedTools.forEach((wt: any) => {
        if (!wt.returnedAt) {
          initial[wt.id] = {
            checkAlatMenyala: false,
            checkPenyimpangan: false,
            checkKelengkapanAlat: false,
            checkKondisiFisikAlat: false,
            checkConditionResult: "baik", // Default
          };
        }
      });
      setFormState(initial);
    }
    setOpen(newOpen);
  };

  const handleUpdateField = (id: string, field: keyof FormState[string], value: any) => {
    setFormState((prev: FormState) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      } as FormState[string]
    }));
  };

  const handleSubmit = () => {
    const tools = Object.entries(formState).map(([worksheetToolId, data]) => ({
      worksheetToolId,
      ...data
    }));

    if (tools.length === 0) {
      globalErrorToast("Tidak ada alat yang dipilih untuk dikembalikan");
      return;
    }

    batchReturnMutation.mutate({ worksheetId, tools });
  };

  const hasUnreturnedTools = borrowedTools?.some(wt => !wt.returnedAt);

  if (!hasUnreturnedTools) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800">
          <PackageCheck className="h-4 w-4" />
          Kembalikan Alat ({borrowedTools?.filter((t: any) => !t.returnedAt).length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Pengembalian Alat</DialogTitle>
          <DialogDescription>
            Lakukan pengecekan kondisi untuk setiap alat sebelum mengembalikannya ke inventory.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="grid gap-4 py-4 sm:grid-cols-2">
              {borrowedTools?.filter((wt: any) => !wt.returnedAt).map((wt: any) => {
                const state = formState[wt.id];
                if (!state) return null;

                return (
                  <Card key={wt.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-sm font-semibold">{wt.tool.toolName}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {wt.tool.toolUniqueCode}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-2">
                        <FieldGroup className="gap-1.5 mt-2">
                          {[
                            { name: "checkAlatMenyala", label: "Alat Menyala" },
                            { name: "checkPenyimpangan", label: "Penyimpangan Alat ±5%" },
                            { name: "checkKelengkapanAlat", label: "Kelengkapan Alat" },
                            { name: "checkKondisiFisikAlat", label: "Kondisi Fisik Alat" },
                          ].map(({ name, label }) => (
                            <Field key={name}>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`${wt.id}-${name}`}
                                  checked={state[name as keyof typeof state] as boolean}
                                  onCheckedChange={(checked) => handleUpdateField(wt.id, name as keyof FormState[string], checked)}
                                />
                                <FieldLabel htmlFor={`${wt.id}-${name}`} className="font-normal text-xs">
                                  {label}
                                </FieldLabel>
                              </div>
                            </Field>
                          ))}
                          
                          <Field className="space-y-1 pt-2">
                            <FieldLabel className="text-xs font-semibold">Kondisi Alat</FieldLabel>
                            <Select
                              value={state.checkConditionResult}
                              onValueChange={(val) => handleUpdateField(wt.id, "checkConditionResult", val)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Pilih Kondisi" />
                              </SelectTrigger>
                              <SelectContent>
                                {TOOLS_CONDITIONS.map((c) => (
                                  <SelectItem key={c} value={c} className="text-xs">
                                    {TOOLS_CONDITIONS_LABELS[c]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </Field>
                        </FieldGroup>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="mt-4 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
          <Button onClick={handleSubmit} disabled={batchReturnMutation.isPending}>
            {batchReturnMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Proses Pengembalian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
