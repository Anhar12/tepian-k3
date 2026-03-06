import { trpcClient } from "@/utils/trpc";
import { auth } from "@/utils/auth";
import { globalSuccessToast, globalErrorToast } from "./toast";

/**
 * Centralized logout function that:
 * 1. Revokes the refresh token on the server
 * 2. Clears local tokens
 * 3. Redirects to login page
 */
export async function logout() {
  try {
    const refreshToken = auth.getRefreshToken();

    // Only attempt to revoke if we have a refresh token
    if (refreshToken) {
      try {
        // Call the logout endpoint to revoke the refresh token
        await trpcClient.platform.auth.logout.mutate({
          refreshToken,
        });
      } catch (error) {
        // Log error but continue with local logout
        console.error("Failed to revoke refresh token on server:", error);
      }
    }

    // Clear local tokens
    auth.clearTokens();

    // Show success message
    globalSuccessToast("Logout berhasil");

    // Redirect to login page
    window.location.href = "/login";
  } catch (error) {
    console.error("Logout error:", error);
    globalErrorToast("Gagal logout. Silakan coba lagi.");
  }
}
