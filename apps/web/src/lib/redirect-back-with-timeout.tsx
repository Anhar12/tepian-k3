import { useRouter } from "@tanstack/react-router";

export function useRedirectBackWithTimeout() {
  const router = useRouter();

  return (timeout: number = 350) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        router.history.back();
        resolve();
      }, timeout);
    });
  };
}
