import { useEffect, useState, useCallback } from "react";
import { env } from "@/env";

const VERSION_KEY = "app_current_version";
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useAppVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const checkVersion = useCallback(async () => {
    if (updateAvailable) return;

    try {
      const response = await fetch(`${env.VITE_SERVER_URL || ""}/api/version`);
      if (!response.ok) return;

      const data = await response.json();
      const latestVersion = data.version;

      const currentVersion = localStorage.getItem(VERSION_KEY);

      if (!currentVersion) {
        // First time loading, save current version
        localStorage.setItem(VERSION_KEY, latestVersion);
      } else if (currentVersion !== latestVersion) {
        // Version mismatch, update available!
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error("Failed to check app version:", error);
    }
  }, [updateAvailable]);

  useEffect(() => {
    // Check immediately on mount
    checkVersion();

    // Check periodically
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL);

    // Check when user focuses back on the tab
    const handleFocus = () => checkVersion();
    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkVersion]);

  const reloadApp = () => {
    localStorage.removeItem(VERSION_KEY);
    window.location.reload();
  };

  return { updateAvailable, reloadApp, setUpdateAvailable };
}
