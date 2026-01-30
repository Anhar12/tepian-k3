import { SkeletonGenerator } from "@/components/ui/skeleton-generator";

interface FormSkeletonProps {
  variant?: "form" | "companyForm" | "userForm" | "parameterForm";
}

export function FormSkeleton({ variant = "form" }: FormSkeletonProps = {}) {
  return <SkeletonGenerator variant={variant} />;
}
