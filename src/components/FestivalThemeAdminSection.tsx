import { useState, useMemo } from "react";
import { backend } from "@/lib/backendClient";
import { useFestivalTheme } from "@/contexts/FestivalThemeContext";
import {
  CATEGORY_LABELS,
  HOLIDAY_STATUS_LABELS,
  addDaysToDateStr,
  type DateConfirmationStatus,
  type DecorationStyle,
  type FestivalOccasion,
  type HolidayStatus,
  type OccasionCategory,
  type OccasionLiveStatus,
  type RecurrenceType,
  type ResolvedOccasionInstance,
} from "@/data/festivalCalendarData";
import {
  getDefaultFestivalImage,
  FESTIVAL_IMAGE_PRESETS,
} from "@/data/festivalVisualAssets";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Play,
  Square,
  Edit,
  Plus,
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Palette,
  Moon,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DECORATION_OPTIONS: { value: DecorationStyle; label: string }[] = [
  { value: "diya_lights", label: "Diya & Warm Golden Glow (Diwali / Navratri)" },
  { value: "tricolor_patriotic", label: "Tricolor Patriotic Ribbon (National Days)" },
  { value: "crescent_lantern", label: "Crescent & Emerald Lantern (Eid / Ramadan)" },
  { value: "floral_marigold", label: "Marigold & Toran Garland (Ganeshotsav / Gudi Padwa)" },
  { value: "royal_tribute", label: "Respectful Tribute Frame (Jayantis & Observances)" },
  { value: "colors_holi", label: "Vibrant Festive Palette (Holi)" },
  { value: "harvest_nature", label: "Green Harvest & Agricultural (Pola / Sankranti / Milk Day)" },
  { value: "peace_minimal", label: "Minimal Serene Tribute (Buddha Purnima / Good Friday)" },
  { value: "festive_sparkles", label: "Celebration Sparkles (New Year / Christmas)" },
];

const STATUS_BADGE_MAP: Record<
  OccasionLiveStatus,
  { label: string; className: string }
> = {
  active_today: {
    label: "Active Today",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  manual_active: {
    label: "Manual Active Override",
    className: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 animate-pulse",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  },
  disabled: {
    label: "Disabled (OFF)",
    className: "bg-muted text-muted-foreground border-border",
  },
  expired: {
    label: "Expired",
    className: "bg-stone-500/15 text-stone-600 dark:text-stone-400 border-stone-500/30",
  },
  needs_confirmation: {
    label: "Date Needs Confirmation",
    className: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40",
  },
};

const FestivalThemeAdminSection = () => {
  const {
    istNow,
    settings,
    resolvedOccasions,
    liveActiveOccasion,
    activeOccasion,
    secondaryOccasions,
    nextOccasion,
    isPreviewMode,
    previewOccasionId,
    startPreview,
    stopPreview,
    updateGlobalSettings,
    saveOccasionRecord,
    deleteCustomOccasion,
  } = useFestivalTheme();
  const { toast } = useToast();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [enabledFilter, setEnabledFilter] = useState<string>("all");

  // Edit / Create Occasion Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<FestivalOccasion | null>(null);
  const [selectedScheduleYear, setSelectedScheduleYear] = useState<string>(String(istNow.year));
  const [savingOccasion, setSavingOccasion] = useState(false);

  // Manual "Activate Now" Modal with required expiry date/time
  const [activateNowModalOpen, setActivateNowModalOpen] = useState(false);
  const [activateTarget, setActivateTarget] = useState<ResolvedOccasionInstance | null>(null);
  const [manualExpiryDate, setManualExpiryDate] = useState<string>(() =>
    addDaysToDateStr(istNow.dateStr, 1)
  );
  const [manualExpiryTime, setManualExpiryTime] = useState<string>("23:59");
  const [savingManual, setSavingManual] = useState(false);

  // Filtered & sorted occasions
  const filteredOccasions = useMemo(() => {
    return resolvedOccasions
      .filter((occ) => {
        if (monthFilter !== "all" && String(occ.month_number) !== monthFilter) return false;
        if (categoryFilter !== "all" && occ.category !== categoryFilter) return false;
        if (statusFilter !== "all" && occ.live_status !== statusFilter) return false;
        if (enabledFilter === "enabled" && !occ.enabled) return false;
        if (enabledFilter === "disabled" && occ.enabled) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = occ.name.toLowerCase().includes(q);
          const matchBadge = occ.theme.badge_text.toLowerCase().includes(q);
          const matchGreeting =
            occ.theme.greeting_en.toLowerCase().includes(q) ||
            (occ.theme.greeting_hi || "").toLowerCase().includes(q) ||
            (occ.theme.greeting_mr || "").toLowerCase().includes(q);
          const matchDate =
            (occ.resolved_start_date || "").includes(q) ||
            (occ.recurring_month_day || "").includes(q);
          if (!matchName && !matchBadge && !matchGreeting && !matchDate) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.month_number !== b.month_number) return a.month_number - b.month_number;
        const da = a.resolved_start_date || `9999-${a.recurring_month_day || "12-31"}`;
        const db = b.resolved_start_date || `9999-${b.recurring_month_day || "12-31"}`;
        return da.localeCompare(db) || b.priority - a.priority;
      });
  }, [
    resolvedOccasions,
    monthFilter,
    categoryFilter,
    statusFilter,
    enabledFilter,
    searchQuery,
  ]);

  const unconfirmedCount = useMemo(
    () => resolvedOccasions.filter((o) => o.live_status === "needs_confirmation").length,
    [resolvedOccasions]
  );

  // Handlers
  const handleMasterToggle = async (checked: boolean) => {
    const { error } = await updateGlobalSettings({ master_enabled: checked });
    if (error) {
      toast({
        title: "Failed to update Master Toggle",
        description: error,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: checked
        ? "Automatic Festival Themes Enabled"
        : "All Automatic Festival Themes Disabled",
      description: checked
        ? "Website will automatically display enabled occasion themes on their scheduled IST dates."
        : "Public website restored to the default AK Buffaloes theme.",
    });
  };

  const handleOverlapModeChange = async (mode: "single_main" | "main_plus_secondary") => {
    const { error } = await updateGlobalSettings({ overlap_display_mode: mode });
    if (error) {
      toast({ title: "Error saving overlap mode", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: "Overlap Display Rule Updated",
      description:
        mode === "single_main"
          ? "Highest-priority occasion will exclusively control the theme."
          : "Highest-priority occasion controls the theme, with smaller pills for secondary occasions.",
    });
  };

  const handleToggleIndividualOccasion = async (
    occ: ResolvedOccasionInstance,
    checked: boolean
  ) => {
    const { error } = await saveOccasionRecord({
      ...occ,
      enabled: checked,
    });
    if (error) {
      toast({ title: "Failed to update toggle", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: `${occ.name}: ${checked ? "Enabled (ON)" : "Disabled (OFF)"}`,
      description: checked
        ? `Will activate automatically on ${occ.resolved_start_date || occ.recurring_month_day || "its scheduled date"}.`
        : "This occasion will never activate automatically while OFF.",
    });
  };

  const handleToggleOccasionPopupAd = async (
    occ: ResolvedOccasionInstance,
    checked: boolean
  ) => {
    const { error } = await saveOccasionRecord({
      ...occ,
      theme: {
        ...occ.theme,
        show_in_popup: checked,
      },
    });
    if (error) {
      toast({
        title: "Failed to update Popup Ad toggle",
        description: error,
        variant: "destructive",
      });
      return;
    }
    try {
      await backend.from("promo_popups").upsert({
        id: `festival-popup-${occ.slug}`,
        festival_id: occ.id,
        festival_slug: occ.slug,
        is_active: checked,
        is_deleted: false,
        title_label: `${occ.theme.icon || "✨"} ${occ.name} — Festival Popup Ad`,
        updated_at: new Date().toISOString(),
      });
      sessionStorage.removeItem("ak_buffaloes_dismissed_popups_v2");
      window.dispatchEvent(new CustomEvent("ak-promo-popups-updated"));
      try {
        const bc = new BroadcastChannel("ak_buffalo_promo_bc");
        bc.postMessage({ type: "popup_updated" });
        bc.close();
      } catch {
        // ignore BroadcastChannel errors
      }
    } catch {
      // ignore storage error
    }
    toast({
      title: `${occ.name} Popup Ad: ${checked ? "ON" : "OFF"}`,
      description: checked
        ? `Festival popup advertisement enabled for ${occ.name}.`
        : `Festival popup advertisement disabled for ${occ.name}.`,
    });
  };

  const handleMoonOffsetChange = async (occ: ResolvedOccasionInstance, offset: number) => {
    const { error } = await saveOccasionRecord({
      ...occ,
      moon_offset_days: offset,
      confirmation_status: "confirmed",
    });
    if (error) {
      toast({ title: "Failed to adjust moon sighting date", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: `${occ.name} Moon-Sighting Adjusted`,
      description:
        offset === 0
          ? "Restored to standard calendar date."
          : `Shifted by ${offset > 0 ? `+${offset}` : offset} day based on moon sighting.`,
    });
  };

  const handleOpenActivateNow = (occ: ResolvedOccasionInstance) => {
    setActivateTarget(occ);
    setManualExpiryDate(addDaysToDateStr(istNow.dateStr, 1));
    setManualExpiryTime("23:59");
    setActivateNowModalOpen(true);
  };

  const handleConfirmActivateNow = async () => {
    if (!activateTarget) return;
    if (!manualExpiryDate || !manualExpiryTime) {
      toast({
        title: "Expiry Date & Time Required",
        description: "Please select when this temporary theme activation should expire.",
        variant: "destructive",
      });
      return;
    }
    const expiresAt = `${manualExpiryDate}T${manualExpiryTime}`;
    const currentComparable = `${istNow.dateStr}T${istNow.timeStr}`;
    if (expiresAt <= currentComparable) {
      toast({
        title: "Invalid Expiry Time",
        description: "Expiry date/time must be in the future (Asia/Kolkata time).",
        variant: "destructive",
      });
      return;
    }

    setSavingManual(true);
    const { error } = await updateGlobalSettings({
      manual_activation: {
        occasion_id: activateTarget.id,
        activated_at: new Date().toISOString(),
        expires_at: expiresAt,
        active: true,
      },
    });
    setSavingManual(false);

    if (error) {
      toast({ title: "Failed to activate theme", description: error, variant: "destructive" });
      return;
    }

    setActivateNowModalOpen(false);
    toast({
      title: `${activateTarget.name} Activated Live!`,
      description: `Active on public website until ${manualExpiryDate} at ${manualExpiryTime} IST.`,
    });
  };

  const handleStopManualActivation = async () => {
    const { error } = await updateGlobalSettings({
      manual_activation: null,
    });
    if (error) {
      toast({ title: "Failed to stop manual activation", description: error, variant: "destructive" });
      return;
    }
    toast({
      title: "Temporary Activation Ended",
      description: "Reverted to automatic date-based theme schedule.",
    });
  };

  const handleOpenEditModal = (occ: ResolvedOccasionInstance) => {
    setIsCreatingNew(false);
    setSelectedScheduleYear(String(istNow.year));
    setEditingOccasion(JSON.parse(JSON.stringify(occ)));
    setEditModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setIsCreatingNew(true);
    setSelectedScheduleYear(String(istNow.year));
    setEditingOccasion({
      id: `custom-occ-${Date.now()}`,
      name: "",
      slug: "",
      category: "hindu_festival",
      holiday_status: "celebration",
      recurrence_type: "fixed_annual",
      enabled: true,
      priority: 80,
      timezone: "Asia/Kolkata",
      activation_time: "00:00",
      deactivation_time: "23:59",
      duration_days: 1,
      recurring_month_day: `${String(istNow.month).padStart(2, "0")}-${String(istNow.day).padStart(2, "0")}`,
      recurring_end_month_day: `${String(istNow.month).padStart(2, "0")}-${String(istNow.day).padStart(2, "0")}`,
      start_date: istNow.dateStr,
      end_date: istNow.dateStr,
      confirmation_status: "confirmed",
      region: "All India",
      is_custom: true,
      yearly_schedule: {
        [String(istNow.year)]: {
          start_date: istNow.dateStr,
          end_date: istNow.dateStr,
          confirmation_status: "confirmed",
        },
      },
      theme: {
        primary_color: "#F59E0B",
        secondary_color: "#14532D",
        accent_color: "#FDE047",
        bg_gradient: "from-amber-950/90 via-emerald-950/90 to-slate-950/95",
        banner_bg: "linear-gradient(90deg, #14532d 0%, #78350f 50%, #14532d 100%)",
        banner_text_color: "#FEF08A",
        primary_hsl: "42 90% 54%",
        icon: "🎉",
        badge_text: "Special Occasion",
        greeting_en: "Warm Greetings from AK Buffaloes Farm!",
        greeting_hi: "एके बफैलोज़ फार्म की ओर से हार्दिक शुभकामनाएं!",
        greeting_mr: "एके बफेलोज फार्मकडून हार्दिक शुभेच्छा!",
        subtitle: "Celebrating with pure dairy excellence and trusted livestock.",
        buffalo_section_note: "Explore our 10 certified buffalo breeds and 50 verified listings.",
        about_section_note: "25+ years of trusted partnership with Indian dairy farmers.",
        footer_Line: "Festive Greetings from AK Buffaloes Farm, Jalgaon",
        decoration_style: "floral_marigold",
        show_in_popup: true,
        is_respectful_observance: false,
      },
    });
    setEditModalOpen(true);
  };

  const handleSaveOccasionForm = async () => {
    if (!editingOccasion) return;
    if (!editingOccasion.name.trim()) {
      toast({
        title: "Occasion Name Required",
        description: "Please enter a name for the festival or special day.",
        variant: "destructive",
      });
      return;
    }

    const cleanSlug =
      editingOccasion.slug?.trim() ||
      editingOccasion.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    setSavingOccasion(true);
    const { error } = await saveOccasionRecord({
      ...editingOccasion,
      slug: cleanSlug,
    });
    setSavingOccasion(false);

    if (error) {
      toast({ title: "Failed to save occasion", description: error, variant: "destructive" });
      return;
    }

    setEditModalOpen(false);
    toast({
      title: isCreatingNew ? "New Occasion Added" : "Occasion Settings Saved",
      description: `${editingOccasion.name} has been updated in the live calendar.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL HEADER & MASTER TOGGLE */}
      <div className="bg-background border border-border rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                Live Festival &amp; Special Day Themes
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-sans text-[10px]">
                Timezone: Asia/Kolkata (IST)
              </Badge>
            </div>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1">
              Automatic live-date-based theme activation across 2026, 2027, 2028, 2029, 2030 &amp; all future years.
            </p>
          </div>

          {/* MASTER TOGGLE */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all ${
                Boolean(settings.master_enabled)
                  ? "bg-emerald-500/10 border-emerald-500/40"
                  : "bg-destructive/10 border-destructive/30"
              }`}
            >
              <div>
                <Label
                  htmlFor="festival-master-toggle"
                  className="font-sans text-xs sm:text-sm font-bold text-foreground cursor-pointer block"
                >
                  Master Toggle: All Automatic Themes
                </Label>
                <span className="font-sans text-[11px] text-muted-foreground">
                  {Boolean(settings.master_enabled)
                    ? "ON — Enabled occasions activate on their date"
                    : "OFF — Default AK Buffaloes theme locked"}
                </span>
              </div>
              <Switch
                id="festival-master-toggle"
                checked={Boolean(settings.master_enabled)}
                onCheckedChange={handleMasterToggle}
              />
            </div>

            <Button
              size="sm"
              onClick={handleOpenCreateModal}
              className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-10 px-4 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Occasion</span>
            </Button>
          </div>
        </div>

        {/* 2. LIVE STATUS SUMMARY CARDS (Today in IST, Active Today, Next Occasion, Overlap Policy) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Card 1: Current Live Date in Asia/Kolkata */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-sans font-semibold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" /> Live India Date &amp; Time
              </span>
              <span className="font-mono text-[11px] bg-background px-2 py-0.5 rounded border border-border">
                {istNow.timeStr} IST
              </span>
            </div>
            <p className="font-display text-base font-bold text-foreground">
              {istNow.formattedDate}
            </p>
            <p className="font-sans text-[11px] text-muted-foreground mt-1">
              ISO Date: <span className="font-mono font-semibold">{istNow.dateStr}</span> (Auto-rechecks at 00:00 IST)
            </p>
          </div>

          {/* Card 2: Currently Active Public Theme */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-sans font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Public Website Theme Now
              </span>
              {settings.manual_activation?.active && liveActiveOccasion && (
                <button
                  type="button"
                  onClick={handleStopManualActivation}
                  className="text-[10px] font-bold text-red-500 hover:underline flex items-center gap-0.5"
                >
                  <Square className="w-2.5 h-2.5 fill-current" /> Stop Override
                </button>
              )}
            </div>
            {liveActiveOccasion ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{liveActiveOccasion.theme.icon}</span>
                  <p className="font-display text-sm sm:text-base font-bold text-foreground truncate">
                    {liveActiveOccasion.name}
                  </p>
                </div>
                <p className="font-sans text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                  {settings.manual_activation?.active &&
                  settings.manual_activation.occasion_id === liveActiveOccasion.id
                    ? `Manual Override until ${settings.manual_activation.expires_at?.replace("T", " ")} IST`
                    : `Active Today (${liveActiveOccasion.resolved_start_date} to ${liveActiveOccasion.resolved_end_date})`}
                </p>
              </div>
            ) : (
              <div>
                <p className="font-display text-sm sm:text-base font-bold text-foreground">
                  Default AK Buffaloes Theme
                </p>
                <p className="font-sans text-[11px] text-muted-foreground mt-1">
                  {settings.master_enabled
                    ? "No enabled occasion matches today's date."
                    : "Master toggle is OFF (Default brand palette active)."}
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Next Upcoming Enabled Occasion */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-sans font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" /> Next Scheduled Occasion
              </span>
              {nextOccasion && nextOccasion.days_until_start !== null && (
                <Badge variant="outline" className="text-[10px] font-sans">
                  In {nextOccasion.days_until_start} day{nextOccasion.days_until_start === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            {nextOccasion ? (
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{nextOccasion.theme.icon}</span>
                  <p className="font-display text-sm sm:text-base font-bold text-foreground truncate">
                    {nextOccasion.name}
                  </p>
                </div>
                <p className="font-sans text-[11px] text-muted-foreground mt-1">
                  Scheduled:{" "}
                  <span className="font-semibold text-foreground">
                    {nextOccasion.resolved_start_date && nextOccasion.resolved_start_date >= istNow.dateStr
                      ? nextOccasion.resolved_start_date
                      : nextOccasion.recurring_month_day
                      ? `${istNow.year + 1}-${nextOccasion.recurring_month_day}`
                      : nextOccasion.resolved_start_date}
                  </span>{" "}
                  (Priority {nextOccasion.priority})
                </p>
              </div>
            ) : (
              <p className="font-sans text-xs text-muted-foreground mt-2">
                No upcoming occasions enabled.
              </p>
            )}
          </div>

          {/* Card 4: Overlap Precedence Rule & Preview Status */}
          <div className="rounded-xl border border-border bg-muted/20 p-3.5">
            <Label className="font-sans text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-1.5">
              <Sliders className="w-3.5 h-3.5 text-gold" /> Overlapping Occasions Rule
            </Label>
            <Select
              value={settings.overlap_display_mode}
              onValueChange={(v) =>
                handleOverlapModeChange(v as "single_main" | "main_plus_secondary")
              }
            >
              <SelectTrigger className="h-8 font-sans text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main_plus_secondary">
                  Main Theme + Secondary Announcement Pills
                </SelectItem>
                <SelectItem value="single_main">
                  Single Main Occasion Only (Highest Priority)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="font-sans text-[10px] text-muted-foreground mt-1.5">
              {secondaryOccasions.length > 0
                ? `${secondaryOccasions.length} secondary occasion(s) also active today.`
                : "Highest priority number wins when dates overlap."}
            </p>
          </div>
        </div>

        {/* Manual Preview Active Notice inside Admin Panel */}
        {isPreviewMode && activeOccasion && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-sans text-xs sm:text-sm font-semibold text-foreground">
                Currently Previewing:{" "}
                <strong className="text-amber-700 dark:text-amber-300">
                  {activeOccasion.theme.icon} {activeOccasion.name}
                </strong>{" "}
                (Local Admin Preview — Public Website is NOT affected)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={stopPreview}
              className="h-8 font-sans text-xs border-amber-500/50 hover:bg-amber-500/20 gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" /> Exit Preview
            </Button>
          </div>
        )}

        {/* Date Needs Confirmation Notice if any */}
        {unconfirmedCount > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-sans">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>{unconfirmedCount} occasion(s)</strong> are marked as{" "}
                <strong>Date Needs Confirmation</strong> for {istNow.year}. Review and confirm their dates.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStatusFilter("needs_confirmation")}
              className="h-7 text-xs font-sans"
            >
              Show Unconfirmed
            </Button>
          </div>
        )}
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search festival, jayanti, national day, greeting, or date..."
              className="pl-9 h-9 font-sans text-xs sm:text-sm"
            />
          </div>

          {/* Month Filter */}
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[155px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All 12 Months</SelectItem>
              {MONTH_NAMES.map((m, idx) => (
                <SelectItem key={m} value={String(idx + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[215px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories ({resolvedOccasions.length})</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Live Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Live Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Live Statuses</SelectItem>
              <SelectItem value="active_today">Active Today</SelectItem>
              <SelectItem value="manual_active">Manual Override</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="disabled">Disabled (OFF)</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="needs_confirmation">Date Needs Confirmation</SelectItem>
            </SelectContent>
          </Select>

          {/* Enabled Filter */}
          <Select value={enabledFilter} onValueChange={setEnabledFilter}>
            <SelectTrigger className="w-[140px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Toggles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All (ON &amp; OFF)</SelectItem>
              <SelectItem value="enabled">Enabled (ON)</SelectItem>
              <SelectItem value="disabled">Disabled (OFF)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. ANNUAL OCCASION CALENDAR LIST WITH INDIVIDUAL ON/OFF TOGGLES */}
      <div className="space-y-3">
        {filteredOccasions.length === 0 ? (
          <div className="bg-background border border-border rounded-xl p-10 text-center">
            <p className="font-sans text-sm text-muted-foreground">
              No occasions match the selected filters.
            </p>
          </div>
        ) : (
          filteredOccasions.map((occ) => {
            const statusInfo = STATUS_BADGE_MAP[occ.live_status];
            const isBeingPreviewed = previewOccasionId === occ.id;
            const isManualRunning =
              settings.manual_activation?.active &&
              settings.manual_activation.occasion_id === occ.id;
            const occImageUrl =
              occ.theme.banner_image_url ||
              getDefaultFestivalImage(occ.slug || occ.id, occ.category);

            return (
              <div
                key={occ.id}
                className={`bg-background border-2 rounded-2xl p-4 transition-all overflow-hidden relative ${
                  occ.live_status === "active_today" || occ.live_status === "manual_active"
                    ? "border-emerald-500/70 ring-1 ring-emerald-500/30 shadow-lg"
                    : isBeingPreviewed
                    ? "border-amber-500/70 ring-1 ring-amber-500/30 shadow-md"
                    : "border-border hover:border-gold/50 shadow-sm"
                }`}
              >
                {/* Top Festive Color Accent Strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{
                    background: `linear-gradient(90deg, ${occ.theme.secondary_color}, ${occ.theme.primary_color}, ${occ.theme.accent_color})`,
                  }}
                />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                  {/* Left: Visual Festival Image Pod + Name, Badges, Greeting, Dates */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 min-w-0 flex-1">
                    {/* Visual Festival Image Showcase Thumbnail */}
                    <div
                      className="relative w-full sm:w-36 h-32 sm:h-24 rounded-xl overflow-hidden shrink-0 border-2 shadow-md group cursor-pointer"
                      style={{ borderColor: occ.theme.primary_color }}
                      onClick={() => handleOpenEditModal(occ)}
                      title="Click to customize festival image & theme"
                    >
                      <img
                        src={occImageUrl}
                        alt={occ.name}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(180deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.75) 100%)",
                        }}
                      />
                      <span
                        className="absolute top-1.5 left-1.5 w-7 h-7 rounded-lg flex items-center justify-center text-base shadow-md border backdrop-blur-md"
                        style={{
                          background: occ.theme.banner_bg,
                          borderColor: occ.theme.accent_color || occ.theme.primary_color,
                        }}
                      >
                        {occ.theme.icon}
                      </span>
                      <span className="absolute bottom-1.5 right-1.5 bg-black/75 text-white text-[9px] font-sans font-bold px-1.5 py-0.5 rounded border border-white/20 flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5 text-gold" />
                        <span>{occ.theme.banner_image_url ? "Custom" : "Festive"}</span>
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
                          {occ.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-sans font-bold ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] font-sans">
                          { MONTH_NAMES[(occ.month_number || 1) - 1] }
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] font-sans">
                          {CATEGORY_LABELS[occ.category]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-sans text-muted-foreground"
                        >
                          {HOLIDAY_STATUS_LABELS[occ.holiday_status]}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono bg-gold/10 text-foreground border-gold/30"
                        >
                          Priority: {occ.priority}
                        </Badge>
                      </div>

                      <p className="font-sans text-xs font-medium text-foreground/90 mt-1 line-clamp-1">
                        {occ.theme.greeting_en}
                        {occ.theme.greeting_mr ? ` • ${occ.theme.greeting_mr}` : ""}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-sans mt-1.5">
                        <span>
                          <strong>{istNow.year} Date:</strong>{" "}
                          {occ.resolved_start_date ? (
                            occ.resolved_start_date === occ.resolved_end_date ? (
                              <span className="font-mono text-foreground font-semibold">
                                {occ.resolved_start_date}
                              </span>
                            ) : (
                              <span className="font-mono text-foreground font-semibold">
                                {occ.resolved_start_date} → {occ.resolved_end_date}
                              </span>
                            )
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              Needs Confirmation
                            </span>
                          )}
                        </span>
                        <span>
                          <strong>Recurrence:</strong>{" "}
                          {occ.recurrence_type === "fixed_annual"
                            ? `Fixed Every Year (${occ.recurring_month_day})`
                            : occ.recurrence_type === "lunar_hindu"
                            ? "Hindu Lunar Calendar (2026–2030)"
                            : occ.recurrence_type === "lunar_islamic"
                            ? "Islamic Hijri Lunar (Moon-Sighting)"
                            : "Annual Variable Calendar"}
                        </span>
                        <span>
                          <strong>Window:</strong> {occ.activation_time}–{occ.deactivation_time} IST
                        </span>
                        {occ.days_until_start !== null && occ.days_until_start > 0 && (
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            Starts in {occ.days_until_start} day{occ.days_until_start === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>

                      {/* Moon-Sighting Quick Correction Bar for Islamic Lunar Festivals */}
                      {occ.moon_sighting_dependent && (
                        <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-border/60">
                          <span className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700 dark:text-emerald-400">
                            <Moon className="w-3.5 h-3.5" /> Moon-Sighting Date Adjustment:
                          </span>
                          {[-1, 0, 1].map((offset) => (
                            <button
                              key={offset}
                              type="button"
                              onClick={() => handleMoonOffsetChange(occ, offset)}
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border transition-colors ${
                                (occ.moon_offset_days || 0) === offset
                                  ? "bg-emerald-600 text-white border-emerald-600"
                                  : "bg-muted/40 text-muted-foreground border-border hover:border-emerald-500/50"
                              }`}
                            >
                              {offset === -1
                                ? "-1 Day (Early Moon)"
                                : offset === 0
                                ? "Standard Calendar Date"
                                : "+1 Day (Late Moon)"}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Individual Theme ON/OFF + Popup Ad ON/OFF + Preview + Activate Now + Customize */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
                    {/* Individual Theme ON/OFF Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border">
                      <Label
                        htmlFor={`occ-switch-${occ.id}`}
                        className="font-sans text-xs font-bold cursor-pointer"
                      >
                        Theme: {occ.enabled ? "ON" : "OFF"}
                      </Label>
                      <Switch
                        id={`occ-switch-${occ.id}`}
                        checked={occ.enabled}
                        onCheckedChange={(checked) =>
                          handleToggleIndividualOccasion(occ, checked)
                        }
                      />
                    </div>

                    {/* Individual Festival Popup Ad ON/OFF Toggle */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30">
                      <Label
                        htmlFor={`occ-popup-switch-${occ.id}`}
                        className="font-sans text-xs font-bold cursor-pointer text-foreground"
                      >
                        Popup Ad: {occ.theme.show_in_popup !== false ? "ON" : "OFF"}
                      </Label>
                      <Switch
                        id={`occ-popup-switch-${occ.id}`}
                        checked={occ.theme.show_in_popup !== false}
                        onCheckedChange={(checked) =>
                          handleToggleOccasionPopupAd(occ, checked)
                        }
                      />
                    </div>

                    {/* Manual Preview Button (Local Admin only) */}
                    <Button
                      size="sm"
                      variant={isBeingPreviewed ? "default" : "outline"}
                      onClick={() =>
                        isBeingPreviewed ? stopPreview() : startPreview(occ.id)
                      }
                      className={`h-8 font-sans text-xs gap-1.5 ${
                        isBeingPreviewed
                          ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 font-bold"
                          : ""
                      }`}
                      title="Preview this theme in your browser without changing the public website"
                    >
                      {isBeingPreviewed ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Stop Preview</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </>
                      )}
                    </Button>

                    {/* Activate Now (Temporary Public Override with Expiry) */}
                    {isManualRunning ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopManualActivation}
                        className="h-8 font-sans text-xs gap-1.5"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Stop Live Override</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenActivateNow(occ)}
                        className="h-8 font-sans text-xs gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                        title="Temporarily activate this theme on the public website until a chosen expiry time"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Activate Now</span>
                      </Button>
                    )}

                    {/* Edit Dates, Priority & Theme */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditModal(occ)}
                      className="h-8 font-sans text-xs gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Customize</span>
                    </Button>

                    {occ.is_custom && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomOccasion(occ.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        title="Delete custom occasion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. MODAL: ACTIVATE NOW (TEMPORARY PUBLIC ACTIVATION WITH REQUIRED EXPIRY) */}
      <Dialog open={activateNowModalOpen} onOpenChange={setActivateNowModalOpen}>
        <DialogContent className="max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-500 fill-current" />
              Activate Theme Now (With Automatic Expiry)
            </DialogTitle>
          </DialogHeader>
          {activateTarget && (
            <div className="space-y-4 pt-2">
              <div
                className="p-3.5 rounded-xl border flex items-center gap-3"
                style={{
                  background: activateTarget.theme.banner_bg,
                  color: activateTarget.theme.banner_text_color,
                  borderColor: activateTarget.theme.primary_color,
                }}
              >
                <span className="text-2xl">{activateTarget.theme.icon}</span>
                <div>
                  <p className="font-display font-bold text-sm">{activateTarget.name}</p>
                  <p className="text-xs opacity-90">{activateTarget.theme.greeting_en}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                This will temporarily activate <strong>{activateTarget.name}</strong> on the public website immediately and automatically deactivate it at the expiry date and time (in <strong>Asia/Kolkata</strong> timezone).
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Expiry Date (IST) *</Label>
                  <Input
                    type="date"
                    value={manualExpiryDate}
                    min={istNow.dateStr}
                    onChange={(e) => setManualExpiryDate(e.target.value)}
                    className="h-9 mt-1 text-xs font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Expiry Time (IST) *</Label>
                  <Input
                    type="time"
                    value={manualExpiryTime}
                    onChange={(e) => setManualExpiryTime(e.target.value)}
                    className="h-9 mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActivateNowModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={savingManual}
                  onClick={handleConfirmActivateNow}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {savingManual ? "Activating..." : "Activate Public Theme Now"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. MODAL: CUSTOMIZE DATES, PRIORITY, MULTI-YEAR CALENDAR & THEME COLORS/GREETINGS */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-gold" />
              {isCreatingNew
                ? "Add New Festival / Special Day"
                : `Customize: ${editingOccasion?.name}`}
            </DialogTitle>
          </DialogHeader>

          {editingOccasion && (
            <div className="space-y-5 pt-2">
              {/* Live Studio Banner Preview with Image inside Modal */}
              <div
                className="rounded-2xl p-4 border-2 shadow-md overflow-hidden relative"
                style={{
                  background: editingOccasion.theme.banner_bg,
                  color: editingOccasion.theme.banner_text_color,
                  borderColor: editingOccasion.theme.primary_color,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
                  <div className="relative w-full sm:w-28 h-24 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 shadow-md"
                    style={{ borderColor: editingOccasion.theme.accent_color || editingOccasion.theme.primary_color }}
                  >
                    <img
                      src={
                        editingOccasion.theme.banner_image_url ||
                        getDefaultFestivalImage(
                          editingOccasion.slug || editingOccasion.id,
                          editingOccasion.category
                        )
                      }
                      alt={editingOccasion.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-black/85 border border-white/30 flex items-center justify-center text-sm">
                      {editingOccasion.theme.icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${editingOccasion.theme.primary_color}30`,
                        border: `1px solid ${editingOccasion.theme.primary_color}`,
                      }}
                    >
                      {editingOccasion.theme.badge_text}
                    </span>
                    <p className="font-display text-sm sm:text-base font-bold mt-1">
                      {editingOccasion.theme.greeting_en}
                    </p>
                    <p className="text-xs opacity-90">{editingOccasion.theme.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Festival Theme & Popup Card Image Customizer */}
              <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-gold" /> Festival Theme &amp; Popup Card Image
                  </h4>
                  {editingOccasion.theme.banner_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, banner_image_url: null },
                        })
                      }
                      className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset to Default Image
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload from PC / Mobile */}
                  <div>
                    <Label className="text-xs font-semibold">Upload Custom Image (PC / Mobile)</Label>
                    <label className="mt-1 flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-dashed border-gold/60 bg-gold/5 hover:bg-gold/10 cursor-pointer text-xs font-sans font-semibold text-foreground transition-colors">
                      <Upload className="w-3.5 h-3.5 text-gold" />
                      <span>Choose Image File...</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setEditingOccasion({
                                ...editingOccasion,
                                theme: {
                                  ...editingOccasion.theme,
                                  banner_image_url: reader.result,
                                },
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Preset AK Buffaloes Farm / Breed Image Selector */}
                  <div>
                    <Label className="text-xs font-semibold">Or Pick Preset Farm / Breed Image</Label>
                    <Select
                      value=""
                      onValueChange={(presetUrl) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: {
                            ...editingOccasion.theme,
                            banner_image_url: presetUrl,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue placeholder="Select a preset farm/buffalo photo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {FESTIVAL_IMAGE_PRESETS.map((preset) => (
                          <SelectItem key={preset.label} value={preset.url} className="text-xs">
                            [{preset.tag}] {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Or Paste Direct Image URL</Label>
                  <Input
                    value={editingOccasion.theme.banner_image_url || ""}
                    placeholder="https://... or leave empty for default curated festival image"
                    onChange={(e) =>
                      setEditingOccasion({
                        ...editingOccasion,
                        theme: {
                          ...editingOccasion.theme,
                          banner_image_url: e.target.value || null,
                        },
                      })
                    }
                    className="h-8 mt-1 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Basic Details & Category / Holiday Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Occasion Name *</Label>
                  <Input
                    value={editingOccasion.name}
                    onChange={(e) =>
                      setEditingOccasion({ ...editingOccasion, name: e.target.value })
                    }
                    className="h-9 mt-1 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs font-semibold">Icon / Emblem</Label>
                    <Input
                      value={editingOccasion.theme.icon}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, icon: e.target.value },
                        })
                      }
                      className="h-9 mt-1 text-sm text-center"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Priority (1–100)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={editingOccasion.priority}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          priority: Number(e.target.value) || 50,
                        })
                      }
                      className="h-9 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Occasion Category</Label>
                  <Select
                    value={editingOccasion.category}
                    onValueChange={(v) =>
                      setEditingOccasion({
                        ...editingOccasion,
                        category: v as OccasionCategory,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, lbl]) => (
                        <SelectItem key={k} value={k}>
                          {lbl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">
                    Holiday Status (Stored Separately)
                  </Label>
                  <Select
                    value={editingOccasion.holiday_status}
                    onValueChange={(v) =>
                      setEditingOccasion({
                        ...editingOccasion,
                        holiday_status: v as HolidayStatus,
                      })
                    }
                  >
                    <SelectTrigger className="h-9 mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(HOLIDAY_STATUS_LABELS).map(([k, lbl]) => (
                        <SelectItem key={k} value={k}>
                          {lbl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Recurrence Management */}
              <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-3">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" /> Annual Date &amp; Recurrence Schedule (Asia/Kolkata)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Recurrence Type</Label>
                    <Select
                      value={editingOccasion.recurrence_type}
                      onValueChange={(v) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          recurrence_type: v as RecurrenceType,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_annual">Fixed Annual Date (Every Year)</SelectItem>
                        <SelectItem value="lunar_hindu">Hindu Lunar Calendar</SelectItem>
                        <SelectItem value="lunar_islamic">Muslim Hijri Lunar (Moon-Sighting)</SelectItem>
                        <SelectItem value="lunar_other">Sikh / Jain / Buddhist Lunar</SelectItem>
                        <SelectItem value="variable_annual">Variable Annual Date</SelectItem>
                        <SelectItem value="one_time">One-Time Special Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Date Confirmation Status</Label>
                    <Select
                      value={editingOccasion.confirmation_status}
                      onValueChange={(v) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          confirmation_status: v as DateConfirmationStatus,
                        })
                      }
                    >
                      <SelectTrigger className="h-9 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed Date</SelectItem>
                        <SelectItem value="estimated">Estimated (Panchang / Astronomical)</SelectItem>
                        <SelectItem value="moon_sighting_pending">Subject to Moon Sighting</SelectItem>
                        <SelectItem value="needs_confirmation">Date Needs Confirmation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Duration (Days)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={40}
                      value={editingOccasion.duration_days}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          duration_days: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="h-9 mt-1 text-xs font-mono"
                    />
                  </div>
                </div>

                {editingOccasion.recurrence_type === "fixed_annual" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Start Month-Day (MM-DD)</Label>
                      <Input
                        value={editingOccasion.recurring_month_day || ""}
                        placeholder="08-15"
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            recurring_month_day: e.target.value,
                          })
                        }
                        className="h-9 mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">End Month-Day (MM-DD)</Label>
                      <Input
                        value={editingOccasion.recurring_end_month_day || ""}
                        placeholder="08-15"
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            recurring_end_month_day: e.target.value,
                          })
                        }
                        className="h-9 mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Start Time (IST)</Label>
                      <Input
                        type="time"
                        value={editingOccasion.activation_time}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            activation_time: e.target.value,
                          })
                        }
                        className="h-9 mt-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">End Time (IST)</Label>
                      <Input
                        type="time"
                        value={editingOccasion.deactivation_time}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            deactivation_time: e.target.value,
                          })
                        }
                        className="h-9 mt-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold">Select Year to Edit Dates:</span>
                      {["2026", "2027", "2028", "2029", "2030", "2031"].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setSelectedScheduleYear(yr)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                            selectedScheduleYear === yr
                              ? "bg-gold text-green-dark border-gold"
                              : "bg-background text-muted-foreground border-border"
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs font-semibold">
                          {selectedScheduleYear} Start Date (YYYY-MM-DD)
                        </Label>
                        <Input
                          type="date"
                          value={
                            editingOccasion.yearly_schedule?.[selectedScheduleYear]?.start_date ||
                            (selectedScheduleYear === String(istNow.year)
                              ? editingOccasion.start_date || ""
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const endVal =
                              editingOccasion.yearly_schedule?.[selectedScheduleYear]?.end_date ||
                              addDaysToDateStr(val, Math.max(0, editingOccasion.duration_days - 1));
                            setEditingOccasion({
                              ...editingOccasion,
                              start_date:
                                selectedScheduleYear === String(istNow.year)
                                  ? val
                                  : editingOccasion.start_date,
                              end_date:
                                selectedScheduleYear === String(istNow.year)
                                  ? endVal
                                  : editingOccasion.end_date,
                              yearly_schedule: {
                                ...(editingOccasion.yearly_schedule || {}),
                                [selectedScheduleYear]: {
                                  start_date: val,
                                  end_date: endVal,
                                  confirmation_status: "confirmed",
                                },
                              },
                            });
                          }}
                          className="h-9 mt-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">
                          {selectedScheduleYear} End Date (YYYY-MM-DD)
                        </Label>
                        <Input
                          type="date"
                          value={
                            editingOccasion.yearly_schedule?.[selectedScheduleYear]?.end_date ||
                            (selectedScheduleYear === String(istNow.year)
                              ? editingOccasion.end_date || ""
                              : "")
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            const startVal =
                              editingOccasion.yearly_schedule?.[selectedScheduleYear]?.start_date ||
                              val;
                            setEditingOccasion({
                              ...editingOccasion,
                              end_date:
                                selectedScheduleYear === String(istNow.year)
                                  ? val
                                  : editingOccasion.end_date,
                              yearly_schedule: {
                                ...(editingOccasion.yearly_schedule || {}),
                                [selectedScheduleYear]: {
                                  start_date: startVal,
                                  end_date: val,
                                  confirmation_status: "confirmed",
                                },
                              },
                            });
                          }}
                          className="h-9 mt-1 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">
                          {selectedScheduleYear} Status
                        </Label>
                        <Select
                          value={
                            editingOccasion.yearly_schedule?.[selectedScheduleYear]
                              ?.confirmation_status || "confirmed"
                          }
                          onValueChange={(v) => {
                            const existing = editingOccasion.yearly_schedule?.[selectedScheduleYear] || {
                              start_date: "",
                              end_date: "",
                              confirmation_status: "needs_confirmation",
                            };
                            setEditingOccasion({
                              ...editingOccasion,
                              yearly_schedule: {
                                ...(editingOccasion.yearly_schedule || {}),
                                [selectedScheduleYear]: {
                                  ...existing,
                                  confirmation_status: v as DateConfirmationStatus,
                                },
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="h-9 mt-1 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="estimated">Estimated</SelectItem>
                            <SelectItem value="needs_confirmation">
                              Date Needs Confirmation
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Colors, Greetings & Section Notes */}
              <div className="p-3.5 rounded-xl bg-muted/25 border border-border space-y-3">
                <h4 className="font-sans text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-gold" /> Theme Colors, Greetings &amp; Website Section Content
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Primary Color</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={editingOccasion.theme.primary_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, primary_color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editingOccasion.theme.primary_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, primary_color: e.target.value },
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Secondary Color</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={editingOccasion.theme.secondary_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, secondary_color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editingOccasion.theme.secondary_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, secondary_color: e.target.value },
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Accent Color</Label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="color"
                        value={editingOccasion.theme.accent_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, accent_color: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={editingOccasion.theme.accent_color}
                        onChange={(e) =>
                          setEditingOccasion({
                            ...editingOccasion,
                            theme: { ...editingOccasion.theme, accent_color: e.target.value },
                          })
                        }
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">Decoration Style</Label>
                    <Select
                      value={editingOccasion.theme.decoration_style}
                      onValueChange={(v) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: {
                            ...editingOccasion.theme,
                            decoration_style: v as DecorationStyle,
                          },
                        })
                      }
                    >
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DECORATION_OPTIONS.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Badge Text</Label>
                    <Input
                      value={editingOccasion.theme.badge_text}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, badge_text: e.target.value },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Footer Greeting Line</Label>
                    <Input
                      value={editingOccasion.theme.footer_Line}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, footer_Line: e.target.value },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">English Greeting *</Label>
                    <Input
                      value={editingOccasion.theme.greeting_en}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, greeting_en: e.target.value },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Hindi Greeting</Label>
                    <Input
                      value={editingOccasion.theme.greeting_hi || ""}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, greeting_hi: e.target.value },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Marathi Greeting</Label>
                    <Input
                      value={editingOccasion.theme.greeting_mr || ""}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, greeting_mr: e.target.value },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Hero &amp; Banner Subtitle</Label>
                  <Textarea
                    rows={2}
                    value={editingOccasion.theme.subtitle}
                    onChange={(e) =>
                      setEditingOccasion({
                        ...editingOccasion,
                        theme: { ...editingOccasion.theme, subtitle: e.target.value },
                      })
                    }
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Buffaloes &amp; Breed Detail Note</Label>
                    <Input
                      value={editingOccasion.theme.buffalo_section_note}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: {
                            ...editingOccasion.theme,
                            buffalo_section_note: e.target.value,
                          },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">About Us Section Note</Label>
                    <Input
                      value={editingOccasion.theme.about_section_note}
                      onChange={(e) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: {
                            ...editingOccasion.theme,
                            about_section_note: e.target.value,
                          },
                        })
                      }
                      className="h-8 mt-1 text-xs"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingOccasion.theme.show_in_popup}
                      onCheckedChange={(c) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: { ...editingOccasion.theme, show_in_popup: c },
                        })
                      }
                    />
                    <Label className="text-xs">Include Greeting Card in Welcome Popup</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={Boolean(editingOccasion.theme.is_respectful_observance)}
                      onCheckedChange={(c) =>
                        setEditingOccasion({
                          ...editingOccasion,
                          theme: {
                            ...editingOccasion.theme,
                            is_respectful_observance: c,
                          },
                        })
                      }
                    />
                    <Label className="text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Respectful Tribute Mode (Subtle Animations)
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={savingOccasion}
                  onClick={handleSaveOccasionForm}
                  className="bg-gold text-green-dark hover:bg-gold-light font-bold"
                >
                  {savingOccasion ? "Saving..." : "Save Occasion Settings"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FestivalThemeAdminSection;
