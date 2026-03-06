import { Link, useMatchRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsLayoutProps {
  toolId: string;
  children: React.ReactNode;
}

export function TabsLayout({ toolId, children }: TabsLayoutProps) {
  const matchRoute = useMatchRoute();

  // Determine active tab based on current route
  const activeTab = matchRoute({ to: "/back-office/tools/$toolId/detail" })
    ? "detail"
    : matchRoute({ to: "/back-office/tools/$toolId/calibration" })
      ? "calibration"
      : matchRoute({ to: "/back-office/tools/$toolId/status" })
        ? "status"
        : "detail";

  return (
    <div className="flex flex-col">
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="detail" asChild>
            <Link
              to="/back-office/tools/$toolId/detail"
              params={{
                toolId,
              }}
            >
              Detail
            </Link>
          </TabsTrigger>
          <TabsTrigger value="calibration" asChild>
            <Link
              to="/back-office/tools/$toolId/calibration"
              params={{
                toolId,
              }}
            >
              Calibration
            </Link>
          </TabsTrigger>
          <TabsTrigger value="status" asChild>
            <Link
              to="/back-office/tools/$toolId/status"
              params={{
                toolId,
              }}
            >
              Status
            </Link>
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
