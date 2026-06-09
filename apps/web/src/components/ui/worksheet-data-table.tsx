import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorksheetDataTableProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  /** When true, adds a "Semua" (show all) entry to the page-size selector.
   * Selecting it calls `onPageSizeChange(-1)`. */
  showAllOption?: boolean;
}

export function WorksheetDataTable({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  showAllOption = false,
}: WorksheetDataTableProps) {
  // A non-positive pageSize (the -1 sentinel) means "show all".
  const isShowingAll = pageSize <= 0;
  const startItem =
    totalItems === 0 ? 0 : isShowingAll ? 1 : (currentPage - 1) * pageSize + 1;
  const endItem = isShowingAll
    ? totalItems
    : Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t bg-muted/20 px-2 py-3 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Menampilkan</span>
        <span className="font-medium text-foreground">
          {startItem}-{endItem}
        </span>
        <span>dari</span>
        <span className="font-medium text-foreground">{totalItems}</span>
        <span className="hidden sm:inline">data</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Baris per halaman
          </span>
          <Select
            value={isShowingAll ? "all" : String(pageSize)}
            onValueChange={(value) =>
              onPageSizeChange(value === "all" ? -1 : Number(value))
            }
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue placeholder={isShowingAll ? "Semua" : pageSize} />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
              {showAllOption && <SelectItem value="all">Semua</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Halaman pertama</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Halaman sebelumnya</span>
          </Button>
          <span className="min-w-20 px-2 text-center text-sm">
            <span className="font-medium">{currentPage}</span>
            <span className="text-muted-foreground"> / {totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Halaman berikutnya</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 bg-transparent"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Halaman terakhir</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
