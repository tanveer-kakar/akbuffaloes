import {
  DEFAULT_FESTIVAL_OCCASIONS,
  CATEGORY_LABELS,
  type FestivalOccasion,
  type OccasionCategory,
} from "@/data/festivalCalendarData";
import { getDefaultFestivalImage } from "@/data/festivalVisualAssets";

export interface PromoPopupCard {
  id: string;
  is_active: boolean;
  title_label: string;
  brand_title_en: string;
  brand_subtitle_en: string;
  badge_text: string;
  headline_en: string;
  highlight_prefix_en: string;
  highlight_text_en: string;
  highlight_suffix_en: string;
  description_en: string;
  subnote_en: string;
  brand_title_hi: string;
  brand_subtitle_hi: string;
  headline_hi: string;
  highlight_text_hi: string;
  description_hi: string;
  subnote_hi: string;
  link_url: string;
  link_label: string;
  button_text: string;
  qr_box_title: string;
  footer_text: string;
  banner_image_url?: string | null;
  is_full_banner?: boolean;
  // Festival Popup Ad Metadata
  festival_id?: string;
  festival_slug?: string;
  festival_category?: OccasionCategory;
  festival_icon?: string;
  festival_date_label?: string;
  festival_primary_color?: string;
  festival_secondary_color?: string;
  festival_accent_color?: string;
  auto_on_festival_date?: boolean;
  created_at?: string;
}

export interface PromoPopupDbRecord {
  id: string;
  is_active?: boolean;
  title_label?: string;
  brand_title_en?: string;
  brand_subtitle_en?: string;
  badge_text?: string;
  headline_en?: string;
  highlight_prefix_en?: string;
  highlight_text_en?: string;
  highlight_suffix_en?: string;
  description_en?: string;
  subnote_en?: string;
  brand_title_hi?: string;
  brand_subtitle_hi?: string;
  headline_hi?: string;
  highlight_text_hi?: string;
  description_hi?: string;
  subnote_hi?: string;
  link_url?: string;
  link_label?: string;
  button_text?: string;
  qr_box_title?: string;
  footer_text?: string;
  banner_image_url?: string | null;
  is_full_banner?: boolean;
  festival_id?: string;
  festival_slug?: string;
  festival_category?: OccasionCategory;
  festival_icon?: string;
  festival_date_label?: string;
  festival_primary_color?: string;
  festival_secondary_color?: string;
  festival_accent_color?: string;
  auto_on_festival_date?: boolean;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

function formatOccasionDateSummary(occ: FestivalOccasion): string {
  if (occ.recurrence_type === "fixed_annual" && occ.recurring_month_day) {
    const [m, d] = occ.recurring_month_day.split("-").map(Number);
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    return `${d} ${months[(m || 1) - 1]} (Annual)`;
  }
  const y2026 = occ.yearly_schedule?.["2026"];
  if (y2026?.start_date) {
    return y2026.end_date && y2026.end_date !== y2026.start_date
      ? `${y2026.start_date} to ${y2026.end_date}`
      : y2026.start_date;
  }
  return "Annual Lunar / Variable Date";
}

function buildFestivalPromoPopupCard(occ: FestivalOccasion): PromoPopupCard {
  const isRespectful = Boolean(occ.theme.is_respectful_observance);
  const categoryLabel = CATEGORY_LABELS[occ.category] || "Festival & Special Day";
  const dateLabel = formatOccasionDateSummary(occ);
  const defaultFestivalImg =
    occ.theme.banner_image_url || getDefaultFestivalImage(occ.slug || occ.id, occ.category);

  return {
    id: `festival-popup-${occ.slug}`,
    is_active: false, // Controlled via ON/OFF switch in Admin Panel or automatic on live festival date
    title_label: `${occ.theme.icon} ${occ.name} — Festival Popup Ad`,
    brand_title_en: "AK Buffaloes",
    brand_subtitle_en: categoryLabel,
    badge_text: occ.theme.icon || "✨",
    headline_en: occ.theme.greeting_en,
    highlight_prefix_en: isRespectful ? "Tribute on" : "Celebrate",
    highlight_text_en: occ.theme.badge_text || occ.name,
    highlight_suffix_en: "with AK Buffaloes Farm",
    description_en: `${occ.theme.subtitle} ${occ.theme.buffalo_section_note}`,
    subnote_en: "Visit our farm in Lohari, Pachora (Jalgaon) or follow",
    brand_title_hi: "एके बफेलोज़",
    brand_subtitle_hi: isRespectful ? "विशेष श्रद्धांजलि एवं नमन" : "पर्व विशेष शुभकामनाएं",
    headline_hi: occ.theme.greeting_hi || occ.theme.greeting_mr || occ.theme.greeting_en,
    highlight_text_hi: isRespectful ? "सादर नमन" : "हार्दिक शुभकामनाएं",
    description_hi:
      occ.theme.greeting_mr && occ.theme.greeting_hi
        ? `${occ.theme.greeting_mr} • शुद्ध मुर्रा, नीली-रावी, जाफराबादी, सुरती और मेहसाणा भैंसों के लिए विश्वसनीय डेयरी फार्म।`
        : "शुद्ध मुर्रा, नीली-रावी, जाफराबादी, सुरती और मेहसाणा भैंसों के लिए महाराष्ट्र का विश्वसनीय डेयरी फार्म।",
    subnote_hi: "संपर्क करें: +91-9022273915 | इंस्टाग्राम @ak_buffaloes",
    link_url: "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4",
    link_label: "@ak_buffaloes",
    button_text: "Follow & Enquire",
    qr_box_title: `${occ.theme.icon} ${occ.name}`,
    footer_text: `${occ.theme.icon} ${occ.theme.footer_Line} | 📞 +91-9022273915`,
    banner_image_url: defaultFestivalImg,
    is_full_banner: false,
    festival_id: occ.id,
    festival_slug: occ.slug,
    festival_category: occ.category,
    festival_icon: occ.theme.icon,
    festival_date_label: dateLabel,
    festival_primary_color: occ.theme.primary_color,
    festival_secondary_color: occ.theme.secondary_color,
    festival_accent_color: occ.theme.accent_color,
    auto_on_festival_date: true,
  };
}

export const festivalPromoPopupCards: PromoPopupCard[] =
  DEFAULT_FESTIVAL_OCCASIONS.map(buildFestivalPromoPopupCard);

export const defaultPromoPopupCards: PromoPopupCard[] = [
  {
    id: "default-insta-promo",
    is_active: true,
    title_label: "Official Instagram Advertisement Card",
    brand_title_en: "AK Buffaloes",
    brand_subtitle_en: "Official Instagram",
    badge_text: "24×7",
    headline_en: "Follow Us on Instagram !",
    highlight_prefix_en: "for",
    highlight_text_en: "Daily Live",
    highlight_suffix_en: "buffalo updates",
    description_en:
      "Watch daily reels, live milking proofs, and new arrivals of Murrah, Nili-Ravi, Jaffarabadi, Surti & Mehsana buffaloes.",
    subnote_en: "For direct bookings & inquiries, follow @ak_buffaloes",
    brand_title_hi: "एके बफेलोज़",
    brand_subtitle_hi: "ऑफिशियल इंस्टाग्राम",
    headline_hi: "इंस्टाग्राम पर फॉलो करें !",
    highlight_text_hi: "रोज़ाना लाइव",
    description_hi:
      "इस अवसर का लाभ उठाएं और मुर्रा, नीली-रावी, जाफराबादी, सुरती व मेहसाणा भैंसों के नए वीडियो और कीमत तुरंत देखें!",
    subnote_hi: "अधिक जानकारी के लिए हमारे इंस्टाग्राम अकाउंट @ak_buffaloes से जुड़ें।",
    link_url: "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4",
    link_label: "@ak_buffaloes",
    button_text: "Follow Now",
    qr_box_title: "Link to Follow / QR Code",
    footer_text:
      "🐃 Official Instagram: @ak_buffaloes — Nurani Nagar, Pachora, Dist. Jalgaon",
    banner_image_url: null,
    is_full_banner: false,
  },
  {
    id: "default-order-buffaloes-banner",
    is_active: true,
    title_label: "Order Buffaloes for Your Farm — Promotional Banner",
    brand_title_en: "AK Buffaloes",
    brand_subtitle_en: "Healthy Buffaloes | Better Tomorrow",
    badge_text: "24×7",
    headline_en: "Order Buffaloes for Your Farm",
    highlight_prefix_en: "",
    highlight_text_en: "Healthy Buffaloes",
    highlight_suffix_en: "| Best for Milk | High Milk Yield",
    description_en:
      "Best for Milk • Healthy & Disease Resistant • Pure Breed Quality • Ideal for Dairy Farming. Strong Buffaloes for a Prosperous Future.",
    subnote_en: "Follow Us on Instagram @ak_buffaloes • Lohari, Jalgaon (Maharashtra)",
    brand_title_hi: "एके बफेलोज़",
    brand_subtitle_hi: "स्वस्थ भैंसें | बेहतर कल",
    headline_hi: "अपने फार्म के लिए भैंसें ऑर्डर करें",
    highlight_text_hi: "अधिक दूध उत्पादन",
    description_hi:
      "उत्तम स्वास्थ्य, शुद्ध नस्ल गुणवत्ता और डेयरी फार्मिंग के लिए आदर्श भैंसें। आज ही अपना ऑर्डर बुक करें!",
    subnote_hi: "इंस्टाग्राम पर फॉलो करें @ak_buffaloes",
    link_url: "/buffaloes",
    link_label: "@ak_buffaloes",
    button_text: "Order Now",
    qr_box_title: "Order Buffaloes Now",
    footer_text:
      "🐃 Quality Buffaloes → Healthy Milk → Happy Farmers | @ak_buffaloes",
    banner_image_url: "/ak-buffalo-order-promo-banner.jpg?v=2",
    is_full_banner: true,
  },
  ...festivalPromoPopupCards,
];

export const isDefaultPromoPopup = (id: string): boolean => {
  return defaultPromoPopupCards.some((card) => card.id === id);
};

const OFFICIAL_INSTAGRAM_URL =
  "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4";

const normalizeInstaUrl = (url?: string | null, fallback?: string): string => {
  const raw = (url || "").trim();
  if (!raw) return fallback || OFFICIAL_INSTAGRAM_URL;
  if (raw.toLowerCase().includes("instagram.com")) {
    return OFFICIAL_INSTAGRAM_URL;
  }
  return raw;
};

const normalizeInstaText = (txt?: string | null, fallback = ""): string => {
  const raw = (txt ?? fallback).trim() || fallback;
  return raw.replace(/@ak\.buffalos/gi, "@ak_buffaloes");
};

export const mergePromoPopupsWithDb = (
  dbRecords?: PromoPopupDbRecord[] | null
): PromoPopupCard[] => {
  if (!dbRecords || !Array.isArray(dbRecords) || dbRecords.length === 0) {
    return [...defaultPromoPopupCards];
  }

  const dbMap = new Map<string, PromoPopupDbRecord>();
  for (const record of dbRecords) {
    if (record && record.id) {
      dbMap.set(record.id, record);
    }
  }

  const mergedDefaults: PromoPopupCard[] = [];
  for (const defCard of defaultPromoPopupCards) {
    const override = dbMap.get(defCard.id);
    if (override) {
      dbMap.delete(defCard.id);
      if (override.is_deleted === true) {
        continue;
      }
      // If default-insta-promo had a legacy order-banner override, preserve its dedicated Instagram card identity
      const isLegacyOrderOverrideOnInsta =
        defCard.id === "default-insta-promo" &&
        (override.banner_image_url?.includes("ak-buffalo-order-promo-banner") ||
          override.title_label?.includes("Order Buffaloes"));

      if (isLegacyOrderOverrideOnInsta) {
        mergedDefaults.push({
          ...defCard,
          is_active:
            override.is_active !== undefined ? Boolean(override.is_active) : defCard.is_active,
          created_at: override.created_at,
        });
        continue;
      }

      mergedDefaults.push({
        ...defCard,
        id: defCard.id,
        is_active: override.is_active !== undefined ? Boolean(override.is_active) : defCard.is_active,
        title_label: override.title_label?.trim() || defCard.title_label,
        brand_title_en: override.brand_title_en?.trim() || defCard.brand_title_en,
        brand_subtitle_en: override.brand_subtitle_en?.trim() || defCard.brand_subtitle_en,
        badge_text: override.badge_text?.trim() || defCard.badge_text,
        headline_en: override.headline_en?.trim() || defCard.headline_en,
        highlight_prefix_en:
          override.highlight_prefix_en !== undefined ? override.highlight_prefix_en : defCard.highlight_prefix_en,
        highlight_text_en: override.highlight_text_en?.trim() || defCard.highlight_text_en,
        highlight_suffix_en:
          override.highlight_suffix_en !== undefined ? override.highlight_suffix_en : defCard.highlight_suffix_en,
        description_en: override.description_en?.trim() || defCard.description_en,
        subnote_en: normalizeInstaText(override.subnote_en, defCard.subnote_en),
        brand_title_hi: override.brand_title_hi?.trim() || defCard.brand_title_hi,
        brand_subtitle_hi: override.brand_subtitle_hi?.trim() || defCard.brand_subtitle_hi,
        headline_hi: override.headline_hi?.trim() || defCard.headline_hi,
        highlight_text_hi: override.highlight_text_hi?.trim() || defCard.highlight_text_hi,
        description_hi: override.description_hi?.trim() || defCard.description_hi,
        subnote_hi: normalizeInstaText(override.subnote_hi, defCard.subnote_hi),
        link_url: normalizeInstaUrl(override.link_url, defCard.link_url),
        link_label: normalizeInstaText(override.link_label, defCard.link_label),
        button_text: override.button_text?.trim() || defCard.button_text,
        qr_box_title: override.qr_box_title?.trim() || defCard.qr_box_title,
        footer_text: normalizeInstaText(override.footer_text, defCard.footer_text),
        banner_image_url:
          override.banner_image_url && override.banner_image_url !== "/ak-buffalo-order-promo-banner.jpg"
            ? override.banner_image_url
            : defCard.banner_image_url,
        is_full_banner:
          override.is_full_banner !== undefined ? Boolean(override.is_full_banner) : defCard.is_full_banner,
        auto_on_festival_date:
          override.auto_on_festival_date !== undefined
            ? Boolean(override.auto_on_festival_date)
            : defCard.auto_on_festival_date,
        created_at: override.created_at,
      });
    } else {
      mergedDefaults.push(defCard);
    }
  }

  const customCards: PromoPopupCard[] = [];
  for (const record of dbMap.values()) {
    if (record.is_deleted === true) continue;
    customCards.push({
      id: record.id,
      is_active: record.is_active !== undefined ? Boolean(record.is_active) : true,
      title_label: record.title_label?.trim() || record.headline_en?.trim() || "Website Announcement Card",
      brand_title_en: record.brand_title_en?.trim() || "AK Buffaloes",
      brand_subtitle_en: record.brand_subtitle_en?.trim() || "Official Announcement",
      badge_text: record.badge_text?.trim() || "24×7",
      headline_en: record.headline_en?.trim() || "Follow Us on Instagram !",
      highlight_prefix_en: record.highlight_prefix_en ?? "for",
      highlight_text_en: record.highlight_text_en?.trim() || "Daily Live",
      highlight_suffix_en: record.highlight_suffix_en ?? "buffalo updates",
      description_en:
        record.description_en?.trim() ||
        "Watch daily reels, live milking proofs, and new arrivals of Murrah, Nili-Ravi, Jaffarabadi, Surti & Mehsana buffaloes.",
      subnote_en: normalizeInstaText(
        record.subnote_en,
        "For direct bookings & inquiries, contact AK Buffaloes"
      ),
      brand_title_hi: record.brand_title_hi?.trim() || "एके बफेलोज़",
      brand_subtitle_hi: record.brand_subtitle_hi?.trim() || "आधिकारिक सूचना",
      headline_hi: record.headline_hi?.trim() || "आज ही हमसे जुड़ें !",
      highlight_text_hi: record.highlight_text_hi?.trim() || "रोज़ाना लाइव",
      description_hi:
        record.description_hi?.trim() ||
        "मुर्रा, नीली-रावी, जाफराबादी, सुरती व मेहसाणा भैंसों के नए वीडियो और कीमत तुरंत देखें!",
      subnote_hi: normalizeInstaText(
        record.subnote_hi,
        "अधिक जानकारी के लिए हमारे फार्म से संपर्क करें।"
      ),
      link_url: normalizeInstaUrl(
        record.link_url,
        "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
      ),
      link_label: normalizeInstaText(record.link_label, "@ak_buffaloes"),
      button_text: record.button_text?.trim() || "Follow Now",
      qr_box_title: record.qr_box_title?.trim() || "Link / QR Code",
      footer_text: normalizeInstaText(
        record.footer_text,
        "🐃 AK Buffaloes Dairy Farm — Nurani Nagar, Pachora, Dist. Jalgaon"
      ),
      banner_image_url: record.banner_image_url || null,
      is_full_banner: Boolean(record.is_full_banner),
      festival_id: record.festival_id,
      festival_slug: record.festival_slug,
      festival_category: record.festival_category,
      festival_icon: record.festival_icon,
      festival_date_label: record.festival_date_label,
      festival_primary_color: record.festival_primary_color,
      festival_secondary_color: record.festival_secondary_color,
      festival_accent_color: record.festival_accent_color,
      auto_on_festival_date: record.auto_on_festival_date,
      created_at: record.created_at,
    });
  }

  customCards.sort((a, b) => {
    const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tA - tB;
  });

  return [...mergedDefaults, ...customCards];
};
