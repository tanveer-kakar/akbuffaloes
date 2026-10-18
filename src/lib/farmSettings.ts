import { useState, useEffect } from "react";
import { backend } from "@/lib/backendClient";

export interface FarmSiteSettings {
  farmPhone: string;
  farmPhoneAlternate?: string;
  farmWhatsapp: string;
  farmAddress: string;
  supportEmail: string;
  businessHours: string;
  directWhatsappInquiry: boolean;
  negotiableBadgeEnabled: boolean;
  autoStockArrivalEmail: boolean;
  customerAutoReplyEmail: boolean;
  dailyDigestEmail: boolean;
  announcementBannerText: string;
  announcementBannerEnabled: boolean;
  adminSessionTimeout: string;
}

export const DEFAULT_FARM_SETTINGS: FarmSiteSettings = {
  farmPhone: "+91-9022273915",
  farmPhoneAlternate: "+91-7499553033",
  farmWhatsapp: "+91-9022273915",
  farmAddress: "Nurani Nagar Lohari Khurd, Tahsil Pachora, District Jalgaon, Maharashtra, India 424201",
  supportEmail: "akbuffaloes540@gmail.com",
  businessHours: "Mon – Sun: 08:00 AM – 08:00 PM (IST)",
  directWhatsappInquiry: true,
  negotiableBadgeEnabled: true,
  autoStockArrivalEmail: true,
  customerAutoReplyEmail: true,
  dailyDigestEmail: true,
  announcementBannerText: "🐃 Special Seasonal Stock: Purebred Murrah & Jaffarabadi high-yield buffaloes now available with complete veterinary health certifications!",
  announcementBannerEnabled: false,
  adminSessionTimeout: "12 Hours",
};

export function getFarmSiteSettings(): FarmSiteSettings {
  if (typeof window === "undefined") return DEFAULT_FARM_SETTINGS;
  try {
    const raw = localStorage.getItem("ak_admin_farm_settings");
    if (!raw) return DEFAULT_FARM_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed.supportEmail === "akbuffaloes786@gmail.com") {
      parsed.supportEmail = "akbuffaloes540@gmail.com";
    }
    if (parsed.farmPhone === "+91 94045 42200" || parsed.farmPhone === "+919404542200") {
      parsed.farmPhone = "+91-9022273915";
    }
    if (!parsed.farmPhoneAlternate || parsed.farmPhoneAlternate === "+91 94045 42200") {
      parsed.farmPhoneAlternate = "+91-7499553033";
    }
    if (parsed.farmWhatsapp === "+91 90222 73915" || parsed.farmWhatsapp === "+91 94045 42200") {
      parsed.farmWhatsapp = "+91-9022273915";
    }
    return { ...DEFAULT_FARM_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_FARM_SETTINGS;
  }
}

export function saveFarmSiteSettings(settings: Partial<FarmSiteSettings>): FarmSiteSettings {
  const current = getFarmSiteSettings();
  const updated: FarmSiteSettings = { ...current, ...settings };
  if (typeof window !== "undefined") {
    localStorage.setItem("ak_admin_farm_settings", JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("ak_farm_settings_changed", { detail: updated }));
  }
  // Persist to backend database asynchronously
  void backend.from("farm_settings").update({ id: "global", ...updated }).eq("id", "global");
  return updated;
}

export function useFarmSettings(): FarmSiteSettings {
  const [settings, setSettings] = useState<FarmSiteSettings>(getFarmSiteSettings);

  useEffect(() => {
    let mounted = true;
    // Fetch live farm settings from server database
    backend
      .from("farm_settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle()
      .then((res) => {
        if (mounted && res && res.data && typeof res.data === "object") {
          const remote = res.data as Partial<FarmSiteSettings>;
          const current = getFarmSiteSettings();
          const merged: FarmSiteSettings = { ...current, ...remote };
          if (typeof window !== "undefined") {
            localStorage.setItem("ak_admin_farm_settings", JSON.stringify(merged));
          }
          setSettings(merged);
        }
      })
      .catch(() => {});

    const handler = () => {
      setSettings(getFarmSiteSettings());
    };
    window.addEventListener("ak_farm_settings_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      mounted = false;
      window.removeEventListener("ak_farm_settings_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return settings;
}
