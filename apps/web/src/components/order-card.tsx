import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText } from "lucide-react";
import type { Order } from "@tepian-k3/types/order.types";
import { useNavigate } from "@tanstack/react-router";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@tepian-k3/constants";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface OrderCardProps {
  order: Order;
}

function formatDate(dateString: string): string {
  return format(dateString, "dd MMM yyyy");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();

  const badgeColorClass =
    ORDER_STATUS_COLORS[order.status] || "bg-gray-200 text-gray-800";

  return (
    <button
      onClick={() =>
        navigate({ to: "/pengujian/status", search: { orderId: order.id } })
      }
      className="w-full text-left"
    >
      <Card className="cursor-pointer p-4 transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {order.orderNumber}
              </h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(order.createdAt)} •{" "}
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={cn(`border-0`, badgeColorClass)}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </button>
  );
}
