import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface RouteErrorBoundaryProps {
  error: Error;
}

export function RouteErrorBoundary({ error }: RouteErrorBoundaryProps) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <CardTitle className="text-lg">Terjadi Kesalahan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error.message ||
              "Maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi."}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Muat Ulang
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
