/**
 * AK Buffaloes Farm Records Exporter
 * Supports CSV, Excel (.xls), and JSON export formats with UTF-8 support
 */

import type {
  ReportType,
  ActivityLog,
  Profile,
  ConsultationRequest,
  ContactMessage,
  PurchaseInquiry,
  BuffaloListingAdmin,
  UserRole,
} from "./pdfReportGenerator";

// Helper to filter items by days
export const isWithinDays = (dateStr: string, days: string): boolean => {
  if (!days || days === "all") return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= Number(days);
};

// Safe trigger download in browser
const triggerDownload = (blob: Blob, filename: string) => {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (typeof URL.revokeObjectURL === "function") {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

/**
 * Download data as CSV with UTF-8 BOM so Hindi/Marathi names open properly in Excel & Google Sheets
 */
export const downloadCSV = <T extends object>(data: T[], filename: string): boolean => {
  if (!data || data.length === 0) return false;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = String((row as Record<string, unknown>)[h] ?? "");
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  // Prepend UTF-8 BOM (\uFEFF)
  const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  triggerDownload(blob, `${filename}.csv`);
  return true;
};

/**
 * Download data as Excel spreadsheet (.xls) with custom AK Buffaloes styled letterhead
 */
export const downloadExcel = <T extends object>(
  data: T[],
  filename: string,
  title?: string
): boolean => {
  if (!data || data.length === 0) return false;
  const headers = Object.keys(data[0]);
  const sheetTitle = (title || filename).slice(0, 31).replace(/[:\\/?*[\]]/g, "_");

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><meta charset="utf-8"/><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${sheetTitle}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
  html += `<body><table border="1" style="border-collapse:collapse;font-family:Arial,sans-serif;">`;

  if (title) {
    html += `<thead><tr><th colspan="${headers.length}" style="background:#0F3A2E;color:#FFFFFF;font-size:15px;padding:12px;text-align:left;">AK Buffaloes Farm Records — ${title}</th></tr>`;
    html += `<tr><th colspan="${headers.length}" style="background:#1B4D3E;color:#E2E8F0;font-size:10px;padding:6px;text-align:left;">Official Administrative Export • Generated on ${new Date().toLocaleString()}</th></tr></thead>`;
  }

  html += `<thead><tr style="background:#2D6A4F;color:#FFFFFF;font-weight:bold;font-size:12px;">`;
  headers.forEach((h) => {
    html += `<th style="padding:8px 12px;border:1px solid #1B4D3E;">${h}</th>`;
  });
  html += `</tr></thead><tbody>`;

  data.forEach((row, idx) => {
    const bg = idx % 2 === 0 ? "#FFFFFF" : "#F6FBF7";
    html += `<tr style="background:${bg};font-size:12px;">`;
    headers.forEach((h) => {
      const val = String((row as Record<string, unknown>)[h] ?? "");
      const escaped = val
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      html += `<td style="padding:6px 10px;border:1px solid #E2E8F0;">${escaped}</td>`;
    });
    html += `</tr>`;
  });

  html += `</tbody></table></body></html>`;

  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  triggerDownload(blob, `${filename}.xls`);
  return true;
};

/**
 * Download structured JSON file for backups or data integration
 */
export const downloadJSON = <T>(data: T, filename: string): boolean => {
  if (!data) return false;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  triggerDownload(blob, `${filename}.json`);
  return true;
};

// Data formatters for each record type

export interface ExportContextData {
  buffaloListings: BuffaloListingAdmin[];
  purchaseInquiries: PurchaseInquiry[];
  profiles: Profile[];
  consultations: ConsultationRequest[];
  contacts: ContactMessage[];
  activityLogs: ActivityLog[];
  userRoles?: Record<string, string> | UserRole[];
  dateRange?: string;
}

export const formatBuffaloesExport = (
  buffaloes: BuffaloListingAdmin[]
) => {
  return buffaloes.map((b) => ({
    "Stock / Breed ID": b.stock_code || b.id,
    Section: b.is_new_stock ? "New Stocks (AKB)" : "10 Breeds Catalog (BRD)",
    Name: b.subtitle_label || b.name,
    Breed: b.breed,
    "Price (Rs)": b.price ?? 0,
    Negotiable: b.is_negotiable !== false ? "Yes" : "No",
    "Milk Yield": b.milk_yield || "",
    Age: b.age || "",
    Weight: b.weight || "",
    Lactation: b.lactation || "",
    "Pregnancy Status": b.pregnancy_status || "",
    "Calf Details": b.calf_details || "",
    "Health Records": b.health_records || "",
    Status: b.status || (b.is_available ? "available" : "sold"),
    "Added Date": new Date(b.created_at).toLocaleDateString(),
    Description: b.description || "",
  }));
};

export const formatUsersExport = (
  profiles: Profile[],
  inquiries: PurchaseInquiry[],
  userRoles?: Record<string, string> | UserRole[],
  dateRange: string = "all"
) => {
  const resolveRole = (userId: string): string => {
    if (!userRoles) return "user";
    if (Array.isArray(userRoles)) {
      return userRoles.find((r) => r.user_id === userId)?.role || "user";
    }
    return userRoles[userId] || "user";
  };
  return profiles
    .filter((p) => isWithinDays(p.created_at, dateRange))
    .map((p) => ({
      "Full Name": p.full_name || "User",
      Email: p.email || "",
      Phone: p.phone || "",
      Role: resolveRole(p.user_id),
      Password: p.user_password || "",
      "Inquiries Count": inquiries.filter((pi) => pi.user_id === p.user_id).length,
      "Joined Date": new Date(p.created_at).toLocaleDateString(),
      "User ID": p.user_id,
    }));
};

export const formatInquiriesExport = (
  inquiries: PurchaseInquiry[],
  dateRange: string = "all"
) => {
  return inquiries
    .filter((pi) => isWithinDays(pi.created_at, dateRange))
    .map((pi) => ({
      "Customer Name": pi.name,
      Email: pi.email,
      Phone: pi.phone,
      "Buffalo Name": pi.buffalo_name || "",
      Breed: pi.buffalo_breed || "",
      "Listed Price": pi.buffalo_price ?? "",
      Status: pi.status || "pending",
      "Inquiry Date": new Date(pi.created_at).toLocaleDateString(),
      Message: pi.message || "",
      "Admin Notes": pi.admin_note || "",
    }));
};

export const formatConsultationsExport = (
  consultations: ConsultationRequest[],
  dateRange: string = "all"
) => {
  return consultations
    .filter((c) => isWithinDays(c.created_at, dateRange))
    .map((c) => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Status: c.status || "pending",
      "Request Date": new Date(c.created_at).toLocaleDateString(),
      "Admin Note": c.admin_note || "",
    }));
};

export const formatContactsExport = (
  contacts: ContactMessage[],
  dateRange: string = "all"
) => {
  return contacts
    .filter((c) => isWithinDays(c.created_at, dateRange))
    .map((c) => ({
      Name: c.name,
      Email: c.email,
      Phone: c.phone || "",
      Status: c.status || "new",
      "Message Date": new Date(c.created_at).toLocaleDateString(),
      Message: c.message,
      "Admin Note": c.admin_note || "",
    }));
};

export const formatActivityExport = (
  activityLogs: ActivityLog[],
  dateRange: string = "all"
) => {
  return activityLogs
    .filter((a) => isWithinDays(a.created_at, dateRange))
    .map((a) => ({
      Date: new Date(a.created_at).toLocaleString(),
      "User Email": a.user_email || "",
      Role: a.user_role,
      Action: a.action,
      "Entity Type": a.entity_type,
      "Entity ID": a.entity_id || "",
      Details: a.details || "",
    }));
};

/**
 * Export any dataset based on selected report type and format
 */
export const exportRecordsByFormat = (
  format: "csv" | "excel" | "json",
  reportType: ReportType,
  data: ExportContextData
): { success: boolean; filename: string; count: number } => {
  const dateTag = new Date().toISOString().slice(0, 10);
  const dateRange = data.dateRange || "all";

  let exportList: Array<Record<string, unknown>> = [];
  let fileSlug = "Farm_Records";
  let title = "Farm Records";

  switch (reportType) {
    case "buffaloes":
      exportList = formatBuffaloesExport(data.buffaloListings);
      fileSlug = `AK_Buffaloes_Inventory_${dateTag}`;
      title = "Livestock Inventory & Availability";
      break;

    case "users":
      exportList = formatUsersExport(data.profiles, data.purchaseInquiries, data.userRoles, dateRange);
      fileSlug = `AK_Buffaloes_Users_${dateTag}`;
      title = "Registered Customer & Farmer Accounts";
      break;

    case "inquiries":
      exportList = formatInquiriesExport(data.purchaseInquiries, dateRange);
      fileSlug = `AK_Buffaloes_Inquiries_${dateTag}`;
      title = "Purchase Inquiries & Deal Requests";
      break;

    case "consultations":
      exportList = [
        ...formatConsultationsExport(data.consultations, dateRange).map((item) => ({
          Category: "Doctor Consultation",
          ...item,
        })),
        ...formatContactsExport(data.contacts, dateRange).map((item) => ({
          Category: "Contact Message",
          ...item,
        })),
      ];
      fileSlug = `AK_Buffaloes_Support_${dateTag}`;
      title = "Consultations & Contact Messages";
      break;

    case "activity":
      exportList = formatActivityExport(data.activityLogs, dateRange);
      fileSlug = `AK_Buffaloes_ActivityLogs_${dateTag}`;
      title = "Platform Operations & Audit Trail";
      break;

    case "comprehensive":
    default: {
      // In comprehensive, if JSON, export full structure; if CSV/Excel, combine high-level audit rows
      if (format === "json") {
        const fullBackup = {
          exportDate: new Date().toISOString(),
          farm: "AK Buffaloes Farm, Maharashtra, India",
          dateRange,
          summary: {
            totalBuffaloes: data.buffaloListings.length,
            totalUsers: data.profiles.length,
            totalInquiries: data.purchaseInquiries.length,
            totalConsultations: data.consultations.length,
            totalContacts: data.contacts.length,
            totalActivityLogs: data.activityLogs.length,
          },
          buffaloes: data.buffaloListings,
          users: data.profiles.map((p) => ({
            ...p,
            role: data.userRoles?.[p.user_id] || "user",
          })),
          inquiries: data.purchaseInquiries,
          consultations: data.consultations,
          contacts: data.contacts,
          activityLogs: data.activityLogs,
        };
        const fname = `AK_Buffaloes_Master_Backup_${dateTag}`;
        downloadJSON(fullBackup, fname);
        return { success: true, filename: `${fname}.json`, count: data.buffaloListings.length + data.profiles.length + data.purchaseInquiries.length };
      }

      // For CSV/Excel comprehensive, create an audit sheet of all inquiries & bookings
      const inquiriesList = formatInquiriesExport(data.purchaseInquiries, dateRange);
      const usersList = formatUsersExport(data.profiles, data.purchaseInquiries, data.userRoles, dateRange);
      const buffaloList = formatBuffaloesExport(data.buffaloListings);

      // Create a master activity summary
      exportList = [
        ...inquiriesList.map((i) => ({ Section: "INQUIRY", ...i })),
        ...usersList.map((u) => ({ Section: "USER", ...u })),
        ...buffaloList.map((b) => ({ Section: "BUFFALO", ...b })),
      ];
      fileSlug = `AK_Buffaloes_Master_Records_${dateTag}`;
      title = "Master Comprehensive Farm Audit";
      break;
    }
  }

  if (format === "csv") {
    downloadCSV(exportList, fileSlug);
    return { success: true, filename: `${fileSlug}.csv`, count: exportList.length };
  } else if (format === "excel") {
    downloadExcel(exportList, fileSlug, title);
    return { success: true, filename: `${fileSlug}.xls`, count: exportList.length };
  } else {
    downloadJSON(exportList, fileSlug);
    return { success: true, filename: `${fileSlug}.json`, count: exportList.length };
  }
};
