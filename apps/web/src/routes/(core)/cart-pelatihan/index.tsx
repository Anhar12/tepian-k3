import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { globalErrorToast, globalSuccessToast } from "@/lib/toast";
import { pageHead } from "@/utils/page-head";
import { queryClient, trpc } from "@/utils/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Loader2, Trash2 } from "lucide-react";
import ImageWithFallback from "@/components/image-with-fallback";

export const Route = createFileRoute("/(core)/cart-pelatihan/")({
  head: () => pageHead("Keranjang Pelatihan"),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();

  const { data: cartItems, isLoading } = useQuery(
    trpc.pelatihan.cart.getCart.queryOptions(),
  );

  const removeMutation = useMutation(
    trpc.pelatihan.cart.removeFromCart.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pelatihan.cart.getCart.queryOptions(),
        );
        globalSuccessToast("Berhasil dihapus dari keranjang");
      },
      onError: (err) => {
        globalErrorToast(`Gagal menghapus: ${err.message}`);
      },
    }),
  );

  const checkoutMutation = useMutation(
    trpc.pelatihan.order.createPelatihanOrder.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.pelatihan.cart.getCart.queryOptions(),
        );
        globalSuccessToast("Berhasil membuat order pelatihan");
        navigate({ to: "/pelatihan/transaksi" });
      },
      onError: (err) => {
        globalErrorToast(`Gagal checkout: ${err.message}`);
      },
    }),
  );

  const totalAmount =
    cartItems?.reduce((acc, item) => acc + item.pelatihan.price, 0) || 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-0">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Keranjang Pelatihan
        </h1>
        <p className="text-muted-foreground">
          Selesaikan pembayaran Anda untuk mulai belajar.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-xl border bg-card">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !cartItems || cartItems.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed bg-card">
              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-slate-800">
                Keranjang masih kosong
              </p>
              <p className="mb-6 text-muted-foreground">
                Anda belum menambahkan kelas apapun ke keranjang.
              </p>
              <Button asChild>
                <Link to="/pelatihan">Cari Kelas Pelatihan</Link>
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Daftar Kelas ({cartItems.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {cartItems.map((item) => (
                    <div
                      key={item.pelatihanId}
                      className="flex items-center gap-6 p-6"
                    >
                      <div className="hidden h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
                        <ImageWithFallback
                          src={item.pelatihan.thumbnailUrl ?? ""}
                          alt={item.pelatihan.title}
                          imgClassName="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          to="/pelatihan/$slug"
                          params={{ slug: item.pelatihan.slug }}
                          className="line-clamp-1 text-lg font-semibold text-slate-800 hover:text-primary hover:underline"
                        >
                          {item.pelatihan.title}
                        </Link>
                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                          {item.pelatihan.shortDescription ||
                            item.pelatihan.description}
                        </p>
                        <div className="mt-2 font-bold text-slate-800">
                          {item.pelatihan.price === 0
                            ? "Gratis"
                            : `Rp ${item.pelatihan.price.toLocaleString("id-ID")}`}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={removeMutation.isPending}
                        onClick={() =>
                          removeMutation.mutate({
                            pelatihanId: item.pelatihanId,
                          })
                        }
                      >
                        {removeMutation.isPending &&
                        removeMutation.variables?.pelatihanId ===
                          item.pelatihanId ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary */}
        <div className="w-full shrink-0 lg:w-96">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Ringkasan Belanja</CardTitle>
              <CardDescription>
                Total tagihan untuk pelatihan yang dipilih
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-2 font-medium">
                <span className="text-muted-foreground">Total Harga</span>
                <span className="text-xl font-bold">
                  Rp {totalAmount.toLocaleString("id-ID")}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                size="lg"
                disabled={
                  !cartItems ||
                  cartItems.length === 0 ||
                  checkoutMutation.isPending ||
                  isLoading
                }
                onClick={() => checkoutMutation.mutate()}
              >
                {checkoutMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Checkout Sekarang
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
