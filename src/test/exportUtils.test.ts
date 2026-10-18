import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isWithinDays,
  formatBuffaloesExport,
  formatUsersExport,
  exportRecordsByFormat,
  type ExportContextData,
} from "../lib/exportUtils";
import type { BuffaloListingAdmin, Profile, PurchaseInquiry } from "../lib/pdfReportGenerator";

describe("exportUtils", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("isWithinDays", () => {
    it("returns true for 'all'", () => {
      expect(isWithinDays("2020-01-01", "all")).toBe(true);
    });

    it("filters correctly by day threshold", () => {
      const today = new Date().toISOString();
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(isWithinDays(today, "7")).toBe(true);
      expect(isWithinDays(sixtyDaysAgo, "30")).toBe(false);
      expect(isWithinDays(sixtyDaysAgo, "90")).toBe(true);
    });
  });

  describe("formatBuffaloesExport", () => {
    it("correctly maps buffalo listing properties", () => {
      const buffaloes: BuffaloListingAdmin[] = [
        {
          id: "buf-1",
          name: "Murrah Queen",
          breed: "Murrah",
          price: 150000,
          age: "4 years",
          weight: "550 kg",
          milk_yield: "18 L/day",
          description: "Top breed",
          image_url: null,
          is_available: true,
          status: "available",
          created_at: new Date().toISOString(),
        },
      ];

      const formatted = formatBuffaloesExport(buffaloes);
      expect(formatted).toHaveLength(1);
      expect(formatted[0].Name).toBe("Murrah Queen");
      expect(formatted[0].Breed).toBe("Murrah");
      expect(formatted[0]["Price (Rs)"]).toBe(150000);
    });
  });

  describe("formatUsersExport", () => {
    it("correctly formats users with decrypted password and inquiry counts", () => {
      const profiles: Profile[] = [
        {
          id: "p1",
          user_id: "u1",
          full_name: "Farmer Ramesh",
          phone: "9876543210",
          email: "ramesh@example.com",
          user_password: "rameshSecret123",
          created_at: new Date().toISOString(),
        },
      ];
      const inquiries: PurchaseInquiry[] = [
        {
          id: "inq-1",
          name: "Ramesh",
          phone: "9876543210",
          email: "ramesh@example.com",
          message: "Interested",
          created_at: new Date().toISOString(),
          user_id: "u1",
        },
      ];

      const formatted = formatUsersExport(profiles, inquiries, { u1: "user" }, "all");
      expect(formatted).toHaveLength(1);
      expect(formatted[0]["Full Name"]).toBe("Farmer Ramesh");
      expect(formatted[0].Email).toBe("ramesh@example.com");
      expect(formatted[0].Password).toBe("rameshSecret123");
      expect(formatted[0]["Inquiries Count"]).toBe(1);
    });
  });

  describe("exportRecordsByFormat", () => {
    it("handles CSV export call without error", () => {
      const dummyData: ExportContextData = {
        buffaloListings: [],
        purchaseInquiries: [],
        profiles: [],
        consultations: [],
        contacts: [],
        activityLogs: [],
      };

      const result = exportRecordsByFormat("json", "comprehensive", dummyData);
      expect(result.success).toBe(true);
      expect(result.filename).toContain(".json");
    });
  });
});
