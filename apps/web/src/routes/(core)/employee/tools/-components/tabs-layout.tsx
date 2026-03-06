import { Link, useMatchRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TabsLayoutProps {
  worksheetId: string;
  children: React.ReactNode;
}

export function TabsLayout({ worksheetId, children }: TabsLayoutProps) {
  const matchRoute = useMatchRoute();

  // Determine active tab based on current route
  // detail is borrow, return is return, default to detail as borrow
  const activeTab = matchRoute({ to: "/employee/tools/$worksheetId/detail" })
    ? "borrow"
    : matchRoute({ to: "/employee/tools/$worksheetId/return" })
      ? "return"
      : "borrow";

  return (
    <div className="flex flex-col">
      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="borrow" asChild>
            <Link
              to="/employee/tools/$worksheetId/detail"
              params={{
                worksheetId,
              }}
            >
              Pinjam
            </Link>
          </TabsTrigger>
          <TabsTrigger value="return" asChild>
            <Link
              to="/employee/tools/$worksheetId/return"
              params={{
                worksheetId,
              }}
            >
              Kembalikan
            </Link>
          </TabsTrigger>
        </TabsList>
        {children}
      </Tabs>
    </div>
  );
}
