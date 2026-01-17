import { getClusterColor } from "@/lib/cluster-colors";
import { Badge } from "./badge";
import {
  EMPLOYEE_STATUS_COLORS,
  EMPLOYEE_STATUS_LABELS,
  TOOLS_AVAILABILITY_COLORS,
  TOOLS_AVAILABILITY_LABELS,
  TOOLS_CONDITIONS_COLORS,
  TOOLS_CONDITIONS_LABELS,
} from "@tepian-k3/constants";

type BadgeVariant = {
  label: string;
  className: string;
};

interface StatusBadgeProps {
  type: "condition" | "availability" | "status" | "cluster";
  value: string;
}

export function StatusBadge({ type, value }: StatusBadgeProps) {
  let badgeConfig: BadgeVariant;

  switch (type) {
    case "condition":
      badgeConfig = {
        label:
          value in TOOLS_CONDITIONS_LABELS
            ? TOOLS_CONDITIONS_LABELS[
                value as keyof typeof TOOLS_CONDITIONS_LABELS
              ]
            : value,
        className:
          value in TOOLS_CONDITIONS_COLORS
            ? TOOLS_CONDITIONS_COLORS[
                value as keyof typeof TOOLS_CONDITIONS_COLORS
              ]
            : "bg-muted text-muted-foreground",
      };
      break;
    case "availability":
      badgeConfig = {
        label:
          value in TOOLS_AVAILABILITY_LABELS
            ? TOOLS_AVAILABILITY_LABELS[
                value as keyof typeof TOOLS_AVAILABILITY_LABELS
              ]
            : value,
        className:
          value in TOOLS_AVAILABILITY_COLORS
            ? TOOLS_AVAILABILITY_COLORS[
                value as keyof typeof TOOLS_AVAILABILITY_COLORS
              ]
            : "bg-muted text-muted-foreground",
      };
      break;
    case "status":
      badgeConfig = {
        label:
          EMPLOYEE_STATUS_LABELS[
            value as keyof typeof EMPLOYEE_STATUS_LABELS
          ] || value,
        className:
          value in EMPLOYEE_STATUS_COLORS
            ? EMPLOYEE_STATUS_COLORS[
                value as keyof typeof EMPLOYEE_STATUS_COLORS
              ]
            : "bg-muted text-muted-foreground",
      };
      break;
    case "cluster":
      return (
        <Badge className={`${getClusterColor(value)} hover:opacity-90`}>
          {value}
        </Badge>
      );
    default:
      badgeConfig = {
        label: value,
        className: "bg-muted text-muted-foreground",
      };
  }

  return (
    <Badge className={`${badgeConfig.className} hover:opacity-90`}>
      {badgeConfig.label}
    </Badge>
  );
}
