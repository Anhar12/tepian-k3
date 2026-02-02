import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeletonInput } from "@/components/ui/skeleton-generator";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui/empty-state";
import { IconAlertCircle } from "@tabler/icons-react";

interface ParameterDetailProps {
  parameterId: string;
}

export default function ParameterDetail({ parameterId }: ParameterDetailProps) {
  const { data: parameter, isLoading } = useQuery(
    trpc.parameter.getParameterById.queryOptions({
      id: parameterId,
    }),
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Parameter</CardTitle>
            <CardDescription>
              Lihat detail informasi parameter Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
              <SkeletonInput />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!parameter) {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Detail Parameter</CardTitle>
            <CardDescription>
              Lihat detail informasi parameter Anda di sini.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <EmptyState
                icon={<IconAlertCircle />}
                title="Parameter tidak ditemukan"
                description="Parameter yang Anda cari tidak ada atau telah dihapus."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Detail Parameter</CardTitle>
          <CardDescription>
            Lihat detail informasi parameter Anda di sini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <FieldGroup>
              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Nama Parameter
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan nama parameter"
                  className="h-10 text-sm"
                  value={parameter.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Kategori Parameter
                </FieldLabel>
                <Input
                  type="text"
                  placeholder="Masukkan kategori parameter"
                  className="h-10 text-sm"
                  value={parameter.category?.name}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Unit Parameter
                </FieldLabel>
                <Input
                  type="number"
                  placeholder="Masukkan unit parameter"
                  className="h-10 text-sm"
                  value={parameter.unit}
                  disabled
                  readOnly
                />
              </Field>

              <Field className="space-y-1">
                <FieldLabel className="ml-1 text-sm font-bold">
                  Harga Parameter
                </FieldLabel>
                <CurrencyInput
                  type="number"
                  placeholder="Masukkan harga parameter"
                  className="h-10 text-start text-sm"
                  value={parameter.price}
                  disabled
                  readOnly
                />
              </Field>
            </FieldGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
