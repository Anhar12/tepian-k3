import { useRouter } from "@tanstack/react-router";

/**
 * A hook that redirects the user back to the previous page after a timeout.
 * @param defaultTimeout The default timeout in milliseconds. Default is 350ms.
 * @returns A function that redirects the user back after the timeout.
 */
export function useRedirectBackWithTimeout(defaultTimeout: number = 350) {
  const router = useRouter();

  return (timeout: number = defaultTimeout) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        router.history.back();
        resolve();
      }, timeout);
    });
  };
}
