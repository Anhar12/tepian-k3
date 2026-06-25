import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isTokenBlacklisted,
  isTokenIssuedBeforeBlacklist,
} from "@tepian-k3/services/token-blacklist";
import { verifyAccessToken, createAccessToken } from "./index";

// Mock the env
vi.mock("../env", () => ({
  env: {
    JWT_SECRET: "test-secret-that-is-at-least-32-characters-long",
    JWT_REFRESH_SECRET:
      "test-refresh-secret-that-is-at-least-32-characters-long",
    JWT_RESET_PASSWORD_SECRET:
      "test-reset-secret-that-is-at-least-32-characters-long",
    JWT_ACCESS_TOKEN_EXPIRY: "15m",
    JWT_REFRESH_TOKEN_EXPIRY: "30d",
  },
}));

// Mock the services
vi.mock("@tepian-k3/services/token-blacklist", () => ({
  isTokenBlacklisted: vi.fn(),
  isTokenIssuedBeforeBlacklist: vi.fn(),
  initializeTokenBlacklist: vi.fn(),
  isBlacklistReady: vi.fn(() => true),
  blacklistToken: vi.fn(),
  blacklistAllUserTokens: vi.fn(),
  shutdownTokenBlacklist: vi.fn(),
}));

describe("Auth Module", () => {
  const mockPayload = {
    id: "user-123",
    sessionId: "session-456",
    email: "test@example.com",
    roles: ["user"],
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create and verify an access token successfully", async () => {
    // Setup mocks to allow verification
    vi.mocked(isTokenBlacklisted).mockResolvedValue(false);
    vi.mocked(isTokenIssuedBeforeBlacklist).mockResolvedValue(false);

    const token = await createAccessToken(mockPayload);
    expect(token).toBeDefined();

    const verified = await verifyAccessToken(token);
    expect(verified).toBeDefined();
    expect(verified?.id).toBe(mockPayload.id);
    expect(verified?.sessionId).toBe(mockPayload.sessionId);
  });

  it("should return null if token is blacklisted by sessionId", async () => {
    // Setup mock to simulate blacklisted session
    vi.mocked(isTokenBlacklisted).mockResolvedValue(true);
    vi.mocked(isTokenIssuedBeforeBlacklist).mockResolvedValue(false);

    const token = await createAccessToken(mockPayload);
    const verified = await verifyAccessToken(token);

    expect(verified).toBeNull();
    expect(isTokenBlacklisted).toHaveBeenCalledWith(mockPayload.sessionId);
  });

  it("should return null if token was issued before a user global blacklist", async () => {
    // Setup mock to simulate global user blacklist
    vi.mocked(isTokenBlacklisted).mockResolvedValue(false);
    vi.mocked(isTokenIssuedBeforeBlacklist).mockResolvedValue(true);

    const token = await createAccessToken(mockPayload);
    const verified = await verifyAccessToken(token);

    expect(verified).toBeNull();
    // iat is checked, we don't know exact iat but the function should be called
    expect(isTokenIssuedBeforeBlacklist).toHaveBeenCalled();
  });
});
