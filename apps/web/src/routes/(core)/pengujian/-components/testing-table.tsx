import {
  ClipboardList,
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  TestTube2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { authMeQueryOptions } from "@/utils/auth-query";
import { queryClient, trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import useDebounced from "@/hooks/use-debounced";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";

interface TestingTableProps extends React.HTMLAttributes<HTMLDivElement> {
  route: "/pengujian" | "/katalog";
  showCart?: boolean;
}

export function TestingTable({
  route,
  showCart = true,
  ...props
}: TestingTableProps) {
  const params = useSearch({ strict: false }) as {
    clusterId?: string;
    parameterCategoryId?: string;
    page?: number;
    perPage?: number;
    name?: string;
    companyId?: string;
    locationId?: string;
  };
  const navigate = useNavigate();

  const [cart, setCart] = useState<
    Map<
      string,
      {
        quantity: number;
        price: number;
      }
    >
  >(new Map());

  // Add loading state map
  const [addingToCart, setAddingToCart] = useState<Map<string, boolean>>(
    new Map(),
  );

  const [searchTerm, setSearchTerm] = useState(params.name || "");
  const debouncedSearchTerm = useDebounced(searchTerm, 500);

  const { data: me } = useQuery(authMeQueryOptions());

  const hasClusterId =
    params.clusterId !== undefined && params.clusterId !== null;

  const { data: parameters, isLoading } = useQuery({
    ...trpc.pengujian.parameter.getOffsetPaginatedParametersByClusterIdAndCategoryId.queryOptions(
      {
        clusterId: params.clusterId,
        parameterCategoryId: params.parameterCategoryId,
        page: params?.page ?? 1,
        perPage: params?.perPage ?? 10,
        name: params.name,
      },
    ),
    enabled: hasClusterId,
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery(
    trpc.pengujian.parameterCategories.getAllParameterCategories.queryOptions(),
  );

  const addToCartMutation = useMutation(
    trpc.pengujian.cart.insertCartItem.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries(
          trpc.pengujian.cart.getAllCartItems.queryOptions(),
        );
        await queryClient.invalidateQueries(
          trpc.pengujian.cart.getCartItemCount.queryOptions(),
        );
        globalSuccessToast(
          `Parameter ${data.parameter.name} berhasil ditambahkan ke keranjang`,
        );

        // Remove loading state for this specific parameter
        setAddingToCart((prev) => {
          const next = new Map(prev);
          next.delete(data.parameterId);
          return next;
        });
      },
      onError: (error, variables) => {
        globalErrorToast(
          `Gagal menambahkan parameter ke keranjang: ${error.message}`,
        );
        // Remove loading state for this specific parameter
        setAddingToCart((prev) => {
          const next = new Map(prev);
          next.delete(variables.parameterId);
          return next;
        });
      },
    }),
  );

  const handleAddToCart = (parameterId: string, qty: number, price: number) => {
    if (!me) return;

    if (!params.companyId || !params.locationId) {
      globalErrorToast("Perusahaan dan lokasi harus dipilih terlebih dahulu");
      return;
    }

    // Set loading state for this specific parameter
    setAddingToCart((prev) => {
      const next = new Map(prev);
      next.set(parameterId, true);
      return next;
    });

    // Implement add to cart functionality here
    addToCartMutation.mutate({
      companyId: params.companyId!,
      locationId: params.locationId!,
      parameterId,
      quantity: qty,
      price,
    });
  };

  const goToPage = (page: number) => {
    navigate({
      to: route,
      search: (old) => ({ ...old, page }),
    });
  };

  // set parameters data to filtered data based on debouncedSearchTerm
  useEffect(() => {
    navigate({
      to: route,
      search: (old) => ({
        ...old,
        name: debouncedSearchTerm || undefined,
      }),
    });
  }, [debouncedSearchTerm, navigate, route]);

  const currentPage = params.page || 1;

  return (
    <div
      className="space-y-8 rounded-4xl border border-slate-100 bg-white p-10 shadow-sm"
      {...props}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            Daftar Jenis Pengujian
          </h3>
          <p className="text-sm text-slate-500">
            {showCart
              ? "Kelola parameter dan biaya pengujian"
              : "Lihat daftar parameter pengujian"}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {isLoadingCategories ? (
          <Skeleton className="h-10 w-48 rounded-full" />
        ) : (
          <Select
            value={params.parameterCategoryId || undefined}
            onValueChange={(value) => {
              navigate({
                to: route,
                search: (old) => ({
                  ...old,
                  parameterCategoryId: value || undefined,
                  page: 1,
                }),
              });
            }}
          >
            <SelectTrigger className="h-11! w-full rounded-full border-slate-200 bg-slate-50/50 md:w-60">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Kategori Parameter</SelectLabel>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-11 w-full rounded-full border-slate-200 bg-slate-50/50 pl-11"
            placeholder="Cari Parameter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-bold text-slate-600">
                Kategori Parameter
              </TableHead>
              <TableHead className="font-bold text-slate-600">
                Parameter
              </TableHead>
              <TableHead className="font-bold text-slate-600">
                Acuan Standar
              </TableHead>
              <TableHead className="font-bold text-slate-600">Biaya</TableHead>
              {showCart && (
                <>
                  <TableHead className="font-bold text-slate-600">
                    Jumlah
                  </TableHead>
                  <TableHead className="font-bold text-slate-600">
                    Subtotal
                  </TableHead>
                  <TableHead className="text-right"></TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {!hasClusterId ? (
              <TableRow className="border-slate-100">
                <TableCell
                  colSpan={showCart ? 7 : 4}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="font-bold text-slate-700">
                        Pilih Kategori Parameter
                      </p>
                      <p className="text-sm text-slate-500">
                        Silakan pilih salah satu kategori parameter pengujian di
                        atas untuk melihat daftar parameter
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="border-slate-100">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-28 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="mb-2 h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  {showCart && (
                    <>
                      <TableCell>
                        <Skeleton className="h-10 w-16 rounded-xl" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-10 w-32 rounded-xl" />
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            ) : (
              parameters?.data.map((row) => (
                <TableRow key={row.id} className="group border-slate-100">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg`,
                        )}
                      >
                        <TestTube2 className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">
                          {row.category.name}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          {row.cluster.name}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className="rounded-full border-none bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-100"
                    >
                      {row.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-35 text-[10px] font-medium text-slate-500">
                    <div className="font-bold text-slate-700">
                      {row.reference?.split(" ")[0]}{" "}
                      {row.reference?.split(" ")[1]}
                    </div>
                    <div>{row.reference?.split(" ").slice(2).join(" ")}</div>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-800">
                    Rp {row.price.toLocaleString("id-ID")}
                  </TableCell>
                  {showCart && (
                    <>
                      <TableCell>
                        <Input
                          type="number"
                          defaultValue={1}
                          className="h-10 w-16 rounded-xl border-slate-200 bg-slate-50/50 text-center font-bold"
                          min={1}
                          onChange={(e) => {
                            const quantity = parseInt(e.target.value, 10);
                            if (quantity < 1) return;
                            setCart((oldCart) => {
                              const newCart = new Map(oldCart);
                              newCart.set(row.id, {
                                quantity,
                                price: row.price,
                              });
                              return newCart;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-bold text-[#0056B3]">
                        Rp{" "}
                        {(
                          (cart.get(row.id)?.quantity || 1) * row.price
                        ).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          className="h-10 gap-2 rounded-xl bg-[#4285F4] px-4 text-[10px] font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg"
                          disabled={!me || addingToCart.get(row.id)}
                          onClick={() =>
                            handleAddToCart(
                              row.id,
                              cart.get(row.id)?.quantity || 1,
                              row.price,
                            )
                          }
                        >
                          {addingToCart.get(row.id) ? (
                            <>
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg text-slate-400"
          disabled={currentPage === 1 || isLoading}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* First page */}
        {currentPage > 2 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(1)}
          >
            1
          </Button>
        )}

        {/* Ellipsis before current page */}
        {currentPage > 3 && (
          <span className="px-2 text-xs text-slate-400">...</span>
        )}

        {/* Previous page */}
        {currentPage > 1 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(currentPage - 1)}
          >
            {currentPage - 1}
          </Button>
        )}

        {/* Current page */}
        <Button
          variant="secondary"
          className="h-8 w-8 rounded-lg bg-[#333] p-0 text-xs font-bold text-white hover:bg-slate-800"
        >
          {currentPage}
        </Button>

        {/* Next page */}
        {parameters?.pageCount && currentPage < parameters.pageCount && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(currentPage + 1)}
          >
            {currentPage + 1}
          </Button>
        )}

        {/* Ellipsis after current page */}
        {parameters?.pageCount && currentPage < parameters.pageCount - 2 && (
          <span className="px-2 text-xs text-slate-400">...</span>
        )}

        {/* Last page */}
        {parameters?.pageCount && currentPage < parameters.pageCount - 1 && (
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-lg p-0 text-xs font-bold text-slate-500"
            onClick={() => goToPage(parameters.pageCount)}
          >
            {parameters.pageCount}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-slate-500 transition-colors hover:text-slate-900"
          disabled={
            !parameters?.pageCount ||
            currentPage === parameters.pageCount ||
            isLoading
          }
          onClick={() => goToPage(currentPage + 1)}
        >
          <span className="text-xs font-bold">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
