import { describe, expect, it, beforeEach, vi } from "vitest";
import { Effect } from "effect";
import { getSharedTestDb, truncateAllTables } from "../helpers/test-db";
import teamMemberQueries from "../../platform/team-member.queries";

const { getDb, setDb } = vi.hoisted(() => {
  let _db: any;
  return {
    getDb: () => {
      if (!_db) throw new Error("DB not init");
      return _db;
    },
    setDb: (d: any) => {
      _db = d;
    },
  };
});

vi.mock("@tepian-k3/db/client", () => {
  return {
    get db() {
      return getDb();
    },
  };
});

vi.mock("@tepian-k3/services/logger", () => ({
  logError: vi.fn(),
  logInfo: vi.fn(),
}));

vi.mock("@tepian-k3/services/storage", () => ({
  storageService: {
    getKeyFromUrl: vi.fn((url: string) =>
      url?.replace("https://storage.example.com/", ""),
    ),
    upload: vi.fn(),
  },
}));

vi.mock("@tepian-k3/services/queue", () => ({
  QueueName: {
    CLEANUP: "cleanup",
  },
  queueService: {
    addJob: vi.fn().mockResolvedValue(true),
  },
}));

describe("teamMemberQueries", () => {
  let mockDb: any;

  beforeEach(async () => {
    mockDb = await getSharedTestDb();
    setDb(mockDb);
    await truncateAllTables(mockDb);
  });

  describe("createTeamMember and getTeamMemberById", () => {
    it("should create a team member and retrieve it by id", async () => {
      const created = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "Budi Santoso",
            role: "Full Stack Engineer",
            bio: "Building amazing things",
            socialLinks: [
              {
                platform: "linkedin",
                url: "https://linkedin.com/in/budi",
                label: "LinkedIn",
              },
              { platform: "email", url: "budi@example.com", label: "Email" },
            ],
            order: 0,
            isActive: true,
          } as any,
          "team-members/photo1.webp",
        ),
      );

      expect(created).toBeDefined();
      expect(created.name).toBe("Budi Santoso");
      expect(created.role).toBe("Full Stack Engineer");
      expect(created.photoUrl).toBe("team-members/photo1.webp");

      const fetched = await Effect.runPromise(
        teamMemberQueries.getTeamMemberById(created.id),
      );

      expect(fetched).toBeDefined();
      expect(fetched?.name).toBe("Budi Santoso");
      expect(Array.isArray(fetched?.socialLinks)).toBe(true);
      expect((fetched?.socialLinks as any[]).length).toBe(2);
    });
  });

  describe("getAllActiveTeamMembers", () => {
    it("should return only active and non-deleted team members ordered by order asc", async () => {
      await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "Member 2",
            role: "Developer",
            order: 2,
            isActive: true,
          } as any,
          null,
        ),
      );

      await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "Member 1",
            role: "Lead",
            order: 1,
            isActive: true,
          } as any,
          null,
        ),
      );

      const inactive = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "Member Inactive",
            role: "Hidden",
            order: 0,
            isActive: false,
          } as any,
          null,
        ),
      );

      const activeMembers = await Effect.runPromise(
        teamMemberQueries.getAllActiveTeamMembers(),
      );

      expect(activeMembers.length).toBe(2);
      expect(activeMembers[0]?.name).toBe("Member 1");
      expect(activeMembers[1]?.name).toBe("Member 2");
    });
  });

  describe("updateTeamMember", () => {
    it("should update team member details", async () => {
      const created = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "Original Name",
            role: "Original Role",
            order: 0,
            isActive: true,
          } as any,
          null,
        ),
      );

      const updated = await Effect.runPromise(
        teamMemberQueries.updateTeamMember(
          {
            id: created.id,
            name: "Updated Name",
            role: "Updated Role",
            bio: "New Bio",
          } as any,
          "team-members/new-photo.webp",
        ),
      );

      expect(updated.name).toBe("Updated Name");
      expect(updated.role).toBe("Updated Role");
      expect(updated.bio).toBe("New Bio");
      expect(updated.photoUrl).toBe("team-members/new-photo.webp");
    });
  });

  describe("deleteTeamMember", () => {
    it("should soft delete team member and exclude from active list", async () => {
      const created = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          {
            name: "To Delete",
            role: "Role",
            order: 0,
            isActive: true,
          } as any,
          null,
        ),
      );

      await Effect.runPromise(teamMemberQueries.deleteTeamMember(created.id));

      const activeMembers = await Effect.runPromise(
        teamMemberQueries.getAllActiveTeamMembers(),
      );

      expect(activeMembers.find((m) => m.id === created.id)).toBeUndefined();
    });
  });

  describe("reorderTeamMembers", () => {
    it("should reorder team members in batch", async () => {
      const m1 = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          { name: "M1", role: "R1", order: 0, isActive: true } as any,
          null,
        ),
      );

      const m2 = await Effect.runPromise(
        teamMemberQueries.createTeamMember(
          { name: "M2", role: "R2", order: 1, isActive: true } as any,
          null,
        ),
      );

      await Effect.runPromise(
        teamMemberQueries.reorderTeamMembers([
          { id: m1.id, order: 1 },
          { id: m2.id, order: 0 },
        ]),
      );

      const active = await Effect.runPromise(
        teamMemberQueries.getAllActiveTeamMembers(),
      );

      expect(active[0]?.id).toBe(m2.id);
      expect(active[1]?.id).toBe(m1.id);
    });
  });
});
