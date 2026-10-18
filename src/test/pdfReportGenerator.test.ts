import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import {
  generateFarmReportPDF,
  BuffaloListingAdmin,
  PurchaseInquiry,
  Profile,
  ConsultationRequest,
  ContactMessage,
  ActivityLog,
} from "@/lib/pdfReportGenerator";

describe("pdfReportGenerator", () => {
  afterAll(() => {
    for (const file of fs.readdirSync(process.cwd())) {
      if (file.startsWith("AK_Buffaloes_") && file.endsWith(".pdf")) {
        try {
          fs.unlinkSync(file);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  });
  const mockBuffaloes: BuffaloListingAdmin[] = [
    {
      id: "b1",
      name: "Murrah Champion",
      breed: "Murrah",
      price: 95000,
      age: "3.5 Years",
      weight: "520 Kg",
      milk_yield: "14 L/day",
      description: "High milk yielding Murrah female",
      image_url: null,
      is_available: true,
      status: "available",
      created_at: new Date().toISOString(),
    },
    {
      id: "b2",
      name: "Nili-Ravi Star",
      breed: "Nili-Ravi",
      price: 110000,
      age: "4 Years",
      weight: "500 Kg",
      milk_yield: "12 L/day",
      description: "Well bred",
      image_url: null,
      is_available: false,
      status: "out_of_stock",
      created_at: new Date().toISOString(),
    },
  ];

  const mockInquiries: PurchaseInquiry[] = [
    {
      id: "pi1",
      name: "Ramesh Patil",
      phone: "+919876543210",
      email: "ramesh@example.com",
      message: "Looking for 2 Murrah buffaloes for commercial dairy",
      status: "confirmed",
      admin_note: "Negotiated and delivery planned",
      created_at: new Date().toISOString(),
      user_id: "u1",
      buffalo_name: "Murrah Champion",
      buffalo_breed: "Murrah",
      buffalo_price: 95000,
    },
    {
      id: "pi2",
      name: "Ganesh Shinde",
      phone: "+919123456789",
      email: "ganesh@example.com",
      message: "Please share pricing for delivery to Pune",
      status: "pending",
      admin_note: null,
      created_at: new Date().toISOString(),
      user_id: "u2",
      buffalo_name: "Nili-Ravi Star",
      buffalo_breed: "Nili-Ravi",
      buffalo_price: 110000,
    },
  ];

  const mockProfiles: Profile[] = [
    {
      id: "p1",
      user_id: "u1",
      full_name: "Ramesh Patil",
      phone: "+919876543210",
      email: "ramesh@example.com",
      created_at: new Date().toISOString(),
    },
    {
      id: "p2",
      user_id: "u2",
      full_name: "Ganesh Shinde",
      phone: "+919123456789",
      email: "ganesh@example.com",
      created_at: new Date().toISOString(),
    },
  ];

  const mockConsultations: ConsultationRequest[] = [
    {
      id: "c1",
      name: "Vijay Deshmukh",
      email: "vijay@example.com",
      phone: "+919988776655",
      status: "completed",
      admin_note: "Provided diet and feed advice",
      created_at: new Date().toISOString(),
    },
  ];

  const mockContacts: ContactMessage[] = [
    {
      id: "m1",
      name: "Suresh Chavan",
      phone: "+919443322110",
      email: "suresh@example.com",
      message: "Need guidance on vaccination schedule",
      status: "replied",
      admin_note: null,
      created_at: new Date().toISOString(),
    },
  ];

  const mockActivityLogs: ActivityLog[] = [
    {
      id: "a1",
      user_id: "admin1",
      user_email: "akbuffaloes540@gmail.com",
      user_role: "admin",
      action: "status_update",
      entity_type: "purchase_inquiry",
      entity_id: "pi1",
      details: "Changed status to confirmed",
      created_at: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Mock URL.createObjectURL and HTMLAnchorElement.prototype.click if in jsdom
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    }
    if (!window.URL.revokeObjectURL) {
      window.URL.revokeObjectURL = vi.fn();
    }
  });

  it("generates a comprehensive master farm report successfully", () => {
    const result = generateFarmReportPDF({
      reportType: "comprehensive",
      dateRange: "all",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
      adminEmail: "akbuffaloes540@gmail.com",
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Comprehensive_Audit");
    expect(result.fileName).toMatch(/\.pdf$/);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.summary.totalBuffaloes).toBe(2);
    expect(result.summary.totalInquiries).toBe(2);
    expect(result.summary.totalUsers).toBe(2);
    expect(result.summary.totalPipelineValue).toBe(205000);
  });

  it("generates an inquiries-only report with correct filename and summary", () => {
    const result = generateFarmReportPDF({
      reportType: "inquiries",
      dateRange: "30",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Purchase_Inquiries");
    expect(result.fileName).toMatch(/\.pdf$/);
    expect(result.summary.totalInquiries).toBe(2);
  });

  it("generates a livestock inventory-only report", () => {
    const result = generateFarmReportPDF({
      reportType: "buffaloes",
      dateRange: "all",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Livestock_Inventory");
    expect(result.summary.totalBuffaloes).toBe(2);
  });

  it("generates a customer accounts directory report", () => {
    const result = generateFarmReportPDF({
      reportType: "users",
      dateRange: "all",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Customer_Accounts");
    expect(result.summary.totalUsers).toBe(2);
  });

  it("generates consultations and contact messages report", () => {
    const result = generateFarmReportPDF({
      reportType: "consultations",
      dateRange: "all",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Consultations_Messages");
    expect(result.summary.totalConsultations).toBe(1);
    expect(result.summary.totalMessages).toBe(1);
  });

  it("generates activity audit log report", () => {
    const result = generateFarmReportPDF({
      reportType: "activity",
      dateRange: "all",
      buffaloListings: mockBuffaloes,
      purchaseInquiries: mockInquiries,
      profiles: mockProfiles,
      consultations: mockConsultations,
      contacts: mockContacts,
      activityLogs: mockActivityLogs,
    });

    expect(result.success).toBe(true);
    expect(result.fileName).toContain("AK_Buffaloes_Operations_Audit");
    expect(result.summary.totalLogs).toBe(1);
  });
});
