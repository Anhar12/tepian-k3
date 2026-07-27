import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import { maskEmail, maskPhone, maskName, maskCompany } from "@tepian-k3/utils/mask-data";

type MaskType = "email" | "phone" | "name" | "company";

export function useMaskedData(value: string | null | undefined, type: MaskType, allowToggle = true) {
  const [isMasked, setIsMasked] = useState(true);
  const { hasAnyPermission, isLoading } = usePermissions();
  
  // Only admins / specific roles can toggle to view raw sensitive data
  const canToggle = allowToggle && !isLoading && hasAnyPermission(["users.read", "orders.read"]);

  let maskedValue = value;
  if (value) {
    switch (type) {
      case "email":
        maskedValue = maskEmail(value);
        break;
      case "phone":
        maskedValue = maskPhone(value);
        break;
      case "name":
        maskedValue = maskName(value);
        break;
      case "company":
        maskedValue = maskCompany(value);
        break;
    }
  }

  const displayValue = isMasked ? maskedValue : value;

  return {
    displayValue: displayValue || "",
    isMasked,
    toggleMask: () => setIsMasked(prev => !prev),
    canToggle
  };
}
