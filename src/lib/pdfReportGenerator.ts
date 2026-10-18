import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportType =
  | "comprehensive"
  | "inquiries"
  | "buffaloes"
  | "users"
  | "consultations"
  | "activity";

export interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  created_at: string;
  updated_at?: string;
  avatar_url?: string | null;
  user_password?: string | null;
}

export interface ConsultationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status?: string;
  admin_note?: string | null;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  message: string;
  status?: string;
  admin_note?: string | null;
  created_at: string;
}

export interface PurchaseInquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  status?: string;
  admin_note?: string | null;
  created_at: string;
  user_id: string | null;
  buffalo_name?: string;
  buffalo_breed?: string;
  buffalo_price?: number;
}

export interface BuffaloListingAdmin {
  id: string;
  stock_code?: string;
  subtitle_label?: string;
  name: string;
  breed: string;
  price: number;
  is_negotiable?: boolean;
  age: string;
  weight: string;
  milk_yield: string;
  lactation?: string;
  pregnancy_status?: string;
  calf_details?: string;
  health_records?: string;
  video_url?: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  status: string;
  is_new_stock?: boolean;
  created_at: string;
}

export interface UserRole {
  user_id: string;
  role: string;
}

export interface GenerateReportOptions {
  reportType: ReportType;
  dateRange?: string; // "all" | "7" | "30" | "90"
  buffaloListings: BuffaloListingAdmin[];
  purchaseInquiries: PurchaseInquiry[];
  profiles: Profile[];
  consultations: ConsultationRequest[];
  contacts: ContactMessage[];
  activityLogs: ActivityLog[];
  userRoles?: UserRole[];
  adminEmail?: string;
}

export interface ReportGenerationResult {
  success: boolean;
  fileName: string;
  pageCount: number;
  summary: {
    totalBuffaloes: number;
    totalInquiries: number;
    totalUsers: number;
    totalConsultations: number;
    totalMessages: number;
    totalLogs: number;
    totalPipelineValue: number;
  };
}

// Helpers
const isWithinDays = (dateStr: string, days?: string): boolean => {
  if (!days || days === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= Number(days);
};

const formatCurrencyINR = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return "—";
  return `Rs. ${Number(amount).toLocaleString("en-IN")}`;
};

const formatDateReadable = (dateStr: string): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const formatDateTimeReadable = (dateStr: string): string => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })} ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return dateStr;
  }
};

const getReportTitle = (type: ReportType): { title: string; subtitle: string } => {
  switch (type) {
    case "comprehensive":
      return {
        title: "COMPREHENSIVE FARM MANAGEMENT & AUDIT REPORT",
        subtitle: "Complete operational summary of livestock, customer inquiries, users & consultations",
      };
    case "inquiries":
      return {
        title: "PURCHASE INQUIRIES & DEALS REPORT",
        subtitle: "Audit log of all buyer purchase inquiries, deal stages, and requests",
      };
    case "buffaloes":
      return {
        title: "BUFFALO LIVESTOCK & INVENTORY REPORT",
        subtitle: "Breeds catalog, current availability, milk yields, and pricing specs",
      };
    case "users":
      return {
        title: "REGISTERED CUSTOMERS & USER ACCOUNTS DIRECTORY",
        subtitle: "Customer profiles, contact details, account types, and activity history",
      };
    case "consultations":
      return {
        title: "CONSULTATION REQUESTS & MESSAGES REPORT",
        subtitle: "Veterinary inquiries, advisory bookings, and incoming contact submissions",
      };
    case "activity":
      return {
        title: "PLATFORM ACTIVITY & OPERATIONS AUDIT REPORT",
        subtitle: "System audit logs, user actions, administrative events, and tracking",
      };
    default:
      return {
        title: "OFFICIAL FARM RECORDS REPORT",
        subtitle: "Official operational data report from AK Buffaloes Dairy Farm",
      };
  }
};

export const generateFarmReportPDF = (
  options: GenerateReportOptions
): ReportGenerationResult => {
  const {
    reportType,
    dateRange = "all",
    buffaloListings,
    purchaseInquiries,
    profiles,
    consultations,
    contacts,
    activityLogs,
    userRoles = [],
    adminEmail = "akbuffaloes540@gmail.com",
  } = options;

  // Filter records by date range if applicable
  const filteredInquiries = purchaseInquiries.filter((p) =>
    isWithinDays(p.created_at, dateRange)
  );
  const filteredBuffaloes = buffaloListings.filter((b) =>
    isWithinDays(b.created_at, dateRange)
  );
  const filteredUsers = profiles.filter((p) =>
    isWithinDays(p.created_at, dateRange)
  );
  const filteredConsultations = consultations.filter((c) =>
    isWithinDays(c.created_at, dateRange)
  );
  const filteredContacts = contacts.filter((m) =>
    isWithinDays(m.created_at, dateRange)
  );
  const filteredLogs = activityLogs.filter((a) =>
    isWithinDays(a.created_at, dateRange)
  );

  // Compute key metrics
  const totalPipelineValue = filteredInquiries.reduce(
    (sum, cur) => sum + (cur.buffalo_price || 0),
    0
  );

  const summary = {
    totalBuffaloes: filteredBuffaloes.length,
    totalInquiries: filteredInquiries.length,
    totalUsers: filteredUsers.length,
    totalConsultations: filteredConsultations.length,
    totalMessages: filteredContacts.length,
    totalLogs: filteredLogs.length,
    totalPipelineValue,
  };

  // Create new jsPDF A4 Document
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // 1. Draw Top Farm Banner Header
  doc.setFillColor(19, 62, 43); // Deep emerald dairy green (#133E2B)
  doc.rect(0, 0, pageWidth, 7, "F");

  doc.setFillColor(212, 175, 55); // Rich Gold Accent (#D4AF37)
  doc.rect(0, 7, pageWidth, 1.5, "F");

  let currentY = 16;

  // Farm Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(19, 62, 43);
  doc.text("AK BUFFALOES DAIRY FARM & LIVESTOCK", marginX, currentY);

  // Subtitle / Address
  currentY += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 90, 85);
  doc.text(
    "Nurani Nagar, Jamner Road, Pachora, Dist. Jalgaon - 424201, Maharashtra, India",
    marginX,
    currentY
  );

  // Contact line
  currentY += 4;
  doc.text(
    "Helpline: +91-9022273915  |  Official Email: akbuffaloes540@gmail.com  |  Web: akbuffaloes.com",
    marginX,
    currentY
  );

  // 2. Report Details Card Box
  currentY += 6;
  const metaBoxY = currentY;
  const metaBoxHeight = 17;
  doc.setFillColor(248, 250, 248);
  doc.setDrawColor(215, 225, 218);
  doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2, 2, "FD");

  const { title: reportTitle, subtitle: reportSubtitle } = getReportTitle(reportType);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(19, 62, 43);
  doc.text(reportTitle, marginX + 4, metaBoxY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 105);
  doc.text(reportSubtitle, marginX + 4, metaBoxY + 10);

  // Right-aligned report metadata in box
  const now = new Date();
  const dateFormatted = now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const randomRef = Math.random().toString(36).substring(2, 6).toUpperCase();
  const dateCode = now.toISOString().slice(0, 10).replace(/-/g, "");
  const reportRef = `AKB-REC-${dateCode}-${randomRef}`;

  const periodLabel =
    dateRange === "all"
      ? "All Time Records"
      : `Last ${dateRange} Days`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 50, 45);
  doc.text(`Ref: ${reportRef}`, pageWidth - marginX - 4, metaBoxY + 5, {
    align: "right",
  });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 100, 95);
  doc.text(
    `Generated: ${dateFormatted} ${timeFormatted}`,
    pageWidth - marginX - 4,
    metaBoxY + 9,
    { align: "right" }
  );
  doc.text(
    `Scope: ${periodLabel} | By: ${adminEmail}`,
    pageWidth - marginX - 4,
    metaBoxY + 13,
    { align: "right" }
  );

  currentY = metaBoxY + metaBoxHeight + 5;

  // 3. KPI Summary Metric Cards (Executive Overview)
  const cardWidth = (contentWidth - 12) / 4; // 4 cards across content width
  const cardHeight = 14;

  const inStockCount = filteredBuffaloes.filter(
    (b) => b.status !== "out_of_stock" && b.is_available !== false
  ).length;

  const kpis = [
    {
      label: "BUFFALO LIVESTOCK",
      value: `${filteredBuffaloes.length} Head`,
      sub: `${inStockCount} In Stock`,
    },
    {
      label: "TOTAL INQUIRIES",
      value: `${filteredInquiries.length}`,
      sub: `${filteredInquiries.filter((p) => (p.status || "pending") === "pending").length} Pending Deals`,
    },
    {
      label: "DEAL PIPELINE VALUE",
      value: totalPipelineValue > 0 ? formatCurrencyINR(totalPipelineValue) : "Rs. 0",
      sub: "From Buyer Inquiries",
    },
    {
      label: "REGISTERED CUSTOMERS",
      value: `${filteredUsers.length} Users`,
      sub: `${filteredConsultations.length} Consultations`,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = marginX + idx * (cardWidth + 4);
    doc.setFillColor(252, 253, 252);
    doc.setDrawColor(220, 230, 222);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    // Top gold line on card
    doc.setFillColor(212, 175, 55);
    doc.rect(cardX, currentY, cardWidth, 0.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 125, 115);
    doc.text(kpi.label, cardX + 2.5, currentY + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(19, 62, 43);
    doc.text(kpi.value, cardX + 2.5, currentY + 8.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(120, 130, 125);
    doc.text(kpi.sub, cardX + 2.5, currentY + 12);
  });

  currentY += cardHeight + 6;

  // Helper to ensure enough space on page before starting a section
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 18;
    }
  };

  // Helper to draw section heading banner
  const drawSectionHeader = (title: string, countBadge?: string) => {
    ensureSpace(12);
    doc.setFillColor(19, 62, 43);
    doc.roundedRect(marginX, currentY, contentWidth, 6, 1, 1, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(title, marginX + 3, currentY + 4.2);

    if (countBadge) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(230, 240, 235);
      doc.text(countBadge, pageWidth - marginX - 3, currentY + 4.2, {
        align: "right",
      });
    }

    currentY += 8;
  };

  // SECTION: BUFFALOES
  if (reportType === "comprehensive" || reportType === "buffaloes") {
    drawSectionHeader(
      "1. LIVESTOCK INVENTORY & BREED CATALOG",
      `Total: ${filteredBuffaloes.length} Listings`
    );

    const buffaloBody = filteredBuffaloes.map((b, index) => {
      const isOut = b.status === "out_of_stock" || b.is_available === false;
      const statusText = isOut
        ? "Out of Stock"
        : b.status === "limited_stock"
        ? "Limited Stock"
        : "In Stock";
      return [
        String(index + 1),
        b.name || "Buffalo",
        b.breed || "Murrah",
        formatCurrencyINR(b.price),
        b.milk_yield || "—",
        `${b.age || "—"} / ${b.weight || "—"}`,
        statusText,
      ];
    });

    if (buffaloBody.length === 0) {
      buffaloBody.push(["—", "No livestock records matching selected filter", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Tag / Name", "Breed", "Price (INR)", "Milk Yield", "Age / Wt", "Status"]],
      body: buffaloBody,
      theme: "striped",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 40, 35],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 80, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 38 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26, fontStyle: "bold" },
        4: { cellWidth: 24 },
        5: { cellWidth: 30 },
        6: { cellWidth: 30 },
      },
      margin: { left: marginX, right: marginX },
    });

    // @ts-expect-error jspdf-autotable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // SECTION: INQUIRIES
  if (reportType === "comprehensive" || reportType === "inquiries") {
    drawSectionHeader(
      reportType === "comprehensive"
        ? "2. PURCHASE INQUIRIES & DEALS TRACKING"
        : "PURCHASE INQUIRIES & DEALS TRACKING",
      `Total: ${filteredInquiries.length} Inquiries`
    );

    const inquiriesBody = filteredInquiries.map((pi, index) => {
      const buffaloDisplay = pi.buffalo_name
        ? `${pi.buffalo_name} (${pi.buffalo_breed || ""})`
        : "General Inquiry";
      const statusFormatted = (pi.status || "pending").toUpperCase();
      return [
        String(index + 1),
        formatDateReadable(pi.created_at),
        pi.name || "Customer",
        pi.phone || "—",
        pi.email || "—",
        buffaloDisplay,
        formatCurrencyINR(pi.buffalo_price),
        statusFormatted,
      ];
    });

    if (inquiriesBody.length === 0) {
      inquiriesBody.push(["—", "No purchase inquiries matching selected filter", "", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Date", "Customer", "Phone", "Email", "Buffalo / Breed", "Price", "Status"]],
      body: inquiriesBody,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 40, 35],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 80, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 20 },
        2: { cellWidth: 26 },
        3: { cellWidth: 24 },
        4: { cellWidth: 34 },
        5: { cellWidth: 32 },
        6: { cellWidth: 20, fontStyle: "bold" },
        7: { cellWidth: 18, halign: "center" },
      },
      margin: { left: marginX, right: marginX },
    });

    // @ts-expect-error jspdf-autotable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // SECTION: USERS & CUSTOMERS
  if (reportType === "comprehensive" || reportType === "users") {
    drawSectionHeader(
      reportType === "comprehensive"
        ? "3. REGISTERED FARMER & USER DIRECTORY"
        : "REGISTERED FARMER & USER DIRECTORY",
      `Total: ${filteredUsers.length} Registered Accounts`
    );

    const usersBody = filteredUsers.map((u, index) => {
      const roleObj = userRoles.find((r) => r.user_id === u.user_id);
      const role = roleObj ? roleObj.role : "user";
      const userInquiries = purchaseInquiries.filter((pi) => pi.user_id === u.user_id).length;
      return [
        String(index + 1),
        u.full_name || "User",
        u.email || "—",
        u.phone || "—",
        role.toUpperCase(),
        formatDateReadable(u.created_at),
        `${userInquiries} Inquiries`,
      ];
    });

    if (usersBody.length === 0) {
      usersBody.push(["—", "No user account records matching filter", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Farmer / Account Name", "Email Address", "Phone", "Role", "Joined Date", "Activity"]],
      body: usersBody,
      theme: "striped",
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 40, 35],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 80, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 36 },
        2: { cellWidth: 46 },
        3: { cellWidth: 26 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 24 },
        6: { cellWidth: 24 },
      },
      margin: { left: marginX, right: marginX },
    });

    // @ts-expect-error jspdf-autotable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // SECTION: CONSULTATIONS & MESSAGES
  if (reportType === "comprehensive" || reportType === "consultations") {
    drawSectionHeader(
      reportType === "comprehensive"
        ? "4. CONSULTATIONS & CONTACT INQUIRIES"
        : "CONSULTATIONS & CONTACT INQUIRIES",
      `Total: ${filteredConsultations.length + filteredContacts.length} Requests`
    );

    const consultRows = filteredConsultations.map((c, idx) => [
      String(idx + 1),
      formatDateReadable(c.created_at),
      "Consultation",
      c.name || "Client",
      c.phone || "—",
      c.email || "—",
      (c.status || "pending").toUpperCase(),
      c.admin_note || "Advisory call requested",
    ]);

    const contactRows = filteredContacts.map((m, idx) => [
      String(filteredConsultations.length + idx + 1),
      formatDateReadable(m.created_at),
      "Message",
      m.name || "Visitor",
      m.phone || "—",
      m.email || "—",
      (m.status || "unread").toUpperCase(),
      m.message || "Contact form inquiry",
    ]);

    const combinedSupportRows = [...consultRows, ...contactRows];

    if (combinedSupportRows.length === 0) {
      combinedSupportRows.push(["—", "No support or consultation records found", "", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Date", "Type", "Client Name", "Phone", "Email", "Status", "Details / Note"]],
      body: combinedSupportRows,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 40, 35],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 80, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 26 },
        4: { cellWidth: 22 },
        5: { cellWidth: 34 },
        6: { cellWidth: 18, halign: "center" },
        7: { cellWidth: 36 },
      },
      margin: { left: marginX, right: marginX },
    });

    // @ts-expect-error jspdf-autotable adds lastAutoTable to jsPDF instance
    currentY = doc.lastAutoTable.finalY + 7;
  }

  // SECTION: ACTIVITY AUDIT LOGS (If selected)
  if (reportType === "activity") {
    drawSectionHeader(
      "PLATFORM OPERATIONS & AUDIT TRAIL",
      `Total: ${filteredLogs.length} Events`
    );

    const logRows = filteredLogs.map((a, idx) => [
      String(idx + 1),
      formatDateTimeReadable(a.created_at),
      a.user_email || "System",
      (a.user_role || "system").toUpperCase(),
      a.action || "action",
      a.entity_type || "entity",
      a.details || "—",
    ]);

    if (logRows.length === 0) {
      logRows.push(["—", "No activity logs matching filter", "", "", "", "", ""]);
    }

    autoTable(doc, {
      startY: currentY,
      head: [["#", "Date & Time", "User Email", "Role", "Action", "Entity", "Details"]],
      body: logRows,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 2,
        textColor: [30, 40, 35],
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 80, 55],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [248, 250, 248],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 26 },
        2: { cellWidth: 38 },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 28 },
        5: { cellWidth: 22 },
        6: { cellWidth: 44 },
      },
      margin: { left: marginX, right: marginX },
    });
  }

  // 4. Professional Running Footers on every page
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);

    // Footer divider line
    doc.setDrawColor(210, 220, 215);
    doc.setLineWidth(0.3);
    doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(110, 120, 115);

    // Left
    doc.text(
      "AK BUFFALOES DAIRY FARM • Pachora, Jalgaon (MS) • Helpline: +91-9022273915",
      marginX,
      pageHeight - 8
    );

    // Center
    doc.text(
      "Official Administration Record • Confidential",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    // Right
    doc.setFont("helvetica", "bold");
    doc.text(
      `Page ${page} of ${totalPages}`,
      pageWidth - marginX,
      pageHeight - 8,
      { align: "right" }
    );
  }

  // Generate clean filename
  const typeSlug =
    reportType === "comprehensive"
      ? "Comprehensive_Audit"
      : reportType === "inquiries"
      ? "Purchase_Inquiries"
      : reportType === "buffaloes"
      ? "Livestock_Inventory"
      : reportType === "users"
      ? "Customer_Accounts"
      : reportType === "consultations"
      ? "Consultations_Messages"
      : "Operations_Audit";

  const dateFileTag = now.toISOString().slice(0, 10);
  const fileName = `AK_Buffaloes_${typeSlug}_${dateFileTag}.pdf`;

  // Trigger browser download
  doc.save(fileName);

  return {
    success: true,
    fileName,
    pageCount: totalPages,
    summary,
  };
};
