import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { toast } from "sonner";
import { Edit2, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useDebounced from "@/hooks/use-debounced";
import type { EditState } from "../index";

export function KnowledgeTable({
  onEdit,
  onSuccess,
}: {
  onEdit: (data: NonNullable<EditState>) => void;
  onSuccess: () => void;
}) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 500);

  const { data: allData, isLoading, refetch } = useQuery(trpc.platform.chatbot.getAll.queryOptions());
  
  const data = allData?.filter((item: any) => 
    !debouncedSearch || 
    item.topic.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    item.answer.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) ?? [];

  const deleteMutation = useMutation({
    ...trpc.platform.chatbot.delete.mutationOptions(),
    onSuccess: () => {
      toast.success("Berhasil menghapus knowledge base");
      refetch();
      onSuccess();
    },
    onError: (err: any) => {
      toast.error(`Gagal menghapus: ${err.message}`);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Daftar Pengetahuan</CardTitle>
        <div className="w-64">
          <Input
            placeholder="Cari topik atau jawaban..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topik</TableHead>
                <TableHead>Kata Kunci</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.topic}
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.answer}
                      </div>
                      {item.sourceType === "pdf" && (
                        <Badge variant="secondary" className="ml-2">PDF</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {item.keywords?.map((kw: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.sourceType === "pdf" ? (
                        <div className="flex items-center gap-1 text-sm text-blue-600">
                          <FileText className="h-3 w-3" />
                          <span className="line-clamp-1 max-w-[150px]" title={item.pdfFileName || ""}>
                            {item.pdfFileName}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="secondary">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            onEdit({
                              id: item.id,
                              topic: item.topic,
                              keywords: item.keywords,
                              answer: item.answer,
                              sourceType: item.sourceType,
                              pdfFileKey: item.pdfFileKey,
                              pdfFileName: item.pdfFileName,
                            })
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
