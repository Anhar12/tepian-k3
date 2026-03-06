import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";

export const useUserProfile = () => {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    ...trpc.platform.auth.profile.queryOptions(),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (!isLoading && !profile && !error) {
    throw new Error("User must be authenticated to access profile");
  }

  return {
    profile: profile!, // Non-null assertion since we throw above if missing
    isLoading,
    error,
  };
};
