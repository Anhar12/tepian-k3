import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, Check, X } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { requirePermission } from "@/utils/require-permission";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/(core)/worksheets/proposed-dates")({
  beforeLoad: async ({ context }) => {
    await requirePermission(context, { permission: "worksheets.read" });
  },
  component: ProposedDatesPage,
});

function ProposedDatesPage() {
  const [page, setPage] = useState(1);
  const perPage = 10;
  
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(null);
  const [finalStartDate, setFinalStartDate] = useState("");
  const [finalEndDate, setFinalEndDate] = useState("");
  
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery(
    trpc.pengujian.worksheet.getAllProposedDates.queryOptions({
      page,
      perPage,
      status: "pending",
    })
  );

  const respondMutation = useMutation(
    trpc.pengujian.worksheet.respondProposedDate.mutationOptions({
      onSuccess: () => {
        globalSuccessToast("Usulan tanggal berhasil direspons");
        refetch();
        setSelectedProposal(null);
        setActionType(null);
      },
      onError: (error: any) => {
        globalErrorToast(`Gagal merespons usulan: ${error.message}`);
      },
    })
  );

  if (isError) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        Gagal memuat data usulan tanggal.
      </div>
    );
  }

  const handleAction = (proposal: any, action: "approved" | "rejected") => {
    setSelectedProposal(proposal);
    setActionType(action);
    if (action === "approved") {
      // Default to the proposed dates
      setFinalStartDate(new Date(proposal.proposedStartDate).toISOString().slice(0, 16));
      setFinalEndDate(new Date(proposal.proposedEndDate).toISOString().slice(0, 16));
    }
  };

  const submitResponse = () => {
    if (!selectedProposal || !actionType) return;
    
    const input: any = {
      proposedDateId: selectedProposal.id,
      action: actionType,
    };
    
    if (actionType === "approved") {
      input.finalStartDate = new Date(finalStartDate).toISOString();
      input.finalEndDate = new Date(finalEndDate).toISOString();
    }
    
    respondMutation.mutate(input);
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usulan Tanggal Pengujian</h1>
          <p className="text-muted-foreground">
            Kelola usulan tanggal pelaksanaan dari pelanggan
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Usulan Menunggu Konfirmasi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>No. Order</TableHead>
                    <TableHead>Usulan Tanggal</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Tidak ada usulan tanggal yang menunggu konfirmasi.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data.map((proposal) => (
                      <TableRow key={proposal.id}>
                        <TableCell className="font-medium">
                          {proposal.worksheet?.order?.company?.name || "-"}
                        </TableCell>
                        <TableCell>
                          {proposal.worksheet?.order?.orderNumber || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(proposal.proposedStartDate), "dd MMM yyyy, HH:mm", { locale: id })}
                            </span>
                            <span className="text-muted-foreground">s/d</span>
                            <span className="flex items-center gap-2">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(proposal.proposedEndDate), "dd MMM yyyy, HH:mm", { locale: id })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] truncate">
                          {proposal.note || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleAction(proposal, "approved")}
                            >
                              <Check className="h-4 w-4 mr-1" /> Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleAction(proposal, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" /> Tolak
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProposal} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approved" ? "Setujui Usulan Tanggal" : "Tolak Usulan Tanggal"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approved" 
                ? "Silakan sesuaikan tanggal resmi pelaksanan jika berbeda dengan usulan pelanggan." 
                : "Anda yakin ingin menolak usulan tanggal ini? Pelanggan dapat mengajukan usulan baru."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "approved" && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Mulai Resmi</label>
                <Input
                  type="datetime-local"
                  value={finalStartDate}
                  onChange={(e) => setFinalStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal Selesai Resmi</label>
                <Input
                  type="datetime-local"
                  value={finalEndDate}
                  onChange={(e) => setFinalEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProposal(null)}>Batal</Button>
            <Button
              variant={actionType === "approved" ? "default" : "destructive"}
              onClick={submitResponse}
              disabled={respondMutation.isPending || (actionType === "approved" && (!finalStartDate || !finalEndDate))}
            >
              {respondMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approved" ? "Konfirmasi & Setujui" : "Tolak Usulan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
