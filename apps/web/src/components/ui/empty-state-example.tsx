import { IconFolderCode } from "@tabler/icons-react";

import { EmptyState } from "@/components/ui/empty-state";

export function EmptyDemo() {
  return (
    <EmptyState
      icon={IconFolderCode}
      title="No Projects Yet"
      description="You haven't created any projects yet. Get started by creating your first project."
      actions={[
        {
          label: "Create Project",
          onClick: () => console.log("Create project clicked"),
        },
        {
          label: "Import Project",
          variant: "outline",
          onClick: () => console.log("Import project clicked"),
        },
      ]}
      learnMoreHref="#"
    />
  );
}
