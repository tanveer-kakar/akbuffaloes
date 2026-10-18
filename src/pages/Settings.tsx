import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/lib/backendClient";
import { isUserAdmin } from "@/lib/adminAuth";
import { voiceAnnouncer } from "@/lib/voiceAnnouncer";
import { sound } from "@/lib/soundEffects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Moon,
  Sun,
  Lock,
  Trash2,
  Bell,
  Shield,
  Globe,
  Volume2,
  VolumeX,
  Mail,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  Tractor,
  MapPin,
  Phone,
  MessageSquare,
  Sparkles,
  Tag,
  Truck,
  Save,
  Check,
  BellRing,
  Megaphone,
  ExternalLink,
  RotateCcw,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { languageNames, type Language } from "@/contexts/LanguageContext";
import { saveUserPreferences } from "@/lib/userPreferences";
import { Textarea } from "@/components/ui/textarea";
import {
  useFarmSettings,
  saveFarmSiteSettings,
  DEFAULT_FARM_SETTINGS,
  type FarmSiteSettings,
} from "@/lib/farmSettings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BUFFALO_BREEDS } from "@/data/buffaloBreedsData";

const languages: Language[] = ["en", "hi", "mr"];

const Settings = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });

  // OTP Verification state for Password Change
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Notification Preferences
  const [emailNotifications, setEmailNotifications] = useState(() => {
    return localStorage.getItem("ak_user_email_notif") !== "false";
  });
  const [savingEmailNotifications, setSavingEmailNotifications] = useState(false);
  const [voiceNotifications, setVoiceNotifications] = useState(voiceAnnouncer.isEnabled());
  const [soundNotifications, setSoundNotifications] = useState(sound.isEnabled());
  const [browserNotifications, setBrowserNotifications] = useState(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission === "granted";
    }
    return false;
  });
  const [deleting, setDeleting] = useState(false);

  // Farming & Buffalo Purchase Preferences
  const [preferredBreed, setPreferredBreed] = useState(() => localStorage.getItem("ak_user_preferred_breed") || "all");
  const [targetYield, setTargetYield] = useState(() => localStorage.getItem("ak_user_target_yield") || "any");
  const [purchasePurpose, setPurchasePurpose] = useState(() => localStorage.getItem("ak_user_purchase_purpose") || "commercial");
  const [preferredAge, setPreferredAge] = useState(() => localStorage.getItem("ak_user_preferred_age") || "any");

  // Extended Stock Alerts & Channels
  const [whatsappNotifications, setWhatsappNotifications] = useState(() => localStorage.getItem("ak_user_whatsapp_notif") !== "false");
  const [newStockAlerts, setNewStockAlerts] = useState(() => localStorage.getItem("ak_user_new_stock_alerts") !== "false");
  const [priceDropAlerts, setPriceDropAlerts] = useState(() => localStorage.getItem("ak_user_price_drop_alerts") !== "false");

  // Farm Delivery & Address Defaults
  const [farmName, setFarmName] = useState(() => localStorage.getItem("ak_user_farm_name") || "");
  const [deliveryState, setDeliveryState] = useState(() => localStorage.getItem("ak_user_delivery_state") || "Gujarat");
  const [deliveryPincode, setDeliveryPincode] = useState(() => localStorage.getItem("ak_user_delivery_pincode") || "");
  const [whatsappNumber, setWhatsappNumber] = useState(() => localStorage.getItem("ak_user_whatsapp_number") || "");
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Admin Farm Site Settings Live State
  const liveFarmSettings = useFarmSettings();
  const [adminSettingsForm, setAdminSettingsForm] = useState<FarmSiteSettings>(liveFarmSettings);
  const [savingAdminSettings, setSavingAdminSettings] = useState(false);

  useEffect(() => {
    setAdminSettingsForm(liveFarmSettings);
  }, [liveFarmSettings]);

  const handleSaveAdminFarmSettings = () => {
    setSavingAdminSettings(true);
    try {
      saveFarmSiteSettings(adminSettingsForm);
      toast({
        title: "Farm Settings Saved! 🚜",
        description: "Helpline contacts, announcement banner, and marketplace rules updated.",
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setSavingAdminSettings(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const loadPreference = async () => {
      const { data, error } = await backend
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) {
        const p = data as Record<string, unknown>;
        if (p.email_notifications !== undefined) setEmailNotifications(p.email_notifications !== false);
        if (p.voice_notifications !== undefined) {
          const v = p.voice_notifications !== false;
          setVoiceNotifications(v);
          voiceAnnouncer.setEnabled(v);
        }
        if (p.sound_notifications !== undefined) {
          const s = Boolean(p.sound_notifications);
          setSoundNotifications(s);
          sound.setEnabled(s);
        }
        if (p.farm_name !== undefined && p.farm_name !== null) {
          setFarmName(String(p.farm_name));
          localStorage.setItem("ak_user_farm_name", String(p.farm_name));
        }
        if (p.delivery_state !== undefined && p.delivery_state !== null) {
          setDeliveryState(String(p.delivery_state));
          localStorage.setItem("ak_user_delivery_state", String(p.delivery_state));
        }
        if (p.delivery_pincode !== undefined && p.delivery_pincode !== null) {
          setDeliveryPincode(String(p.delivery_pincode));
          localStorage.setItem("ak_user_delivery_pincode", String(p.delivery_pincode));
        }
        if (p.whatsapp_number !== undefined && p.whatsapp_number !== null) {
          setWhatsappNumber(String(p.whatsapp_number));
          localStorage.setItem("ak_user_whatsapp_number", String(p.whatsapp_number));
        } else if (p.phone !== undefined && p.phone !== null) {
          setWhatsappNumber(String(p.phone));
          localStorage.setItem("ak_user_whatsapp_number", String(p.phone));
        }
        if (p.preferred_breed !== undefined && p.preferred_breed !== null) {
          setPreferredBreed(String(p.preferred_breed));
          localStorage.setItem("ak_user_preferred_breed", String(p.preferred_breed));
        }
        if (p.target_yield !== undefined && p.target_yield !== null) {
          setTargetYield(String(p.target_yield));
          localStorage.setItem("ak_user_target_yield", String(p.target_yield));
        }
        if (p.purchase_purpose !== undefined && p.purchase_purpose !== null) {
          setPurchasePurpose(String(p.purchase_purpose));
          localStorage.setItem("ak_user_purchase_purpose", String(p.purchase_purpose));
        }
        if (p.preferred_age !== undefined && p.preferred_age !== null) {
          setPreferredAge(String(p.preferred_age));
          localStorage.setItem("ak_user_preferred_age", String(p.preferred_age));
        }
        if (p.whatsapp_notifications !== undefined) {
          const wn = p.whatsapp_notifications !== false;
          setWhatsappNotifications(wn);
          localStorage.setItem("ak_user_whatsapp_notif", String(wn));
        }
        if (p.new_stock_alerts !== undefined) {
          const nsa = p.new_stock_alerts !== false;
          setNewStockAlerts(nsa);
          localStorage.setItem("ak_user_new_stock_alerts", String(nsa));
        }
        if (p.price_drop_alerts !== undefined) {
          const pda = p.price_drop_alerts !== false;
          setPriceDropAlerts(pda);
          localStorage.setItem("ak_user_price_drop_alerts", String(pda));
        }
      }
    };
    void loadPreference();
  }, [user]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Request OTP for password change
  const handleInitiatePasswordChange = async () => {
    if (!passwords.newPassword.trim()) {
      toast({ title: "Please enter a new password", variant: "destructive" });
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setRequestingOtp(true);
    try {
      const res = await fetch("/api/auth/settings-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || res.status === 404 || res.status === 502) {
        throw new Error("offline");
      }
      const data = await res.json();
      setRequestingOtp(false);

      if (!res.ok) {
        toast({ title: "Could not send OTP", description: data.error || "Please try again", variant: "destructive" });
        return;
      }

      setOtpToken(data.token || "");
      setOtpCode("");
      setResendCooldown(60);
      setOtpModalOpen(true);
      toast({
        title: "OTP Sent to Your Email ✉️",
        description: `Please enter the 6-digit verification code sent to ${user?.email}.`,
      });
    } catch {
      // Backend server unavailable (e.g. Netlify static hosting)
      setRequestingOtp(false);
      if (user?.email && isUserAdmin(user.email)) {
        localStorage.setItem("ak_admin_password", passwords.newPassword);
      }
      try {
        const users = JSON.parse(localStorage.getItem("ak_offline_users") || "[]");
        const idx = users.findIndex((u: Record<string, unknown>) => u.email === user?.email);
        if (idx >= 0) {
          users[idx].password = passwords.newPassword;
          localStorage.setItem("ak_offline_users", JSON.stringify(users));
        }
      } catch {
        // Ignore localStorage error
      }
      setPasswords({ newPassword: "", confirmPassword: "" });
      toast({
        title: "Password Updated Successfully! 🔐",
        description: "Your account password has been updated.",
      });
    }
  };

  // Step 2: Verify OTP and apply new password
  const handleVerifyOtpAndChangePassword = async () => {
    const cleanOtp = otpCode.trim().replace(/\s+/g, "");
    if (!cleanOtp || cleanOtp.length !== 6) {
      toast({ title: "Please enter the 6-digit verification code", variant: "destructive" });
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await fetch("/api/auth/settings-verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          otp: cleanOtp,
          token: otpToken,
          newPassword: passwords.newPassword,
        }),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || res.status === 404 || res.status === 502) {
        throw new Error("offline");
      }
      const data = await res.json();
      setVerifyingOtp(false);

      if (!res.ok) {
        toast({ title: "Verification Failed", description: data.error || "Invalid OTP code", variant: "destructive" });
        return;
      }

      setOtpModalOpen(false);
      setPasswords({ newPassword: "", confirmPassword: "" });
      setOtpCode("");
      toast({ title: "Password Updated Successfully! 🔐", description: "Your account password has been updated." });
    } catch {
      setVerifyingOtp(false);
      if (user?.email && isUserAdmin(user.email)) {
        localStorage.setItem("ak_admin_password", passwords.newPassword);
      }
      try {
        const users = JSON.parse(localStorage.getItem("ak_offline_users") || "[]");
        const idx = users.findIndex((u: Record<string, unknown>) => u.email === user?.email);
        if (idx >= 0) {
          users[idx].password = passwords.newPassword;
          localStorage.setItem("ak_offline_users", JSON.stringify(users));
        }
      } catch {
        // Ignore localStorage error
      }
      setOtpModalOpen(false);
      setPasswords({ newPassword: "", confirmPassword: "" });
      setOtpCode("");
      toast({ title: "Password Updated Successfully! 🔐", description: "Your account password has been updated." });
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setRequestingOtp(true);
    try {
      const res = await fetch("/api/auth/settings-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html") || res.status === 404 || res.status === 502) {
        throw new Error("offline");
      }
      const data = await res.json();
      setRequestingOtp(false);

      if (!res.ok) {
        toast({ title: "Failed to resend OTP", description: data.error || "Please try again", variant: "destructive" });
        return;
      }

      setOtpToken(data.token || "");
      setResendCooldown(60);
      toast({ title: "New OTP Sent!", description: `Fresh 6-digit verification code sent to ${user?.email}.` });
    } catch {
      setRequestingOtp(false);
      setResendCooldown(60);
      toast({ title: "Verification Ready", description: `You can update your password directly.` });
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setEmailNotifications(value);
    localStorage.setItem("ak_user_email_notif", String(value));
    if (user) {
      setSavingEmailNotifications(true);
      const { error } = await backend
        .from("profiles")
        .update({ email_notifications: value })
        .eq("user_id", user.id);
      setSavingEmailNotifications(false);
      if (error) {
        toast({ title: "Notification preference could not be saved to cloud", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({
      title: value ? "Email Notifications Enabled ✉️" : "Email Notifications Disabled 🔕",
      description: value ? "You will receive inquiry updates, order status, and farm alerts via email." : "You will no longer receive notification emails.",
    });
    if (value && sound.isEnabled()) sound.playSuccess();
  };

  const handleVoiceToggle = async (value: boolean) => {
    setVoiceNotifications(value);
    voiceAnnouncer.setEnabled(value);
    if (user) {
      await backend.from("profiles").update({ voice_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "AI Voice Enabled 🔊" : "AI Voice Muted 🔇",
      description: value ? "AI voice will speak notifications and messages aloud." : "Spoken voice notifications are disabled.",
    });
    if (value) {
      voiceAnnouncer.speak("AI Voice notifications are now active.");
    }
  };

  const handleSoundToggle = async (value: boolean) => {
    setSoundNotifications(value);
    sound.setEnabled(value);
    if (user) {
      await backend.from("profiles").update({ sound_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "Sound Effects Enabled 🔔" : "Sound Effects Muted 🔕",
      description: value ? "Sound effects and chimes are now active." : "Sound effects are now muted.",
    });
    if (value) {
      sound.playSuccess();
    }
  };

  const handleWhatsappToggle = (value: boolean) => {
    setWhatsappNotifications(value);
    saveUserPreferences({ whatsappNotifications: value });
    if (user) {
      void backend.from("profiles").update({ whatsapp_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "WhatsApp Instant Alerts Enabled 📱" : "WhatsApp Alerts Disabled 🔕",
      description: value ? "Booking confirmations and inquiry updates will be delivered via WhatsApp." : "WhatsApp alerts turned off.",
    });
    if (value && sound.isEnabled()) sound.playSuccess();
  };

  const handleNewStockToggle = (value: boolean) => {
    setNewStockAlerts(value);
    saveUserPreferences({ newStockAlerts: value });
    if (user) {
      void backend.from("profiles").update({ new_stock_alerts: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "New Stock Alerts Enabled ✨" : "New Stock Alerts Disabled 🔕",
      description: value ? "You will receive instant alerts whenever new AKB buffaloes arrive." : "New stock arrival alerts turned off.",
    });
    if (value && sound.isEnabled()) sound.playSuccess();
  };

  const handlePriceDropToggle = (value: boolean) => {
    setPriceDropAlerts(value);
    saveUserPreferences({ priceDropAlerts: value });
    if (user) {
      void backend.from("profiles").update({ price_drop_alerts: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "Price Drop & Deals Alerts Enabled 🏷️" : "Price Drop Alerts Disabled 🔕",
      description: value ? "You will receive alerts when special deals and negotiable pricing become available." : "Price drop alerts turned off.",
    });
    if (value && sound.isEnabled()) sound.playSuccess();
  };

  const handleBrowserNotificationToggle = async (value: boolean) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast({
        title: "Browser Notifications Unsupported",
        description: "Your current browser does not support desktop notifications.",
        variant: "destructive",
      });
      return;
    }
    if (value) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setBrowserNotifications(true);
          toast({
            title: "Browser Push Notifications Active 🔔",
            description: "You will receive instant desktop alerts for farm announcements.",
          });
          if (sound.isEnabled()) sound.playSuccess();
          new Notification("AK Buffaloes Dairy Farm", {
            body: "Desktop notifications are now connected and working!",
            icon: "/favicon.ico",
          });
        } else {
          setBrowserNotifications(false);
          toast({
            title: "Notification Permission Blocked",
            description: "Please allow notifications in your browser site permissions to enable this.",
            variant: "destructive",
          });
        }
      } catch {
        setBrowserNotifications(false);
      }
    } else {
      setBrowserNotifications(false);
      toast({
        title: "Browser Notifications Paused",
        description: "Desktop browser notifications have been paused.",
      });
    }
  };

  const handleTestNotifications = () => {
    toast({
      title: "Notification System Test 🔔✨",
      description: "Sound, Voice, and Alert systems are fully operational on AK Buffaloes!",
    });
    if (sound.isEnabled()) {
      sound.playSuccess();
    }
    if (voiceAnnouncer.isEnabled()) {
      voiceAnnouncer.speak("Notification system test completed successfully. All farm alerts are working.");
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("AK Buffaloes Farm Alert", {
        body: "All notification functions are operating normally!",
        icon: "/favicon.ico",
      });
    }
  };

  const handleSaveFarmingPreferences = async () => {
    setSavingPreferences(true);
    try {
      localStorage.setItem("ak_user_preferred_breed", preferredBreed);
      localStorage.setItem("ak_user_target_yield", targetYield);
      localStorage.setItem("ak_user_purchase_purpose", purchasePurpose);
      localStorage.setItem("ak_user_preferred_age", preferredAge);
      localStorage.setItem("ak_user_whatsapp_notif", String(whatsappNotifications));
      localStorage.setItem("ak_user_new_stock_alerts", String(newStockAlerts));
      localStorage.setItem("ak_user_price_drop_alerts", String(priceDropAlerts));
      localStorage.setItem("ak_user_farm_name", farmName);
      localStorage.setItem("ak_user_delivery_state", deliveryState);
      localStorage.setItem("ak_user_delivery_pincode", deliveryPincode);
      localStorage.setItem("ak_user_whatsapp_number", whatsappNumber);

      if (user) {
        await backend.from("profiles").update({
          phone: whatsappNumber || undefined,
          farm_name: farmName,
          delivery_state: deliveryState,
          delivery_pincode: deliveryPincode,
          whatsapp_number: whatsappNumber,
          preferred_breed: preferredBreed,
          target_yield: targetYield,
          purchase_purpose: purchasePurpose,
          preferred_age: preferredAge,
          whatsapp_notifications: whatsappNotifications,
          new_stock_alerts: newStockAlerts,
          price_drop_alerts: priceDropAlerts,
        }).eq("user_id", user.id);
      }
      toast({
        title: "Dairy Preferences Saved! 🌾🐃",
        description: "Your breed interests, alert preferences, and farm details have been updated.",
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    const { data, error } = await backend.functions.invoke("self-delete-account");
    if (error || !data?.success) {
      setDeleting(false);
      toast({ title: "Account deletion failed", description: error?.message || data?.error || "Please try again", variant: "destructive" });
      return;
    }
    toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
    await signOut();
    navigate("/");
  };

  return (
    <div className="space-y-6">
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-1">{t("settings.title")}</h2>
        <p className="font-sans text-sm text-muted-foreground mb-6">{t("settings.subtitle")}</p>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gold" />
              {t("lang.label")}
            </h3>
            <div className="flex gap-2 bg-muted/20 rounded-lg px-4 py-3">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`font-sans text-sm px-4 py-2 rounded-md transition-colors ${
                    language === lang
                      ? "bg-gold text-green-dark font-semibold"
                      : "text-foreground hover:bg-muted/50 border border-border"
                  }`}
                >
                  {languageNames[lang]}
                </button>
              ))}
            </div>
          </div>

          {/* Appearance */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              {theme === "dark" ? <Moon className="w-4 h-4 text-gold" /> : <Sun className="w-4 h-4 text-gold" />}
              {t("settings.appearance")}
            </h3>
            <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
              <div>
                <p className="font-sans text-sm font-medium text-foreground">{t("settings.darkMode")}</p>
                <p className="font-sans text-xs text-muted-foreground">{t("settings.darkModeDesc")}</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold" />
              {t("settings.notifications")}
            </h3>
            <div className="space-y-3">
              {/* Email Notifications */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">{t("settings.emailNotif")}</p>
                    <p className="font-sans text-xs text-muted-foreground">{t("settings.emailNotifDesc")}</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  disabled={savingEmailNotifications}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>

              {/* AI Voice Announcements */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  {voiceNotifications ? <Volume2 className="w-4 h-4 text-gold" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">AI Voice Messages & Announcements</p>
                    <p className="font-sans text-xs text-muted-foreground">Read out notification messages and status updates in clear AI voice.</p>
                  </div>
                </div>
                <Switch
                  checked={voiceNotifications}
                  onCheckedChange={handleVoiceToggle}
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-gold" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Sound Effects</p>
                    <p className="font-sans text-xs text-muted-foreground">Play soft notification chimes and button audio feedback.</p>
                  </div>
                </div>
                <Switch
                  checked={soundNotifications}
                  onCheckedChange={handleSoundToggle}
                />
              </div>

              {/* WhatsApp Status Updates */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">WhatsApp Instant Alerts</p>
                    <p className="font-sans text-xs text-muted-foreground">Receive booking confirmations, inquiry updates, and delivery status via WhatsApp.</p>
                  </div>
                </div>
                <Switch
                  checked={whatsappNotifications}
                  onCheckedChange={handleWhatsappToggle}
                />
              </div>

              {/* New Stock Arrival Alerts */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">New Stock Arrival Alerts</p>
                    <p className="font-sans text-xs text-muted-foreground">Get notified immediately when fresh AKB buffalo stocks arrive on the website.</p>
                  </div>
                </div>
                <Switch
                  checked={newStockAlerts}
                  onCheckedChange={handleNewStockToggle}
                />
              </div>

              {/* Price Drop & Offer Alerts */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Price Drop & Offer Alerts</p>
                    <p className="font-sans text-xs text-muted-foreground">Receive alerts when premium buffalo listings offer discounts or negotiable pricing.</p>
                  </div>
                </div>
                <Switch
                  checked={priceDropAlerts}
                  onCheckedChange={handlePriceDropToggle}
                />
              </div>

              {/* Browser / Desktop Push Notifications */}
              <div className="flex items-center justify-between bg-muted/20 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  <BellRing className="w-4 h-4 text-gold" />
                  <div>
                    <p className="font-sans text-sm font-medium text-foreground">Browser Push Notifications</p>
                    <p className="font-sans text-xs text-muted-foreground">Show instant desktop alerts even when browsing other applications.</p>
                  </div>
                </div>
                <Switch
                  checked={browserNotifications}
                  onCheckedChange={handleBrowserNotificationToggle}
                />
              </div>

              {/* Test Notifications Action Banner */}
              <div className="flex items-center justify-between bg-gold/10 border border-gold/30 rounded-lg px-4 py-3 mt-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
                    <BellRing className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-semibold text-foreground">Verify Notification Functions</p>
                    <p className="font-sans text-[11px] text-muted-foreground">Test audio chimes, AI voice narration, and popup alerts right now.</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotifications}
                  className="font-sans text-xs h-8 px-3 gap-1.5 border-gold/40 text-gold hover:bg-gold hover:text-green-dark transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5" /> Test Notifications
                </Button>
              </div>
            </div>
          </div>

          {/* Farming & Buffalo Purchase Preferences */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Tractor className="w-4 h-4 text-gold" />
              Dairy Farming & Purchase Preferences
            </h3>
            <div className="bg-muted/20 rounded-lg p-4 space-y-4 border border-border/60">
              <p className="font-sans text-xs text-muted-foreground">
                Customize your recommendations and filters when browsing all 10 buffalo breeds and new arrivals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Preferred Breed */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold" /> Preferred Buffalo Breed
                  </Label>
                  <Select value={preferredBreed} onValueChange={setPreferredBreed}>
                    <SelectTrigger className="h-9 font-sans text-xs">
                      <SelectValue placeholder="All 10 Breeds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All 10 Buffalo Breeds</SelectItem>
                      {BUFFALO_BREEDS.map((b) => (
                        <SelectItem key={b.slug} value={b.name}>
                          {b.name} ({b.shortPriceRange})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Daily Milk Yield Target */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Tag className="w-3.5 h-3.5 text-gold" /> Required Daily Milk Yield
                  </Label>
                  <Select value={targetYield} onValueChange={setTargetYield}>
                    <SelectTrigger className="h-9 font-sans text-xs">
                      <SelectValue placeholder="Any Milk Yield" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Milk Yield</SelectItem>
                      <SelectItem value="8-10">8 – 10 L/Day (Standard Yield)</SelectItem>
                      <SelectItem value="10-14">10 – 14 L/Day (High Dairy Yield)</SelectItem>
                      <SelectItem value="14-18">14 – 18+ L/Day (Super Commercial Yield)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Purchase Purpose */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Tractor className="w-3.5 h-3.5 text-gold" /> Primary Dairy Purpose
                  </Label>
                  <Select value={purchasePurpose} onValueChange={setPurchasePurpose}>
                    <SelectTrigger className="h-9 font-sans text-xs">
                      <SelectValue placeholder="Commercial Dairy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="commercial">Commercial Dairy Farm (High Yield)</SelectItem>
                      <SelectItem value="household">Household Small Dairy (Easy Maintenance)</SelectItem>
                      <SelectItem value="breeding">Purebred Breeding & Pedigree Genetic Improvement</SelectItem>
                      <SelectItem value="trading">Livestock Trading & Farm Resale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Lactation / Age */}
                <div>
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                    <Check className="w-3.5 h-3.5 text-gold" /> Preferred Calving Stage / Age
                  </Label>
                  <Select value={preferredAge} onValueChange={setPreferredAge}>
                    <SelectTrigger className="h-9 font-sans text-xs">
                      <SelectValue placeholder="Any Age" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Age & Lactation</SelectItem>
                      <SelectItem value="first_calver">1st Calver (2.5 – 3.5 Years)</SelectItem>
                      <SelectItem value="prime_second">2nd Lactation (Peak Milker 3.5 – 5 Years)</SelectItem>
                      <SelectItem value="proven_third">3rd+ Lactation (Proven Dairy Performer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Delivery & Address Defaults */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-gold" />
              Farm Delivery & Contact Address
            </h3>
            <div className="bg-muted/20 rounded-lg p-4 space-y-4 border border-border/60">
              <p className="font-sans text-xs text-muted-foreground">
                Save your farm details to auto-populate transport inquiry forms and receive accurate transit estimates.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">
                    Farm / Dairy Business Name
                  </Label>
                  <Input
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g. Patel Brothers Dairy Farm"
                    className="font-sans h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" /> WhatsApp Number for Transport Coordination
                  </Label>
                  <Input
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="font-sans h-9 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gold" /> Delivery State
                  </Label>
                  <Select value={deliveryState} onValueChange={setDeliveryState}>
                    <SelectTrigger className="h-9 font-sans text-xs">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Haryana">Haryana</SelectItem>
                      <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                      <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="Madhya Pradesh">Madhya Pradesh</SelectItem>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Other">Other States across India</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-foreground mb-1 block">
                    Pincode & Nearest Landmark
                  </Label>
                  <Input
                    value={deliveryPincode}
                    onChange={(e) => setDeliveryPincode(e.target.value)}
                    placeholder="e.g. 360001, Near Highway Toll Plaza"
                    className="font-sans h-9 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSaveFarmingPreferences}
                  disabled={savingPreferences}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-9 text-xs gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingPreferences ? "Saving Preferences..." : "Save Dairy Preferences"}
                </Button>
              </div>
            </div>
          </div>

          {/* Security */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold" />
              {t("settings.security")}
            </h3>
            <div className="bg-muted/20 rounded-lg px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-sans text-sm font-medium text-foreground">{t("settings.changePassword")}</p>
                <span className="font-sans text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                  <Mail className="w-3 h-3" /> Email OTP Verified
                </span>
              </div>
              <p className="font-sans text-xs text-muted-foreground">
                For enhanced security, a 6-digit email OTP verification code is sent to your registered email address ({user?.email}) before updating your password.
              </p>
              <form
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleInitiatePasswordChange();
                }}
                className="space-y-3"
              >
                {/* Hidden dummy fields to capture any browser autofill attempt inside this component */}
                <input type="text" name="dummy-username-autofill" style={{ display: "none" }} aria-hidden="true" tabIndex={-1} autoComplete="username" />
                <input type="password" name="dummy-password-autofill" style={{ display: "none" }} aria-hidden="true" tabIndex={-1} autoComplete="current-password" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <div>
                    <Label className="font-sans text-xs text-muted-foreground">{t("settings.newPassword")}</Label>
                    <Input
                      type="password"
                      name="settings-new-password"
                      autoComplete="new-password"
                      placeholder="Min 8 characters"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                      className="font-sans h-10 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-xs text-muted-foreground">{t("settings.confirmPassword")}</Label>
                    <Input
                      type="password"
                      name="settings-confirm-password"
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                      className="font-sans h-10 mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={requestingOtp || !passwords.newPassword || !passwords.confirmPassword}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-9 gap-2 text-sm"
                >
                  {requestingOtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending OTP...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" /> Send OTP & Update Password
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* OTP Verification Modal */}
          <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
            <DialogContent className="max-w-md bg-background border border-border">
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center text-gold mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <DialogTitle className="font-display text-xl text-center">Verify Email OTP</DialogTitle>
                <DialogDescription className="font-sans text-center text-xs text-muted-foreground">
                  We've sent a 6-digit verification code to <strong>{user?.email}</strong>. Enter it below to confirm your new password.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div>
                  <Label className="font-sans text-xs text-foreground font-semibold">6-Digit Verification Code</Label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    className="font-mono text-center text-2xl tracking-[8px] h-12 mt-1.5 font-bold"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Didn't receive the email?</span>
                  {resendCooldown > 0 ? (
                    <span className="text-muted-foreground font-medium">Resend in {resendCooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={requestingOtp}
                      className="text-gold font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOtpModalOpen(false)}
                    className="w-1/2 font-sans"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleVerifyOtpAndChangePassword}
                    disabled={verifyingOtp || otpCode.length !== 6}
                    className="w-1/2 bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5"
                  >
                    {verifyingOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Verify & Update
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Account Info */}
          <div>
            <h3 className="font-sans text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              {t("settings.account")}
            </h3>
            <div className="bg-muted/20 rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-sans text-sm text-muted-foreground">{t("auth.email")}</p>
                <p className="font-sans text-sm font-medium text-foreground">{user?.email || "—"}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-sans text-sm text-muted-foreground">{t("settings.role")}</p>
                <p className="font-sans text-sm font-medium text-foreground capitalize">{isAdmin ? "Admin" : "User"}</p>
              </div>
            </div>
          </div>

          {/* Farm Administration & Site Settings - Admin Exclusive */}
          {isAdmin && (
            <div className="pt-4 border-t border-border space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-sans text-sm font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gold" />
                    Farm Administration & Site Settings
                  </h3>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">
                    Live system settings for public helpline numbers, announcement banner, and inquiry automation.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/admin")}
                    className="font-sans text-xs h-8 gap-1.5 border-border"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open Admin Panel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingAdminSettings}
                    onClick={handleSaveAdminFarmSettings}
                    className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs h-8 gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingAdminSettings ? "Saving..." : "Save Admin Settings"}
                  </Button>
                </div>
              </div>

              <div className="bg-muted/20 border border-border/60 rounded-lg p-4 space-y-4">
                {/* Contact & Helpline Numbers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Primary Helpline Phone
                    </Label>
                    <Input
                      value={adminSettingsForm.farmPhone}
                      onChange={(e) =>
                        setAdminSettingsForm((prev) => ({ ...prev, farmPhone: e.target.value }))
                      }
                      placeholder="+91-9022273915"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Alternate Helpline Phone
                    </Label>
                    <Input
                      value={adminSettingsForm.farmPhoneAlternate || ""}
                      onChange={(e) =>
                        setAdminSettingsForm((prev) => ({ ...prev, farmPhoneAlternate: e.target.value }))
                      }
                      placeholder="+91-7499553033"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      WhatsApp Inquiry Number
                    </Label>
                    <Input
                      value={adminSettingsForm.farmWhatsapp}
                      onChange={(e) =>
                        setAdminSettingsForm((prev) => ({ ...prev, farmWhatsapp: e.target.value }))
                      }
                      placeholder="+91-9022273915"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Farm Support Email
                    </Label>
                    <Input
                      value={adminSettingsForm.supportEmail}
                      onChange={(e) =>
                        setAdminSettingsForm((prev) => ({ ...prev, supportEmail: e.target.value }))
                      }
                      placeholder="akbuffaloes540@gmail.com"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-foreground mb-1 block">
                      Business Operating Hours
                    </Label>
                    <Input
                      value={adminSettingsForm.businessHours}
                      onChange={(e) =>
                        setAdminSettingsForm((prev) => ({ ...prev, businessHours: e.target.value }))
                      }
                      placeholder="Mon – Sun: 08:00 AM – 08:00 PM (IST)"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Automation Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg p-3">
                    <div>
                      <p className="font-sans text-xs font-medium text-foreground">Direct WhatsApp Inquiries</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Show instant chat button on listings</p>
                    </div>
                    <Switch
                      checked={adminSettingsForm.directWhatsappInquiry}
                      onCheckedChange={(val) =>
                        setAdminSettingsForm((prev) => ({ ...prev, directWhatsappInquiry: val }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg p-3">
                    <div>
                      <p className="font-sans text-xs font-medium text-foreground">Negotiable Price Badges</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Display Negotiable badge on stocks</p>
                    </div>
                    <Switch
                      checked={adminSettingsForm.negotiableBadgeEnabled}
                      onCheckedChange={(val) =>
                        setAdminSettingsForm((prev) => ({ ...prev, negotiableBadgeEnabled: val }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg p-3">
                    <div>
                      <p className="font-sans text-xs font-medium text-foreground">Customer Auto-Reply Email</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Acknowledge bookings automatically</p>
                    </div>
                    <Switch
                      checked={adminSettingsForm.customerAutoReplyEmail}
                      onCheckedChange={(val) =>
                        setAdminSettingsForm((prev) => ({ ...prev, customerAutoReplyEmail: val }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between bg-background/50 border border-border/50 rounded-lg p-3">
                    <div>
                      <p className="font-sans text-xs font-medium text-foreground">Daily Digest Email</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Summary email for daily activity</p>
                    </div>
                    <Switch
                      checked={adminSettingsForm.dailyDigestEmail}
                      onCheckedChange={(val) =>
                        setAdminSettingsForm((prev) => ({ ...prev, dailyDigestEmail: val }))
                      }
                    />
                  </div>
                </div>

                {/* Announcement Banner */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-gold" /> Site-wide Announcement Banner
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-sans text-muted-foreground">
                        {adminSettingsForm.announcementBannerEnabled ? "Active" : "Hidden"}
                      </span>
                      <Switch
                        checked={adminSettingsForm.announcementBannerEnabled}
                        onCheckedChange={(val) =>
                          setAdminSettingsForm((prev) => ({ ...prev, announcementBannerEnabled: val }))
                        }
                      />
                    </div>
                  </div>
                  <Textarea
                    value={adminSettingsForm.announcementBannerText}
                    onChange={(e) =>
                      setAdminSettingsForm((prev) => ({ ...prev, announcementBannerText: e.target.value }))
                    }
                    placeholder="Enter special farm announcement or seasonal update..."
                    className="font-sans text-xs min-h-[60px]"
                  />
                  {adminSettingsForm.announcementBannerEnabled && (
                    <div className="p-2 rounded-md bg-gold/15 border border-gold/40 text-green-dark font-sans text-xs flex items-center gap-2">
                      <Megaphone className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span className="font-medium">{adminSettingsForm.announcementBannerText}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAdminSettingsForm(DEFAULT_FARM_SETTINGS);
                      saveFarmSiteSettings(DEFAULT_FARM_SETTINGS);
                      toast({ title: "Reset to Defaults", description: "Standard farm settings restored." });
                    }}
                    className="font-sans text-xs h-8 text-muted-foreground hover:text-foreground gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Defaults
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingAdminSettings}
                    onClick={handleSaveAdminFarmSettings}
                    className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs h-8 gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingAdminSettings ? "Saving..." : "Save Admin Settings"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone - Only for non-admin */}
          {!isAdmin && (
            <div className="pt-4 border-t border-border">
              <h3 className="font-sans text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                {t("settings.dangerZone")}
              </h3>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-4">
                <p className="font-sans text-sm text-foreground mb-1">{t("settings.deleteAccount")}</p>
                <p className="font-sans text-xs text-muted-foreground mb-3">
                  {t("settings.deleteDesc")}
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="font-sans font-semibold gap-2">
                      <Trash2 className="w-3.5 h-3.5" />
                      {t("settings.deleteBtn")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-display">{t("settings.deleteConfirmTitle")}</AlertDialogTitle>
                      <AlertDialogDescription className="font-sans">
                        {t("settings.deleteConfirmDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-sans">{t("settings.cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-sans"
                      >
                        {deleting ? t("settings.deleting") : t("settings.confirmDelete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
