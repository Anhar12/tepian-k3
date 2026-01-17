"use client";

import { Activity, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface HeaderCardProps {
  title: string;
  subtitle: string;
}

export function WorksheetHeaderCard({ title, subtitle }: HeaderCardProps) {
  return (
    <Card className="overflow-hidden border-0 bg-linear-to-r from-primary/5 via-primary/10 to-primary/5">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20 sm:h-14 sm:w-14">
              <Activity className="h-6 w-6 text-primary sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground sm:text-xl">
                {title}
              </h1>
              <p className="text-xs text-muted-foreground sm:text-sm">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Button variant="outline" size="sm" className="gap-2 bg-background">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Simpan</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
