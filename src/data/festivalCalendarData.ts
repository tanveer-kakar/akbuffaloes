export type OccasionCategory =
  | "hindu_festival"
  | "muslim_festival"
  | "other_religious"
  | "national_day"
  | "regional_day"
  | "jayanti_anniversary"
  | "international_day";

export type HolidayStatus =
  | "gazetted_holiday"
  | "restricted_holiday"
  | "regional_holiday"
  | "observance_only"
  | "celebration";

export type RecurrenceType =
  | "fixed_annual"
  | "lunar_hindu"
  | "lunar_islamic"
  | "lunar_other"
  | "variable_annual"
  | "one_time";

export type DateConfirmationStatus =
  | "confirmed"
  | "estimated"
  | "needs_confirmation"
  | "moon_sighting_pending";

export type DecorationStyle =
  | "diya_lights"
  | "tricolor_patriotic"
  | "crescent_lantern"
  | "floral_marigold"
  | "royal_tribute"
  | "colors_holi"
  | "harvest_nature"
  | "peace_minimal"
  | "festive_sparkles";

export type OccasionLiveStatus =
  | "active_today"
  | "manual_active"
  | "scheduled"
  | "disabled"
  | "expired"
  | "needs_confirmation";

export interface YearlyScheduleEntry {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  confirmation_status: DateConfirmationStatus;
  note?: string;
}

export interface OccasionThemeConfig {
  primary_color: string;       // Hex color e.g. "#D97706"
  secondary_color: string;     // Hex color e.g. "#92400E"
  accent_color: string;        // Hex color e.g. "#F59E0B"
  bg_gradient: string;         // Tailwind or CSS gradient string
  banner_bg: string;           // CSS background for top announcement bar
  banner_text_color: string;   // Hex color for banner text
  primary_hsl?: string;        // Optional HSL override for --gold / --primary
  hero_overlay_hsl?: string;   // Optional HSL override for --hero-overlay
  icon: string;                // Emoji or symbol e.g. "🪔", "🇮🇳", "🌙"
  badge_text: string;          // Short badge e.g. "Shubh Deepawali"
  greeting_en: string;         // English greeting
  greeting_hi?: string;        // Hindi greeting
  greeting_mr?: string;        // Marathi greeting
  subtitle: string;            // Banner / Hero message
  buffalo_section_note: string;// Special note shown on Buffaloes & BreedDetail pages
  about_section_note: string;  // Special note shown on About Us page
  footer_Line: string;         // Short line shown in Footer
  decoration_style: DecorationStyle;
  banner_image_url?: string | null;
  show_in_popup: boolean;
  is_respectful_observance?: boolean; // True for national tributes/jayantis/solemn days
}

export interface FestivalOccasion {
  id: string;
  name: string;
  slug: string;
  category: OccasionCategory;
  holiday_status: HolidayStatus;
  recurrence_type: RecurrenceType;
  enabled: boolean;
  priority: number; // Higher number = higher precedence (1 to 100)
  timezone: string; // Default "Asia/Kolkata"
  activation_time: string; // "HH:mm" in Asia/Kolkata, default "00:00"
  deactivation_time: string; // "HH:mm" in Asia/Kolkata, default "23:59"
  duration_days: number;
  // For fixed_annual occasions:
  recurring_month_day?: string; // "MM-DD"
  recurring_end_month_day?: string; // "MM-DD"
  // For variable / lunar / one-time occasions or admin overrides:
  start_date?: string; // "YYYY-MM-DD"
  end_date?: string;   // "YYYY-MM-DD"
  confirmation_status: DateConfirmationStatus;
  moon_sighting_dependent?: boolean;
  moon_offset_days?: number; // -1, 0, +1 adjustment for lunar sightings
  region?: string; // e.g. "All India", "Maharashtra", "Global"
  yearly_schedule?: Record<string, YearlyScheduleEntry>;
  theme: OccasionThemeConfig;
  is_custom?: boolean;
  updated_at?: string;
}

export interface FestivalGlobalSettings {
  id: string; // "global"
  master_enabled: boolean;
  overlap_display_mode: "single_main" | "main_plus_secondary";
  timezone: string; // "Asia/Kolkata"
  manual_activation: {
    occasion_id: string | null;
    activated_at: string | null;
    expires_at: string | null; // ISO string or "YYYY-MM-DDTHH:mm" in IST
    active: boolean;
  } | null;
  updated_at?: string;
}

export interface ISTDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  dateStr: string;     // "YYYY-MM-DD"
  monthDay: string;    // "MM-DD"
  timeStr: string;     // "HH:mm"
  isoNow: string;
  formattedDate: string;
}

export interface ResolvedOccasionInstance extends FestivalOccasion {
  resolved_start_date: string | null; // "YYYY-MM-DD" for current/relevant cycle
  resolved_end_date: string | null;   // "YYYY-MM-DD"
  resolved_year: number;
  resolved_confirmation: DateConfirmationStatus;
  live_status: OccasionLiveStatus;
  days_until_start: number | null;
  month_number: number; // 1..12 for sorting/grouping by month
}

export const CATEGORY_LABELS: Record<OccasionCategory, string> = {
  hindu_festival: "Hindu Festivals",
  muslim_festival: "Muslim Festivals & Observances",
  other_religious: "Sikh, Buddhist, Jain & Christian",
  national_day: "Indian National Days & Govt Observances",
  regional_day: "Regional & State Observances",
  jayanti_anniversary: "Notable Personalities' Jayantis",
  international_day: "International & Agricultural Days",
};

export const HOLIDAY_STATUS_LABELS: Record<HolidayStatus, string> = {
  gazetted_holiday: "Gazetted Public Holiday",
  restricted_holiday: "Restricted / Optional Holiday",
  regional_holiday: "State / Regional Holiday",
  observance_only: "Respectful Observance (Working Day)",
  celebration: "Cultural / Global Celebration",
};

export const DEFAULT_FESTIVAL_SETTINGS: FestivalGlobalSettings = {
  id: "global",
  master_enabled: true,
  overlap_display_mode: "main_plus_secondary",
  timezone: "Asia/Kolkata",
  manual_activation: null,
};

/**
 * Extracts exact current date and time components in the Asia/Kolkata timezone.
 * Never relies on the host machine's local timezone.
 */
export function getISTDateParts(referenceDate: Date = new Date()): ISTDateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(referenceDate);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const year = parseInt(map.year || "2026", 10);
  const month = parseInt(map.month || "01", 10);
  const day = parseInt(map.day || "01", 10);
  let hour = parseInt(map.hour || "00", 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(map.minute || "00", 10);
  const second = parseInt(map.second || "00", 10);

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");

  const dateStr = `${year}-${mm}-${dd}`;
  const monthDay = `${mm}-${dd}`;
  const timeStr = `${hh}:${min}`;

  const displayFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dateStr,
    monthDay,
    timeStr,
    isoNow: referenceDate.toISOString(),
    formattedDate: displayFormatter.format(referenceDate),
  };
}

/**
 * Adds a number of days to a YYYY-MM-DD string safely in UTC calendar arithmetic.
 */
export function addDaysToDateStr(dateStr: string, daysToAdd: number): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + daysToAdd));
  const ry = dt.getUTCFullYear();
  const rm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(dt.getUTCDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
}

/**
 * Returns the difference in whole calendar days: (targetDateStr - baseDateStr).
 */
export function diffCalendarDays(baseDateStr: string, targetDateStr: string): number {
  const [y1, m1, d1] = baseDateStr.split("-").map(Number);
  const [y2, m2, d2] = targetDateStr.split("-").map(Number);
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

// ─── Comprehensive Default Annual Occasions Catalog ──────────────────────────
export const DEFAULT_FESTIVAL_OCCASIONS: FestivalOccasion[] = [
  // ======================== JANUARY ========================
  {
    id: "occ-new-year",
    name: "New Year's Day",
    slug: "new-years-day",
    category: "international_day",
    holiday_status: "celebration",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 65,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "01-01",
    recurring_end_month_day: "01-01",
    confirmation_status: "confirmed",
    region: "Global",
    theme: {
      primary_color: "#D4AF37",
      secondary_color: "#0F291E",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-emerald-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #0b2419 0%, #1e3a2f 50%, #0b2419 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 90% 55%",
      icon: "✨",
      badge_text: "Happy New Year",
      greeting_en: "Wishing You a Prosperous & Healthy New Year!",
      greeting_hi: "नव वर्ष की हार्दिक शुभकामनाएं!",
      greeting_mr: "नवीन वर्षाच्या हार्दिक शुभेच्छा!",
      subtitle: "May the new year bring abundant milk yields, healthy herds, and prosperity to every dairy farmer.",
      buffalo_section_note: "Start the New Year by scaling your dairy herd with certified high-yield buffaloes.",
      about_section_note: "Celebrating another year of trusted partnership with dairy farmers across India.",
      footer_Line: "Happy New Year from AK Buffaloes Farm, Pachora",
      decoration_style: "festive_sparkles",
      show_in_popup: true,
    },
  },
  {
    id: "occ-savitribai-phule-jayanti",
    name: "Savitribai Phule Jayanti",
    slug: "savitribai-phule-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 78,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "01-03",
    recurring_end_month_day: "01-03",
    confirmation_status: "confirmed",
    region: "Maharashtra & All India",
    theme: {
      primary_color: "#D97706",
      secondary_color: "#1E293B",
      accent_color: "#FBBF24",
      bg_gradient: "from-amber-950/90 via-stone-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #271709 0%, #45270d 50%, #271709 100%)",
      banner_text_color: "#FDE68A",
      primary_hsl: "38 85% 52%",
      icon: "📚",
      badge_text: "Savitribai Phule Jayanti",
      greeting_en: "Humble Tribute to Krantijyoti Savitribai Phule on Her Birth Anniversary",
      greeting_hi: "क्रांतिज्योति सावित्रीबाई फुले जयंती पर शत्-शत् नमन",
      greeting_mr: "क्रांतीज्योती सावित्रीबाई फुले यांना जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Honoring India's pioneer of women's education, social reform, and rural empowerment.",
      buffalo_section_note: "Empowering rural families and women dairy entrepreneurs across Maharashtra & India.",
      about_section_note: "Inspired by Krantijyoti Savitribai Phule's vision of rural self-reliance and dignity.",
      footer_Line: "Saluting Krantijyoti Savitribai Phule — Pioneer of Education",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-vivekananda-jayanti",
    name: "Swami Vivekananda Jayanti (National Youth Day)",
    slug: "swami-vivekananda-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 72,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "01-12",
    recurring_end_month_day: "01-12",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#EA580C",
      secondary_color: "#1C1917",
      accent_color: "#FDBA74",
      bg_gradient: "from-orange-950/90 via-stone-900/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #2e1305 0%, #5c280b 50%, #2e1305 100%)",
      banner_text_color: "#FFEDD5",
      primary_hsl: "24 85% 52%",
      icon: "🔥",
      badge_text: "National Youth Day",
      greeting_en: "Tributes to Swami Vivekananda on National Youth Day",
      greeting_hi: "स्वामी विवेकानंद जयंती एवं राष्ट्रीय युवा दिवस पर सादर नमन",
      greeting_mr: "स्वामी विवेकानंद जयंती व राष्ट्रीय युवा दिनानिमित्त विनम्र अभिवादन",
      subtitle: "Inspiring young Indian farmers and agribusiness leaders to build modern, self-reliant dairy enterprises.",
      buffalo_section_note: "Guiding young dairy entrepreneurs with scientific breeding and profitable herd setups.",
      about_section_note: "Committed to mentoring the next generation of progressive dairy farmers.",
      footer_Line: "National Youth Day — Arise, Awake, and Build Self-Reliant India",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-makar-sankranti",
    name: "Makar Sankranti & Pongal",
    slug: "makar-sankranti",
    category: "hindu_festival",
    holiday_status: "restricted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 82,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 2,
    recurring_month_day: "01-14",
    recurring_end_month_day: "01-15",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-900/90 via-emerald-950/90 to-yellow-950/90",
      banner_bg: "linear-gradient(90deg, #1b3a20 0%, #5c3d08 50%, #1b3a20 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "40 92% 52%",
      icon: "🪁",
      badge_text: "Shubh Makar Sankranti",
      greeting_en: "Tilgul Ghya, God God Bola! Happy Makar Sankranti & Pongal!",
      greeting_hi: "मकर संक्रांति और पोंगल की हार्दिक शुभकामनाएं!",
      greeting_mr: "तिळगुळ घ्या, गोड गोड बोला! मकर संक्रांतीच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating India's auspicious harvest festival of abundance, sunshine, cattle care, and prosperity.",
      buffalo_section_note: "Auspicious harvest season selection of high-milk-yielding Murrah & Jaffarabadi buffaloes.",
      about_section_note: "Rooted in India's agricultural and dairy farming traditions for over 25 years.",
      footer_Line: "Shubh Makar Sankranti & Happy Harvest Season from AK Buffaloes",
      decoration_style: "harvest_nature",
      show_in_popup: true,
    },
  },
  {
    id: "occ-netaji-jayanti",
    name: "Netaji Subhas Chandra Bose Jayanti (Parakram Diwas)",
    slug: "netaji-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 74,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "01-23",
    recurring_end_month_day: "01-23",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#EA580C",
      secondary_color: "#14532D",
      accent_color: "#F8FAFC",
      bg_gradient: "from-orange-950/90 via-slate-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #2d1606 0%, #112e1c 100%)",
      banner_text_color: "#FED7AA",
      primary_hsl: "28 85% 52%",
      icon: "🫡",
      badge_text: "Parakram Diwas",
      greeting_en: "Saluting Netaji Subhas Chandra Bose on Parakram Diwas",
      greeting_hi: "पराक्रम दिवस पर नेताजी सुभाष चंद्र बोस को कोटि-कोटि नमन",
      greeting_mr: "पराक्रम दिनानिमित्त नेताजी सुभाषचंद्र बोस यांना विनम्र अभिवादन!",
      subtitle: "Remembering the indomitable courage and patriotism of Netaji Subhas Chandra Bose.",
      buffalo_section_note: "Serving India's hardworking agricultural community with pride and integrity.",
      about_section_note: "Dedicated to national strength through agricultural and dairy prosperity.",
      footer_Line: "Jai Hind — Remembering Netaji Subhas Chandra Bose on Parakram Diwas",
      decoration_style: "tricolor_patriotic",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-republic-day",
    name: "Republic Day of India",
    slug: "republic-day",
    category: "national_day",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 98,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "01-26",
    recurring_end_month_day: "01-26",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#FF9933",
      secondary_color: "#138808",
      accent_color: "#FFFFFF",
      bg_gradient: "from-orange-950/90 via-slate-900/90 to-emerald-950/95",
      banner_bg: "linear-gradient(90deg, #7c2d12 0%, #1e293b 50%, #14532d 100%)",
      banner_text_color: "#FFFFFF",
      primary_hsl: "30 95% 55%",
      icon: "🇮🇳",
      badge_text: "Happy Republic Day • 26 January",
      greeting_en: "Warm Greetings on the Republic Day of India — Jai Hind, Jai Kisan!",
      greeting_hi: "गणतंत्र दिवस की हार्दिक शुभकामनाएं — जय हिंद, जय किसान!",
      greeting_mr: "भारतीय प्रजासत्ताक दिनाच्या हार्दिक शुभेच्छा — जय हिंद, जय बळीराजा!",
      subtitle: "Honoring the Constitution of India and the farmers who nourish our great nation every single day.",
      buffalo_section_note: "Proudly strengthening India's White Revolution with purebred indigenous buffalo breeds.",
      about_section_note: "Celebrating India's Republic and our 25+ years of service to Indian dairy farmers.",
      footer_Line: "Happy Republic Day — Proudly Serving Indian Dairy Farmers",
      decoration_style: "tricolor_patriotic",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },

  // ======================== FEBRUARY ========================
  {
    id: "occ-vasant-panchami",
    name: "Vasant Panchami / Saraswati Puja",
    slug: "vasant-panchami",
    category: "hindu_festival",
    holiday_status: "restricted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 75,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-01-23", end_date: "2026-01-23", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-02-11", end_date: "2027-02-11", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-01-31", end_date: "2028-01-31", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-02-18", end_date: "2029-02-18", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-02-07", end_date: "2030-02-07", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#EAB308",
      secondary_color: "#422006",
      accent_color: "#FEF08A",
      bg_gradient: "from-yellow-900/90 via-amber-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #422006 0%, #713f12 50%, #422006 100%)",
      banner_text_color: "#FEF9C3",
      primary_hsl: "48 95% 53%",
      icon: "🌼",
      badge_text: "Shubh Vasant Panchami",
      greeting_en: "Warm Wishes on Vasant Panchami — Welcome the Season of Spring & Wisdom!",
      greeting_hi: "बसंत पंचमी और सरस्वती पूजा की हार्दिक शुभकामनाएं!",
      greeting_mr: "वसंत पंचमीच्या हार्दिक शुभेच्छा!",
      subtitle: "Welcoming spring harvest breezes and auspicious beginnings on the farm.",
      buffalo_section_note: "Spring season livestock collection with verified health and lactation records.",
      about_section_note: "Blending traditional wisdom with scientific dairy management.",
      footer_Line: "Shubh Vasant Panchami from AK Buffaloes",
      decoration_style: "floral_marigold",
      show_in_popup: false,
    },
  },
  {
    id: "occ-maha-shivaratri",
    name: "Maha Shivaratri",
    slug: "maha-shivaratri",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 85,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-02-15", end_date: "2026-02-15", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-03-06", end_date: "2027-03-06", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-02-23", end_date: "2028-02-23", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-02-11", end_date: "2029-02-11", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-03-02", end_date: "2030-03-02", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#1E1B4B",
      accent_color: "#FDE68A",
      bg_gradient: "from-indigo-950/90 via-slate-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)",
      banner_text_color: "#FDE68A",
      primary_hsl: "42 88% 55%",
      icon: "🔱",
      badge_text: "Maha Shivaratri",
      greeting_en: "Har Har Mahadev! Auspicious Greetings on Maha Shivaratri",
      greeting_hi: "महाशिवरात्रि के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "महाशिवरात्रीच्या पवित्र पर्वाच्या हार्दिक शुभेच्छा!",
      subtitle: "May Lord Shiva bless every home and farm with peace, health, and pure abundance.",
      buffalo_section_note: "Pure, wholesome A2 buffalo milk and healthy livestock for auspicious occasions.",
      about_section_note: "Serving pure dairy traditions with devotion and honesty.",
      footer_Line: "Shubh Maha Shivaratri — AK Buffaloes Farm",
      decoration_style: "diya_lights",
      show_in_popup: true,
    },
  },
  {
    id: "occ-shivaji-maharaj-jayanti",
    name: "Chhatrapati Shivaji Maharaj Jayanti",
    slug: "shivaji-maharaj-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "regional_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 95,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "02-19",
    recurring_end_month_day: "02-19",
    confirmation_status: "confirmed",
    region: "Maharashtra & All India",
    theme: {
      primary_color: "#F97316",
      secondary_color: "#431407",
      accent_color: "#FDBA74",
      bg_gradient: "from-orange-950/95 via-amber-950/90 to-stone-950/95",
      banner_bg: "linear-gradient(90deg, #431407 0%, #9a3412 50%, #431407 100%)",
      banner_text_color: "#FFEDD5",
      primary_hsl: "25 95% 53%",
      icon: "🚩",
      badge_text: "Shiv Jayanti • 19 February",
      greeting_en: "Saluting Chhatrapati Shivaji Maharaj on Shiv Jayanti!",
      greeting_hi: "छत्रपति शिवाजी महाराज जयंती पर कोटि-कोटि नमन!",
      greeting_mr: "रयतेचे राजे छत्रपती शिवाजी महाराज यांना जयंतीनिमित्त मानाचा मुजरा!",
      subtitle: "Honoring the great protector of farmers (Ryat-Raja) and visionary leader of Swarajya.",
      buffalo_section_note: "Proudly based in Jalgaon, Maharashtra — serving the hardworking farmers of Chhatrapati's land.",
      about_section_note: "Inspired by Chhatrapati Shivaji Maharaj's deep respect and protection for farmers (Baliraja).",
      footer_Line: "छत्रपती शिवाजी महाराज जयंतीनिमित्त विनम्र अभिवादन — AK Buffaloes, Maharashtra",
      decoration_style: "royal_tribute",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },

  // ======================== MARCH ========================
  {
    id: "occ-holi",
    name: "Holi & Dhulandi — Festival of Colors",
    slug: "holi",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 90,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 2,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-03-03", end_date: "2026-03-04", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-03-22", end_date: "2027-03-22", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-03-11", end_date: "2028-03-11", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-02-28", end_date: "2029-03-01", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-03-19", end_date: "2030-03-20", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#EC4899",
      secondary_color: "#701A75",
      accent_color: "#FDE047",
      bg_gradient: "from-fuchsia-950/90 via-purple-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #701a75 0%, #be185d 50%, #0f5132 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "330 82% 58%",
      icon: "🎨",
      badge_text: "Happy Holi",
      greeting_en: "Wishing You and Your Family a Joyful & Colorful Holi!",
      greeting_hi: "होली और धुलेंडी के पावन पर्व की रंगभरी शुभकामनाएं!",
      greeting_mr: "होळी व धुलीवंदनाच्या रंगमय शुभेच्छा!",
      subtitle: "May the vibrant colors of Holi fill your home and dairy farm with happiness, sweet gujiyas, and prosperity.",
      buffalo_section_note: "Celebrate the festive season with pure buffalo milk, khoya, and high-yield dairy breeds.",
      about_section_note: "Sharing the joy of India's vibrant harvest and spring celebrations with our farming family.",
      footer_Line: "Happy Holi from AK Buffaloes Farm",
      decoration_style: "colors_holi",
      show_in_popup: true,
    },
  },
  {
    id: "occ-womens-day",
    name: "International Women's Day",
    slug: "international-womens-day",
    category: "international_day",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 68,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "03-08",
    recurring_end_month_day: "03-08",
    confirmation_status: "confirmed",
    region: "Global",
    theme: {
      primary_color: "#D946EF",
      secondary_color: "#2E1065",
      accent_color: "#F5D0FE",
      bg_gradient: "from-purple-950/90 via-fuchsia-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #3b0764 0%, #701a75 50%, #3b0764 100%)",
      banner_text_color: "#FAE8FF",
      primary_hsl: "292 80% 58%",
      icon: "🌸",
      badge_text: "International Women's Day",
      greeting_en: "Saluting the Women Backbone of India's Dairy & Rural Economy!",
      greeting_hi: "अंतर्राष्ट्रीय महिला दिवस पर देश की मातृशक्ति को नमन!",
      greeting_mr: "जागतिक महिला दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Over 70% of India's dairy care is led by rural women — we honor their dedication and leadership.",
      buffalo_section_note: "Supporting women-led dairy farms and self-help groups with docile, high-yielding buffaloes.",
      about_section_note: "Grateful to the women dairy farmers who drive India's milk revolution.",
      footer_Line: "Happy International Women's Day — Empowering Women in Dairy",
      decoration_style: "floral_marigold",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-gudi-padwa",
    name: "Gudi Padwa & Ugadi (Marathi & Hindu New Year)",
    slug: "gudi-padwa",
    category: "hindu_festival",
    holiday_status: "regional_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 92,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "Maharashtra & All India",
    yearly_schedule: {
      "2026": { start_date: "2026-03-19", end_date: "2026-03-19", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-04-07", end_date: "2027-04-07", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-03-27", end_date: "2028-03-27", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-03-16", end_date: "2029-03-16", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-04-04", end_date: "2030-04-04", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-emerald-950/90 to-orange-950/90",
      banner_bg: "linear-gradient(90deg, #14532d 0%, #92400e 50%, #14532d 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "38 92% 52%",
      icon: "🚩",
      badge_text: "गुढीपाडव्याच्या हार्दिक शुभेच्छा",
      greeting_en: "Happy Gudi Padwa & Ugadi — Auspicious New Year Greetings!",
      greeting_hi: "गुड़ी पड़वा और हिन्दू नववर्ष की हार्दिक शुभकामनाएं!",
      greeting_mr: "गुढीपाडवा आणि मराठी नववर्षाच्या मनःपूर्वक शुभेच्छा!",
      subtitle: "May the Gudi of victory, health, and dairy prosperity rise high at your farm and home.",
      buffalo_section_note: "Gudi Padwa is one of the most auspicious Muhurats to bring new dairy livestock to your farm.",
      about_section_note: "Celebrating Marathi New Year at our Pachora, Jalgaon farm with our farming community.",
      footer_Line: "गुढीपाडव्याच्या हार्दिक शुभेच्छा — AK Buffaloes, Jalgaon",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },
  {
    id: "occ-ramadan",
    name: "Ramadan Mubarak (Holy Month of Fasting)",
    slug: "ramadan-mubarak",
    category: "muslim_festival",
    holiday_status: "observance_only",
    recurrence_type: "lunar_islamic",
    enabled: false, // Enabled on demand or for opening days so 30-day span doesn't override every March day unless Admin enables it
    priority: 76,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 30,
    confirmation_status: "confirmed",
    moon_sighting_dependent: true,
    moon_offset_days: 0,
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-02-18", end_date: "2026-03-19", confirmation_status: "confirmed", note: "Subject to moon sighting in India" },
      "2027": { start_date: "2027-02-08", end_date: "2027-03-09", confirmation_status: "estimated", note: "Subject to moon sighting in India" },
      "2028": { start_date: "2028-01-28", end_date: "2028-02-26", confirmation_status: "estimated", note: "Subject to moon sighting in India" },
      "2029": { start_date: "2029-01-16", end_date: "2029-02-14", confirmation_status: "estimated", note: "Subject to moon sighting in India" },
      "2030": { start_date: "2030-01-06", end_date: "2030-02-04", confirmation_status: "needs_confirmation", note: "Moon sighting confirmation required" },
    },
    theme: {
      primary_color: "#10B981",
      secondary_color: "#064E3B",
      accent_color: "#FCD34D",
      bg_gradient: "from-emerald-950/95 via-teal-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #042f2e 0%, #065f46 50%, #042f2e 100%)",
      banner_text_color: "#FDE68A",
      primary_hsl: "43 88% 55%",
      icon: "🌙",
      badge_text: "Ramadan Kareem",
      greeting_en: "Ramadan Mubarak — Wishing You a Blessed Month of Peace, Prayer & Mercy!",
      greeting_hi: "माह-ए-रमज़ान मुबारक — दुआओं और बरकत का महीना!",
      greeting_mr: "पवित्र रमजान महिन्याच्या हार्दिक शुभेच्छा!",
      subtitle: "May this holy month bring peace, barakah, and good health to every family.",
      buffalo_section_note: "Pure, nutritious dairy and healthy livestock from AK Buffaloes Farm.",
      about_section_note: "Wishing peace, brotherhood, and blessings to all our patrons during the holy month.",
      footer_Line: "Ramadan Mubarak from AK Buffaloes Farm",
      decoration_style: "crescent_lantern",
      show_in_popup: true,
    },
  },
  {
    id: "occ-eid-ul-fitr",
    name: "Eid-ul-Fitr (Ramzan Eid)",
    slug: "eid-ul-fitr",
    category: "muslim_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_islamic",
    enabled: true,
    priority: 94,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 2,
    confirmation_status: "confirmed",
    moon_sighting_dependent: true,
    moon_offset_days: 0,
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-03-20", end_date: "2026-03-21", confirmation_status: "confirmed", note: "Subject to Shawwal moon sighting in India" },
      "2027": { start_date: "2027-03-10", end_date: "2027-03-11", confirmation_status: "estimated", note: "Subject to Shawwal moon sighting in India" },
      "2028": { start_date: "2028-02-27", end_date: "2028-02-28", confirmation_status: "estimated", note: "Subject to Shawwal moon sighting in India" },
      "2029": { start_date: "2029-02-15", end_date: "2029-02-16", confirmation_status: "estimated", note: "Subject to Shawwal moon sighting in India" },
      "2030": { start_date: "2030-02-05", end_date: "2030-02-06", confirmation_status: "needs_confirmation", note: "Moon sighting confirmation required" },
    },
    theme: {
      primary_color: "#D4AF37",
      secondary_color: "#064E3B",
      accent_color: "#6EE7B7",
      bg_gradient: "from-emerald-950/95 via-green-950/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #064e3b 0%, #047857 50%, #064e3b 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 88% 55%",
      icon: "🌙",
      badge_text: "Eid Mubarak",
      greeting_en: "Eid-ul-Fitr Mubarak to You and Your Family!",
      greeting_hi: "ईद-उल-फ़ित्र की दिली मुबारकबाद!",
      greeting_mr: "रमजान ईदच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrate the sweetness of Sheer Khurma and joyful togetherness with blessings from AK Buffaloes.",
      buffalo_section_note: "Festive greetings from Founder Akil Bhai & Salim Bhai — visit our farm in Pachora, Jalgaon.",
      about_section_note: "Warm Eid wishes from the entire AK Buffaloes family to farmers and patrons across India.",
      footer_Line: "Eid-ul-Fitr Mubarak — AK Buffaloes Farm, Maharashtra",
      decoration_style: "crescent_lantern",
      show_in_popup: true,
    },
  },
  {
    id: "occ-ram-navami",
    name: "Ram Navami",
    slug: "ram-navami",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 85,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-03-26", end_date: "2026-03-26", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-04-15", end_date: "2027-04-15", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-04-03", end_date: "2028-04-03", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-03-23", end_date: "2029-03-23", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-04-12", end_date: "2030-04-12", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F97316",
      secondary_color: "#431407",
      accent_color: "#FDE047",
      bg_gradient: "from-orange-950/90 via-amber-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #431407 0%, #9a3412 50%, #431407 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "32 95% 53%",
      icon: "🏹",
      badge_text: "Shubh Ram Navami",
      greeting_en: "Warm & Auspicious Greetings on Shri Ram Navami!",
      greeting_hi: "श्री राम नवमी के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "श्रीरामनवमीच्या मंगलमय शुभेच्छा!",
      subtitle: "May righteousness, peace, and prosperity bless every household and farm.",
      buffalo_section_note: "Ethical, transparent livestock trade built on 25+ years of farmer trust.",
      about_section_note: "Committed to truth, fairness, and service to India's agricultural families.",
      footer_Line: "Shubh Ram Navami from AK Buffaloes",
      decoration_style: "diya_lights",
      show_in_popup: true,
    },
  },
  {
    id: "occ-mahavir-jayanti",
    name: "Mahavir Jayanti",
    slug: "mahavir-jayanti",
    category: "other_religious",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_other",
    enabled: true,
    priority: 80,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-03-31", end_date: "2026-03-31", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-04-19", end_date: "2027-04-19", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-04-07", end_date: "2028-04-07", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-03-27", end_date: "2029-03-27", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-04-16", end_date: "2030-04-16", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#1E293B",
      accent_color: "#FEF9C3",
      bg_gradient: "from-amber-950/90 via-slate-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 90% 55%",
      icon: "🙏",
      badge_text: "Mahavir Jayanti",
      greeting_en: "Peaceful Greetings on Bhagwan Mahavir Jayanti — Ahimsa Paramo Dharma",
      greeting_hi: "भगवान महावीर जयंती की हार्दिक शुभकामनाएं!",
      greeting_mr: "भगवान महावीर जयंतीच्या मंगलमय शुभेच्छा!",
      subtitle: "Practicing compassion, gentle animal care, and non-violence toward all living beings.",
      buffalo_section_note: "Humane, compassionate, and stress-free care for every buffalo and calf at our farm.",
      about_section_note: "Ethical animal husbandry and compassionate veterinary care are at the heart of AK Buffaloes.",
      footer_Line: "Shubh Mahavir Jayanti — Compassionate Livestock Care",
      decoration_style: "peace_minimal",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },

  // ======================== APRIL ========================
  {
    id: "occ-good-friday",
    name: "Good Friday",
    slug: "good-friday",
    category: "other_religious",
    holiday_status: "gazetted_holiday",
    recurrence_type: "variable_annual",
    enabled: true,
    priority: 72,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-04-03", end_date: "2026-04-03", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-03-26", end_date: "2027-03-26", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-04-14", end_date: "2028-04-14", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-03-30", end_date: "2029-03-30", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-04-19", end_date: "2030-04-19", confirmation_status: "confirmed" },
    },
    theme: {
      primary_color: "#CBD5E1",
      secondary_color: "#0F172A",
      accent_color: "#E2E8F0",
      bg_gradient: "from-slate-950/95 via-slate-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      banner_text_color: "#F1F5F9",
      icon: "🕊️",
      badge_text: "Good Friday Observance",
      greeting_en: "Observing Good Friday with Reflection, Peace, and Compassion",
      greeting_hi: "गुड फ्राइडे — शांति, करुणा और सद्भाव का स्मरण",
      greeting_mr: "गुड फ्रायडे — शांतता आणि करुणेचा संदेश",
      subtitle: "May peace, kindness, and grace abide in every home.",
      buffalo_section_note: "Our farm remains open for scheduled consultations and livestock care.",
      about_section_note: "Guided by values of service, humility, and goodwill toward all.",
      footer_Line: "Observing Good Friday in Peace & Reflection",
      decoration_style: "peace_minimal",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-easter-sunday",
    name: "Easter Sunday",
    slug: "easter-sunday",
    category: "other_religious",
    holiday_status: "restricted_holiday",
    recurrence_type: "variable_annual",
    enabled: true,
    priority: 74,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-04-05", end_date: "2026-04-05", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-03-28", end_date: "2027-03-28", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-04-16", end_date: "2028-04-16", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-04-01", end_date: "2029-04-01", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-04-21", end_date: "2030-04-21", confirmation_status: "confirmed" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#065F46",
      accent_color: "#FEF08A",
      bg_gradient: "from-emerald-950/90 via-teal-950/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #064e3b 0%, #115e59 50%, #064e3b 100%)",
      banner_text_color: "#FEF08A",
      icon: "🌷",
      badge_text: "Happy Easter",
      greeting_en: "Wishing You a Blessed & Joyful Easter Sunday!",
      greeting_hi: "ईस्टर संडे की हार्दिक शुभकामनाएं!",
      greeting_mr: "ईस्टर संडेच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating renewal, hope, and joyful family gatherings.",
      buffalo_section_note: "Healthy, thriving dairy herds nurtured with care.",
      about_section_note: "Warm Easter wishes from AK Buffaloes to all our patrons.",
      footer_Line: "Happy Easter from AK Buffaloes Farm",
      decoration_style: "floral_marigold",
      show_in_popup: false,
    },
  },
  {
    id: "occ-jyotirao-phule-jayanti",
    name: "Mahatma Jyotirao Phule Jayanti",
    slug: "jyotirao-phule-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 82,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "04-11",
    recurring_end_month_day: "04-11",
    confirmation_status: "confirmed",
    region: "Maharashtra & All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#1E293B",
      accent_color: "#FDE68A",
      bg_gradient: "from-amber-950/90 via-stone-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #271709 0%, #45270d 50%, #271709 100%)",
      banner_text_color: "#FDE68A",
      icon: "🌾",
      badge_text: "Mahatma Phule Jayanti • 11 April",
      greeting_en: "Respectful Tributes to Mahatma Jyotirao Phule — Champion of Farmers & Equality",
      greeting_hi: "महात्मा ज्योतिराव फुले जयंती पर कोटि-कोटि नमन!",
      greeting_mr: "महात्मा जोतीराव फुले यांना जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Remembering the author of 'Shetkaryacha Asud' who dedicated his life to farmers' welfare and education.",
      buffalo_section_note: "Empowering Maharashtra's farmers with fair pricing and genuine livestock.",
      about_section_note: "Guided by Mahatma Phule's lifelong advocacy for agricultural families.",
      footer_Line: "Saluting Mahatma Jyotirao Phule — Friend of Farmers",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-baisakhi",
    name: "Baisakhi / Vaisakhi — Harvest Festival",
    slug: "baisakhi",
    category: "other_religious",
    holiday_status: "restricted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 80,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "04-13",
    recurring_end_month_day: "04-13",
    confirmation_status: "confirmed",
    region: "Punjab, Haryana & All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-900/90 via-yellow-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #451a03 0%, #78350f 50%, #14532d 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "42 95% 52%",
      icon: "🌾",
      badge_text: "Happy Baisakhi",
      greeting_en: "Lakh Lakh Vadhaiyan! Warm Greetings on Baisakhi Harvest Festival!",
      greeting_hi: "बैसाखी के पावन कृषि पर्व की लख-लख बधाइयां!",
      greeting_mr: "बैसाखी या कृषी उत्सवाच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating golden wheat harvests, Punjabi & Haryanvi dairy heritage, and our prized Murrah & Nili-Ravi breeds.",
      buffalo_section_note: "Explore authentic Haryana & Punjab lineage Murrah and Nili-Ravi buffaloes.",
      about_section_note: "Honoring the rich agricultural and dairy heritage of North & Western India.",
      footer_Line: "Happy Baisakhi — Celebrating India's Harvest & Dairy Farmers",
      decoration_style: "harvest_nature",
      show_in_popup: true,
    },
  },
  {
    id: "occ-ambedkar-jayanti",
    name: "Dr. B.R. Ambedkar Jayanti",
    slug: "ambedkar-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 95,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "04-14",
    recurring_end_month_day: "04-14",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#38BDF8",
      secondary_color: "#1E3A8A",
      accent_color: "#BAE6FD",
      bg_gradient: "from-blue-950/95 via-slate-900/90 to-indigo-950/95",
      banner_bg: "linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)",
      banner_text_color: "#E0F2FE",
      primary_hsl: "205 90% 55%",
      icon: "⚖️",
      badge_text: "Dr. B.R. Ambedkar Jayanti • 14 April",
      greeting_en: "Respectful Tributes to Bharat Ratna Dr. Babasaheb Ambedkar on His Birth Anniversary",
      greeting_hi: "भारत रत्न डॉ. बाबासाहेब आंबेडकर जयंती पर कोटि-कोटि नमन!",
      greeting_mr: "भारतरत्न डॉ. बाबासाहेब आंबेडकर यांना जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Honoring the chief architect of the Indian Constitution and champion of social justice, education, and dignity.",
      buffalo_section_note: "Equal opportunity, transparent pricing, and respectful service for every farmer across India.",
      about_section_note: "Standing by the constitutional values of equality, fraternity, and rural progress.",
      footer_Line: "Tributes to Bharat Ratna Dr. B.R. Ambedkar — Architect of the Constitution",
      decoration_style: "royal_tribute",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-akshaya-tritiya",
    name: "Akshaya Tritiya",
    slug: "akshaya-tritiya",
    category: "hindu_festival",
    holiday_status: "restricted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 84,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-04-19", end_date: "2026-04-19", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-05-09", end_date: "2027-05-09", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-04-27", end_date: "2028-04-27", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-04-16", end_date: "2029-04-16", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-05-05", end_date: "2030-05-05", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#451A03",
      accent_color: "#FEF08A",
      bg_gradient: "from-amber-950/90 via-yellow-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #451a03 0%, #854d0e 50%, #451a03 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 95% 55%",
      icon: "🪙",
      badge_text: "Shubh Akshaya Tritiya",
      greeting_en: "Wishing You Unending Prosperity & Good Fortune on Akshaya Tritiya!",
      greeting_hi: "अक्षय तृतीया के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "अक्षय्य तृतीयेच्या हार्दिक शुभेच्छा!",
      subtitle: "An auspicious day for new agricultural ventures, livestock investments, and lasting prosperity.",
      buffalo_section_note: "Invest in 'Black Gold' Murrah and Jaffarabadi dairy buffaloes on Akshaya Tritiya.",
      about_section_note: "Wishing ever-growing dairy income and healthy herds to all our farming partners.",
      footer_Line: "Shubh Akshaya Tritiya from AK Buffaloes",
      decoration_style: "diya_lights",
      show_in_popup: true,
    },
  },

  // ======================== MAY ========================
  {
    id: "occ-maharashtra-day",
    name: "Maharashtra Din (Maharashtra Statehood Day)",
    slug: "maharashtra-day",
    category: "regional_day",
    holiday_status: "regional_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 93,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "05-01",
    recurring_end_month_day: "05-01",
    confirmation_status: "confirmed",
    region: "Maharashtra",
    theme: {
      primary_color: "#F97316",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-orange-950/90 via-emerald-950/90 to-stone-950/95",
      banner_bg: "linear-gradient(90deg, #7c2d12 0%, #14532d 50%, #7c2d12 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "28 92% 54%",
      icon: "🚩",
      badge_text: "जय महाराष्ट्र • 1 May",
      greeting_en: "Happy Maharashtra Day & International Workers' Day! Jai Maharashtra!",
      greeting_hi: "महाराष्ट्र दिवस और श्रमिक दिवस की हार्दिक शुभकामनाएं!",
      greeting_mr: "महाराष्ट्र दिन आणि कामगार दिनाच्या हार्दिक शुभेच्छा! जय महाराष्ट्र!",
      subtitle: "Celebrating the rich agricultural spirit, Pandharpuri & Nagpuri breeds, and hardworking farmers of Maharashtra.",
      buffalo_section_note: "Explore pride-of-Maharashtra Pandharpuri and Nagpuri buffaloes alongside Murrah & Jaffarabadi.",
      about_section_note: "Proudly headquartered in Pachora, District Jalgaon, Maharashtra for over 25 years.",
      footer_Line: "महाराष्ट्र दिनाच्या हार्दिक शुभेच्छा — AK Buffaloes, Jalgaon, Maharashtra",
      decoration_style: "royal_tribute",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-buddha-purnima",
    name: "Buddha Purnima / Vesak",
    slug: "buddha-purnima",
    category: "other_religious",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_other",
    enabled: true,
    priority: 80,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-05-01", end_date: "2026-05-01", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-05-20", end_date: "2027-05-20", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-05-08", end_date: "2028-05-08", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-05-27", end_date: "2029-05-27", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-05-16", end_date: "2030-05-16", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#1E3A8A",
      accent_color: "#FEF08A",
      bg_gradient: "from-slate-900/90 via-indigo-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1e293b 0%, #1e3a8a 50%, #1e293b 100%)",
      banner_text_color: "#FEF9C3",
      icon: "🪷",
      badge_text: "Buddha Purnima",
      greeting_en: "Peaceful Greetings on Buddha Purnima — May Wisdom & Compassion Prevail",
      greeting_hi: "बुद्ध पूर्णिमा के पावन अवसर पर शांति और करुणा की शुभकामनाएं!",
      greeting_mr: "बुद्ध पौर्णिमेच्या शांततामय व मंगलमय शुभेच्छा!",
      subtitle: "Honoring Lord Buddha's timeless message of peace, mindfulness, and kindness to all creatures.",
      buffalo_section_note: "Peaceful, well-cared-for dairy herds raised in a calm, hygienic environment.",
      about_section_note: "Guided by honesty, ethical conduct, and compassion.",
      footer_Line: "Happy Buddha Purnima — Peace & Compassion",
      decoration_style: "peace_minimal",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-eid-ul-adha",
    name: "Eid-ul-Adha (Bakrid)",
    slug: "eid-ul-adha",
    category: "muslim_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_islamic",
    enabled: true,
    priority: 92,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 2,
    confirmation_status: "confirmed",
    moon_sighting_dependent: true,
    moon_offset_days: 0,
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-05-27", end_date: "2026-05-28", confirmation_status: "confirmed", note: "Subject to Dhul Hijjah moon sighting in India" },
      "2027": { start_date: "2027-05-17", end_date: "2027-05-18", confirmation_status: "estimated", note: "Subject to Dhul Hijjah moon sighting in India" },
      "2028": { start_date: "2028-05-05", end_date: "2028-05-06", confirmation_status: "estimated", note: "Subject to Dhul Hijjah moon sighting in India" },
      "2029": { start_date: "2029-04-24", end_date: "2029-04-25", confirmation_status: "estimated", note: "Subject to Dhul Hijjah moon sighting in India" },
      "2030": { start_date: "2030-04-14", end_date: "2030-04-15", confirmation_status: "needs_confirmation", note: "Moon sighting confirmation required" },
    },
    theme: {
      primary_color: "#D4AF37",
      secondary_color: "#064E3B",
      accent_color: "#A7F3D0",
      bg_gradient: "from-emerald-950/95 via-teal-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #064e3b 0%, #065f46 50%, #064e3b 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "44 88% 55%",
      icon: "🌙",
      badge_text: "Eid-ul-Adha Mubarak",
      greeting_en: "Eid-ul-Adha Mubarak! Wishing You Peace, Faith, and Blessings!",
      greeting_hi: "ईद-उल-अज़हा की हार्दिक मुबारकबाद!",
      greeting_mr: "बकरी ईदच्या हार्दिक शुभेच्छा!",
      subtitle: "May the spirit of devotion, generosity, and community harmony bless your home.",
      buffalo_section_note: "Warm festive wishes from Akil Bhai, Salim Bhai & the AK Buffaloes Farm team.",
      about_section_note: "Serving patrons across India with sincerity, trust, and brotherhood.",
      footer_Line: "Eid-ul-Adha Mubarak from AK Buffaloes Farm",
      decoration_style: "crescent_lantern",
      show_in_popup: true,
    },
  },

  // ======================== JUNE ========================
  {
    id: "occ-world-milk-day",
    name: "World Milk Day (Global Dairy Celebration)",
    slug: "world-milk-day",
    category: "international_day",
    holiday_status: "celebration",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 88,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "06-01",
    recurring_end_month_day: "06-01",
    confirmation_status: "confirmed",
    region: "Global & All India",
    theme: {
      primary_color: "#38BDF8",
      secondary_color: "#0F291E",
      accent_color: "#FDE047",
      bg_gradient: "from-sky-950/90 via-emerald-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #0c4a6e 0%, #065f46 50%, #0c4a6e 100%)",
      banner_text_color: "#F0F9FF",
      primary_hsl: "43 90% 55%",
      icon: "🥛",
      badge_text: "World Milk Day • 1 June",
      greeting_en: "Happy World Milk Day! Celebrating Pure Buffalo Milk & Dairy Farmers!",
      greeting_hi: "विश्व दुग्ध दिवस की हार्दिक शुभकामनाएं — शुद्ध दूध, स्वस्थ भारत!",
      greeting_mr: "जागतिक दुग्ध दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Honoring the nutritional power of high-fat, calcium-rich Indian buffalo milk and the farmers who produce it.",
      buffalo_section_note: "Discover Murrah, Jaffarabadi & Bhadawari breeds delivering 7%–12.5% rich butterfat milk.",
      about_section_note: "25+ years of championing pure, high-yield dairy farming at AK Buffaloes.",
      footer_Line: "World Milk Day — Celebrating India's Dairy Excellence",
      decoration_style: "harvest_nature",
      show_in_popup: true,
    },
  },
  {
    id: "occ-muharram",
    name: "Islamic New Year & Youm-e-Ashura (Muharram)",
    slug: "muharram",
    category: "muslim_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_islamic",
    enabled: true,
    priority: 76,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    moon_sighting_dependent: true,
    moon_offset_days: 0,
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-06-26", end_date: "2026-06-26", confirmation_status: "confirmed", note: "Youm-e-Ashura (10th Muharram)" },
      "2027": { start_date: "2027-06-15", end_date: "2027-06-15", confirmation_status: "estimated", note: "Subject to Muharram moon sighting" },
      "2028": { start_date: "2028-06-03", end_date: "2028-06-03", confirmation_status: "estimated", note: "Subject to Muharram moon sighting" },
      "2029": { start_date: "2029-05-23", end_date: "2029-05-23", confirmation_status: "estimated", note: "Subject to Muharram moon sighting" },
      "2030": { start_date: "2030-05-13", end_date: "2030-05-13", confirmation_status: "needs_confirmation", note: "Moon sighting confirmation required" },
    },
    theme: {
      primary_color: "#94A3B8",
      secondary_color: "#0F172A",
      accent_color: "#E2E8F0",
      bg_gradient: "from-slate-950/95 via-emerald-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
      banner_text_color: "#F8FAFC",
      icon: "🕊️",
      badge_text: "Youm-e-Ashura Observance",
      greeting_en: "Solemn Remembrance of Patience, Truth, and Sacrifice on Youm-e-Ashura",
      greeting_hi: "यौम-ए-आशूरा — सत्य, धैर्य और बलिदान का स्मरण",
      greeting_mr: "मोहरम — सत्य, संयम आणि त्यागाचे स्मरण",
      subtitle: "Standing for truth, justice, and compassion.",
      buffalo_section_note: "Farm operations and customer assistance remain available as scheduled.",
      about_section_note: "Guided by integrity, patience, and ethical service.",
      footer_Line: "Observing Youm-e-Ashura with Respect",
      decoration_style: "peace_minimal",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-international-yoga-day",
    name: "International Day of Yoga",
    slug: "international-yoga-day",
    category: "international_day",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 65,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "06-21",
    recurring_end_month_day: "06-21",
    confirmation_status: "confirmed",
    region: "All India & Global",
    theme: {
      primary_color: "#22C55E",
      secondary_color: "#064E3B",
      accent_color: "#BBF7D0",
      bg_gradient: "from-emerald-950/90 via-teal-950/90 to-green-950/90",
      banner_bg: "linear-gradient(90deg, #052e16 0%, #14532d 50%, #052e16 100%)",
      banner_text_color: "#DCFCE7",
      icon: "🧘",
      badge_text: "International Day of Yoga • 21 June",
      greeting_en: "Happy International Day of Yoga — Holistic Health Through Yoga & Pure Dairy!",
      greeting_hi: "अंतर्राष्ट्रीय योग दिवस की हार्दिक शुभकामनाएं — करें योग, रहें निरोग!",
      greeting_mr: "आंतरराष्ट्रीय योग दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Combining daily wellness with pure farm-fresh buffalo milk for lifelong strength.",
      buffalo_section_note: "Healthy animals raised in natural paddocks for wholesome, nutrient-dense milk.",
      about_section_note: "Promoting natural health and sustainable farming.",
      footer_Line: "International Day of Yoga — Wellness & Pure Nutrition",
      decoration_style: "harvest_nature",
      show_in_popup: false,
    },
  },

  // ======================== AUGUST ========================
  {
    id: "occ-independence-day",
    name: "Independence Day of India",
    slug: "independence-day",
    category: "national_day",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 99,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "08-15",
    recurring_end_month_day: "08-15",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#FF9933",
      secondary_color: "#138808",
      accent_color: "#FFFFFF",
      bg_gradient: "from-orange-950/90 via-slate-900/90 to-emerald-950/95",
      banner_bg: "linear-gradient(90deg, #7c2d12 0%, #1e293b 50%, #14532d 100%)",
      banner_text_color: "#FFFFFF",
      primary_hsl: "30 95% 55%",
      icon: "🇮🇳",
      badge_text: "Happy Independence Day • 15 August",
      greeting_en: "Saluting Our Freedom Fighters & Farmers on Independence Day — Jai Hind!",
      greeting_hi: "स्वतंत्रता दिवस की हार्दिक शुभकामनाएं — जय हिंद, जय जवान, जय किसान!",
      greeting_mr: "भारतीय स्वातंत्र्यदिनाच्या हार्दिक शुभेच्छा — जय हिंद, जय भारत!",
      subtitle: "Celebrating India's freedom and self-reliance powered by millions of dedicated dairy and agricultural families.",
      buffalo_section_note: "Strengthening Atmanirbhar Bharat with India's finest indigenous buffalo breeds.",
      about_section_note: "Proudly serving independent India's dairy sector from Maharashtra to every state.",
      footer_Line: "Happy Independence Day — Jai Hind, Jai Kisan!",
      decoration_style: "tricolor_patriotic",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-milad-un-nabi",
    name: "Eid Milad-un-Nabi",
    slug: "eid-milad-un-nabi",
    category: "muslim_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_islamic",
    enabled: true,
    priority: 85,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    moon_sighting_dependent: true,
    moon_offset_days: 0,
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-08-26", end_date: "2026-08-26", confirmation_status: "confirmed", note: "Subject to Rabi-ul-Awwal moon sighting" },
      "2027": { start_date: "2027-08-15", end_date: "2027-08-15", confirmation_status: "estimated", note: "Subject to Rabi-ul-Awwal moon sighting" },
      "2028": { start_date: "2028-08-03", end_date: "2028-08-03", confirmation_status: "estimated", note: "Subject to Rabi-ul-Awwal moon sighting" },
      "2029": { start_date: "2029-07-24", end_date: "2029-07-24", confirmation_status: "estimated", note: "Subject to Rabi-ul-Awwal moon sighting" },
      "2030": { start_date: "2030-07-13", end_date: "2030-07-13", confirmation_status: "needs_confirmation", note: "Moon sighting confirmation required" },
    },
    theme: {
      primary_color: "#10B981",
      secondary_color: "#064E3B",
      accent_color: "#FDE68A",
      bg_gradient: "from-emerald-950/95 via-green-950/90 to-teal-950/95",
      banner_bg: "linear-gradient(90deg, #064e3b 0%, #047857 50%, #064e3b 100%)",
      banner_text_color: "#FEF08A",
      icon: "🕌",
      badge_text: "Eid Milad-un-Nabi Mubarak",
      greeting_en: "Warm Greetings of Peace, Mercy & Compassion on Eid Milad-un-Nabi!",
      greeting_hi: "ईद मिलाद-उन-नबी की तहे दिल से मुबारकबाद!",
      greeting_mr: "ईद-ए-मिलादच्या हार्दिक शुभेच्छा!",
      subtitle: "May the message of kindness, honesty in trade, and mercy to animals guide us always.",
      buffalo_section_note: "Ethical trade, honest livestock evaluation, and compassionate animal care.",
      about_section_note: "Wishing peace and blessings to all families on this blessed day.",
      footer_Line: "Eid Milad-un-Nabi Mubarak — AK Buffaloes Farm",
      decoration_style: "crescent_lantern",
      show_in_popup: false,
    },
  },
  {
    id: "occ-raksha-bandhan",
    name: "Raksha Bandhan",
    slug: "raksha-bandhan",
    category: "hindu_festival",
    holiday_status: "restricted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 84,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-08-28", end_date: "2026-08-28", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-08-17", end_date: "2027-08-17", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-08-05", end_date: "2028-08-05", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-08-23", end_date: "2029-08-23", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-08-13", end_date: "2030-08-13", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#7C2D12",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-rose-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #451a03 0%, #881337 50%, #451a03 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "38 90% 55%",
      icon: "🧵",
      badge_text: "Happy Raksha Bandhan",
      greeting_en: "Celebrating the Sacred Bond of Trust & Protection on Raksha Bandhan!",
      greeting_hi: "रक्षाबंधन के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "रक्षाबंधनाच्या आणि नारळी पौर्णिमेच्या हार्दिक शुभेच्छा!",
      subtitle: "May the bond of love, family, and pure festive sweets bring joy to every home.",
      buffalo_section_note: "High-butterfat buffalo milk makes every festive sweet richer and purer.",
      about_section_note: "Bound by a 25-year promise of trust and protection for our farming community.",
      footer_Line: "Happy Raksha Bandhan from AK Buffaloes",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },

  // ======================== SEPTEMBER ========================
  {
    id: "occ-janmashtami",
    name: "Shri Krishna Janmashtami & Dahi Handi",
    slug: "krishna-janmashtami",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 91,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-09-04", end_date: "2026-09-04", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-08-25", end_date: "2027-08-25", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-08-13", end_date: "2028-08-13", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-09-01", end_date: "2029-09-01", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-08-21", end_date: "2030-08-21", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#1E3A8A",
      accent_color: "#FEF08A",
      bg_gradient: "from-indigo-950/95 via-blue-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #172554 0%, #1e40af 50%, #172554 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 93% 55%",
      icon: "🪈",
      badge_text: "Shubh Janmashtami",
      greeting_en: "Happy Krishna Janmashtami & Gopalkala — Celebrating India's Sacred Dairy Heritage!",
      greeting_hi: "श्री कृष्ण जन्माष्टमी और दही हांडी की हार्दिक शुभकामनाएं!",
      greeting_mr: "श्रीकृष्ण जन्माष्टमी व गोपाळकाल्याच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating Gopal-Krishna's love for dairy, makhan-mishri, and sacred cattle care.",
      buffalo_section_note: "Produce rich, creamy makhan, curd, and ghee with our high-fat Jaffarabadi, Bhadawari & Murrah breeds.",
      about_section_note: "Honoring India's timeless dairy culture and pastoral devotion.",
      footer_Line: "Shubh Krishna Janmashtami from AK Buffaloes Farm",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },
  {
    id: "occ-teachers-day",
    name: "Teachers' Day (Dr. Sarvepalli Radhakrishnan Jayanti)",
    slug: "teachers-day",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 70,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "09-05",
    recurring_end_month_day: "09-05",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#1E293B",
      accent_color: "#FDE68A",
      bg_gradient: "from-slate-900/90 via-amber-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1e293b 0%, #451a03 50%, #1e293b 100%)",
      banner_text_color: "#FEF08A",
      icon: "📖",
      badge_text: "Happy Teachers' Day • 5 September",
      greeting_en: "Tributes to Dr. Sarvepalli Radhakrishnan & Every Mentor on Teachers' Day!",
      greeting_hi: "शिक्षक दिवस पर डॉ. सर्वपल्ली राधाकृष्णन को नमन एवं सभी गुरुजनों को प्रणाम!",
      greeting_mr: "शिक्षक दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Sharing 25+ years of practical dairy farming knowledge and mentorship with farmers across India.",
      buffalo_section_note: "Book a free dairy mentorship & breed selection consultation with our experienced team.",
      about_section_note: "Learning and teaching scientific animal husbandry every single day.",
      footer_Line: "Happy Teachers' Day — Sharing Knowledge with Dairy Farmers",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-bail-pola",
    name: "Bail Pola / Bendur (Maharashtra Cattle Thanksgiving Festival)",
    slug: "bail-pola",
    category: "hindu_festival",
    holiday_status: "regional_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 94,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "Maharashtra & Central India",
    yearly_schedule: {
      "2026": { start_date: "2026-09-10", end_date: "2026-09-10", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-08-31", end_date: "2027-08-31", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-08-19", end_date: "2028-08-19", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-09-07", end_date: "2029-09-07", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-08-27", end_date: "2030-08-27", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-emerald-950/90 to-yellow-950/90",
      banner_bg: "linear-gradient(90deg, #14532d 0%, #854d0e 50%, #14532d 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "40 94% 53%",
      icon: "🐃",
      badge_text: "बैल पोळा व बेंदूर सणाच्या शुभेच्छा",
      greeting_en: "Happy Pola & Bendur! Expressing Gratitude to Our Sacred Cattle & Livestock!",
      greeting_hi: "पोला पर्व की हार्दिक शुभकामनाएं — पशुधन ही किसान की असली संपत्ति है!",
      greeting_mr: "बैल पोळा व बेंदूर सणाच्या सर्व शेतकरी बांधवांना हार्दिक शुभेच्छा!",
      subtitle: "Celebrating Maharashtra's beloved festival of gratitude toward the cattle and buffaloes that sustain every farm.",
      buffalo_section_note: "Every buffalo at AK Buffaloes is treated like family — healthy, groomed, and veterinary-certified.",
      about_section_note: "Pola reminds us of the sacred bond between Maharashtra's farmers and their livestock.",
      footer_Line: "बैल पोळा सणाच्या हार्दिक शुभेच्छा — AK Buffaloes, Jalgaon",
      decoration_style: "harvest_nature",
      show_in_popup: true,
    },
  },
  {
    id: "occ-ganesh-chaturthi",
    name: "Ganesh Chaturthi / Ganeshotsav",
    slug: "ganesh-chaturthi",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 95,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 10,
    confirmation_status: "confirmed",
    region: "Maharashtra & All India",
    yearly_schedule: {
      "2026": { start_date: "2026-09-14", end_date: "2026-09-25", confirmation_status: "confirmed", note: "Ganesh Chaturthi to Anant Chaturdashi" },
      "2027": { start_date: "2027-09-04", end_date: "2027-09-14", confirmation_status: "confirmed", note: "Ganesh Chaturthi to Anant Chaturdashi" },
      "2028": { start_date: "2028-08-23", end_date: "2028-09-02", confirmation_status: "confirmed", note: "Ganesh Chaturthi to Anant Chaturdashi" },
      "2029": { start_date: "2029-09-11", end_date: "2029-09-21", confirmation_status: "confirmed", note: "Ganesh Chaturthi to Anant Chaturdashi" },
      "2030": { start_date: "2030-09-01", end_date: "2030-09-11", confirmation_status: "estimated", note: "Ganesh Chaturthi to Anant Chaturdashi" },
    },
    theme: {
      primary_color: "#F97316",
      secondary_color: "#7C2D12",
      accent_color: "#FDE047",
      bg_gradient: "from-orange-950/90 via-red-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #431407 0%, #9a3412 50%, #431407 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "30 95% 54%",
      icon: "🌺",
      badge_text: "गणपती बाप्पा मोरया!",
      greeting_en: "Ganpati Bappa Morya! Auspicious Greetings on Shri Ganeshotsav!",
      greeting_hi: "श्री गणेश चतुर्थी और गणेशोत्सव की हार्दिक शुभकामनाएं!",
      greeting_mr: "श्री गणेश चतुर्थी आणि गणेशोत्सवाच्या हार्दिक शुभेच्छा! गणपती बाप्पा मोरया!",
      subtitle: "May Vighnaharta Lord Ganesha bless your family, farm, and dairy business with wisdom and auspicious beginnings.",
      buffalo_section_note: "Begin your new dairy venture during auspicious Ganeshotsav with verified high-yield buffaloes.",
      about_section_note: "Celebrating Maharashtra's grand festival of joy, devotion, and community spirit.",
      footer_Line: "गणपती बाप्पा मोरया! मंगलमूर्ती मोरया! — AK Buffaloes",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },

  // ======================== OCTOBER ========================
  {
    id: "occ-gandhi-jayanti",
    name: "Mahatma Gandhi Jayanti & Lal Bahadur Shastri Jayanti",
    slug: "gandhi-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 97,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "10-02",
    recurring_end_month_day: "10-02",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#14532D",
      accent_color: "#F8FAFC",
      bg_gradient: "from-stone-900/95 via-emerald-950/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #431407 0%, #1e293b 50%, #14532d 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "36 85% 52%",
      icon: "🕊️",
      badge_text: "Gandhi & Shastri Jayanti • 2 October",
      greeting_en: "Tributes to Mahatma Gandhi & Lal Bahadur Shastri — 'The Soul of India Lives in Its Villages'",
      greeting_hi: "महात्मा गांधी जयंती एवं लाल बहादुर शास्त्री जयंती पर शत्-शत् नमन — जय जवान, जय किसान!",
      greeting_mr: "महात्मा गांधी व लाल बहादूर शास्त्री जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Honoring truth, non-violence, Gram Swaraj, and the timeless call of 'Jai Jawan, Jai Kisan'.",
      buffalo_section_note: "Strengthening village self-reliance (Gram Swaraj) with sustainable dairy livelihoods.",
      about_section_note: "Committed to rural prosperity, honest trade, and farmer dignity.",
      footer_Line: "2 October — Remembering Mahatma Gandhi & Lal Bahadur Shastri",
      decoration_style: "tricolor_patriotic",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-world-animal-day",
    name: "World Animal Welfare Day",
    slug: "world-animal-day",
    category: "international_day",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 72,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "10-04",
    recurring_end_month_day: "10-04",
    confirmation_status: "confirmed",
    region: "Global",
    theme: {
      primary_color: "#10B981",
      secondary_color: "#064E3B",
      accent_color: "#A7F3D0",
      bg_gradient: "from-emerald-950/90 via-green-950/90 to-teal-950/90",
      banner_bg: "linear-gradient(90deg, #052e16 0%, #065f46 50%, #052e16 100%)",
      banner_text_color: "#D1FAE5",
      icon: "🐃",
      badge_text: "World Animal Day • 4 October",
      greeting_en: "Celebrating World Animal Day — Humane Care & Veterinary Excellence!",
      greeting_hi: "विश्व पशु कल्याण दिवस — स्वस्थ पशुधन, समृद्ध किसान!",
      greeting_mr: "जागतिक पशू कल्याण दिन — पशूंची काळजी, आपली जबाबदारी!",
      subtitle: "Every animal at AK Buffaloes receives nutritious green fodder, clean water, shade, and regular veterinary care.",
      buffalo_section_note: "100% health-screened, vaccinated, and gently handled dairy buffaloes.",
      about_section_note: "Animal welfare is the foundation of high milk yield and ethical farming.",
      footer_Line: "World Animal Day — Ethical & Compassionate Livestock Care",
      decoration_style: "harvest_nature",
      show_in_popup: false,
    },
  },
  {
    id: "occ-sharad-navratri",
    name: "Sharad Navratri — Nine Nights of Devotion",
    slug: "sharad-navratri",
    category: "hindu_festival",
    holiday_status: "celebration",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 88,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 9,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-10-11", end_date: "2026-10-19", confirmation_status: "confirmed", note: "Ghatasthapana to Maha Navami" },
      "2027": { start_date: "2027-09-30", end_date: "2027-10-08", confirmation_status: "confirmed", note: "Ghatasthapana to Maha Navami" },
      "2028": { start_date: "2028-09-19", end_date: "2028-09-27", confirmation_status: "confirmed", note: "Ghatasthapana to Maha Navami" },
      "2029": { start_date: "2029-10-08", end_date: "2029-10-16", confirmation_status: "confirmed", note: "Ghatasthapana to Maha Navami" },
      "2030": { start_date: "2030-09-28", end_date: "2030-10-05", confirmation_status: "estimated", note: "Ghatasthapana to Maha Navami" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#7C2D12",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-red-950/85 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #450a0a 0%, #9a3412 50%, #450a0a 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "36 92% 54%",
      icon: "🪔",
      badge_text: "Shubh Sharad Navratri",
      greeting_en: "Shubh Navratri! May These Nine Auspicious Days Bring Strength & Prosperity!",
      greeting_hi: "शारदीय नवरात्रि के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "शारदीय नवरात्रोत्सवाच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating the auspicious festive season with pure dairy nutrition and certified high-yield buffaloes.",
      buffalo_section_note: "Navratri Special: Explore 10 authentic buffalo breeds ready for auspicious farm induction.",
      about_section_note: "Celebrating India's vibrant festive traditions alongside our farming community.",
      footer_Line: "Shubh Sharad Navratri from AK Buffaloes Farm",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },
  {
    id: "occ-kalam-jayanti",
    name: "Dr. A.P.J. Abdul Kalam Jayanti (World Students' Day)",
    slug: "apj-abdul-kalam-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 80,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "10-15",
    recurring_end_month_day: "10-15",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#38BDF8",
      secondary_color: "#0F172A",
      accent_color: "#FDE047",
      bg_gradient: "from-slate-950/95 via-blue-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)",
      banner_text_color: "#E0F2FE",
      icon: "🚀",
      badge_text: "Dr. A.P.J. Abdul Kalam Jayanti • 15 October",
      greeting_en: "Remembering Bharat Ratna Dr. A.P.J. Abdul Kalam — The People's President",
      greeting_hi: "भारत रत्न डॉ. ए.पी.जे. अब्दुल कलाम जयंती पर सादर नमन!",
      greeting_mr: "भारतरत्न डॉ. ए.पी.जे. अब्दुल कलाम यांना जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Advancing rural India through science, innovation, and modern dairy management.",
      buffalo_section_note: "Scientific nutrition, digital records, and verified genetics for modern dairy farms.",
      about_section_note: "Inspired by Dr. Kalam's vision of PURA (Providing Urban Amenities in Rural Areas).",
      footer_Line: "Tributes to Dr. A.P.J. Abdul Kalam on World Students' Day",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-dussehra",
    name: "Vijayadashami / Dussehra",
    slug: "dussehra",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 95,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-10-20", end_date: "2026-10-20", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-10-09", end_date: "2027-10-09", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-09-27", end_date: "2028-09-27", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-10-17", end_date: "2029-10-17", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-10-06", end_date: "2030-10-06", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#451A03",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/95 via-orange-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #451a03 0%, #92400e 50%, #451a03 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "42 95% 54%",
      icon: "🌼",
      badge_text: "विजयादशमीच्या हार्दिक शुभेच्छा",
      greeting_en: "Happy Dussehra & Vijayadashami! Share the Apta Gold of Prosperity!",
      greeting_hi: "विजयादशमी (दशहरा) के पावन पर्व की हार्दिक शुभकामनाएं!",
      greeting_mr: "दसरा आणि विजयादशमीच्या हार्दिक शुभेच्छा! सोनं घ्या, सोन्यासारखं राहा!",
      subtitle: "One of the three most auspicious Sade-Teen Muhurats of the year for new livestock and farm expansions.",
      buffalo_section_note: "Dussehra Muhurat Selection: Bring home champion Murrah, Jaffarabadi & Pandharpuri buffaloes.",
      about_section_note: "Celebrating the triumph of truth, hard work, and agricultural prosperity.",
      footer_Line: "Happy Vijayadashami / Dussehra from AK Buffaloes",
      decoration_style: "floral_marigold",
      show_in_popup: true,
    },
  },
  {
    id: "occ-sardar-patel-jayanti",
    name: "Sardar Vallabhbhai Patel Jayanti (Rashtriya Ekta Diwas)",
    slug: "sardar-patel-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 82,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "10-31",
    recurring_end_month_day: "10-31",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F97316",
      secondary_color: "#1E293B",
      accent_color: "#FDE68A",
      bg_gradient: "from-stone-950/95 via-amber-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1c1917 0%, #7c2d12 50%, #14532d 100%)",
      banner_text_color: "#FFEDD5",
      icon: "🇮🇳",
      badge_text: "Rashtriya Ekta Diwas • 31 October",
      greeting_en: "Saluting Iron Man Sardar Vallabhbhai Patel — Inspiration Behind India's Dairy Cooperatives!",
      greeting_hi: "लौह पुरुष सरदार वल्लभभाई पटेल जयंती (राष्ट्रीय एकता दिवस) पर कोटि-कोटि नमन!",
      greeting_mr: "लोहपुरुष सरदार वल्लभभाई पटेल यांना जयंतीनिमित्त विनम्र अभिवादन!",
      subtitle: "Honoring the great unifier of India and champion of Bardoli's farmers and dairy cooperative movement.",
      buffalo_section_note: "Uniting breeders and dairy farmers across India with Gujarat & Haryana's finest buffalo breeds.",
      about_section_note: "Inspired by Sardar Patel's vision of farmer unity and dairy self-reliance.",
      footer_Line: "Rashtriya Ekta Diwas — Saluting Sardar Vallabhbhai Patel",
      decoration_style: "tricolor_patriotic",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },

  // ======================== NOVEMBER ========================
  {
    id: "occ-diwali",
    name: "Diwali / Deepawali — Festival of Lights",
    slug: "diwali",
    category: "hindu_festival",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 98,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 5,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-11-06", end_date: "2026-11-10", confirmation_status: "confirmed", note: "Dhanteras, Naraka Chaturdashi, Lakshmi Puja (Nov 8), Govardhan Puja & Bhai Dooj" },
      "2027": { start_date: "2027-10-27", end_date: "2027-10-31", confirmation_status: "confirmed", note: "5-day Deepawali Panchaparva (Main Diwali Oct 29)" },
      "2028": { start_date: "2028-10-15", end_date: "2028-10-19", confirmation_status: "confirmed", note: "5-day Deepawali Panchaparva (Main Diwali Oct 17)" },
      "2029": { start_date: "2029-11-03", end_date: "2029-11-07", confirmation_status: "confirmed", note: "5-day Deepawali Panchaparva (Main Diwali Nov 5)" },
      "2030": { start_date: "2030-10-24", end_date: "2030-10-28", confirmation_status: "estimated", note: "5-day Deepawali Panchaparva (Main Diwali Oct 26)" },
    },
    theme: {
      primary_color: "#FBBF24",
      secondary_color: "#451A03",
      accent_color: "#FEF08A",
      bg_gradient: "from-amber-950/95 via-yellow-950/90 to-red-950/95",
      banner_bg: "linear-gradient(90deg, #3b0a0a 0%, #78350f 50%, #3b0a0a 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "45 96% 56%",
      icon: "🪔",
      badge_text: "शुभ दीपावली • Happy Diwali",
      greeting_en: "Shubh Deepawali! Wishing You Radiant Light, Wealth, and Dairy Prosperity!",
      greeting_hi: "धनतेरस, रूप चौदस, दीपावली, गोवर्धन पूजा और भाई दूज की हार्दिक शुभकामनाएं!",
      greeting_mr: "दिवाळीच्या आणि बलिप्रतिपदा पाडव्याच्या मनःपूर्वक शुभेच्छा!",
      subtitle: "May Goddess Lakshmi and Govardhan Giridhari bless your home and cattle shed with overflowing milk and prosperity.",
      buffalo_section_note: "Diwali Padwa & Govardhan Puja Special: Celebrate with pure A2 buffalo dairy and champion livestock.",
      about_section_note: "Warmest Diwali greetings from Akil Bhai, Salim Bhai, and the entire AK Buffaloes family.",
      footer_Line: "शुभ दीपावली! Happy Diwali from AK Buffaloes Farm",
      decoration_style: "diya_lights",
      show_in_popup: true,
    },
  },
  {
    id: "occ-chhath-puja",
    name: "Chhath Puja",
    slug: "chhath-puja",
    category: "hindu_festival",
    holiday_status: "regional_holiday",
    recurrence_type: "lunar_hindu",
    enabled: true,
    priority: 83,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "Bihar, UP, Jharkhand & All India",
    yearly_schedule: {
      "2026": { start_date: "2026-11-15", end_date: "2026-11-15", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-11-04", end_date: "2027-11-04", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-10-23", end_date: "2028-10-23", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-11-11", end_date: "2029-11-11", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-10-31", end_date: "2030-10-31", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F97316",
      secondary_color: "#431407",
      accent_color: "#FDE047",
      bg_gradient: "from-orange-950/90 via-amber-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #431407 0%, #9a3412 50%, #431407 100%)",
      banner_text_color: "#FEF08A",
      icon: "☀️",
      badge_text: "जय छठी मैया • Chhath Puja",
      greeting_en: "Warm Greetings on the Sacred Festival of Chhath Puja!",
      greeting_hi: "लोकआस्था के महापर्व छठ पूजा की हार्दिक शुभकामनाएं! जय छठी मैया!",
      greeting_mr: "छठ पूजेच्या हार्दिक शुभेच्छा!",
      subtitle: "Offering gratitude to Surya Dev and nature for sustaining agriculture, water, and livestock.",
      buffalo_section_note: "Pan-India safe buffalo transport to UP, Bihar, Madhya Pradesh, Gujarat, and across India.",
      about_section_note: "Serving dairy farmers across every state of India with dedication.",
      footer_Line: "Shubh Chhath Puja from AK Buffaloes Farm",
      decoration_style: "harvest_nature",
      show_in_popup: false,
    },
  },
  {
    id: "occ-nehru-childrens-day",
    name: "Children's Day (Pandit Jawaharlal Nehru Jayanti)",
    slug: "childrens-day",
    category: "jayanti_anniversary",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 68,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "11-14",
    recurring_end_month_day: "11-14",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F43F5E",
      secondary_color: "#1E293B",
      accent_color: "#FDA4AF",
      bg_gradient: "from-rose-950/85 via-slate-900/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #1e293b 0%, #881337 50%, #1e293b 100%)",
      banner_text_color: "#FFE4E6",
      icon: "🌹",
      badge_text: "Children's Day • 14 November",
      greeting_en: "Warm Wishes on Children's Day & Tributes to Pandit Jawaharlal Nehru!",
      greeting_hi: "बाल दिवस की शुभकामनाएं एवं पं. जवाहरलाल नेहरू जयंती पर सादर नमन!",
      greeting_mr: "बालदिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Nourishing the health and growth of India's children with pure, calcium-rich dairy nutrition.",
      buffalo_section_note: "Pure buffalo milk provides essential protein, calcium, and vitamins for growing children.",
      about_section_note: "Building a healthier future generation through quality dairy farming.",
      footer_Line: "Happy Children's Day — Pure Milk for Healthy Futures",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-birsa-munda-jayanti",
    name: "Bhagwan Birsa Munda Jayanti (Janjatiya Gaurav Divas)",
    slug: "birsa-munda-jayanti",
    category: "jayanti_anniversary",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 79,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "11-15",
    recurring_end_month_day: "11-15",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#10B981",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-emerald-950/95 via-stone-900/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #052e16 0%, #3f6212 50%, #052e16 100%)",
      banner_text_color: "#FEF08A",
      icon: "🌿",
      badge_text: "Janjatiya Gaurav Divas • 15 November",
      greeting_en: "Saluting Bhagwan Birsa Munda on Janjatiya Gaurav Divas!",
      greeting_hi: "जनजातीय गौरव दिवस पर भगवान बिरसा मुंडा को कोटि-कोटि नमन!",
      greeting_mr: "जनजातीय गौरव दिनानिमित्त भगवान बिरसा मुंडा यांना विनम्र अभिवादन!",
      subtitle: "Honoring India's tribal freedom heroes and their deep harmony with nature, forests, and pastoral life.",
      buffalo_section_note: "Supporting rural and tribal dairy farmers with hardy, disease-resistant buffalo breeds.",
      about_section_note: "Respecting indigenous wisdom and sustainable livestock stewardship.",
      footer_Line: "Janjatiya Gaurav Divas — Saluting Bhagwan Birsa Munda",
      decoration_style: "royal_tribute",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-guru-nanak-jayanti",
    name: "Guru Nanak Jayanti (Gurpurab / Prakash Parv)",
    slug: "guru-nanak-jayanti",
    category: "other_religious",
    holiday_status: "gazetted_holiday",
    recurrence_type: "lunar_other",
    enabled: true,
    priority: 88,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    confirmation_status: "confirmed",
    region: "All India",
    yearly_schedule: {
      "2026": { start_date: "2026-11-24", end_date: "2026-11-24", confirmation_status: "confirmed" },
      "2027": { start_date: "2027-11-14", end_date: "2027-11-14", confirmation_status: "confirmed" },
      "2028": { start_date: "2028-11-02", end_date: "2028-11-02", confirmation_status: "confirmed" },
      "2029": { start_date: "2029-11-21", end_date: "2029-11-21", confirmation_status: "confirmed" },
      "2030": { start_date: "2030-11-10", end_date: "2030-11-10", confirmation_status: "estimated" },
    },
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#1E3A8A",
      accent_color: "#FDE047",
      bg_gradient: "from-amber-950/90 via-blue-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #172554 0%, #854d0e 50%, #172554 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "42 92% 54%",
      icon: "🙏",
      badge_text: "Gurpurab Di Lakh Lakh Vadhai",
      greeting_en: "Warm Greetings on Sri Guru Nanak Dev Ji's Prakash Parv — Kirat Karo, Naam Japo, Vand Chhako!",
      greeting_hi: "श्री गुरु नानक देव जी के प्रकाश पर्व (गुरुपर्व) की लख-लख बधाइयां!",
      greeting_mr: "श्री गुरुनानक जयंतीच्या हार्दिक शुभेच्छा!",
      subtitle: "Honoring the sacred teachings of honest labor (Kirat Karo), selfless service (Seva), and equality.",
      buffalo_section_note: "Authentic Punjab & Haryana lineage Murrah and Nili-Ravi buffaloes raised with honest care.",
      about_section_note: "Guided by the timeless principle of honest work and service to the farming community.",
      footer_Line: "Happy Gurpurab — Sri Guru Nanak Dev Ji Prakash Parv",
      decoration_style: "diya_lights",
      show_in_popup: true,
    },
  },
  {
    id: "occ-constitution-day",
    name: "Constitution Day of India (Samvidhan Divas)",
    slug: "constitution-day",
    category: "national_day",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 90,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "11-26",
    recurring_end_month_day: "11-26",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#F59E0B",
      secondary_color: "#1E293B",
      accent_color: "#38BDF8",
      bg_gradient: "from-slate-950/95 via-blue-950/90 to-emerald-950/90",
      banner_bg: "linear-gradient(90deg, #0f172a 0%, #1e3a8a 50%, #14532d 100%)",
      banner_text_color: "#FEF08A",
      icon: "📜",
      badge_text: "Samvidhan Divas • 26 November",
      greeting_en: "Proudly Observing Constitution Day of India (Samvidhan Divas)",
      greeting_hi: "भारतीय संविधान दिवस की हार्दिक शुभकामनाएं!",
      greeting_mr: "भारतीय संविधान दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Upholding the constitutional ideals of justice, liberty, equality, and fraternity.",
      buffalo_section_note: "Transparent documentation, verified records, and ethical practices in every transaction.",
      about_section_note: "Honoring the supreme law of our nation on Samvidhan Divas.",
      footer_Line: "26 November — Constitution Day of India (Samvidhan Divas)",
      decoration_style: "tricolor_patriotic",
      show_in_popup: false,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-national-milk-day",
    name: "National Milk Day (Dr. Verghese Kurien Jayanti)",
    slug: "national-milk-day",
    category: "national_day",
    holiday_status: "celebration",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 86,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "11-26",
    recurring_end_month_day: "11-26",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#38BDF8",
      secondary_color: "#064E3B",
      accent_color: "#FEF08A",
      bg_gradient: "from-emerald-950/90 via-sky-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #064e3b 0%, #0369a1 50%, #064e3b 100%)",
      banner_text_color: "#F0F9FF",
      icon: "🥛",
      badge_text: "National Milk Day • 26 November",
      greeting_en: "Happy National Milk Day! Tributes to Dr. Verghese Kurien, Father of the White Revolution!",
      greeting_hi: "राष्ट्रीय दुग्ध दिवस की शुभकामनाएं — श्वेत क्रांति के जनक डॉ. वर्गीज कुरियन को नमन!",
      greeting_mr: "राष्ट्रीय दुग्ध दिनाच्या हार्दिक शुभेच्छा!",
      subtitle: "Celebrating India's position as the world's #1 milk producer, powered by high-yield buffalo breeds.",
      buffalo_section_note: "Buffaloes contribute over 45% of India's rich milk output — explore our 10 elite breeds.",
      about_section_note: "Dedicated to advancing India's White Revolution from Jalgaon, Maharashtra.",
      footer_Line: "National Milk Day — Proudly Powering India's White Revolution",
      decoration_style: "harvest_nature",
      show_in_popup: true,
    },
  },

  // ======================== DECEMBER ========================
  {
    id: "occ-kisan-diwas",
    name: "Kisan Diwas (National Farmers' Day)",
    slug: "kisan-diwas",
    category: "national_day",
    holiday_status: "observance_only",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 92,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "12-23",
    recurring_end_month_day: "12-23",
    confirmation_status: "confirmed",
    region: "All India",
    theme: {
      primary_color: "#22C55E",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-emerald-950/95 via-green-950/90 to-amber-950/90",
      banner_bg: "linear-gradient(90deg, #052e16 0%, #166534 50%, #052e16 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "142 76% 45%",
      icon: "🌾",
      badge_text: "Kisan Diwas • 23 December",
      greeting_en: "Saluting Every Indian Farmer on Kisan Diwas (National Farmers' Day)!",
      greeting_hi: "राष्ट्रीय किसान दिवस (23 दिसंबर) पर देश के अन्नदाता और पशुपालकों को सादर प्रणाम!",
      greeting_mr: "राष्ट्रीय शेतकरी दिनानिमित्त जगाच्या पोशिंद्या बळीराजाला मानाचा मुजरा!",
      subtitle: "Honoring the tireless hard work of India's crop and dairy farmers on Chaudhury Charan Singh Jayanti.",
      buffalo_section_note: "Built by farmers, for farmers — 100% transparent pricing and free dairy consultation.",
      about_section_note: "Our entire mission at AK Buffaloes is dedicated to the prosperity of Indian farmers.",
      footer_Line: "Happy Kisan Diwas — Jai Kisan, Jai Dairy!",
      decoration_style: "harvest_nature",
      show_in_popup: true,
      is_respectful_observance: true,
    },
  },
  {
    id: "occ-christmas",
    name: "Christmas Day",
    slug: "christmas-day",
    category: "other_religious",
    holiday_status: "gazetted_holiday",
    recurrence_type: "fixed_annual",
    enabled: true,
    priority: 85,
    timezone: "Asia/Kolkata",
    activation_time: "00:00",
    deactivation_time: "23:59",
    duration_days: 1,
    recurring_month_day: "12-25",
    recurring_end_month_day: "12-25",
    confirmation_status: "confirmed",
    region: "All India & Global",
    theme: {
      primary_color: "#EF4444",
      secondary_color: "#14532D",
      accent_color: "#FDE047",
      bg_gradient: "from-red-950/90 via-emerald-950/90 to-slate-950/95",
      banner_bg: "linear-gradient(90deg, #450a0a 0%, #14532d 50%, #450a0a 100%)",
      banner_text_color: "#FEF08A",
      primary_hsl: "42 90% 55%",
      icon: "🎄",
      badge_text: "Merry Christmas • 25 December",
      greeting_en: "Merry Christmas! Wishing You Peace, Joy, and Goodwill!",
      greeting_hi: "क्रिसमस की हार्दिक शुभकामनाएं — सुख, शांति और आनंद का पर्व!",
      greeting_mr: "नाताळ सणाच्या हार्दिक शुभेच्छा!",
      subtitle: "May the festive season bring warmth, harmony, and abundance to your home and farm.",
      buffalo_section_note: "Winter peak lactation season — explore our highest-yielding Murrah and Nili-Ravi buffaloes.",
      about_section_note: "Warm holiday greetings from the AK Buffaloes team.",
      footer_Line: "Merry Christmas & Season's Greetings from AK Buffaloes",
      decoration_style: "festive_sparkles",
      show_in_popup: true,
    },
  },
];

/**
 * Resolves an occasion's start_date, end_date, confirmation status, and live status
 * for a given IST date/time (`istNow`).
 *
 * Rules enforced:
 * - Fixed-date occasions recur automatically every year (including Dec -> Jan rollover).
 * - Variable/lunar occasions use explicit `start_date`/`end_date` if configured for that year,
 *   or `yearly_schedule[year]`.
 * - Never reuses a previous year's date for a lunar/variable occasion if the current year's date is missing or unconfirmed.
 * - Applies `moon_offset_days` for lunar Islamic occasions when configured.
 */
export function resolveOccasionForISTDate(
  occasion: FestivalOccasion,
  istNow: ISTDateParts,
  settings: FestivalGlobalSettings = DEFAULT_FESTIVAL_SETTINGS
): ResolvedOccasionInstance {
  const { year, dateStr, timeStr } = istNow;

  let resolvedStart: string | null = null;
  let resolvedEnd: string | null = null;
  let resolvedYear = year;
  let resolvedConfirmation: DateConfirmationStatus = occasion.confirmation_status || "confirmed";

  if (occasion.recurrence_type === "fixed_annual" && occasion.recurring_month_day) {
    const startMd = occasion.recurring_month_day;
    const endMd = occasion.recurring_end_month_day || startMd;

    // Construct this year's instance
    const thisYearStart = `${year}-${startMd}`;
    const thisYearEnd =
      endMd < startMd
        ? `${year + 1}-${endMd}`
        : occasion.duration_days > 1 && endMd === startMd
        ? addDaysToDateStr(thisYearStart, occasion.duration_days - 1)
        : `${year}-${endMd}`;

    // If this year's window has already passed, also know next year's window for upcoming calculations
    if (dateStr > thisYearEnd) {
      resolvedStart = thisYearStart;
      resolvedEnd = thisYearEnd;
      resolvedYear = year;
    } else {
      resolvedStart = thisYearStart;
      resolvedEnd = thisYearEnd;
      resolvedYear = year;
    }
    resolvedConfirmation = "confirmed";
  } else {
    // Variable / Lunar / One-time occasion
    // 1. Check if Admin set a direct start_date/end_date that matches the current year (or spans across current year)
    const customStartYear = occasion.start_date ? parseInt(occasion.start_date.slice(0, 4), 10) : null;
    const customEndYear = occasion.end_date ? parseInt(occasion.end_date.slice(0, 4), 10) : customStartYear;

    if (
      occasion.start_date &&
      (customStartYear === year || customEndYear === year || occasion.recurrence_type === "one_time")
    ) {
      resolvedStart = occasion.start_date;
      resolvedEnd =
        occasion.end_date ||
        addDaysToDateStr(occasion.start_date, Math.max(0, (occasion.duration_days || 1) - 1));
      resolvedYear = customStartYear || year;
      resolvedConfirmation = occasion.confirmation_status || "confirmed";
    } else if (occasion.yearly_schedule && occasion.yearly_schedule[String(year)]) {
      // 2. Look up current year in yearly_schedule
      const entry = occasion.yearly_schedule[String(year)];
      resolvedStart = entry.start_date;
      resolvedEnd =
        entry.end_date ||
        addDaysToDateStr(entry.start_date, Math.max(0, (occasion.duration_days || 1) - 1));
      resolvedYear = year;
      resolvedConfirmation = entry.confirmation_status || "confirmed";
    } else {
      // 3. No entry for current year! Never guess or reuse a previous year's date!
      resolvedStart = null;
      resolvedEnd = null;
      resolvedYear = year;
      resolvedConfirmation = "needs_confirmation";
    }

    // Apply moon-sighting offset days if applicable
    if (
      resolvedStart &&
      resolvedEnd &&
      occasion.moon_sighting_dependent &&
      typeof occasion.moon_offset_days === "number" &&
      occasion.moon_offset_days !== 0
    ) {
      resolvedStart = addDaysToDateStr(resolvedStart, occasion.moon_offset_days);
      resolvedEnd = addDaysToDateStr(resolvedEnd, occasion.moon_offset_days);
    }
  }

  // Determine month number (1..12) for calendar grouping
  let monthNumber = 1;
  if (resolvedStart && /^\d{4}-\d{2}-\d{2}$/.test(resolvedStart)) {
    monthNumber = parseInt(resolvedStart.slice(5, 7), 10);
  } else if (occasion.recurring_month_day) {
    monthNumber = parseInt(occasion.recurring_month_day.slice(0, 2), 10);
  } else if (occasion.yearly_schedule) {
    const anyEntry = Object.values(occasion.yearly_schedule)[0];
    if (anyEntry?.start_date) {
      monthNumber = parseInt(anyEntry.start_date.slice(5, 7), 10);
    }
  }

  // Check if manual activation is currently active for this occasion
  const isManualActive = isManualActivationValidForOccasion(occasion.id, settings, istNow);

  // Determine if date/time falls inside [resolvedStart + activation_time, resolvedEnd + deactivation_time]
  const actTime = occasion.activation_time || "00:00";
  const deactTime = occasion.deactivation_time || "23:59";

  let isWithinWindow = false;
  if (
    resolvedStart &&
    resolvedEnd &&
    resolvedConfirmation !== "needs_confirmation" &&
    dateStr >= resolvedStart &&
    dateStr <= resolvedEnd
  ) {
    const afterStart = dateStr > resolvedStart || timeStr >= actTime;
    const beforeEnd = dateStr < resolvedEnd || timeStr <= deactTime;
    isWithinWindow = afterStart && beforeEnd;
  }

  // Compute days until next occurrence (looking into next year if this year's date already passed)
  let daysUntilStart: number | null = null;
  if (isWithinWindow) {
    daysUntilStart = 0;
  } else if (resolvedStart && dateStr < resolvedStart && resolvedConfirmation !== "needs_confirmation") {
    daysUntilStart = diffCalendarDays(dateStr, resolvedStart);
  } else {
    // Check next year's occurrence
    const nextYear = year + 1;
    if (occasion.recurrence_type === "fixed_annual" && occasion.recurring_month_day) {
      const nextStart = `${nextYear}-${occasion.recurring_month_day}`;
      daysUntilStart = diffCalendarDays(dateStr, nextStart);
    } else if (occasion.yearly_schedule && occasion.yearly_schedule[String(nextYear)]) {
      const nextEntry = occasion.yearly_schedule[String(nextYear)];
      if (nextEntry.confirmation_status !== "needs_confirmation") {
        let nextStart = nextEntry.start_date;
        if (occasion.moon_sighting_dependent && occasion.moon_offset_days) {
          nextStart = addDaysToDateStr(nextStart, occasion.moon_offset_days);
        }
        daysUntilStart = diffCalendarDays(dateStr, nextStart);
      }
    }
  }

  // Determine live_status
  let liveStatus: OccasionLiveStatus;
  if (isManualActive) {
    liveStatus = "manual_active";
  } else if (resolvedConfirmation === "needs_confirmation" || !resolvedStart || !resolvedEnd) {
    liveStatus = "needs_confirmation";
  } else if (!occasion.enabled) {
    liveStatus = "disabled";
  } else if (isWithinWindow) {
    liveStatus = "active_today";
  } else if (dateStr > resolvedEnd) {
    // For fixed annual or multi-year scheduled occasions, if next year is scheduled, show scheduled or expired
    liveStatus = daysUntilStart !== null && daysUntilStart > 0 ? "scheduled" : "expired";
  } else {
    liveStatus = "scheduled";
  }

  return {
    ...occasion,
    resolved_start_date: resolvedStart,
    resolved_end_date: resolvedEnd,
    resolved_year: resolvedYear,
    resolved_confirmation: resolvedConfirmation,
    live_status: liveStatus,
    days_until_start: daysUntilStart,
    month_number: monthNumber,
  };
}

/**
 * Checks whether a manual "Activate Now" override is currently active and has not expired in IST.
 */
export function isManualActivationValidForOccasion(
  occasionId: string,
  settings: FestivalGlobalSettings,
  istNow: ISTDateParts
): boolean {
  const manual = settings?.manual_activation;
  if (!manual || !manual.active || manual.occasion_id !== occasionId || !manual.expires_at) {
    return false;
  }
  const currentComparable = `${istNow.dateStr}T${istNow.timeStr}`;
  const exp = manual.expires_at.slice(0, 16); // "YYYY-MM-DDTHH:mm"
  return currentComparable <= exp;
}

/**
 * Evaluates the entire festival calendar for a given IST timestamp and global settings.
 * Returns:
 * - `istNow`: current IST date/time parts
 * - `activeOccasion`: highest-priority active occasion (or manual activation if active), or `null` if master is OFF / none match
 * - `secondaryOccasions`: other enabled occasions active today when `overlap_display_mode === 'main_plus_secondary'`
 * - `nextOccasion`: next upcoming enabled occasion sorted by `days_until_start`
 * - `resolvedOccasions`: all occasions with computed `live_status` and resolved dates
 */
export function evaluateFestivalCalendar(
  occasions: FestivalOccasion[],
  settings: FestivalGlobalSettings = DEFAULT_FESTIVAL_SETTINGS,
  referenceDate: Date = new Date()
) {
  const istNow = getISTDateParts(referenceDate);
  const mergedSettings: FestivalGlobalSettings = {
    ...DEFAULT_FESTIVAL_SETTINGS,
    ...settings,
  };

  const resolvedOccasions = occasions.map((occ) =>
    resolveOccasionForISTDate(occ, istNow, mergedSettings)
  );

  // 1. Check if Manual Activation ("Activate Now") is currently active and unexpired
  let manualOccasion: ResolvedOccasionInstance | null = null;
  if (mergedSettings.manual_activation?.active && mergedSettings.manual_activation.occasion_id) {
    const candidate = resolvedOccasions.find(
      (o) => o.id === mergedSettings.manual_activation?.occasion_id
    );
    if (
      candidate &&
      isManualActivationValidForOccasion(candidate.id, mergedSettings, istNow)
    ) {
      manualOccasion = candidate;
    }
  }

  // 2. Find all automatic occasions active today (only when master_enabled is true)
  const matchingToday = mergedSettings.master_enabled
    ? resolvedOccasions
        .filter((o) => o.enabled && o.live_status === "active_today")
        .sort((a, b) => b.priority - a.priority)
    : [];

  let activeOccasion: ResolvedOccasionInstance | null = null;
  let secondaryOccasions: ResolvedOccasionInstance[] = [];

  if (manualOccasion) {
    activeOccasion = manualOccasion;
    if (mergedSettings.overlap_display_mode === "main_plus_secondary") {
      secondaryOccasions = matchingToday.filter((o) => o.id !== manualOccasion!.id);
    }
  } else if (matchingToday.length > 0) {
    activeOccasion = matchingToday[0];
    if (mergedSettings.overlap_display_mode === "main_plus_secondary" && matchingToday.length > 1) {
      secondaryOccasions = matchingToday.slice(1);
    }
  }

  // 3. Find the next upcoming enabled occasion
  const upcomingCandidates = resolvedOccasions
    .filter(
      (o) =>
        o.enabled &&
        o.resolved_confirmation !== "needs_confirmation" &&
        o.days_until_start !== null &&
        o.days_until_start > 0
    )
    .sort((a, b) => (a.days_until_start! - b.days_until_start!) || (b.priority - a.priority));

  const nextOccasion = upcomingCandidates.length > 0 ? upcomingCandidates[0] : null;

  return {
    istNow,
    settings: mergedSettings,
    activeOccasion,
    secondaryOccasions,
    nextOccasion,
    resolvedOccasions,
  };
}

/**
 * Merges default occasions with database-saved records so Admin edits, custom occasions,
 * and toggle states persist across deployments and server restarts.
 */
export function mergeOccasionsWithDb(
  dbRecords?: Partial<FestivalOccasion>[] | null
): FestivalOccasion[] {
  if (!dbRecords || !Array.isArray(dbRecords) || dbRecords.length === 0) {
    return DEFAULT_FESTIVAL_OCCASIONS.map((o) => ({ ...o, theme: { ...o.theme } }));
  }

  const dbMap = new Map<string, Partial<FestivalOccasion> & { is_deleted?: boolean }>();
  for (const rec of dbRecords) {
    if (rec && rec.id) {
      dbMap.set(rec.id, rec);
    }
  }

  const merged: FestivalOccasion[] = [];
  for (const defOcc of DEFAULT_FESTIVAL_OCCASIONS) {
    const override = dbMap.get(defOcc.id);
    if (override) {
      dbMap.delete(defOcc.id);
      if (override.is_deleted) continue;
      merged.push({
        ...defOcc,
        ...override,
        yearly_schedule: {
          ...(defOcc.yearly_schedule || {}),
          ...(override.yearly_schedule || {}),
        },
        theme: {
          ...defOcc.theme,
          ...(override.theme || {}),
        },
      });
    } else {
      merged.push({ ...defOcc, theme: { ...defOcc.theme } });
    }
  }

  // Append any custom occasions added by the Admin
  for (const custom of dbMap.values()) {
    if (custom.is_deleted || !custom.id || !custom.name) continue;
    merged.push({
      id: custom.id,
      name: custom.name,
      slug: custom.slug || custom.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: custom.category || "hindu_festival",
      holiday_status: custom.holiday_status || "celebration",
      recurrence_type: custom.recurrence_type || "fixed_annual",
      enabled: custom.enabled ?? true,
      priority: typeof custom.priority === "number" ? custom.priority : 75,
      timezone: custom.timezone || "Asia/Kolkata",
      activation_time: custom.activation_time || "00:00",
      deactivation_time: custom.deactivation_time || "23:59",
      duration_days: custom.duration_days || 1,
      recurring_month_day: custom.recurring_month_day,
      recurring_end_month_day: custom.recurring_end_month_day,
      start_date: custom.start_date,
      end_date: custom.end_date,
      confirmation_status: custom.confirmation_status || "confirmed",
      moon_sighting_dependent: custom.moon_sighting_dependent || false,
      moon_offset_days: custom.moon_offset_days || 0,
      region: custom.region || "All India",
      yearly_schedule: custom.yearly_schedule || {},
      is_custom: true,
      updated_at: custom.updated_at,
      theme: {
        primary_color: "#F59E0B",
        secondary_color: "#14532D",
        accent_color: "#FDE047",
        bg_gradient: "from-amber-950/90 via-emerald-950/90 to-slate-950/95",
        banner_bg: "linear-gradient(90deg, #14532d 0%, #78350f 50%, #14532d 100%)",
        banner_text_color: "#FEF08A",
        icon: "✨",
        badge_text: custom.name,
        greeting_en: `Warm Greetings on ${custom.name}!`,
        subtitle: "Best wishes from AK Buffaloes Farm, Pachora, Maharashtra.",
        buffalo_section_note: "Explore our 10 certified buffalo breeds with verified milk yields.",
        about_section_note: "Celebrating special occasions with our farming community.",
        footer_Line: `${custom.name} — AK Buffaloes Farm`,
        decoration_style: "festive_sparkles",
        show_in_popup: true,
        ...(custom.theme || {}),
      },
    });
  }

  return merged;
}
