import { useState, useEffect } from "react";

export interface UserFarmingPreferences {
  preferredBreed: string;
  targetYield: string;
  purchasePurpose: string;
  preferredAge: string;
  whatsappNotifications: boolean;
  newStockAlerts: boolean;
  priceDropAlerts: boolean;
  farmName: string;
  deliveryState: string;
  deliveryPincode: string;
  whatsappNumber: string;
  fullName: string;
}

export const DEFAULT_USER_PREFERENCES: UserFarmingPreferences = {
  preferredBreed: "all",
  targetYield: "any",
  purchasePurpose: "commercial",
  preferredAge: "any",
  whatsappNotifications: true,
  newStockAlerts: true,
  priceDropAlerts: true,
  farmName: "",
  deliveryState: "Gujarat",
  deliveryPincode: "",
  whatsappNumber: "",
  fullName: "",
};

export function getUserPreferences(): UserFarmingPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;
  try {
    return {
      preferredBreed: localStorage.getItem("ak_user_preferred_breed") || DEFAULT_USER_PREFERENCES.preferredBreed,
      targetYield: localStorage.getItem("ak_user_target_yield") || DEFAULT_USER_PREFERENCES.targetYield,
      purchasePurpose: localStorage.getItem("ak_user_purchase_purpose") || DEFAULT_USER_PREFERENCES.purchasePurpose,
      preferredAge: localStorage.getItem("ak_user_preferred_age") || DEFAULT_USER_PREFERENCES.preferredAge,
      whatsappNotifications: localStorage.getItem("ak_user_whatsapp_notif") !== "false",
      newStockAlerts: localStorage.getItem("ak_user_new_stock_alerts") !== "false",
      priceDropAlerts: localStorage.getItem("ak_user_price_drop_alerts") !== "false",
      farmName: localStorage.getItem("ak_user_farm_name") || "",
      deliveryState: localStorage.getItem("ak_user_delivery_state") || DEFAULT_USER_PREFERENCES.deliveryState,
      deliveryPincode: localStorage.getItem("ak_user_delivery_pincode") || "",
      whatsappNumber: localStorage.getItem("ak_user_whatsapp_number") || "",
      fullName: localStorage.getItem("ak_user_full_name") || "",
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: Partial<UserFarmingPreferences>): UserFarmingPreferences {
  if (typeof window !== "undefined") {
    if (prefs.preferredBreed !== undefined) localStorage.setItem("ak_user_preferred_breed", prefs.preferredBreed);
    if (prefs.targetYield !== undefined) localStorage.setItem("ak_user_target_yield", prefs.targetYield);
    if (prefs.purchasePurpose !== undefined) localStorage.setItem("ak_user_purchase_purpose", prefs.purchasePurpose);
    if (prefs.preferredAge !== undefined) localStorage.setItem("ak_user_preferred_age", prefs.preferredAge);
    if (prefs.whatsappNotifications !== undefined) localStorage.setItem("ak_user_whatsapp_notif", String(prefs.whatsappNotifications));
    if (prefs.newStockAlerts !== undefined) localStorage.setItem("ak_user_new_stock_alerts", String(prefs.newStockAlerts));
    if (prefs.priceDropAlerts !== undefined) localStorage.setItem("ak_user_price_drop_alerts", String(prefs.priceDropAlerts));
    if (prefs.farmName !== undefined) localStorage.setItem("ak_user_farm_name", prefs.farmName);
    if (prefs.deliveryState !== undefined) localStorage.setItem("ak_user_delivery_state", prefs.deliveryState);
    if (prefs.deliveryPincode !== undefined) localStorage.setItem("ak_user_delivery_pincode", prefs.deliveryPincode);
    if (prefs.whatsappNumber !== undefined) localStorage.setItem("ak_user_whatsapp_number", prefs.whatsappNumber);
    if (prefs.fullName !== undefined) localStorage.setItem("ak_user_full_name", prefs.fullName);

    window.dispatchEvent(new CustomEvent("ak_user_prefs_changed"));
  }
  return getUserPreferences();
}

export function useUserPreferences(): UserFarmingPreferences {
  const [prefs, setPrefs] = useState<UserFarmingPreferences>(getUserPreferences);

  useEffect(() => {
    const handler = () => {
      setPrefs(getUserPreferences());
    };
    window.addEventListener("ak_user_prefs_changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ak_user_prefs_changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return prefs;
}
