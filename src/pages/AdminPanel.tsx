import { useEffect, useState, useMemo, useCallback, useRef, type ComponentType } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import BuffaloLoader from "@/components/BuffaloLoader";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Trash2, Users, MessageSquare, Phone, Shield,
  RefreshCw, Edit, Eye, EyeOff, Save, BarChart3, UserX, KeyRound, Download, Search,
  ChevronLeft, ChevronRight, Camera, ImageOff, TrendingUp, CheckCircle, XCircle,
  Tag, Settings as SettingsIcon, Volume2, VolumeX, Bell, BellOff, BellRing, Mail, Lock, ArrowLeft,
  FileText, ChevronDown, FileSpreadsheet, FileCode, Plus, Upload,
  Image as ImageIcon, Video, Video as VideoIcon, RotateCcw, Sparkles, Calendar,
  Layers, Milk, Scale, Award, Play, X, MapPin, Clock, Megaphone
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import AnalyticsSection from "@/components/AnalyticsSection";
import { ADMIN_EMAIL, isUserAdmin } from "@/lib/adminAuth";
import { voiceAnnouncer } from "@/lib/voiceAnnouncer";
import { sound } from "@/lib/soundEffects";
import { generateFarmReportPDF, type ReportType } from "@/lib/pdfReportGenerator";
import {
  exportRecordsByFormat,
} from "@/lib/exportUtils";
import {
  galleryItems as defaultGalleryItems,
  mergeGalleryWithDb,
  isDefaultGalleryItem,
  type GalleryItem,
  type GalleryItemDbRecord,
} from "@/data/galleryData";
import {
  mergePromoPopupsWithDb,
  isDefaultPromoPopup,
  type PromoPopupCard,
  type PromoPopupDbRecord,
} from "@/data/promoPopupData";
import { PromoPopupCardView } from "@/components/InstagramPromoPopup";
import FestivalThemeAdminSection from "@/components/FestivalThemeAdminSection";
import { useFestivalTheme } from "@/contexts/FestivalThemeContext";
import { CATEGORY_LABELS, type OccasionCategory } from "@/data/festivalCalendarData";
import {
  BUFFALO_BREEDS,
  BREED_PRESET_OPTIONS,
  BUFFALO_VIDEO_PRESETS,
  DEFAULT_BREED_CATALOG_PROFILES,
  DEFAULT_NEW_STOCK_PROFILES,
  enrichBuffaloToNewStock,
  getBuffaloSliderImages,
  getDefaultBreedImagePath,
  isLegacySampleRecord,
  mergeDbWithLiveOverrides,
  removeBuffaloLiveOverride,
  resolveAdminBuffaloThumb,
  resolveBuffaloImage,
  saveBuffaloLiveOverride,
} from "@/data/buffaloBreedsData";
import {
  DEFAULT_FARM_SETTINGS,
  getFarmSiteSettings,
  saveFarmSiteSettings,
  type FarmSiteSettings,
} from "@/lib/farmSettings";


interface ActivityLog { id: string; user_id: string; user_email: string | null; user_role: string; action: string; entity_type: string; entity_id: string | null; details: string | null; created_at: string; }
interface UserRole { user_id: string; role: string; }
interface Profile { id: string; user_id: string; full_name: string | null; phone: string | null; email: string | null; created_at: string; updated_at?: string; avatar_url?: string | null; email_notifications?: boolean; voice_notifications?: boolean; sound_notifications?: boolean; user_password?: string | null; }
interface ConsultationRequest { id: string; name: string; email: string; phone: string; status?: string; admin_note?: string | null; created_at: string; }
interface ContactMessage { id: string; name: string; phone: string | null; email: string; message: string; status?: string; admin_note?: string | null; created_at: string; }
interface PurchaseInquiry { id: string; name: string; phone: string; email: string; message: string; status?: string; admin_note?: string | null; created_at: string; user_id: string | null; buffalo_name?: string; buffalo_breed?: string; buffalo_price?: number; }
interface BuffaloListingAdmin {
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
  location?: string;
  pregnancy_status?: string;
  calf_details?: string;
  health_records?: string;
  video_url?: string | null;
  extra_images?: string[] | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  is_new_stock?: boolean;
  status: string; // "available" | "out_of_stock" | "limited_stock"
  created_at: string;
}

interface StatusRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  status?: string;
  admin_note?: string | null;
  buffalo_name?: string;
  buffalo_breed?: string;
  buffalo_price?: number;
}

const dateFilterOptions = [
  { value: "all", label: "All Time" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const isWithinDays = (dateStr: string, days: string) => {
  if (days === "all") return true;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= Number(days);
};

// Search bar component
const SearchBar = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative w-full sm:w-auto">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 h-9 font-sans text-sm w-full sm:max-w-xs"
    />
  </div>
);

const ITEMS_PER_PAGE = 10;

// Pagination controls component
const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-border">
      <p className="font-sans text-[10px] sm:text-xs text-muted-foreground">
        Page {currentPage}/{totalPages}
      </p>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
          let page: number;
          if (totalPages <= 3) page = i + 1;
          else if (currentPage <= 2) page = i + 1;
          else if (currentPage >= totalPages - 1) page = totalPages - 2 + i;
          else page = currentPage - 1 + i;
          return (
            <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className={`h-7 w-7 sm:h-8 sm:w-8 p-0 font-sans text-[10px] sm:text-xs ${currentPage === page ? "bg-gold text-green-dark hover:bg-gold-light" : ""}`} onClick={() => onPageChange(page)}>
              {page}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0" disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};

// ─── Stats Carousel ──────────────────────────────────────────────────────────
type StatCardDef = {
  label: string;
  tab: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
};

const StatsCarousel = ({
  cards,
  activeTab,
  setActiveTab,
}: {
  cards: StatCardDef[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps", dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };
    emblaApi.on("select", update);
    emblaApi.on("reInit", update);
    update();
  }, [emblaApi]);

  return (
    <div className="relative mb-6">
      {/* Prev button */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollPrev()}
        disabled={!canScrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md transition-all hover:border-gold/60 disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Embla viewport */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3">
          {cards.map((st) => (
            <button
              key={st.label}
              type="button"
              onClick={() => setActiveTab(st.tab)}
              className={`flex-none w-[160px] sm:w-[175px] bg-background border rounded-lg p-3 sm:p-4 text-left transition-all cursor-pointer hover:border-gold/60 ${
                activeTab === st.tab ? "border-gold ring-1 ring-gold/40 shadow-sm" : "border-border"
              }`}
            >
              <st.icon className={`w-5 h-5 ${st.color} mb-1.5`} />
              <p className="font-sans text-base sm:text-lg font-bold text-foreground break-words leading-snug">{st.value}</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5 leading-snug">{st.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Next button */}
      <button
        type="button"
        onClick={() => emblaApi?.scrollNext()}
        disabled={!canScrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md transition-all hover:border-gold/60 disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

type TabDef = {
  v: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  count: number;
};

const TabsScrollRow = ({
  tabs,
  activeTab: _activeTab,
  newLogsCount,
}: {
  tabs: TabDef[];
  activeTab: string;
  newLogsCount: number;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "prev" | "next") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "next" ? 220 : -220, behavior: "smooth" });
  };

  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onClick={() => scroll("prev")}
        className="shrink-0 bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:border-gold/60 transition-all z-10"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>

      <div ref={scrollRef} className="overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
        <TabsList className="bg-background border border-border inline-flex flex-nowrap items-center justify-start h-auto gap-1.5 p-1.5 w-max">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.v}
              value={t.v}
              className="font-sans text-xs sm:text-sm font-medium gap-1.5 shrink-0 px-3 py-2 rounded-md relative whitespace-nowrap data-[state=active]:bg-gold/15 data-[state=active]:text-foreground data-[state=active]:border-gold/50 border border-transparent"
            >
              <t.icon className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>{t.label}</span>
              {t.count > 0 && <span className="font-semibold">({t.count})</span>}
              {t.v === "activity" && newLogsCount > 0 && (
                <span className="-top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                  {newLogsCount > 99 ? "99+" : newLogsCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <button
        type="button"
        onClick={() => scroll("next")}
        className="shrink-0 bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:border-gold/60 transition-all z-10"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const AdminPanel = () => {
  const { user, isAdmin, loading, signOut, signInAsAdmin } = useAuth();
  const { toast } = useToast();
  const {
    occasions: festivalOccasions,
    settings: festivalSettings,
    liveActiveOccasion: festivalActiveOccasion,
  } = useFestivalTheme();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [consultations, setConsultations] = useState<ConsultationRequest[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [purchaseInquiries, setPurchaseInquiries] = useState<PurchaseInquiry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [fetching, setFetching] = useState(true);

  const [viewContact, setViewContact] = useState<ContactMessage | null>(null);
  const [viewInquiry, setViewInquiry] = useState<PurchaseInquiry | null>(null);
  const [viewUser, setViewUser] = useState<Profile | null>(null);
  const [viewConsult, setViewConsult] = useState<ConsultationRequest | null>(null);

  // Credential tab CRUD states
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit Inquiry states
  const [editInquiryModal, setEditInquiryModal] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<PurchaseInquiry | null>(null);
  const [inquiryForm, setInquiryForm] = useState({ name: "", phone: "", email: "", message: "", status: "pending" });
  const [savingInquiry, setSavingInquiry] = useState(false);

  // Edit Consultation states
  const [editConsultModal, setEditConsultModal] = useState(false);
  const [editingConsult, setEditingConsult] = useState<ConsultationRequest | null>(null);
  const [consultForm, setConsultForm] = useState({ name: "", phone: "", email: "" });
  const [savingConsult, setSavingConsult] = useState(false);

  // Edit Message states
  const [editMessageModal, setEditMessageModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ContactMessage | null>(null);
  const [messageForm, setMessageForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [savingMessage, setSavingMessage] = useState(false);

  // Buffalo listings state (All 10 Breeds Catalog + New Stocks management)
  const [buffaloListings, setBuffaloListings] = useState<BuffaloListingAdmin[]>([]);
  const [buffaloBreedFilter, setBuffaloBreedFilter] = useState("all");
  const [buffaloStatusFilter, setBuffaloStatusFilter] = useState("all");
  const [buffaloStockTypeFilter, setBuffaloStockTypeFilter] = useState("all");
  const [buffaloLocationFilter, setBuffaloLocationFilter] = useState("all");
  const [buffaloCalfFilter, setBuffaloCalfFilter] = useState("all");
  const [buffaloSearch, setBuffaloSearch] = useState("");
  const [buffaloStockCodeFilter, setBuffaloStockCodeFilter] = useState("all");
  const [previewBuffaloDetail, setPreviewBuffaloDetail] = useState<BuffaloListingAdmin | null>(null);
  const [previewBuffaloMediaIdx, setPreviewBuffaloMediaIdx] = useState(0);
  const [previewBuffaloPlayingVideo, setPreviewBuffaloPlayingVideo] = useState(false);
  const [editBuffaloModal, setEditBuffaloModal] = useState(false);
  const [isCreatingBuffalo, setIsCreatingBuffalo] = useState(false);
  const [editingBuffalo, setEditingBuffalo] = useState<BuffaloListingAdmin | null>(null);
  const [buffaloForm, setBuffaloForm] = useState({
    stock_code: "AKB-009",
    subtitle_label: "Murrah Buffalo (With Calf)",
    name: "",
    breed: "Murrah",
    price: 120000,
    is_negotiable: true,
    age: "4 Years",
    weight: "550 kg",
    milk_yield: "14 L/day",
    lactation: "2nd Lactation",
    location: "",
    pregnancy_status: "Pregnant (3 Months)",
    calf_details: "With Calf",
    health_records: "Vaccinated & Vet Certified",
    video_url: BUFFALO_VIDEO_PRESETS[0].value,
    description: "",
    image_url: "/murrah1.jpg",
    extra_image_url: "/murrah2.jpg",
    status: "available",
    is_new_stock: true,
  });
  const [savingBuffalo, setSavingBuffalo] = useState(false);
  const [uploadingBuffaloImage, setUploadingBuffaloImage] = useState(false);
  const [uploadingBuffaloExtraImage, setUploadingBuffaloExtraImage] = useState(false);
  const [uploadingBuffaloVideo, setUploadingBuffaloVideo] = useState(false);
  const buffaloImageInputRef = useRef<HTMLInputElement>(null);
  const buffaloExtraImageInputRef = useRef<HTMLInputElement>(null);
  const buffaloVideoInputRef = useRef<HTMLInputElement>(null);
  const [quickBuffaloUploadTarget, setQuickBuffaloUploadTarget] = useState<BuffaloListingAdmin | null>(null);
  const quickBuffaloInputRef = useRef<HTMLInputElement>(null);
  const [quickBuffaloVideoTarget, setQuickBuffaloVideoTarget] = useState<BuffaloListingAdmin | null>(null);
  const quickBuffaloVideoInputRef = useRef<HTMLInputElement>(null);
  const quickDetailPhoto1InputRef = useRef<HTMLInputElement>(null);
  const quickDetailPhoto2InputRef = useRef<HTMLInputElement>(null);
  const quickDetailVideoInputRef = useRef<HTMLInputElement>(null);
  const [buffaloPage, setBuffaloPage] = useState(1);

  // Gallery photos & videos management state (Admin Panel only)
  const [galleryDbRecords, setGalleryDbRecords] = useState<GalleryItemDbRecord[]>([]);
  const [galleryTypeFilter, setGalleryTypeFilter] = useState<"all" | "image" | "video">("all");
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryPage, setGalleryPage] = useState(1);
  const [editGalleryModal, setEditGalleryModal] = useState(false);
  const [isCreatingGalleryItem, setIsCreatingGalleryItem] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState<{
    type: "image" | "video";
    src: string;
    title: string;
    alt: string;
    description: string;
  }>({
    type: "image",
    src: "",
    title: "",
    alt: "",
    description: "",
  });
  const [savingGalleryItem, setSavingGalleryItem] = useState(false);
  const [uploadingGalleryMedia, setUploadingGalleryMedia] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const bulkGalleryInputRef = useRef<HTMLInputElement>(null);
  const [quickGalleryUploadTarget, setQuickGalleryUploadTarget] = useState<GalleryItem | null>(null);
  const quickGalleryInputRef = useRef<HTMLInputElement>(null);
  const [galleryViewMode, setGalleryViewMode] = useState<"table" | "grid">("table");
  const [previewGalleryItem, setPreviewGalleryItem] = useState<GalleryItem | null>(null);

  // Website Popup Advertisement Cards state (Admin Panel ON/OFF & Add/Edit)
  const [promoPopupDbRecords, setPromoPopupDbRecords] = useState<PromoPopupDbRecord[]>([]);
  const [editPromoModal, setEditPromoModal] = useState(false);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [editingPromoCard, setEditingPromoCard] = useState<PromoPopupCard | null>(null);
  const [promoForm, setPromoForm] = useState<Omit<PromoPopupCard, "id" | "created_at">>({
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
    subnote_en: "For direct bookings & inquiries, follow",
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
  });
  const [savingPromoCard, setSavingPromoCard] = useState(false);
  const [uploadingPromoBanner, setUploadingPromoBanner] = useState(false);
  const promoBannerInputRef = useRef<HTMLInputElement>(null);
  const [previewPromoCard, setPreviewPromoCard] = useState<PromoPopupCard | null>(null);
  const [promoSearch, setPromoSearch] = useState("");
  const [promoCategoryFilter, setPromoCategoryFilter] = useState("all");
  const [promoStatusFilter, setPromoStatusFilter] = useState("all");
  const [promoModeFilter, setPromoModeFilter] = useState("all");

  // Additional Buffalo & Gallery Filters
  const [buffaloPriceFilter, setBuffaloPriceFilter] = useState("all");
  const [buffaloSort, setBuffaloSort] = useState("stock_code_asc");
  const [gallerySourceFilter, setGallerySourceFilter] = useState("all");

  // Admin Notification & Audio Settings
  const [adminEmailNotifications, setAdminEmailNotifications] = useState(true);
  const [adminVoiceNotifications, setAdminVoiceNotifications] = useState(voiceAnnouncer.isEnabled());
  const [adminSoundNotifications, setAdminSoundNotifications] = useState(sound.isEnabled());

  // Business & Website Operations Settings (Admin)
  const [farmSettings, setFarmSettings] = useState<FarmSiteSettings>(() => getFarmSiteSettings());
  const [savingFarmSettings, setSavingFarmSettings] = useState(false);

  // Admin Inactivity Timeout Guard
  useEffect(() => {
    if (!isAdmin) return;
    const timeoutSetting = farmSettings.adminSessionTimeout || "12 Hours";
    let durationMs = 12 * 60 * 60 * 1000;
    if (timeoutSetting.includes("30 Min")) durationMs = 30 * 60 * 1000;
    else if (timeoutSetting.includes("2 Hour")) durationMs = 2 * 60 * 60 * 1000;
    else if (timeoutSetting.includes("12 Hour")) durationMs = 12 * 60 * 60 * 1000;
    else if (timeoutSetting.includes("24 Hour")) durationMs = 24 * 60 * 60 * 1000;

    let timer: NodeJS.Timeout;
    const handleActivity = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        toast({
          title: "Admin Session Inactivity Timeout",
          description: `You have been inactive for ${timeoutSetting}. Signed out to protect admin security.`,
          variant: "destructive",
        });
        void signOut();
      }, durationMs);
    };

    const trackedEvents = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    trackedEvents.forEach((ev) => window.addEventListener(ev, handleActivity, { passive: true }));
    handleActivity();

    return () => {
      clearTimeout(timer);
      trackedEvents.forEach((ev) => window.removeEventListener(ev, handleActivity));
    };
  }, [isAdmin, farmSettings.adminSessionTimeout, signOut, toast]);

  const [activitySearch, setActivitySearch] = useState("");
  const [activityDateFilter, setActivityDateFilter] = useState("all");
  const [activityRoleFilter, setActivityRoleFilter] = useState("all");
  const [activityEntityFilter, setActivityEntityFilter] = useState("all");
  const [activitySort, setActivitySort] = useState("newest");
  const [activityPage, setActivityPage] = useState(1);
  const [newLogsCount, setNewLogsCount] = useState(0);
  // Activity log actions
  const [activitySelectedIds, setActivitySelectedIds] = useState<Set<string>>(new Set());
  const [activityEditLog, setActivityEditLog] = useState<ActivityLog | null>(null);
  const [activityEditAction, setActivityEditAction] = useState("");
  const [activityEditDetails, setActivityEditDetails] = useState("");
  const [activityEditSaving, setActivityEditSaving] = useState(false);
  const [activityDeleteConfirmId, setActivityDeleteConfirmId] = useState<string | null>(null);
  const [activityBulkDeleteConfirm, setActivityBulkDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState("buffaloes");

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [inquirySearch, setInquirySearch] = useState("");
  const [consultSearch, setConsultSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [credSearch, setCredSearch] = useState("");
  // Date, status, breed, phone, note & sort filters across all tabs
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userDateFilter, setUserDateFilter] = useState("all");
  const [userPhoneFilter, setUserPhoneFilter] = useState("all");
  const [userSort, setUserSort] = useState("newest");
  const [inquiryDateFilter, setInquiryDateFilter] = useState("all");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [inquiryBreedFilter, setInquiryBreedFilter] = useState("all");
  const [inquiryNoteFilter, setInquiryNoteFilter] = useState("all");
  const [inquirySort, setInquirySort] = useState("newest");
  const [consultDateFilter, setConsultDateFilter] = useState("all");
  const [consultStatusFilter, setConsultStatusFilter] = useState("all");
  const [consultNoteFilter, setConsultNoteFilter] = useState("all");
  const [consultSort, setConsultSort] = useState("newest");
  const [messageDateFilter, setMessageDateFilter] = useState("all");
  const [messageStatusFilter, setMessageStatusFilter] = useState("all");
  const [messagePhoneFilter, setMessagePhoneFilter] = useState("all");
  const [messageSort, setMessageSort] = useState("newest");
  const [credRoleFilter, setCredRoleFilter] = useState("all");
  const [credPasswordFilter, setCredPasswordFilter] = useState("all");

  // Avatar management in edit profile
  const [uploadingAdminAvatar, setUploadingAdminAvatar] = useState(false);
  const adminAvatarRef = useRef<HTMLInputElement>(null);

  const [statusModal, setStatusModal] = useState<{ table: string; record: StatusRecord } | null>(null);
  const [statusAction, setStatusAction] = useState("pending");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [inquiryPage, setInquiryPage] = useState(1);
  const [consultPage, setConsultPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);

  // User Password Management & Security Modal states
  const [passwordModalUser, setPasswordModalUser] = useState<Profile | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showModalRealPassword, setShowModalRealPassword] = useState(false);
  const [savingUserPassword, setSavingUserPassword] = useState(false);
  const [resetEmailSending, setResetEmailSending] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [viewUserPasswordVisible, setViewUserPasswordVisible] = useState(false);

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // PDF Report Generation Modal States
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<ReportType>("comprehensive");
  const [selectedReportDateRange, setSelectedReportDateRange] = useState("all");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleGeneratePDF = (typeOverride?: ReportType, dateRangeOverride?: string) => {
    const type = typeOverride || selectedReportType;
    const dateRange = dateRangeOverride || (typeOverride ? "all" : selectedReportDateRange);
    setGeneratingPDF(true);
    try {
      const result = generateFarmReportPDF({
        reportType: type,
        dateRange,
        buffaloListings,
        purchaseInquiries,
        profiles,
        consultations,
        contacts,
        activityLogs,
        userRoles,
        adminEmail: user?.email || ADMIN_EMAIL,
      });

      if (result.success) {
        toast({
          title: "PDF Report Downloaded! 📑",
          description: `Downloaded ${result.fileName} (${result.pageCount} ${result.pageCount === 1 ? "page" : "pages"}).`,
        });
        if (sound.isEnabled()) sound.playSuccess();
        if (voiceAnnouncer.isEnabled()) {
          voiceAnnouncer.speak("Farm record report downloaded in PDF format.");
        }
        setShowReportDialog(false);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast({
        title: "Report Generation Error",
        description: err instanceof Error ? err.message : "Failed to generate PDF.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleExportRecords = (
    format: "csv" | "excel" | "json",
    typeOverride?: ReportType,
    dateRangeOverride?: string
  ) => {
    const type = typeOverride || selectedReportType;
    const range = dateRangeOverride || (typeOverride ? "all" : selectedReportDateRange);
    try {
      const result = exportRecordsByFormat(format, type, {
        buffaloListings,
        purchaseInquiries,
        profiles,
        consultations,
        contacts,
        activityLogs,
        userRoles,
        dateRange: range,
      });

      if (result.success) {
        const formatLabel =
          format === "csv"
            ? "CSV Spreadsheet"
            : format === "excel"
            ? "Excel Workbook"
            : "JSON Backup";
        toast({
          title: `${formatLabel} Exported! 📥`,
          description: `Downloaded ${result.filename} (${result.count} records).`,
        });
        if (sound.isEnabled()) sound.playSuccess();
        if (voiceAnnouncer.isEnabled()) {
          voiceAnnouncer.speak(`Records exported in ${format.toUpperCase()} format.`);
        }
        setShowReportDialog(false);
      }
    } catch (err) {
      console.error("Export failed:", err);
      toast({
        title: "Export Error",
        description: err instanceof Error ? err.message : "Failed to export records.",
        variant: "destructive",
      });
    }
  };

  const handleAdminSetPassword = async () => {
    if (!passwordModalUser) return;
    if (!adminNewPassword || adminNewPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setSavingUserPassword(true);
    try {
      const { error: fnError } = await backend.functions.invoke("admin-update-user", {
        body: { userId: passwordModalUser.user_id, password: adminNewPassword },
      });
      if (fnError) {
        toast({ title: "Update failed", description: fnError.message, variant: "destructive" });
      } else {
        toast({ title: "Password updated successfully", description: `Updated credentials for ${getUserEmail(passwordModalUser.user_id)}` });
        setProfiles(prev => prev.map(p => p.user_id === passwordModalUser.user_id ? { ...p, user_password: adminNewPassword } : p));
        setPasswordModalUser(prev => prev ? { ...prev, user_password: adminNewPassword } : null);
        setAdminNewPassword("");
      }
    } catch (err) {
      toast({ title: "Error updating password", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setSavingUserPassword(false);
    }
  };

  const handleAdminSendResetEmail = async () => {
    if (!passwordModalUser) return;
    const userEmail = getUserEmail(passwordModalUser.user_id);
    if (!userEmail) return;
    setResetEmailSending(true);
    try {
      const { error } = await backend.auth.forgotPassword(userEmail);
      if (error) {
        toast({ title: "Failed to send reset link", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Password reset link sent", description: `A reset email with OTP has been sent to ${userEmail}` });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setResetEmailSending(false);
    }
  };

  const generateTemporaryPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pwd = "Buffalo@";
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAdminNewPassword(pwd);
    setShowNewPassword(true);
  };

  // Inline Admin Login states for unauthenticated visitors
  const [portalEmail, setPortalEmail] = useState(ADMIN_EMAIL);
  const [portalPassword, setPortalPassword] = useState("");
  const [showPortalPassword, setShowPortalPassword] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const handleAdminPortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortalError("");
    if (!portalEmail.trim() || !portalPassword) {
      setPortalError("Please enter both email and password.");
      return;
    }
    setPortalLoading(true);
    const { error, isAdmin: adminConfirmed } = await signInAsAdmin(portalEmail.trim(), portalPassword);
    setPortalLoading(false);
    if (error || !adminConfirmed) {
      const msg = error?.message || "This account does not have administrator privileges.";
      setPortalError(msg);
      toast({
        title: "Admin Sign-in Failed",
        description: msg,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Welcome, Administrator!" });
    if (sound.isEnabled()) sound.playSuccess();
    if (voiceAnnouncer.isEnabled()) voiceAnnouncer.speak("Welcome to AK Buffaloes Admin Panel");
  };

  // Real-time activity logs subscription
  useEffect(() => {
    if (!isAdmin) return;

    const playNotificationSound = () => {
      if (sound.isEnabled()) {
        sound.playSuccess();
      }
    };

    const channel = backend
      .channel('activity-logs-realtime')
      .on(
        'data_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newLog = payload.new as unknown as ActivityLog;
          setActivityLogs((prev) => [newLog, ...prev]);
          if (activeTab !== "activity") {
            setNewLogsCount((prev) => prev + 1);
            playNotificationSound();
            toast({
              title: "🔔 New Activity",
              description: `${newLog.action} by ${newLog.user_email || 'Unknown'}`,
            });
          }
        }
      )
      .on(
        "data_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const deletedProfile = payload.old as unknown as Pick<Profile, "id">;
            setProfiles((prev) => prev.filter((profile) => profile.id !== deletedProfile.id));
            return;
          }

          const updatedProfile = payload.new as unknown as Profile;
          setProfiles((prev) => {
            const exists = prev.some((profile) => profile.id === updatedProfile.id);
            if (payload.eventType === "INSERT" && !exists) {
              return [updatedProfile, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at));
            }
            return prev.map((profile) => profile.id === updatedProfile.id ? updatedProfile : profile);
          });
        }
      )
      .subscribe();
    return () => { backend.removeChannel(channel); };
  }, [activeTab, isAdmin, toast]);

  const fetchAll = useCallback(async () => {
    setFetching(true);
    try {
      const [p, c, m, pi, r, al, bl, gi, pp] = await Promise.all([
        backend.from("profiles").select("*").order("created_at", { ascending: false }),
        backend.from("consultation_requests").select("*").order("created_at", { ascending: false }),
        backend.from("contact_messages").select("*").order("created_at", { ascending: false }),
        backend.from("purchase_inquiries").select("*").order("created_at", { ascending: false }),
        backend.from("user_roles").select("user_id, role"),
        backend.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(500),
        backend.from("buffalo_listings").select("*").order("price", { ascending: true }),
        backend.from("gallery_items").select("*").order("created_at", { ascending: false }),
        backend.from("promo_popups").select("*").order("created_at", { ascending: false }),
      ]);
      const queryErrors = [p, c, m, pi, r, al, bl].flatMap((result) => result.error ? [result.error.message] : []);
      if (queryErrors.length > 0) {
        toast({ title: "Some admin data could not be loaded", description: queryErrors.join("; "), variant: "destructive" });
      }
      setProfiles((p.data as unknown as Profile[]) || []);
      setConsultations((c.data as unknown as ConsultationRequest[]) || []);
      setContacts((m.data as unknown as ContactMessage[]) || []);
      setPurchaseInquiries((pi.data as unknown as PurchaseInquiry[]) || []);
      setUserRoles((r.data as unknown as UserRole[]) || []);
      setActivityLogs((al.data as unknown as ActivityLog[]) || []);
      const allRawBuffaloes = ((bl.data as unknown as BuffaloListingAdmin[]) || []).slice();
      // Remove any legacy 5-sample records from DB and memory
      const legacySampleItems = allRawBuffaloes.filter((item) => isLegacySampleRecord(item));
      if (legacySampleItems.length > 0) {
        await Promise.all(
          legacySampleItems.map((sampleItem) =>
            backend.from("buffalo_listings").delete().eq("id", sampleItem.id)
          )
        );
      }
      const rawBuffaloes = allRawBuffaloes.filter((item) => !isLegacySampleRecord(item));
      const missingNewRecords: BuffaloListingAdmin[] = [];

      // 1. Ensure all 8 Default New Stock arrivals (AKB-001 .. AKB-008) exist in Admin Panel & DB
      for (const newStockDef of DEFAULT_NEW_STOCK_PROFILES) {
        const exists = rawBuffaloes.some(
          (item) => item.id === newStockDef.id || (newStockDef.stock_code && item.stock_code === newStockDef.stock_code)
        );
        if (!exists) {
          const newStockRec: BuffaloListingAdmin = {
            ...newStockDef,
          };
          missingNewRecords.push(newStockRec);
        }
      }

      // 2. Ensure all 10 Default Breed Catalog profiles (BRD-001 .. BRD-010) exist in Admin Panel & DB
      for (const breedCatalogDef of DEFAULT_BREED_CATALOG_PROFILES) {
        const exists = rawBuffaloes.some(
          (item) =>
            item.id === breedCatalogDef.id ||
            (breedCatalogDef.stock_code && item.stock_code === breedCatalogDef.stock_code)
        );
        if (!exists) {
          const breedCatalogRec: BuffaloListingAdmin = {
            ...breedCatalogDef,
          };
          missingNewRecords.push(breedCatalogRec);
        }
      }

      if (missingNewRecords.length > 0) {
        await Promise.all(
          missingNewRecords.map((rec) => backend.from("buffalo_listings").insert(rec))
        );
      }

      const mergedWithLive = mergeDbWithLiveOverrides([...rawBuffaloes, ...missingNewRecords]);

      const combinedBuffaloes = mergedWithLive
        .map((item, idx) => {
          const enriched = enrichBuffaloToNewStock(item, idx);
          const resolvedStatus =
            item.status || (item.is_available === false ? "out_of_stock" : "available");
          const resolvedAvailable =
            resolvedStatus === "out_of_stock" ? false : item.is_available !== false;
          return {
            ...enriched,
            ...item,
            stock_code: item.stock_code || enriched.stock_code,
            subtitle_label: item.subtitle_label || enriched.subtitle_label,
            lactation: item.lactation || enriched.lactation,
            pregnancy_status: item.pregnancy_status || enriched.pregnancy_status,
            calf_details: item.calf_details || enriched.calf_details,
            health_records: item.health_records || enriched.health_records,
            video_url: item.video_url || enriched.video_url,
            is_negotiable: item.is_negotiable ?? enriched.is_negotiable,
            is_new_stock: enriched.is_new_stock,
            status: resolvedStatus,
            is_available: resolvedAvailable,
          };
        })
        .sort((a, b) => {
          const aNew = Boolean(a.is_new_stock);
          const bNew = Boolean(b.is_new_stock);
          if (aNew !== bNew) return aNew ? -1 : 1;
          const numA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
          const numB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
          return numA - numB;
        });
      setBuffaloListings(combinedBuffaloes);
      if (!gi.error && Array.isArray(gi.data)) {
        setGalleryDbRecords(gi.data as unknown as GalleryItemDbRecord[]);
      }
      if (!pp.error && Array.isArray(pp.data)) {
        setPromoPopupDbRecords(pp.data as unknown as PromoPopupDbRecord[]);
      }
    } catch (err: unknown) {
      console.error("Failed to load admin data:", err);
      toast({
        title: "Failed to load admin data",
        description: err instanceof Error ? err.message : "Network or database error",
        variant: "destructive",
      });
    } finally {
      setFetching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAdmin) fetchAll();
  }, [isAdmin, fetchAll]);

  const getUserRole = useCallback((userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    if (profile?.email && isUserAdmin(profile.email)) return "admin";
    const role = userRoles.find((r) => r.user_id === userId);
    return role?.role || "user";
  }, [userRoles, profiles]);

  const getUserEmail = useCallback((userId: string): string => {
    const profile = profiles.find(p => p.user_id === userId);
    if (profile?.email) return profile.email;
    const inquiry = purchaseInquiries.find(pi => pi.user_id === userId);
    if (inquiry) return inquiry.email;
    return "—";
  }, [profiles, purchaseInquiries]);

  const deleteRecord = async <T extends { id: string }>(table: "consultation_requests" | "contact_messages" | "purchase_inquiries" | "profiles", id: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
    await backend.from(table).delete().eq("id", id);
    setter((prev) => prev.filter((record) => record.id !== id));
    toast({ title: "Deleted successfully" });
  };

  const deleteUser = async (profile: Profile) => {
    await Promise.all([
      backend.from("purchase_inquiries").delete().eq("user_id", profile.user_id),
      backend.from("user_roles").delete().eq("user_id", profile.user_id),
      backend.from("profiles").delete().eq("user_id", profile.user_id),
    ]);
    setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    setPurchaseInquiries((prev) => prev.filter((pi) => pi.user_id !== profile.user_id));
    setUserRoles((prev) => prev.filter((r) => r.user_id !== profile.user_id));
    toast({ title: "User removed successfully" });
  };


  const statusBadge = (status?: string) => {
    const s = status || "pending";
    const map = {
      pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      accepted: { label: "Accepted", cls: "bg-green-100 text-green-700 border-green-300" },
      confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700 border-blue-300" },
      rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-300" },
      completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
    };
    const { label, cls } = map[s] || map.pending;
    return <Badge className={`text-[10px] ${cls}`}>{label}</Badge>;
  };

  const openStatusModal = (table: string, record: StatusRecord) => {
    setStatusModal({ table, record });
    setStatusAction(record.status || "pending");
    setStatusNote(record.admin_note || "");
  };

  const applyStatusUpdate = async () => {
    if (!statusModal) return;
    setUpdatingStatus(true);
    const { data, error } = await backend.functions.invoke("update-status", {
      body: { table: statusModal.table, id: statusModal.record.id, status: statusAction, adminNote: statusNote },
    });
    setUpdatingStatus(false);
    if (error || (data && data.error)) {
      toast({ title: "Status update failed", description: (error && error.message) || (data && data.error), variant: "destructive" });
      return;
    }
    toast({ title: "Status updated to " + statusAction, description: "The user has been notified by email." });
    const targetId = statusModal.record.id;
    if (statusModal.table === "purchase_inquiries") {
      setPurchaseInquiries(prev => prev.map(r => r.id === targetId ? { ...r, status: statusAction, admin_note: statusNote } : r));
    } else if (statusModal.table === "consultation_requests") {
      setConsultations(prev => prev.map(r => r.id === targetId ? { ...r, status: statusAction, admin_note: statusNote } : r));
    } else if (statusModal.table === "contact_messages") {
      setContacts(prev => prev.map(r => r.id === targetId ? { ...r, status: statusAction, admin_note: statusNote } : r));
    }
    setStatusModal(null);
  };

  // Profile CRUD
  const openEditProfile = (p: Profile) => {
    setEditingProfile(p);
    const email = getUserEmail(p.user_id);
    setProfileForm({ full_name: p.full_name || "", phone: p.phone || "", email: email !== "—" ? email : "", password: "" });
    setEditProfileModal(true);
  };

  const saveProfile = async () => {
    if (!editingProfile) return;
    setSavingProfile(true);
    const payload = { full_name: profileForm.full_name.trim() || null, phone: profileForm.phone.trim() || null, email: profileForm.email.trim() || null };
    const { error } = await backend.from("profiles").update(payload).eq("id", editingProfile.id);
    if (!error) {
      setProfiles((prev) => prev.map((p) => p.id === editingProfile.id ? { ...p, ...payload } : p));
      toast({ title: "Profile updated" });

      // Update email/password via edge function if changed
      if (profileForm.email.trim() || profileForm.password) {
        try {
          const updatePayload: { email?: string; password?: string } = {};
          if (profileForm.email.trim()) updatePayload.email = profileForm.email.trim();
          if (profileForm.password) updatePayload.password = profileForm.password;
          
          const { error: fnError } = await backend.functions.invoke("admin-update-user", {
            body: { userId: editingProfile.user_id, ...updatePayload },
          });
          if (fnError) toast({ title: "Credential update failed", description: fnError.message, variant: "destructive" });
          else toast({ title: "Credentials updated" });
        } catch (error) {
          toast({ title: "Credential update error", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
        }
      }
    } else {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }

    setSavingProfile(false);
    setEditProfileModal(false);
  };

  // Edit Inquiry CRUD
  const openEditInquiry = (pi: PurchaseInquiry) => {
    setEditingInquiry(pi);
    setInquiryForm({ name: pi.name, phone: pi.phone, email: pi.email, message: pi.message, status: pi.status || "pending" });
    setEditInquiryModal(true);
  };
  const saveInquiry = async () => {
    if (!editingInquiry) return;
    setSavingInquiry(true);
    const payload = {
      name: inquiryForm.name.trim(),
      phone: inquiryForm.phone.trim(),
      email: inquiryForm.email.trim(),
      message: inquiryForm.message.trim(),
      status: inquiryForm.status || "pending",
    };
    const { error } = await backend.from("purchase_inquiries").update(payload).eq("id", editingInquiry.id);
    if (!error) {
      setPurchaseInquiries(prev => prev.map(pi => pi.id === editingInquiry.id ? { ...pi, ...payload } : pi));
      toast({ title: "Inquiry updated" });
    } else {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
    setSavingInquiry(false);
    setEditInquiryModal(false);
  };

  // Edit Consultation CRUD
  const openEditConsult = (c: ConsultationRequest) => {
    setEditingConsult(c);
    setConsultForm({ name: c.name, phone: c.phone, email: c.email });
    setEditConsultModal(true);
  };
  const saveConsult = async () => {
    if (!editingConsult) return;
    setSavingConsult(true);
    const payload = { name: consultForm.name.trim(), phone: consultForm.phone.trim(), email: consultForm.email.trim() };
    const { error } = await backend.from("consultation_requests").update(payload).eq("id", editingConsult.id);
    if (!error) { setConsultations(prev => prev.map(c => c.id === editingConsult.id ? { ...c, ...payload } : c)); toast({ title: "Consultation updated" }); }
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setSavingConsult(false); setEditConsultModal(false);
  };

  // Edit Message CRUD
  const openEditMessage = (m: ContactMessage) => {
    setEditingMessage(m);
    setMessageForm({ name: m.name, phone: m.phone || "", email: m.email, message: m.message });
    setEditMessageModal(true);
  };
  const saveMessage = async () => {
    if (!editingMessage) return;
    setSavingMessage(true);
    const payload = { name: messageForm.name.trim(), phone: messageForm.phone.trim() || null, email: messageForm.email.trim(), message: messageForm.message.trim() };
    const { error } = await backend.from("contact_messages").update(payload).eq("id", editingMessage.id);
    if (!error) { setContacts(prev => prev.map(m => m.id === editingMessage.id ? { ...m, ...payload } : m)); toast({ title: "Message updated" }); }
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setSavingMessage(false); setEditMessageModal(false);
  };

  const toggleUserRole = async (profile: Profile) => {
    const currentRole = getUserRole(profile.user_id);
    const newRole = currentRole === "admin" ? "user" : "admin";
    const { error } = await backend.from("user_roles").update({ role: newRole }).eq("user_id", profile.user_id);
    if (!error) {
      setUserRoles((prev) => prev.map((r) => r.user_id === profile.user_id ? { ...r, role: newRole } : r));
      toast({ title: `Role changed to ${newRole}` });
    } else {
      toast({ title: "Role update failed", description: error.message, variant: "destructive" });
    }
  };

  // Filtered data
  const s = (val: unknown, query: string) => String(val ?? "").toLowerCase().includes(query.toLowerCase());

  const filteredUsers = useMemo(() => {
    let result = profiles;
    if (userRoleFilter !== "all") result = result.filter(p => getUserRole(p.user_id) === userRoleFilter);
    if (userDateFilter !== "all") result = result.filter(p => isWithinDays(p.created_at, userDateFilter));
    if (userPhoneFilter === "with_phone") result = result.filter(p => Boolean(p.phone?.trim()));
    if (userPhoneFilter === "without_phone") result = result.filter(p => !p.phone?.trim());
    if (userSearch) {
      result = result.filter(p =>
        s(p.full_name || "", userSearch) ||
        s(p.phone || "", userSearch) ||
        s(p.email || getUserEmail(p.user_id), userSearch) ||
        s(p.user_id, userSearch)
      );
    }
    return [...result].sort((a, b) => {
      if (userSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (userSort === "name_asc") return (a.full_name || "").localeCompare(b.full_name || "");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [profiles, userSearch, userRoleFilter, userDateFilter, userPhoneFilter, userSort, getUserRole, getUserEmail]);

  const filteredInquiries = useMemo(() => {
    let result = purchaseInquiries;
    if (inquiryDateFilter !== "all") result = result.filter(pi => isWithinDays(pi.created_at, inquiryDateFilter));
    if (inquiryStatusFilter !== "all") result = result.filter(pi => (pi.status || "pending") === inquiryStatusFilter);
    if (inquiryBreedFilter === "general") {
      result = result.filter(pi => !pi.buffalo_breed);
    } else if (inquiryBreedFilter !== "all") {
      result = result.filter(pi => (pi.buffalo_breed || "").toLowerCase() === inquiryBreedFilter.toLowerCase());
    }
    if (inquiryNoteFilter === "with_note") result = result.filter(pi => Boolean(pi.admin_note?.trim()));
    if (inquiryNoteFilter === "without_note") result = result.filter(pi => !pi.admin_note?.trim());
    if (inquirySearch) {
      result = result.filter(pi =>
        s(pi.name, inquirySearch) ||
        s(pi.email, inquirySearch) ||
        s(pi.phone, inquirySearch) ||
        s(pi.message, inquirySearch) ||
        (pi.buffalo_name && s(pi.buffalo_name, inquirySearch)) ||
        (pi.buffalo_breed && s(pi.buffalo_breed, inquirySearch))
      );
    }
    return [...result].sort((a, b) => {
      if (inquirySort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (inquirySort === "price_desc") return (Number(b.buffalo_price) || 0) - (Number(a.buffalo_price) || 0);
      if (inquirySort === "price_asc") return (Number(a.buffalo_price) || 0) - (Number(b.buffalo_price) || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [purchaseInquiries, inquirySearch, inquiryDateFilter, inquiryStatusFilter, inquiryBreedFilter, inquiryNoteFilter, inquirySort]);

  const filteredConsultations = useMemo(() => {
    let result = consultations;
    if (consultDateFilter !== "all") result = result.filter(c => isWithinDays(c.created_at, consultDateFilter));
    if (consultStatusFilter !== "all") result = result.filter(c => (c.status || "pending") === consultStatusFilter);
    if (consultNoteFilter === "with_note") result = result.filter(c => Boolean(c.admin_note?.trim()));
    if (consultNoteFilter === "without_note") result = result.filter(c => !c.admin_note?.trim());
    if (consultSearch) {
      result = result.filter(c =>
        s(c.name, consultSearch) ||
        s(c.email, consultSearch) ||
        s(c.phone, consultSearch) ||
        s(c.admin_note || "", consultSearch)
      );
    }
    return [...result].sort((a, b) => {
      if (consultSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (consultSort === "name_asc") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [consultations, consultSearch, consultDateFilter, consultStatusFilter, consultNoteFilter, consultSort]);

  const filteredMessages = useMemo(() => {
    let result = contacts;
    if (messageDateFilter !== "all") result = result.filter(m => isWithinDays(m.created_at, messageDateFilter));
    if (messageStatusFilter !== "all") result = result.filter(m => (m.status || "pending") === messageStatusFilter);
    if (messagePhoneFilter === "with_phone") result = result.filter(m => Boolean(m.phone?.trim()));
    if (messagePhoneFilter === "email_only") result = result.filter(m => !m.phone?.trim());
    if (messageSearch) {
      result = result.filter(m =>
        s(m.name, messageSearch) ||
        s(m.email, messageSearch) ||
        s(m.phone || "", messageSearch) ||
        s(m.message, messageSearch)
      );
    }
    return [...result].sort((a, b) => {
      if (messageSort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (messageSort === "name_asc") return a.name.localeCompare(b.name);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [contacts, messageSearch, messageDateFilter, messageStatusFilter, messagePhoneFilter, messageSort]);

  // Reset pages when search/filter changes
  useEffect(() => { setUserPage(1); }, [userSearch, userRoleFilter, userDateFilter, userPhoneFilter, userSort]);
  useEffect(() => { setInquiryPage(1); }, [inquirySearch, inquiryDateFilter, inquiryStatusFilter, inquiryBreedFilter, inquiryNoteFilter, inquirySort]);
  useEffect(() => { setConsultPage(1); }, [consultSearch, consultDateFilter, consultStatusFilter, consultNoteFilter, consultSort]);
  useEffect(() => { setMessagePage(1); }, [messageSearch, messageDateFilter, messageStatusFilter, messagePhoneFilter, messageSort]);
  useEffect(() => { setActivityPage(1); }, [activitySearch, activityDateFilter, activityRoleFilter, activityEntityFilter, activitySort]);
  useEffect(() => { setBuffaloPage(1); }, [buffaloSearch, buffaloBreedFilter, buffaloStatusFilter, buffaloPriceFilter, buffaloStockTypeFilter, buffaloLocationFilter, buffaloCalfFilter, buffaloSort]);
  useEffect(() => { setGalleryPage(1); }, [gallerySearch, galleryTypeFilter, gallerySourceFilter]);

  const isBuffaloNewStock = useCallback((b: BuffaloListingAdmin) => {
    if (typeof b.is_new_stock === "boolean") return b.is_new_stock;
    if (String(b.id || "").startsWith("breed-catalog-")) return false;
    return String(b.id || "").startsWith("new-stock-");
  }, []);

  const filteredBuffaloes = useMemo(() => {
    let result = buffaloListings.filter((b) => !isLegacySampleRecord(b));
    if (buffaloStockTypeFilter === "new_stocks") {
      result = result.filter(b => isBuffaloNewStock(b));
    } else if (buffaloStockTypeFilter === "catalog") {
      result = result.filter(b => !isBuffaloNewStock(b));
    }
    if (buffaloBreedFilter !== "all") {
      result = result.filter(b => (b.breed || "").toLowerCase() === buffaloBreedFilter.toLowerCase());
    }
    if (buffaloStatusFilter !== "all") {
      result = result.filter(b => (b.status || "available") === buffaloStatusFilter);
    }
    if (buffaloCalfFilter !== "all") {
      result = result.filter((b) => {
        const combined = `${b.calf_details || ""} ${b.pregnancy_status || ""} ${b.subtitle_label || ""}`.toLowerCase();
        if (buffaloCalfFilter === "with_calf") {
          return combined.includes("with calf") || combined.includes("female calf");
        }
        if (buffaloCalfFilter === "pregnant") {
          return combined.includes("pregnant");
        }
        if (buffaloCalfFilter === "milking") {
          return combined.includes("milking") || combined.includes("calved");
        }
        return true;
      });
    }
    if (buffaloPriceFilter === "under_90k") {
      result = result.filter(b => Number(b.price) < 95000);
    } else if (buffaloPriceFilter === "90k_120k") {
      result = result.filter(b => Number(b.price) >= 95000 && Number(b.price) <= 120000);
    } else if (buffaloPriceFilter === "above_120k") {
      result = result.filter(b => Number(b.price) > 120000);
    }
    if (buffaloStockCodeFilter !== "all") {
      result = result.filter(b => (b.stock_code || "").toUpperCase() === buffaloStockCodeFilter.toUpperCase());
    }
    if (buffaloSearch) {
      result = result.filter(b =>
        s(b.name, buffaloSearch) ||
        s(b.stock_code || "", buffaloSearch) ||
        s(b.subtitle_label || "", buffaloSearch) ||
        s(b.breed, buffaloSearch) ||
        s(String(b.price), buffaloSearch) ||
        s(b.milk_yield, buffaloSearch) ||
        s(b.age, buffaloSearch) ||
        s(b.lactation || "", buffaloSearch) ||
        s(b.pregnancy_status || "", buffaloSearch) ||
        s(b.calf_details || "", buffaloSearch) ||
        s(b.health_records || "", buffaloSearch)
      );
    }
    const stockNumSort = (a: BuffaloListingAdmin, b: BuffaloListingAdmin) => {
      const numA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      const numB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      return numA - numB;
    };
    return [...result].sort((a, b) => {
      if (buffaloSort === "price_asc") return Number(a.price) - Number(b.price);
      if (buffaloSort === "price_desc") return Number(b.price) - Number(a.price);
      if (buffaloSort === "name_asc") return a.name.localeCompare(b.name);
      if (buffaloSort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (buffaloSort === "breeds_first") {
        const aNew = isBuffaloNewStock(a);
        const bNew = isBuffaloNewStock(b);
        if (aNew !== bNew) return aNew ? 1 : -1;
        return stockNumSort(a, b);
      }
      if (buffaloSort === "new_stock_first") {
        const aNew = isBuffaloNewStock(a);
        const bNew = isBuffaloNewStock(b);
        if (aNew !== bNew) return aNew ? -1 : 1;
        return stockNumSort(a, b);
      }
      // Default: stock_code_asc
      return stockNumSort(a, b);
    });
  }, [buffaloListings, buffaloStockTypeFilter, buffaloBreedFilter, buffaloStatusFilter, buffaloCalfFilter, buffaloPriceFilter, buffaloSort, buffaloSearch, buffaloStockCodeFilter, isBuffaloNewStock]);

  // Merged live gallery items for Admin Panel
  const adminGalleryItems = useMemo(() => {
    return mergeGalleryWithDb(galleryDbRecords);
  }, [galleryDbRecords]);

  const filteredGalleryItems = useMemo(() => {
    let result = adminGalleryItems;
    if (galleryTypeFilter !== "all") {
      result = result.filter((item) => item.type === galleryTypeFilter);
    }
    if (gallerySourceFilter === "default") {
      result = result.filter((item) => isDefaultGalleryItem(item.id));
    } else if (gallerySourceFilter === "custom") {
      result = result.filter((item) => !isDefaultGalleryItem(item.id));
    }
    if (gallerySearch.trim()) {
      result = result.filter(
        (item) =>
          s(item.title, gallerySearch) ||
          s(item.description, gallerySearch) ||
          s(item.alt, gallerySearch) ||
          s(item.id, gallerySearch)
      );
    }
    return result;
  }, [adminGalleryItems, galleryTypeFilter, gallerySourceFilter, gallerySearch]);

  const deletedDefaultGalleryCount = useMemo(() => {
    return galleryDbRecords.filter((r) => r.is_deleted === true && isDefaultGalleryItem(r.id)).length;
  }, [galleryDbRecords]);

  // Merged live promo popup cards for Admin Panel (including all 32 Festival Popup Ads)
  const adminPromoPopups = useMemo(() => {
    const merged = mergePromoPopupsWithDb(promoPopupDbRecords);
    return merged.map((card) => {
      const explicitDb = promoPopupDbRecords.find((r) => r.id === card.id && !r.is_deleted);
      if (explicitDb && explicitDb.is_active !== undefined) {
        return { ...card, is_active: Boolean(explicitDb.is_active) };
      }
      if (
        card.festival_id &&
        festivalActiveOccasion &&
        card.festival_id === festivalActiveOccasion.id &&
        festivalActiveOccasion.theme.show_in_popup !== false
      ) {
        return { ...card, is_active: true };
      }
      return { ...card, is_active: Boolean(card.is_active) };
    });
  }, [promoPopupDbRecords, festivalActiveOccasion]);

  const activePromoPopupsCount = useMemo(() => {
    return adminPromoPopups.filter((c) => c.is_active === true).length;
  }, [adminPromoPopups]);

  const filteredPromoPopups = useMemo(() => {
    return adminPromoPopups.filter((card) => {
      if (promoCategoryFilter === "general" && card.festival_id) return false;
      if (promoCategoryFilter === "festivals_all" && !card.festival_id) return false;
      if (
        promoCategoryFilter !== "all" &&
        promoCategoryFilter !== "general" &&
        promoCategoryFilter !== "festivals_all" &&
        card.festival_category !== promoCategoryFilter
      ) {
        return false;
      }
      if (promoStatusFilter === "on" && !card.is_active) return false;
      if (promoStatusFilter === "off" && card.is_active) return false;
      const hasManualOverride = promoPopupDbRecords.some(
        (r) => r.id === card.id && !r.is_deleted && typeof r.is_active === "boolean"
      );
      if (promoModeFilter === "auto" && hasManualOverride) return false;
      if (promoModeFilter === "manual" && !hasManualOverride) return false;
      if (promoSearch.trim()) {
        const q = promoSearch.toLowerCase();
        const hay = `${card.title_label} ${card.headline_en} ${card.headline_hi} ${card.brand_subtitle_en} ${card.festival_date_label || ""} ${card.description_en}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [adminPromoPopups, promoCategoryFilter, promoStatusFilter, promoModeFilter, promoSearch, promoPopupDbRecords]);

  const filteredActivityLogs = useMemo(() => {
    let result = activityLogs;
    if (activityRoleFilter !== "all") result = result.filter(a => a.user_role === activityRoleFilter);
    if (activityEntityFilter !== "all") result = result.filter(a => a.entity_type === activityEntityFilter);
    if (activityDateFilter !== "all") result = result.filter(a => isWithinDays(a.created_at, activityDateFilter));
    if (activitySearch) result = result.filter(a => s(a.action, activitySearch) || s(a.entity_type, activitySearch) || s(a.details || "", activitySearch) || s(a.user_email || "", activitySearch));
    return [...result].sort((a, b) => {
      if (activitySort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [activityLogs, activitySearch, activityDateFilter, activityRoleFilter, activityEntityFilter, activitySort]);

  // ── Activity Log CRUD ────────────────────────────────────────────────────
  const handleActivityDelete = async (id: string) => {
    const { error } = await backend.from("activity_logs").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: String(error), variant: "destructive" });
    } else {
      setActivityLogs((prev) => prev.filter((a) => a.id !== id));
      setActivitySelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
      toast({ title: "Log deleted", description: "Activity record removed." });
    }
    setActivityDeleteConfirmId(null);
  };

  const handleActivityBulkDelete = async () => {
    const ids = [...activitySelectedIds];
    let failed = 0;
    for (const id of ids) {
      const { error } = await backend.from("activity_logs").delete().eq("id", id);
      if (error) failed++;
      else setActivityLogs((prev) => prev.filter((a) => a.id !== id));
    }
    setActivitySelectedIds(new Set());
    setActivityBulkDeleteConfirm(false);
    toast({
      title: failed ? `Deleted ${ids.length - failed}/${ids.length}` : `Deleted ${ids.length} logs`,
      description: failed ? `${failed} deletions failed.` : "Selected logs removed.",
      variant: failed ? "destructive" : "default",
    });
  };

  const handleActivityEditSave = async () => {
    if (!activityEditLog) return;
    setActivityEditSaving(true);
    const { error } = await backend
      .from("activity_logs")
      .update({ action: activityEditAction.trim(), details: activityEditDetails.trim() || null })
      .eq("id", activityEditLog.id);
    if (error) {
      toast({ title: "Update failed", description: String(error), variant: "destructive" });
    } else {
      setActivityLogs((prev) =>
        prev.map((a) =>
          a.id === activityEditLog.id
            ? { ...a, action: activityEditAction.trim(), details: activityEditDetails.trim() || null }
            : a
        )
      );
      toast({ title: "Log updated", description: "Activity record saved." });
      setActivityEditLog(null);
    }
    setActivityEditSaving(false);
  };

  const toggleActivitySelect = (id: string) => {
    setActivitySelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const toggleActivitySelectAll = (pageItems: ActivityLog[]) => {
    const allSelected = pageItems.every((a) => activitySelectedIds.has(a.id));
    if (allSelected) {
      setActivitySelectedIds((prev) => {
        const next = new Set(prev);
        pageItems.forEach((a) => next.delete(a.id));
        return next;
      });
    } else {
      setActivitySelectedIds((prev) => {
        const next = new Set(prev);
        pageItems.forEach((a) => next.add(a.id));
        return next;
      });
    }
  };
  // ────────────────────────────────────────────────────────────────────────

  // Buffalo status changer
  const handleUpdateBuffaloStatus = async (id: string, newStatus: string) => {
    const isAvailable = newStatus !== "out_of_stock";
    const existingBuffalo = buffaloListings.find((b) => b.id === id);
    const enrichedFallback = existingBuffalo
      ? enrichBuffaloToNewStock(existingBuffalo, buffaloListings.indexOf(existingBuffalo))
      : null;
    const fullUpdatedRecord: BuffaloListingAdmin = existingBuffalo
      ? {
          ...enrichedFallback,
          ...existingBuffalo,
          status: newStatus,
          is_available: isAvailable,
        }
      : ({
          id,
          status: newStatus,
          is_available: isAvailable,
        } as BuffaloListingAdmin);

    // 1. Immediately update local state + broadcast live override to User pages (Buffaloes.tsx & BreedDetail.tsx)
    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus, is_available: isAvailable } : b))
    );
    if (previewBuffaloDetail?.id === id) {
      setPreviewBuffaloDetail((prev) =>
        prev ? { ...prev, status: newStatus, is_available: isAvailable } : null
      );
    }

    // 2. Persist in backend SQLite (with automatic insert fallback if record wasn't in DB yet)
    const { data, error } = await backend
      .from("buffalo_listings")
      .update({ status: newStatus, is_available: isAvailable })
      .eq("id", id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0)) && existingBuffalo) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    if (error) {
      toast({ title: "Failed to update status in database", description: error.message, variant: "destructive" });
      return;
    }

    const codeLabel = fullUpdatedRecord.stock_code ? `${fullUpdatedRecord.stock_code} ` : "";
    const statusLabel =
      newStatus === "out_of_stock"
        ? "Out of Stock"
        : newStatus === "limited_stock"
        ? "Limited Stock"
        : "In Stock (Send Enquiry)";
    toast({
      title: "Buffalo Status Updated! 🐃",
      description: `${codeLabel}${fullUpdatedRecord.name || "Listing"} marked as "${statusLabel}". User side updated automatically!`,
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Toggle between "New Stocks (AKB)" and "All 10 Buffalo Breeds (BRD)" on any buffalo row
  const handleToggleNewStock = async (buffalo: BuffaloListingAdmin) => {
    const currentIsNew = isBuffaloNewStock(buffalo);
    const nextIsNew = !currentIsNew;
    const enriched = enrichBuffaloToNewStock(buffalo, buffaloListings.indexOf(buffalo));
    const nextStockCode = buffalo.stock_code || enriched.stock_code;
    const payload = {
      is_new_stock: nextIsNew,
      stock_code: nextStockCode,
      subtitle_label: buffalo.subtitle_label || enriched.subtitle_label,
      lactation: buffalo.lactation || enriched.lactation,
      pregnancy_status: buffalo.pregnancy_status || enriched.pregnancy_status,
      calf_details: buffalo.calf_details || enriched.calf_details,
      health_records: buffalo.health_records || enriched.health_records,
    };
    const fullUpdatedRecord: BuffaloListingAdmin = {
      ...enriched,
      ...buffalo,
      ...payload,
    };

    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) => (b.id === buffalo.id ? { ...b, ...payload } : b))
    );
    if (previewBuffaloDetail?.id === buffalo.id) {
      setPreviewBuffaloDetail((prev) => (prev ? { ...prev, ...payload } : null));
    }

    const { data, error } = await backend
      .from("buffalo_listings")
      .update(payload)
      .eq("id", buffalo.id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    if (error) {
      toast({ title: "Failed to update buffalo section", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: nextIsNew ? "Moved to New Stocks! ✨" : "Moved to All 10 Buffalo Breeds! 🐃",
      description: nextIsNew
        ? `${nextStockCode} (${buffalo.name}) now appears in the "New Stocks" tab on the website.`
        : `${nextStockCode} (${buffalo.name}) now appears in the "Explore All 10 Buffalo Breeds" tab on the website.`,
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  const getDefaultBreedImage = (breed: string) => {
    return getDefaultBreedImagePath(breed);
  };

  // Strictly 1 Preset Photo for buffaloes: shows only the 1 selected photo, removing all other photos
  const dynamicPhoto1Presets = useMemo(() => {
    if (buffaloForm.image_url === "") return [];
    const currentVal = buffaloForm.image_url?.trim() || getDefaultBreedImagePath(buffaloForm.breed);
    if (!currentVal) return [];
    const preview = resolveBuffaloImage({ breed: buffaloForm.breed, image_url: currentVal }, 0, buffaloForm.breed);
    return [
      {
        label: `${buffaloForm.breed} (Selected Photo 1)`,
        value: currentVal,
        preview: preview || currentVal,
      },
    ];
  }, [buffaloForm.breed, buffaloForm.image_url]);

  const dynamicPhoto2Presets = useMemo(() => {
    const currentVal = buffaloForm.extra_image_url?.trim();
    if (!currentVal) return [];
    const preview = resolveBuffaloImage({ breed: buffaloForm.breed, image_url: currentVal }, 1, buffaloForm.breed);
    return [
      {
        label: `${buffaloForm.breed} (Selected Photo 2)`,
        value: currentVal,
        preview: preview || currentVal,
      },
    ];
  }, [buffaloForm.breed, buffaloForm.extra_image_url]);

  const getNextStockCode = (forNewStock = true) => {
    const prefix = forNewStock ? "AKB" : "BRD";
    const regex = forNewStock ? /^AKB-\d+$/i : /^BRD-\d+$/i;
    const defaultCount = forNewStock
      ? DEFAULT_NEW_STOCK_PROFILES.length
      : DEFAULT_BREED_CATALOG_PROFILES.length;
    const existingCodes = buffaloListings
      .map((b) => b.stock_code || "")
      .filter((c) => regex.test(c))
      .map((c) => parseInt(c.replace(/[^0-9]/g, ""), 10));
    const maxNum = existingCodes.length > 0 ? Math.max(...existingCodes) : defaultCount;
    return `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const handleOpenAddNewStock = () => {
    const nextCode = getNextStockCode(true);
    setIsCreatingBuffalo(true);
    setEditingBuffalo(null);
    setBuffaloForm({
      stock_code: nextCode,
      subtitle_label: "Murrah Buffalo (With Calf)",
      name: "Murrah Buffalo (With Calf)",
      breed: "Murrah",
      price: 120000,
      is_negotiable: true,
      age: "4 Years",
      weight: "550 kg",
      milk_yield: "14 L/day",
      lactation: "2nd Lactation",
      location: "",
      pregnancy_status: "Pregnant (3 Months)",
      calf_details: "With Calf",
      health_records: "Vaccinated & Vet Certified",
      video_url: BUFFALO_VIDEO_PRESETS[0].value,
      description: "High-yielding healthy dairy buffalo with verified vaccination and pedigree records.",
      image_url: "/murrah1.jpg",
      extra_image_url: "/murrah2.jpg",
      status: "available",
      is_new_stock: true,
    });
    setEditBuffaloModal(true);
  };

  const handleOpenAddBuffalo = () => {
    const nextCode = getNextStockCode(false);
    setIsCreatingBuffalo(true);
    setEditingBuffalo(null);
    setBuffaloForm({
      stock_code: nextCode,
      subtitle_label: "Murrah Buffalo (With Calf)",
      name: "Murrah Buffalo",
      breed: "Murrah",
      price: 125000,
      is_negotiable: true,
      age: "4 Years",
      weight: "550 kg",
      milk_yield: "14 L/day",
      lactation: "2nd Lactation",
      location: "",
      pregnancy_status: "Pregnant (3 Months)",
      calf_details: "With Calf",
      health_records: "Vaccinated & Vet Certified",
      video_url: BUFFALO_VIDEO_PRESETS[0].value,
      description: "Purebred dairy buffalo with verified milk yield, 2-photo gallery, and complete health records.",
      image_url: "/murrah1.jpg",
      extra_image_url: "/murrah2.jpg",
      status: "available",
      is_new_stock: false,
    });
    setEditBuffaloModal(true);
  };

  const handleEditBuffalo = (buffalo: BuffaloListingAdmin) => {
    const enriched = enrichBuffaloToNewStock(buffalo, buffaloListings.indexOf(buffalo));
    const extraImg = Array.isArray(buffalo.extra_images) && buffalo.extra_images.length > 0
      ? (buffalo.extra_images[0] ?? "")
      : "";
    const resolvedVideo = buffalo.video_url !== undefined && buffalo.video_url !== null
      ? buffalo.video_url
      : (enriched.video_url ?? "");
    const resolvedImage = buffalo.image_url !== undefined && buffalo.image_url !== null
      ? buffalo.image_url
      : (enriched.image_url ?? "");

    setIsCreatingBuffalo(false);
    setEditingBuffalo(buffalo);
    setBuffaloForm({
      stock_code: buffalo.stock_code || enriched.stock_code,
      subtitle_label: buffalo.subtitle_label || enriched.subtitle_label,
      name: buffalo.name || enriched.name || "",
      breed: buffalo.breed || enriched.breed || "Jaffarabadi",
      price: buffalo.price || enriched.price || 105000,
      is_negotiable: buffalo.is_negotiable ?? enriched.is_negotiable ?? true,
      age: buffalo.age || enriched.age || "4 Years",
      weight: buffalo.weight || enriched.weight || "520 kg",
      milk_yield: buffalo.milk_yield || enriched.milk_yield || "12 L/day",
      lactation: buffalo.lactation || enriched.lactation,
      location: "",
      pregnancy_status: buffalo.pregnancy_status || enriched.pregnancy_status,
      calf_details: buffalo.calf_details || enriched.calf_details,
      health_records: buffalo.health_records || enriched.health_records,
      video_url: resolvedVideo,
      description: buffalo.description || enriched.description || "",
      image_url: resolvedImage,
      extra_image_url: extraImg,
      status: buffalo.status || (buffalo.is_available === false ? "out_of_stock" : "available"),
      is_new_stock: isBuffaloNewStock(buffalo),
    });
    setEditBuffaloModal(true);
  };

  // Upload buffalo photo 1 (Main Photo) inside Add/Edit modal
  const sanitizeMediaUrl = (url?: string | null): string => {
    if (!url) return "";
    const trimmed = url.trim();
    if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
    return trimmed.includes("?") ? `${trimmed}&t=${Date.now()}` : `${trimmed}?t=${Date.now()}`;
  };

  // Upload buffalo photo 1 (Main Profile Photo) inside Add/Edit modal
  const handleBuffaloImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please choose an image file (JPG, PNG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please select an image under 15 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const targetId = editingBuffalo?.id || `buffalo-${Date.now()}`;
      const filePath = `${targetId}/photo-1-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Photo upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      setBuffaloForm((prev) => ({ ...prev, image_url: publicUrl }));
      toast({ title: "Main Buffalo Photo Uploaded! 📸", description: "Click Save to apply this photo to the listing." });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Upload buffalo photo 2 (Second Photo / Alternate Angle) inside Add/Edit modal
  const handleBuffaloExtraImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please choose an image file (JPG, PNG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please select an image under 15 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloExtraImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const targetId = editingBuffalo?.id || `buffalo-${Date.now()}`;
      const filePath = `${targetId}/photo-2-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Second photo upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      setBuffaloForm((prev) => ({ ...prev, extra_image_url: publicUrl }));
      toast({ title: "Second Buffalo Photo Uploaded! 📸", description: "Click Save to apply this photo to the listing." });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloExtraImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Direct quick photo upload from Buffalo table row
  const handleQuickBuffaloImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = quickBuffaloUploadTarget;
    if (!file || !target) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please select an image under 15 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${target.id}/photo-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...target,
        image_url: publicUrl,
      };
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, image_url: publicUrl } : b))
      );
      if (previewBuffaloDetail?.id === target.id) {
        setPreviewBuffaloDetail((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
      }
      const { data: dbData, error: dbErr } = await backend
        .from("buffalo_listings")
        .update({ image_url: publicUrl })
        .eq("id", target.id)
        .select("*");
      if (!dbErr && (!dbData || (Array.isArray(dbData) && dbData.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
      if (dbErr) {
        toast({ title: "Failed to save image URL", description: dbErr.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Buffalo Photo Updated! 🐃",
        description: `Updated photo for ${target.name}. Live on the website immediately.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloImage(false);
      setQuickBuffaloUploadTarget(null);
      if (e.target) e.target.value = "";
    }
  };

  // Upload buffalo video inside Add/Edit modal
  const handleBuffaloVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file type", description: "Please choose a video file (MP4, WebM, MOV).", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video too large", description: "Please select a video under 100 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloVideo(true);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const targetId = editingBuffalo?.id || `buffalo-${Date.now()}`;
      const filePath = `${targetId}/video-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Video upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      setBuffaloForm((prev) => ({ ...prev, video_url: publicUrl }));
      toast({ title: "Buffalo Video Uploaded! 🎬", description: "Click Save to apply this video to the listing." });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloVideo(false);
      if (e.target) e.target.value = "";
    }
  };

  // Remove Photo 1 from buffalo details
  const handleRemoveBuffaloImage = async () => {
    setBuffaloForm((prev) => ({ ...prev, image_url: "" }));
    if (editingBuffalo) {
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...editingBuffalo,
        image_url: "",
      };
      setEditingBuffalo(fullUpdatedRecord);
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === editingBuffalo.id ? { ...b, image_url: "" } : b))
      );
      if (previewBuffaloDetail?.id === editingBuffalo.id) {
        setPreviewBuffaloDetail((prev) => (prev ? { ...prev, image_url: "" } : null));
      }
      const { data, error } = await backend
        .from("buffalo_listings")
        .update({ image_url: "" })
        .eq("id", editingBuffalo.id)
        .select("*");
      if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
    }
    toast({
      title: "Photo 1 Removed 🗑️",
      description: "Main profile photo removed. You can upload a new photo or select a preset.",
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Remove Photo 2 from buffalo details
  const handleRemoveBuffaloExtraImage = async () => {
    setBuffaloForm((prev) => ({ ...prev, extra_image_url: "" }));
    if (editingBuffalo) {
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...editingBuffalo,
        extra_images: [],
      };
      setEditingBuffalo(fullUpdatedRecord);
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === editingBuffalo.id ? { ...b, extra_images: [] } : b))
      );
      if (previewBuffaloDetail?.id === editingBuffalo.id) {
        setPreviewBuffaloDetail((prev) => (prev ? { ...prev, extra_images: [] } : null));
      }
      const { data, error } = await backend
        .from("buffalo_listings")
        .update({ extra_images: [] })
        .eq("id", editingBuffalo.id)
        .select("*");
      if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
    }
    toast({
      title: "Photo 2 Removed 🗑️",
      description: "Second photo removed. You can upload a new photo or select a preset.",
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Remove Buffalo Video from buffalo details
  const handleRemoveBuffaloVideo = async () => {
    setBuffaloForm((prev) => ({ ...prev, video_url: "" }));
    if (editingBuffalo) {
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...editingBuffalo,
        video_url: null,
      };
      setEditingBuffalo(fullUpdatedRecord);
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === editingBuffalo.id ? { ...b, video_url: null } : b))
      );
      if (previewBuffaloDetail?.id === editingBuffalo.id) {
        setPreviewBuffaloDetail((prev) => (prev ? { ...prev, video_url: null } : null));
      }
      const { data, error } = await backend
        .from("buffalo_listings")
        .update({ video_url: null })
        .eq("id", editingBuffalo.id)
        .select("*");
      if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
    }
    toast({
      title: "Buffalo Video Removed 🎬🗑️",
      description: "Video removed from buffalo details. You can upload a new video or choose a preset.",
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Direct quick video upload from Buffalo table row
  const handleQuickBuffaloVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = quickBuffaloVideoTarget;
    if (!file || !target) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file type", description: "Please select a video file (MP4, WebM, MOV).", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video too large", description: "Please select a video under 100 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloVideo(true);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const filePath = `${target.id}/video-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...target,
        video_url: publicUrl,
      };
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, video_url: publicUrl } : b))
      );
      if (previewBuffaloDetail?.id === target.id) {
        setPreviewBuffaloDetail((prev) => (prev ? { ...prev, video_url: publicUrl } : null));
      }
      const { data: dbData, error: dbErr } = await backend
        .from("buffalo_listings")
        .update({ video_url: publicUrl })
        .eq("id", target.id)
        .select("*");
      if (!dbErr && (!dbData || (Array.isArray(dbData) && dbData.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
      if (dbErr) {
        toast({ title: "Failed to save video URL", description: dbErr.message, variant: "destructive" });
        return;
      }
      toast({
        title: "Buffalo Video Updated! 🎬🐃",
        description: `Updated video for ${target.name}. Live on the website immediately.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloVideo(false);
      setQuickBuffaloVideoTarget(null);
      if (e.target) e.target.value = "";
    }
  };

  // Quick Photo 1 upload from Buffalo Details modal
  const handleDetailPhoto1Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = previewBuffaloDetail;
    if (!file || !target) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please select an image under 15 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${target.id}/photo1-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...target,
        image_url: publicUrl,
      };
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, image_url: publicUrl } : b))
      );
      setPreviewBuffaloDetail((prev) => (prev ? { ...prev, image_url: publicUrl } : null));
      const { data: dbData, error: dbErr } = await backend
        .from("buffalo_listings")
        .update({ image_url: publicUrl })
        .eq("id", target.id)
        .select("*");
      if (!dbErr && (!dbData || (Array.isArray(dbData) && dbData.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
      toast({
        title: "Photo 1 Updated! 📸",
        description: `Main photo for ${target.name} updated. Live on website immediately.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Quick Photo 2 upload from Buffalo Details modal
  const handleDetailPhoto2Upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = previewBuffaloDetail;
    if (!file || !target) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Please select an image under 15 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloExtraImage(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const filePath = `${target.id}/photo2-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...target,
        extra_images: [publicUrl],
      };
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, extra_images: [publicUrl] } : b))
      );
      setPreviewBuffaloDetail((prev) => (prev ? { ...prev, extra_images: [publicUrl] } : null));
      const { data: dbData, error: dbErr } = await backend
        .from("buffalo_listings")
        .update({ extra_images: [publicUrl] })
        .eq("id", target.id)
        .select("*");
      if (!dbErr && (!dbData || (Array.isArray(dbData) && dbData.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
      toast({
        title: "Photo 2 Updated! 📸",
        description: `Second photo for ${target.name} updated. Live on website immediately.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloExtraImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Quick Video upload from Buffalo Details modal
  const handleDetailVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = previewBuffaloDetail;
    if (!file || !target) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file type", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video too large", description: "Please select a video under 100 MB.", variant: "destructive" });
      return;
    }
    setUploadingBuffaloVideo(true);
    try {
      const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
      const filePath = `${target.id}/video-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("buffaloes").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("buffaloes").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const fullUpdatedRecord: BuffaloListingAdmin = {
        ...target,
        video_url: publicUrl,
      };
      saveBuffaloLiveOverride(fullUpdatedRecord);
      setBuffaloListings((prev) =>
        prev.map((b) => (b.id === target.id ? { ...b, video_url: publicUrl } : b))
      );
      setPreviewBuffaloDetail((prev) => (prev ? { ...prev, video_url: publicUrl } : null));
      const { data: dbData, error: dbErr } = await backend
        .from("buffalo_listings")
        .update({ video_url: publicUrl })
        .eq("id", target.id)
        .select("*");
      if (!dbErr && (!dbData || (Array.isArray(dbData) && dbData.length === 0))) {
        await backend.from("buffalo_listings").insert(fullUpdatedRecord);
      }
      toast({
        title: "Video Updated! 🎬",
        description: `Video for ${target.name} updated. Live on website immediately.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingBuffaloVideo(false);
      if (e.target) e.target.value = "";
    }
  };

  // Quick Remove Photo 1 from Detail modal
  const handleDetailRemovePhoto1 = async () => {
    const target = previewBuffaloDetail;
    if (!target) return;
    const fullUpdatedRecord: BuffaloListingAdmin = {
      ...target,
      image_url: "",
    };
    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) => (b.id === target.id ? { ...b, image_url: "" } : b))
    );
    setPreviewBuffaloDetail((prev) => (prev ? { ...prev, image_url: "" } : null));
    const { data, error } = await backend
      .from("buffalo_listings")
      .update({ image_url: "" })
      .eq("id", target.id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    toast({ title: "Photo 1 Removed 🗑️", description: "Main photo removed. Click '+ Add Photo 1' to attach a new one." });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Quick Remove Photo 2 from Detail modal
  const handleDetailRemovePhoto2 = async () => {
    const target = previewBuffaloDetail;
    if (!target) return;
    const fullUpdatedRecord: BuffaloListingAdmin = {
      ...target,
      extra_images: [],
    };
    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) => (b.id === target.id ? { ...b, extra_images: [] } : b))
    );
    setPreviewBuffaloDetail((prev) => (prev ? { ...prev, extra_images: [] } : null));
    const { data, error } = await backend
      .from("buffalo_listings")
      .update({ extra_images: [] })
      .eq("id", target.id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    toast({ title: "Photo 2 Removed 🗑️", description: "Photo 2 removed. Click '+ Add Photo 2' to attach a new one." });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // Quick Remove Video from Detail modal
  const handleDetailRemoveVideo = async () => {
    const target = previewBuffaloDetail;
    if (!target) return;
    const fullUpdatedRecord: BuffaloListingAdmin = {
      ...target,
      video_url: null,
    };
    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) => (b.id === target.id ? { ...b, video_url: null } : b))
    );
    setPreviewBuffaloDetail((prev) => (prev ? { ...prev, video_url: null } : null));
    setPreviewBuffaloPlayingVideo(false);
    const { data, error } = await backend
      .from("buffalo_listings")
      .update({ video_url: null })
      .eq("id", target.id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    toast({ title: "Video Removed 🎬🗑️", description: "Video removed from buffalo details." });
    if (sound.isEnabled()) sound.playSuccess();
  };

  const handleSaveBuffalo = async () => {
    if (!buffaloForm.name.trim()) {
      toast({ title: "Name required", description: "Please enter a buffalo listing name.", variant: "destructive" });
      return;
    }
    setSavingBuffalo(true);
    const isAvailable = buffaloForm.status !== "out_of_stock";
    const resolvedImageUrl = buffaloForm.image_url?.trim() || "";
    const resolvedVideoUrl = buffaloForm.video_url?.trim() || null;
    const resolvedStockCode =
      buffaloForm.stock_code?.trim() || getNextStockCode(Boolean(buffaloForm.is_new_stock));
    const resolvedSubtitle =
      buffaloForm.subtitle_label?.trim() ||
      `${buffaloForm.breed} Buffalo (${buffaloForm.calf_details || "With Calf"})`;

    if (isCreatingBuffalo) {
      const newPayload = {
        stock_code: resolvedStockCode,
        subtitle_label: resolvedSubtitle,
        name: buffaloForm.name.trim(),
        breed: buffaloForm.breed,
        price: Number(buffaloForm.price) || 85000,
        is_negotiable: Boolean(buffaloForm.is_negotiable),
        age: buffaloForm.age.trim() || "4 Years",
        weight: buffaloForm.weight.trim() || "500 kg",
        milk_yield: buffaloForm.milk_yield.trim() || "12 - 14 L/Day",
        lactation: buffaloForm.lactation.trim() || "2nd Lactation",
        location: "",
        pregnancy_status: buffaloForm.pregnancy_status.trim() || "Milking (Freshly Calved)",
        calf_details: buffaloForm.calf_details.trim() || "With Calf",
        health_records: buffaloForm.health_records.trim() || "Vaccinated & Vet Certified",
        video_url: resolvedVideoUrl,
        description: buffaloForm.description.trim() || null,
        image_url: resolvedImageUrl || getDefaultBreedImage(buffaloForm.breed),
        extra_images: buffaloForm.extra_image_url?.trim() ? [buffaloForm.extra_image_url.trim()] : [],
        status: buffaloForm.status,
        is_available: isAvailable,
        is_new_stock: Boolean(buffaloForm.is_new_stock),
      };
      const newRecordId = buffaloForm.is_new_stock
        ? `new-stock-${Date.now()}`
        : `breed-catalog-${Date.now()}`;
      const { data, error } = await backend
        .from("buffalo_listings")
        .insert({ id: newRecordId, ...newPayload })
        .select("*")
        .single();
      setSavingBuffalo(false);
      if (error) {
        toast({ title: "Failed to add buffalo", description: error.message, variant: "destructive" });
        return;
      }
      const createdRecord = (data as unknown as BuffaloListingAdmin) || {
        id: newRecordId,
        ...newPayload,
        created_at: new Date().toISOString(),
      };
      saveBuffaloLiveOverride(createdRecord);
      setBuffaloListings((prev) => [createdRecord, ...prev]);
      setEditBuffaloModal(false);
      toast({
        title: buffaloForm.is_new_stock ? "New Stock Added! ✨🐃" : "Breed Catalog Buffalo Added! 🐃",
        description: buffaloForm.is_new_stock
          ? `${resolvedStockCode} — ${createdRecord.name} (${createdRecord.breed}) is now live in the New Stocks tab!`
          : `${resolvedStockCode} — ${createdRecord.name} (${createdRecord.breed}) is now live in the All 10 Buffalo Breeds tab!`,
      });
      if (sound.isEnabled()) sound.playSuccess();
      return;
    }

    if (!editingBuffalo) {
      setSavingBuffalo(false);
      return;
    }

    const updatedPayload = {
      stock_code: resolvedStockCode,
      subtitle_label: resolvedSubtitle,
      name: buffaloForm.name.trim(),
      breed: buffaloForm.breed,
      price: Number(buffaloForm.price) || 85000,
      is_negotiable: Boolean(buffaloForm.is_negotiable),
      age: buffaloForm.age.trim(),
      weight: buffaloForm.weight.trim(),
      milk_yield: buffaloForm.milk_yield.trim(),
      lactation: buffaloForm.lactation.trim(),
      location: "",
      pregnancy_status: buffaloForm.pregnancy_status.trim(),
      calf_details: buffaloForm.calf_details.trim(),
      health_records: buffaloForm.health_records.trim(),
      video_url: resolvedVideoUrl,
      description: buffaloForm.description.trim(),
      image_url: resolvedImageUrl,
      extra_images: buffaloForm.extra_image_url?.trim() ? [buffaloForm.extra_image_url.trim()] : [],
      status: buffaloForm.status,
      is_available: isAvailable,
      is_new_stock: Boolean(buffaloForm.is_new_stock),
    };

    const fullUpdatedRecord: BuffaloListingAdmin = {
      ...editingBuffalo,
      ...updatedPayload,
    };
    saveBuffaloLiveOverride(fullUpdatedRecord);
    setBuffaloListings((prev) =>
      prev.map((b) =>
        b.id === editingBuffalo.id
          ? {
              ...b,
              ...updatedPayload,
            }
          : b
      )
    );
    if (previewBuffaloDetail?.id === editingBuffalo.id) {
      setPreviewBuffaloDetail((prev) => (prev ? { ...prev, ...updatedPayload } : null));
    }

    const { data, error } = await backend
      .from("buffalo_listings")
      .update(updatedPayload)
      .eq("id", editingBuffalo.id)
      .select("*");
    if (!error && (!data || (Array.isArray(data) && data.length === 0))) {
      await backend.from("buffalo_listings").insert(fullUpdatedRecord);
    }
    setSavingBuffalo(false);
    if (error) {
      toast({ title: "Failed to save buffalo", description: error.message, variant: "destructive" });
      return;
    }
    setEditBuffaloModal(false);
    toast({
      title: "Buffalo & Stock Details Updated! ✅",
      description: `Updated ${resolvedStockCode} (${buffaloForm.name}) across Website & Admin Panel.`,
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  const handleDeleteBuffalo = async (buffalo: BuffaloListingAdmin) => {
    removeBuffaloLiveOverride(buffalo.id);
    setBuffaloListings((prev) => prev.filter((b) => b.id !== buffalo.id));
    if (previewBuffaloDetail?.id === buffalo.id) {
      setPreviewBuffaloDetail(null);
    }
    const { error } = await backend.from("buffalo_listings").delete().eq("id", buffalo.id);
    if (error) {
      toast({ title: "Failed to delete buffalo", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Buffalo Listing Removed", description: `${buffalo.name} has been removed.` });
  };

  // --- GALLERY PHOTOS & VIDEOS HANDLERS (Admin Panel Only) ---
  const handleOpenAddGallery = (defaultType: "image" | "video" = "image") => {
    const nextPhotoNum = adminGalleryItems.filter((i) => i.type === "image").length + 1;
    const nextVideoNum = adminGalleryItems.filter((i) => i.type === "video").length + 1;
    const defaultTitle =
      defaultType === "video"
        ? `AK Buffaloes Farm Video #${nextVideoNum}`
        : `AK Buffaloes Farm Photo #${nextPhotoNum}`;
    const defaultDesc =
      defaultType === "video"
        ? "Live video showcase from AK Buffaloes dairy farm and breeding center."
        : "High-resolution photograph from AK Buffaloes dairy farm and breeding showcase.";

    setIsCreatingGalleryItem(true);
    setEditingGalleryItem(null);
    setGalleryForm({
      type: defaultType,
      src: "",
      title: defaultTitle,
      alt: defaultTitle,
      description: defaultDesc,
    });
    setEditGalleryModal(true);
  };

  // Multi-file bulk upload handler to add multiple photos & videos at once
  const handleBulkGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploadingGalleryMedia(true);
    let addedPhotos = 0;
    let addedVideos = 0;
    const newlyInserted: GalleryItemDbRecord[] = [];
    let currentPhotoIdx = adminGalleryItems.filter((i) => i.type === "image").length;
    let currentVideoIdx = adminGalleryItems.filter((i) => i.type === "video").length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isVideo = file.type.startsWith("video/");
        const isImage = file.type.startsWith("image/");
        if (!isVideo && !isImage) continue;
        if (file.size > 55 * 1024 * 1024) {
          toast({
            title: `Skipped ${file.name}`,
            description: "File exceeds the 55 MB limit.",
            variant: "destructive",
          });
          continue;
        }

        const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
        const mediaType: "image" | "video" = isVideo ? "video" : "image";
        const uniqueStamp = `${Date.now()}-${i}`;
        const targetId = `custom-${mediaType === "video" ? "vid" : "img"}-${uniqueStamp}`;
        const filePath = `${targetId}/${mediaType}-${uniqueStamp}.${ext}`;

        const { data: uploadData, error: uploadError } = await backend.storage
          .from("gallery")
          .upload(filePath, file, { upsert: true });
        if (uploadError) {
          toast({
            title: `Upload failed for ${file.name}`,
            description: uploadError.message,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = backend.storage.from("gallery").getPublicUrl(filePath);
        const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);

        if (isVideo) {
          currentVideoIdx += 1;
          addedVideos += 1;
        } else {
          currentPhotoIdx += 1;
          addedPhotos += 1;
        }

        const rawName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ").trim();
        const autoTitle =
          rawName && !/^(img|vid|dsc|whatsapp|video|image|photo)\s*\d*$/i.test(rawName)
            ? rawName.charAt(0).toUpperCase() + rawName.slice(1)
            : isVideo
            ? `AK Buffaloes Farm Video #${currentVideoIdx}`
            : `AK Buffaloes Farm Photo #${currentPhotoIdx}`;

        const newRecord: GalleryItemDbRecord = {
          id: targetId,
          type: mediaType,
          src: publicUrl,
          title: autoTitle,
          alt: autoTitle,
          description: isVideo
            ? "Live video showcase from AK Buffaloes dairy farm and breeding center."
            : "High-resolution photograph from AK Buffaloes dairy farm and breeding showcase.",
          is_deleted: false,
          created_at: new Date().toISOString(),
        };

        const { data, error: dbErr } = await backend
          .from("gallery_items")
          .insert(newRecord)
          .select("*")
          .single();

        if (!dbErr) {
          newlyInserted.push((data as unknown as GalleryItemDbRecord) || newRecord);
        }
      }

      if (newlyInserted.length > 0) {
        setGalleryDbRecords((prev) => [...newlyInserted, ...prev]);
        const summaryParts: string[] = [];
        if (addedPhotos > 0) summaryParts.push(`${addedPhotos} new photo(s)`);
        if (addedVideos > 0) summaryParts.push(`${addedVideos} new video(s)`);
        toast({
          title: "Added to Website Gallery! 🎉",
          description: `Successfully added ${summaryParts.join(" and ")} to the Gallery.`,
        });
        if (sound.isEnabled()) sound.playSuccess();
      }
    } finally {
      setUploadingGalleryMedia(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleOpenEditGallery = (item: GalleryItem) => {
    setIsCreatingGalleryItem(false);
    setEditingGalleryItem(item);
    setGalleryForm({
      type: item.type,
      src: item.src,
      title: item.title,
      alt: item.alt,
      description: item.description,
    });
    setEditGalleryModal(true);
  };

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast({
        title: "Unsupported file format",
        description: "Please upload an image (JPG, PNG, WEBP) or video (MP4, WebM).",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 55 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 55 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingGalleryMedia(true);
    try {
      const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
      const mediaType: "image" | "video" = isVideo ? "video" : "image";
      const targetId = editingGalleryItem?.id || `gallery-${Date.now()}`;
      const filePath = `${targetId}/${mediaType}-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("gallery").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Media upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("gallery").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setGalleryForm((prev) => ({
        ...prev,
        type: mediaType,
        src: publicUrl,
        title: prev.title || cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        alt: prev.alt || cleanName,
      }));
      toast({
        title: isVideo ? "Video Uploaded! 🎬" : "Photo Uploaded! 📸",
        description: "Click Save to publish to the Gallery.",
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingGalleryMedia(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleQuickGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = quickGalleryUploadTarget;
    if (!file || !target) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast({ title: "Invalid file", description: "Please choose an image or video file.", variant: "destructive" });
      return;
    }
    if (file.size > 55 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum upload size is 55 MB.", variant: "destructive" });
      return;
    }
    setUploadingGalleryMedia(true);
    try {
      const ext = (file.name.split(".").pop() || (isVideo ? "mp4" : "jpg")).toLowerCase();
      const newType: "image" | "video" = isVideo ? "video" : "image";
      const filePath = `${target.id}/${newType}-${Date.now()}.${ext}`;
      const { data: uploadData, error: uploadError } = await backend.storage.from("gallery").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = backend.storage.from("gallery").getPublicUrl(filePath);
      const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);

      const existingDb = galleryDbRecords.find((r) => r.id === target.id);
      const recordPayload: GalleryItemDbRecord = {
        id: target.id,
        type: newType,
        src: publicUrl,
        title: target.title,
        alt: target.alt,
        description: target.description,
        is_deleted: false,
      };

      if (existingDb) {
        const { error } = await backend.from("gallery_items").update(recordPayload).eq("id", target.id);
        if (error) {
          toast({ title: "Database update failed", description: error.message, variant: "destructive" });
          return;
        }
        setGalleryDbRecords((prev) => prev.map((r) => (r.id === target.id ? { ...r, ...recordPayload } : r)));
      } else {
        const { error } = await backend.from("gallery_items").insert(recordPayload);
        if (error) {
          toast({ title: "Database save failed", description: error.message, variant: "destructive" });
          return;
        }
        setGalleryDbRecords((prev) => [recordPayload, ...prev]);
      }

      toast({
        title: "Gallery Media Replaced! ✨",
        description: `Updated "${target.title}" with new ${newType === "video" ? "video" : "photo"}.`,
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setUploadingGalleryMedia(false);
      setQuickGalleryUploadTarget(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleSaveGalleryItem = async (keepOpenForAnother = false) => {
    if (!galleryForm.src.trim()) {
      toast({
        title: "Media required",
        description: "Please upload a photo/video from your device or enter a media URL.",
        variant: "destructive",
      });
      return;
    }
    const nextCount =
      adminGalleryItems.filter((i) => i.type === galleryForm.type).length + 1;
    const effectiveTitle =
      galleryForm.title.trim() ||
      (galleryForm.type === "video"
        ? `AK Buffaloes Farm Video #${nextCount}`
        : `AK Buffaloes Farm Photo #${nextCount}`);

    setSavingGalleryItem(true);
    try {
      const targetId = isCreatingGalleryItem
        ? `${galleryForm.type === "video" ? "custom-vid" : "custom-img"}-${Date.now()}`
        : editingGalleryItem!.id;

      // Determine whether src is custom or default bundled asset
      const defItem = defaultGalleryItems.find((d) => d.id === targetId);
      const srcToStore =
        defItem && galleryForm.src === defItem.src ? "" : galleryForm.src.trim();

      const payload: GalleryItemDbRecord = {
        id: targetId,
        type: galleryForm.type,
        src: srcToStore || galleryForm.src.trim(),
        title: effectiveTitle,
        alt: galleryForm.alt.trim() || effectiveTitle,
        description:
          galleryForm.description.trim() ||
          "Official media from AK Buffaloes farm showcase.",
        is_deleted: false,
      };

      const existsInDb = galleryDbRecords.some((r) => r.id === targetId);
      if (existsInDb) {
        const { error } = await backend
          .from("gallery_items")
          .update(payload)
          .eq("id", targetId);
        if (error) {
          toast({ title: "Failed to update gallery item", description: error.message, variant: "destructive" });
          return;
        }
        setGalleryDbRecords((prev) =>
          prev.map((r) => (r.id === targetId ? { ...r, ...payload } : r))
        );
      } else {
        const { data, error } = await backend
          .from("gallery_items")
          .insert(payload)
          .select("*")
          .single();
        if (error) {
          toast({ title: "Failed to save gallery item", description: error.message, variant: "destructive" });
          return;
        }
        const saved = (data as unknown as GalleryItemDbRecord) || {
          ...payload,
          created_at: new Date().toISOString(),
        };
        setGalleryDbRecords((prev) => [saved, ...prev]);
      }

      toast({
        title: isCreatingGalleryItem ? "Added to Gallery! 🎉" : "Gallery Item Updated! ✅",
        description: `"${payload.title}" is now live on the Gallery page.`,
      });
      if (sound.isEnabled()) sound.playSuccess();

      if (keepOpenForAnother && isCreatingGalleryItem) {
        const upcomingNum = nextCount + 1;
        const upcomingTitle =
          galleryForm.type === "video"
            ? `AK Buffaloes Farm Video #${upcomingNum}`
            : `AK Buffaloes Farm Photo #${upcomingNum}`;
        setGalleryForm((prev) => ({
          ...prev,
          src: "",
          title: upcomingTitle,
          alt: upcomingTitle,
        }));
      } else {
        setEditGalleryModal(false);
      }
    } finally {
      setSavingGalleryItem(false);
    }
  };

  const handleDeleteGalleryItem = async (item: GalleryItem) => {
    const isDefault = isDefaultGalleryItem(item.id);
    const existsInDb = galleryDbRecords.some((r) => r.id === item.id);

    if (isDefault) {
      const deleteMarker: GalleryItemDbRecord = {
        id: item.id,
        type: item.type,
        title: item.title,
        alt: item.alt,
        description: item.description,
        is_deleted: true,
      };
      if (existsInDb) {
        const { error } = await backend
          .from("gallery_items")
          .update({ is_deleted: true })
          .eq("id", item.id);
        if (error) {
          toast({ title: "Delete failed", description: error.message, variant: "destructive" });
          return;
        }
        setGalleryDbRecords((prev) =>
          prev.map((r) => (r.id === item.id ? { ...r, is_deleted: true } : r))
        );
      } else {
        const { error } = await backend.from("gallery_items").insert(deleteMarker);
        if (error) {
          toast({ title: "Delete failed", description: error.message, variant: "destructive" });
          return;
        }
        setGalleryDbRecords((prev) => [deleteMarker, ...prev]);
      }
    } else {
      const { error } = await backend.from("gallery_items").delete().eq("id", item.id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return;
      }
      setGalleryDbRecords((prev) => prev.filter((r) => r.id !== item.id));
    }

    toast({
      title: "Gallery Media Deleted",
      description: `"${item.title}" has been removed from the gallery.`,
    });
  };

  const handleRestoreDeletedGalleryDefaults = async () => {
    const deletedIds = galleryDbRecords
      .filter((r) => r.is_deleted === true && isDefaultGalleryItem(r.id))
      .map((r) => r.id);
    if (deletedIds.length === 0) return;

    await Promise.all(
      deletedIds.map((id) =>
        backend.from("gallery_items").update({ is_deleted: false }).eq("id", id)
      )
    );
    setGalleryDbRecords((prev) =>
      prev.map((r) => (deletedIds.includes(r.id) ? { ...r, is_deleted: false } : r))
    );
    toast({
      title: "Default Gallery Items Restored! 🔄",
      description: `Restored ${deletedIds.length} default gallery items.`,
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  // =========================================================================
  // POPUP ADVERTISEMENT CARDS CRUD & ON/OFF (SHOW / NOT SHOW) HANDLERS
  // =========================================================================
  const notifyPromoPopupsUpdated = () => {
    try {
      sessionStorage.removeItem("ak_buffaloes_dismissed_popups_v2");
      window.dispatchEvent(new CustomEvent("ak-promo-popups-updated"));
    } catch {
      // ignore storage errors
    }
  };

  const handleTogglePromoCardActive = async (card: PromoPopupCard, nextActive: boolean) => {
    const existingRecord = promoPopupDbRecords.find((r) => r.id === card.id);
    const updatedPayload: PromoPopupDbRecord = {
      ...card,
      is_active: nextActive,
      is_deleted: false,
      created_at: existingRecord?.created_at || card.created_at || new Date().toISOString(),
    };

    if (existingRecord) {
      const { error } = await backend
        .from("promo_popups")
        .update({ is_active: nextActive, is_deleted: false })
        .eq("id", card.id);
      if (error) {
        toast({ title: "Failed to toggle popup status", description: error.message, variant: "destructive" });
        return;
      }
      setPromoPopupDbRecords((prev) =>
        prev.map((r) => (r.id === card.id ? { ...r, is_active: nextActive, is_deleted: false } : r))
      );
    } else {
      const { data, error } = await backend
        .from("promo_popups")
        .insert(updatedPayload)
        .select()
        .single();
      if (error) {
        toast({ title: "Failed to toggle popup status", description: error.message, variant: "destructive" });
        return;
      }
      const saved = (data as unknown as PromoPopupDbRecord) || updatedPayload;
      setPromoPopupDbRecords((prev) => [saved, ...prev]);
    }

    notifyPromoPopupsUpdated();
    toast({
      title: nextActive ? "Popup Card Switched ON (Showing on Website) ✅" : "Popup Card Switched OFF (Hidden from Website) 🚫",
      description: nextActive
        ? `"${card.title_label || card.headline_en}" will now appear when visitors open the website.`
        : `"${card.title_label || card.headline_en}" is now hidden and will NOT show on the website.`,
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  const handleToggleAllPromoCards = async (turnOn: boolean) => {
    const targets = filteredPromoPopups.length > 0 ? filteredPromoPopups : adminPromoPopups;
    for (const card of targets) {
      if (Boolean(card.is_active) !== turnOn) {
        await handleTogglePromoCardActive(card, turnOn);
      }
    }
    notifyPromoPopupsUpdated();
    toast({
      title: turnOn
        ? `${targets.length} Popup Card(s) Switched ON ✅`
        : `${targets.length} Popup Card(s) Switched OFF 🚫`,
      description: turnOn
        ? "Selected popup advertisement cards are now enabled to show on the website."
        : "Selected popup advertisement cards are now hidden from the website.",
    });
  };

  const handleResetFestivalPopupsToAuto = async () => {
    const festivalDbIds = promoPopupDbRecords
      .filter((r) => r.id.startsWith("festival-popup-") && !r.is_deleted)
      .map((r) => r.id);

    for (const id of festivalDbIds) {
      await backend.from("promo_popups").delete().eq("id", id);
    }
    setPromoPopupDbRecords((prev) =>
      prev.filter((r) => !(r.id.startsWith("festival-popup-") && !r.is_deleted))
    );
    notifyPromoPopupsUpdated();
    toast({
      title: "Auto Festival Popup Schedule Restored! 🗓️",
      description:
        "All 32 festival popup ads are set to Auto Mode — each festival popup will automatically turn ON on its live IST festival date.",
    });
    if (sound.isEnabled()) sound.playSuccess();
  };

  const handleOpenAddPromoCard = () => {
    const nextNum = adminPromoPopups.length + 1;
    setIsCreatingPromo(true);
    setEditingPromoCard(null);
    setPromoForm({
      is_active: true,
      title_label: `Website Popup Card #${nextNum}`,
      brand_title_en: "AK Buffaloes",
      brand_subtitle_en: "Official Instagram",
      badge_text: "24×7",
      headline_en: "Follow Us on Instagram !",
      highlight_prefix_en: "for",
      highlight_text_en: "Daily Live",
      highlight_suffix_en: "buffalo updates",
      description_en:
        "Watch daily reels, live milking proofs, and new arrivals of Murrah, Nili-Ravi, Jaffarabadi, Surti & Mehsana buffaloes.",
      subnote_en: "For direct bookings & inquiries, follow",
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
    });
    setEditPromoModal(true);
  };

  const handleOpenEditPromoCard = (card: PromoPopupCard) => {
    setIsCreatingPromo(false);
    setEditingPromoCard(card);
    setPromoForm({
      is_active: card.is_active !== false,
      title_label: card.title_label || "",
      brand_title_en: card.brand_title_en || "AK Buffaloes",
      brand_subtitle_en: card.brand_subtitle_en || "Official Instagram",
      badge_text: card.badge_text || "24×7",
      headline_en: card.headline_en || "",
      highlight_prefix_en: card.highlight_prefix_en ?? "for",
      highlight_text_en: card.highlight_text_en || "",
      highlight_suffix_en: card.highlight_suffix_en ?? "",
      description_en: card.description_en || "",
      subnote_en: card.subnote_en || "",
      brand_title_hi: card.brand_title_hi || "एके बफेलोज़",
      brand_subtitle_hi: card.brand_subtitle_hi || "ऑफिशियल इंस्टाग्राम",
      headline_hi: card.headline_hi || "",
      highlight_text_hi: card.highlight_text_hi || "",
      description_hi: card.description_hi || "",
      subnote_hi: card.subnote_hi || "",
      link_url: card.link_url || "",
      link_label: card.link_label || "@ak_buffaloes",
      button_text: card.button_text || "Follow Now",
      qr_box_title: card.qr_box_title || "Link to Follow / QR Code",
      footer_text: card.footer_text || "",
      banner_image_url: card.banner_image_url || null,
    });
    setEditPromoModal(true);
  };

  const handlePromoBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file (JPG, PNG, WEBP).", variant: "destructive" });
      return;
    }
    setUploadingPromoBanner(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `popups/promo-banner-${Date.now()}.${ext}`;
      const { error: uploadError } = await backend.storage.from("gallery").upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: "Banner upload failed", description: uploadError.message, variant: "destructive" });
        setUploadingPromoBanner(false);
        return;
      }
      const { data: urlData } = backend.storage.from("gallery").getPublicUrl(filePath);
      setPromoForm((prev) => ({ ...prev, banner_image_url: urlData.publicUrl }));
      toast({ title: "Banner Image Uploaded! 📸", description: "Popup banner photo attached to this card." });
    } catch (err: unknown) {
      toast({
        title: "Upload error",
        description: err instanceof Error ? err.message : "Could not upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingPromoBanner(false);
      e.target.value = "";
    }
  };

  const handleSavePromoCard = async (keepOpenForAnother = false) => {
    if (!promoForm.headline_en.trim() && !promoForm.headline_hi.trim()) {
      toast({
        title: "Headline Required",
        description: "Please enter an English or Hindi announcement headline for the popup card.",
        variant: "destructive",
      });
      return;
    }

    setSavingPromoCard(true);
    const cleanLink =
      promoForm.link_url.trim() || "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4";
    const payload = {
      is_active: promoForm.is_active,
      title_label: promoForm.title_label.trim() || promoForm.headline_en.trim() || "Website Popup Card",
      brand_title_en: promoForm.brand_title_en.trim() || "AK Buffaloes",
      brand_subtitle_en: promoForm.brand_subtitle_en.trim() || "Official Instagram",
      badge_text: promoForm.badge_text.trim() || "24×7",
      headline_en: promoForm.headline_en.trim(),
      highlight_prefix_en: promoForm.highlight_prefix_en.trim(),
      highlight_text_en: promoForm.highlight_text_en.trim(),
      highlight_suffix_en: promoForm.highlight_suffix_en.trim(),
      description_en: promoForm.description_en.trim(),
      subnote_en: promoForm.subnote_en.trim(),
      brand_title_hi: promoForm.brand_title_hi.trim() || "एके बफेलोज़",
      brand_subtitle_hi: promoForm.brand_subtitle_hi.trim() || "ऑफिशियल इंस्टाग्राम",
      headline_hi: promoForm.headline_hi.trim(),
      highlight_text_hi: promoForm.highlight_text_hi.trim(),
      description_hi: promoForm.description_hi.trim(),
      subnote_hi: promoForm.subnote_hi.trim(),
      link_url: cleanLink,
      link_label: promoForm.link_label.trim() || "@ak_buffaloes",
      button_text: promoForm.button_text.trim() || "Follow Now",
      qr_box_title: promoForm.qr_box_title.trim() || "Link to Follow / QR Code",
      footer_text:
        promoForm.footer_text.trim() ||
        "🐃 Official Instagram: @ak_buffaloes — Nurani Nagar, Pachora, Dist. Jalgaon",
      banner_image_url: promoForm.banner_image_url?.trim() || null,
      is_full_banner: editingPromoCard?.is_full_banner ?? false,
      is_deleted: false,
    };

    try {
      if (isCreatingPromo) {
        const newId = `promo-card-${Date.now()}`;
        const newRecord: PromoPopupDbRecord = {
          id: newId,
          ...payload,
          created_at: new Date().toISOString(),
        };
        const { data, error } = await backend
          .from("promo_popups")
          .insert(newRecord)
          .select()
          .single();

        if (error) {
          toast({ title: "Failed to add popup card", description: error.message, variant: "destructive" });
          setSavingPromoCard(false);
          return;
        }
        const saved = (data as unknown as PromoPopupDbRecord) || newRecord;
        setPromoPopupDbRecords((prev) => [saved, ...prev]);
        toast({
          title: "New Popup Advertisement Card Added! 🎉",
          description: saved.is_active
            ? "Card is ON and will automatically display on the website."
            : "Card saved as OFF (hidden until you switch it ON).",
        });
      } else if (editingPromoCard) {
        const existingInDb = promoPopupDbRecords.some((r) => r.id === editingPromoCard.id);
        const updatedRecord: PromoPopupDbRecord = {
          id: editingPromoCard.id,
          ...payload,
          created_at: editingPromoCard.created_at || new Date().toISOString(),
        };

        if (existingInDb) {
          const { error } = await backend
            .from("promo_popups")
            .update(payload)
            .eq("id", editingPromoCard.id);
          if (error) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
            setSavingPromoCard(false);
            return;
          }
          setPromoPopupDbRecords((prev) =>
            prev.map((r) => (r.id === editingPromoCard.id ? { ...r, ...payload } : r))
          );
        } else {
          const { data, error } = await backend
            .from("promo_popups")
            .insert(updatedRecord)
            .select()
            .single();
          if (error) {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
            setSavingPromoCard(false);
            return;
          }
          const saved = (data as unknown as PromoPopupDbRecord) || updatedRecord;
          setPromoPopupDbRecords((prev) => [saved, ...prev]);
        }

        toast({
          title: "Popup Card Updated! ✨",
          description: "Your popup advertisement card changes are now live.",
        });
      }

      notifyPromoPopupsUpdated();
      if (sound.isEnabled()) sound.playSuccess();

      if (keepOpenForAnother && isCreatingPromo) {
        const nextNum = adminPromoPopups.length + 2;
        setPromoForm((prev) => ({
          ...prev,
          title_label: `Website Popup Card #${nextNum}`,
          banner_image_url: null,
          is_active: true,
        }));
      } else {
        setEditPromoModal(false);
      }
    } finally {
      setSavingPromoCard(false);
    }
  };

  const handleDeletePromoCard = async (card: PromoPopupCard) => {
    const isDefault = isDefaultPromoPopup(card.id);
    const existingInDb = promoPopupDbRecords.some((r) => r.id === card.id);

    if (isDefault) {
      // Default card: mark is_deleted = true or switch OFF
      if (existingInDb) {
        const { error } = await backend
          .from("promo_popups")
          .update({ is_deleted: true, is_active: false })
          .eq("id", card.id);
        if (error) {
          toast({ title: "Delete failed", description: error.message, variant: "destructive" });
          return;
        }
        setPromoPopupDbRecords((prev) =>
          prev.map((r) => (r.id === card.id ? { ...r, is_deleted: true, is_active: false } : r))
        );
      } else {
        const deleteMarker: PromoPopupDbRecord = {
          ...card,
          is_active: false,
          is_deleted: true,
          created_at: new Date().toISOString(),
        };
        const { error } = await backend.from("promo_popups").insert(deleteMarker);
        if (error) {
          toast({ title: "Delete failed", description: error.message, variant: "destructive" });
          return;
        }
        setPromoPopupDbRecords((prev) => [deleteMarker, ...prev]);
      }
    } else {
      const { error } = await backend.from("promo_popups").delete().eq("id", card.id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return;
      }
      setPromoPopupDbRecords((prev) => prev.filter((r) => r.id !== card.id));
    }

    notifyPromoPopupsUpdated();
    toast({
      title: "Popup Card Deleted",
      description: "The popup advertisement card has been removed.",
    });
  };

  const handleRestoreDefaultPromoPopup = async () => {
    const deletedDefaults = promoPopupDbRecords.filter(
      (r) => r.is_deleted === true && isDefaultPromoPopup(r.id)
    );
    for (const rec of deletedDefaults) {
      await backend
        .from("promo_popups")
        .update({ is_deleted: false, is_active: true })
        .eq("id", rec.id);
    }
    setPromoPopupDbRecords((prev) =>
      prev.map((r) =>
        isDefaultPromoPopup(r.id) ? { ...r, is_deleted: false, is_active: true } : r
      )
    );
    notifyPromoPopupsUpdated();
    toast({
      title: "Default Instagram Popup Card Restored! 🔄",
      description: "The default Instagram advertisement popup card is back and switched ON.",
    });
  };

  const handleAdminVoiceToggle = async (value: boolean) => {
    setAdminVoiceNotifications(value);
    voiceAnnouncer.setEnabled(value);
    if (user) {
      await backend.from("profiles").update({ voice_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "Admin Voice Enabled 🔊" : "Admin Voice Muted 🔇",
      description: value ? "AI voice announcements are now active for admin." : "Voice announcements are muted.",
    });
  };

  const handleAdminSoundToggle = async (value: boolean) => {
    setAdminSoundNotifications(value);
    sound.setEnabled(value);
    if (user) {
      await backend.from("profiles").update({ sound_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "Admin Sounds Enabled 🔔" : "Admin Sounds Muted 🔕",
      description: value ? "Sound effects and chimes are now active for admin." : "Sound effects are muted.",
    });
  };

  const handleAdminEmailToggle = async (value: boolean) => {
    setAdminEmailNotifications(value);
    localStorage.setItem("ak_admin_email_notif", String(value));
    if (user) {
      await backend.from("profiles").update({ email_notifications: value }).eq("user_id", user.id);
    }
    toast({
      title: value ? "Email Notifications Enabled ✉️" : "Email Notifications Disabled 🔕",
      description: value ? "You will receive email notifications for new inquiries and actions." : "Email notifications are disabled.",
    });
    if (value && sound.isEnabled()) sound.playSuccess();
  };

  const handleDailyDigestToggle = (val: boolean) => {
    const updated = { ...farmSettings, dailyDigestEmail: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "Daily Digest Email Enabled 📅" : "Daily Digest Email Disabled 🔕",
      description: val ? "You will receive a morning email summarizing new leads and inquiries." : "Daily morning email digest turned off.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleDirectWhatsappToggle = (val: boolean) => {
    const updated = { ...farmSettings, directWhatsappInquiry: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "WhatsApp Inquiries Button Enabled 💬" : "WhatsApp Inquiries Button Hidden",
      description: val ? "Direct WhatsApp chat button will be shown on all buffalo listings." : "WhatsApp inquiry button hidden.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleNegotiableBadgeToggle = (val: boolean) => {
    const updated = { ...farmSettings, negotiableBadgeEnabled: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "Price Negotiable Badge Enabled 🏷️" : "Negotiable Badge Hidden",
      description: val ? "'Price Negotiable' tag will appear on eligible buffalo listings." : "Negotiable badge hidden from buffalo cards.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleCustomerAutoReplyToggle = (val: boolean) => {
    const updated = { ...farmSettings, customerAutoReplyEmail: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "Customer Auto-Reply Enabled ✉️" : "Customer Auto-Reply Disabled",
      description: val ? "Customers will receive an instant confirmation email upon inquiry submission." : "Customer auto-reply disabled.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleAutoStockArrivalToggle = (val: boolean) => {
    const updated = { ...farmSettings, autoStockArrivalEmail: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "New Stock Broadcast Enabled 📢" : "New Stock Broadcast Disabled",
      description: val ? "Registered buyers will receive automated emails when new stock is added." : "Automated stock arrival broadcast disabled.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleAnnouncementBannerToggle = (val: boolean) => {
    const updated = { ...farmSettings, announcementBannerEnabled: val };
    setFarmSettings(updated);
    saveFarmSiteSettings(updated);
    toast({
      title: val ? "Announcement Banner Active 📢" : "Announcement Banner Hidden",
      description: val ? "Top notification banner is now displayed site-wide." : "Top announcement banner is now hidden.",
    });
    if (val && sound.isEnabled()) sound.playSuccess();
  };

  const handleTestAdminNotifications = () => {
    toast({
      title: "Admin Notification System Test 🔔🛡️",
      description: "Admin chimes, AI voice, and dashboard alerts are operating normally.",
    });
    if (sound.isEnabled()) {
      sound.playSuccess();
    }
    if (voiceAnnouncer.isEnabled()) {
      voiceAnnouncer.speak("Admin notification system check successful.");
    }
  };

  const handleSaveFarmSettings = () => {
    setSavingFarmSettings(true);
    try {
      saveFarmSiteSettings(farmSettings);
      toast({
        title: "Farm Settings Saved! 🏢🐃",
        description: "Helpline, operating hours, announcement banner, and marketplace rules updated.",
      });
      if (sound.isEnabled()) sound.playSuccess();
    } finally {
      setSavingFarmSettings(false);
    }
  };

  const getAdminBuffaloThumb = (breed: string, imageUrl?: string | null, id?: string) => {
    return resolveAdminBuffaloThumb(breed, imageUrl, id);
  };

  // Avatar upload/remove for admin panel
  const handleAdminAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProfile) return;
    if (!file.type.startsWith("image/")) { toast({ title: "Please select an image file", variant: "destructive" }); return; }
    if (file.size > 2 * 1024 * 1024) { toast({ title: "Image must be under 2MB", variant: "destructive" }); return; }
    setUploadingAdminAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${editingProfile.user_id}/avatar.${ext}`;
    const { data: uploadData, error: uploadError } = await backend.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { setUploadingAdminAvatar(false); toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }
    const { data: urlData } = backend.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = sanitizeMediaUrl(uploadData?.publicUrl || urlData?.publicUrl);
    await backend.from("profiles").update({ avatar_url: publicUrl }).eq("id", editingProfile.id);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, avatar_url: publicUrl } : p));
    setEditingProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : prev);
    setUploadingAdminAvatar(false);
    toast({ title: "Profile photo updated!" });
  };

  const removeAdminAvatar = async () => {
    if (!editingProfile) return;
    setUploadingAdminAvatar(true);
    const { data: fileList } = await backend.storage.from("avatars").list(editingProfile.user_id);
    if (fileList && fileList.length > 0) {
      await backend.storage.from("avatars").remove(fileList.map(f => `${editingProfile.user_id}/${f.name}`));
    }
    await backend.from("profiles").update({ avatar_url: null }).eq("id", editingProfile.id);
    setProfiles(prev => prev.map(p => p.id === editingProfile.id ? { ...p, avatar_url: null } : p));
    setEditingProfile(prev => prev ? { ...prev, avatar_url: null } : prev);
    setUploadingAdminAvatar(false);
    toast({ title: "Profile photo removed" });
  };

  // Admin's own profile reference
  const myProfile = profiles.find(p => p.user_id === user?.id);

  const paginate = <T,>(data: T[], page: number) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };
  const totalPages = (count: number) => Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));

  const GALLERY_ITEMS_PER_PAGE = 12;
  const paginateGallery = <T,>(data: T[], page: number) => {
    const start = (page - 1) * GALLERY_ITEMS_PER_PAGE;
    return data.slice(start, start + GALLERY_ITEMS_PER_PAGE);
  };
  const totalGalleryPages = (count: number) => Math.max(1, Math.ceil(count / GALLERY_ITEMS_PER_PAGE));

  const paginatedUsers = paginate(filteredUsers, userPage);
  const paginatedInquiries = paginate(filteredInquiries, inquiryPage);
  const paginatedConsultations = paginate(filteredConsultations, consultPage);
  const paginatedMessages = paginate(filteredMessages, messagePage);
  const paginatedActivityLogs = paginate(filteredActivityLogs, activityPage);
  const paginatedBuffaloes = paginate(filteredBuffaloes, buffaloPage);
  const paginatedGallery = paginateGallery(filteredGalleryItems, galleryPage);

  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-cream flex items-center justify-center">
        <BuffaloLoader isFullPage={false} message="Verifying admin credentials..." />
      </main>
    );
  }

  if (!user || !isAdmin) {
    return (
      <main className="pt-24 pb-16 min-h-screen bg-gradient-to-b from-cream via-cream to-muted/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-background border border-gold/40 rounded-2xl p-6 sm:p-8 shadow-xl"
        >
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gold/15 border-2 border-gold flex items-center justify-center mb-3 text-gold shadow-md">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Admin Portal
            </h1>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-1 max-w-xs">
              Secure administrative access for AK Buffaloes livestock management and inquiries.
            </p>
          </div>

          {user && !isAdmin && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-sans space-y-2">
              <div className="flex items-center justify-between">
                <span>Signed in as <strong className="font-semibold">{user.email}</strong> (User account)</span>
                <button
                  type="button"
                  onClick={async () => { await signOut(); toast({ title: "Signed out" }); }}
                  className="text-destructive font-bold hover:underline shrink-0 text-[11px] ml-2"
                >
                  Sign Out
                </button>
              </div>
              <div>
                <Link to="/dashboard" className="text-gold font-semibold hover:underline inline-flex items-center gap-1">
                  ← Return to User Dashboard & Profile
                </Link>
              </div>
            </div>
          )}

          {portalError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-sans">
              {portalError}
            </div>
          )}

          <form onSubmit={handleAdminPortalLogin} className="space-y-4">
            <div>
              <Label className="font-sans text-xs font-medium text-foreground">Admin Email</Label>
              <Input
                type="email"
                value={portalEmail}
                onChange={(e) => setPortalEmail(e.target.value)}
                placeholder="Admin email"
                className="mt-1 font-sans text-sm h-11"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <Label className="font-sans text-xs font-medium text-foreground">Admin Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPortalPassword ? "text" : "password"}
                  value={portalPassword}
                  onChange={(e) => setPortalPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="font-sans text-sm h-11 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPortalPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  aria-label={showPortalPassword ? "Hide password" : "Show password"}
                >
                  {showPortalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end -mt-1 pb-1">
              <Link
                to={`/reset-password${portalEmail.trim() ? `?email=${encodeURIComponent(portalEmail.trim())}` : ""}`}
                className="font-sans text-xs text-gold hover:text-gold-light hover:underline transition-colors font-medium"
              >
                Forgot Admin Password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={portalLoading}
              className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-bold h-11 text-sm shadow-md gap-2"
            >
              <Lock className="w-4 h-4" />
              {portalLoading ? "Verifying..." : "Sign In to Admin Portal"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs font-sans text-muted-foreground">
            <Link to="/" className="inline-flex items-center gap-1.5 hover:text-gold transition-colors font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Website
            </Link>
            <Link to="/login" className="hover:text-gold transition-colors font-medium">
              User Login
            </Link>
          </div>
        </motion.div>
      </main>
    );
  }

  if (fetching) {
    return (
      <main className="pt-20 min-h-screen bg-cream flex items-center justify-center">
        <BuffaloLoader isFullPage={false} message="Loading admin dashboard data..." />
      </main>
    );
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatDateTime = (d: string) => new Date(d).toLocaleString();
  const adminUsers = profiles.filter(p => getUserRole(p.user_id) === "admin");
  const regularUsers = profiles.filter(p => getUserRole(p.user_id) !== "admin");

  return (
    <main className="pt-20 min-h-screen bg-cream">
      <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-gold" />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5 sm:gap-2 text-[10px] sm:text-xs h-8 sm:h-9 px-2.5 sm:px-3.5 shadow-sm"
                  title="Export farm reports in PDF, CSV, Excel, or JSON format"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Reports</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 font-sans">
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Farm Record Exports
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleGeneratePDF()} className="cursor-pointer gap-2 py-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Download PDF (.pdf)</span>
                    <span className="text-[10px] text-muted-foreground">Official styled letterhead document</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportRecords("csv", "comprehensive")} className="cursor-pointer gap-2 py-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Export CSV (.csv)</span>
                    <span className="text-[10px] text-muted-foreground">Clean UTF-8 spreadsheet</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportRecords("excel", "comprehensive")} className="cursor-pointer gap-2 py-2">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Export Excel (.xls)</span>
                    <span className="text-[10px] text-muted-foreground">Formatted workbook with headers</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportRecords("json", "comprehensive")} className="cursor-pointer gap-2 py-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">Export JSON (.json)</span>
                    <span className="text-[10px] text-muted-foreground">Complete structured backup</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowReportDialog(true)} className="cursor-pointer gap-2 py-1.5 text-xs text-primary font-medium">
                  <SettingsIcon className="w-3.5 h-3.5" />
                  <span>Customize & Filter Report...</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-2 sm:gap-3 bg-background border border-border rounded-lg px-2 sm:px-3 py-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-2 border-border">
                {myProfile?.avatar_url ? (
                  <img src={myProfile.avatar_url} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="font-sans text-sm font-semibold text-foreground">{myProfile?.full_name || "Admin"}</p>
                <p className="font-sans text-[10px] text-muted-foreground">Administrator</p>
              </div>
            </div>
            <Button onClick={fetchAll} variant="outline" className="font-sans gap-1.5 sm:gap-2 text-[10px] sm:text-xs h-8 sm:h-9 px-2 sm:px-3">
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="hidden sm:inline">Refresh</span><span className="sm:hidden">↻</span>
            </Button>
          </div>
        </div>

        {/* Stats (Click any card to jump to that management tab) */}
        <StatsCarousel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          cards={[
            { label: "Buffaloes", tab: "buffaloes", value: `${buffaloListings.length} (${buffaloListings.filter((b) => b.status !== "out_of_stock" && b.is_available !== false).length} In Stock)`, icon: Tag, color: "text-amber-600" },
            { label: "Gallery (Photos & Videos)", tab: "gallery", value: String(adminGalleryItems.length), icon: Camera, color: "text-emerald-600" },
            { label: "Popup Ads (ON/OFF)", tab: "popups", value: `${activePromoPopupsCount}/${adminPromoPopups.length} ON`, icon: Sparkles, color: "text-gold" },
            {
              label: "Live Festival & Special Day Themes",
              tab: "festivals",
              value: festivalSettings.master_enabled
                ? festivalActiveOccasion
                  ? `${festivalActiveOccasion.theme.icon} ${festivalActiveOccasion.name}`
                  : `${festivalOccasions.filter((o) => o.enabled).length}/${festivalOccasions.length} Enabled`
                : "Master OFF",
              icon: Calendar,
              color: "text-orange-600",
            },
            { label: "Users", tab: "users", value: String(regularUsers.length), icon: Users, color: "text-indigo-600" },
            { label: "Enquiries", tab: "purchase", value: String(purchaseInquiries.length), icon: MessageSquare, color: "text-blue-600" },
            { label: "Consultations", tab: "consultations", value: String(consultations.length), icon: Phone, color: "text-green-600" },
            { label: "Messages", tab: "messages", value: String(contacts.length), icon: MessageSquare, color: "text-pink-600" },
          ]}
        />

        <Tabs value={activeTab} className="space-y-4 md:space-y-6" onValueChange={(v) => {
          setActiveTab(v);
          if (v === 'activity') setNewLogsCount(0);
        }}>
          {/* Scrollable tabs row */}
          <TabsScrollRow
            activeTab={activeTab}
            newLogsCount={newLogsCount}
            tabs={[
              { v: "analytics", icon: TrendingUp, label: "Analytics", count: 0 },
              { v: "buffaloes", icon: Tag, label: "Buffaloes", count: buffaloListings.length },
              { v: "gallery", icon: Camera, label: "Gallery (Photos & Videos)", count: adminGalleryItems.length },
              { v: "popups", icon: Sparkles, label: "Popup Ads (ON/OFF)", count: adminPromoPopups.length },
              { v: "festivals", icon: Calendar, label: "Live Festival & Special Day Themes", count: festivalOccasions.length },
              { v: "users", icon: Users, label: "Users", count: profiles.length },
              { v: "purchase", icon: MessageSquare, label: "Enquiries", count: purchaseInquiries.length },
              { v: "consultations", icon: Phone, label: "Consultations", count: consultations.length },
              { v: "messages", icon: MessageSquare, label: "Messages", count: contacts.length },
              { v: "credentials", icon: KeyRound, label: "Credentials", count: 0 },
              { v: "activity", icon: BarChart3, label: "Activity History", count: activityLogs.length },
              { v: "settings", icon: SettingsIcon, label: "Settings", count: 0 },
            ]}
          />

          {/* Global hidden multi-file input for adding multiple gallery photos & videos from any tab */}
          <input
            ref={bulkGalleryInputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/webm,video/ogg,video/*"
            onChange={handleBulkGalleryUpload}
            className="hidden"
          />

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics">
            <AnalyticsSection
              profiles={profiles}
              purchaseInquiries={purchaseInquiries}
              consultations={consultations}
              contacts={contacts}
              activityLogs={activityLogs}
              buffaloListings={buffaloListings}
              galleryItems={adminGalleryItems}
              galleryDbRecords={galleryDbRecords}
              onManageGallery={() => setActiveTab("gallery")}
              onManageBuffaloes={() => setActiveTab("buffaloes")}
              onAddGalleryPhoto={() => handleOpenAddGallery("image")}
              onAddGalleryVideo={() => handleOpenAddGallery("video")}
              onBulkUploadGallery={() => bulkGalleryInputRef.current?.click()}
            />
          </TabsContent>

          {/* BUFFALOES TAB */}
          <TabsContent value="buffaloes">
            <div className="space-y-4">
              {/* Hidden file input for quick row photo upload */}
              <input
                ref={quickBuffaloInputRef}
                type="file"
                accept="image/*"
                onChange={handleQuickBuffaloImageUpload}
                className="hidden"
              />

              {/* Hidden file input for quick row video upload */}
              <input
                ref={quickBuffaloVideoInputRef}
                type="file"
                accept="video/*"
                onChange={handleQuickBuffaloVideoUpload}
                className="hidden"
              />

              {/* Top Banner & Quick Metrics */}
              <div className="bg-background border border-border rounded-lg p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <Tag className="w-5 h-5 text-gold" /> All 10 Buffalo Breeds & New Stocks Operations
                    </h2>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      Manage both <strong>Explore All 10 Buffalo Breeds (BRD-001..BRD-010)</strong> and <strong>New Stocks (AKB-001..AKB-008)</strong> with 2-photo carousels, videos, and 8-spec detail cards.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-xs bg-gold/15 text-green-dark dark:text-gold border border-gold/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-gold" />
                      10 Breeds Catalog: {buffaloListings.filter(b => !isLegacySampleRecord(b) && !isBuffaloNewStock(b)).length}
                    </span>
                    <span className="font-sans text-xs bg-primary/10 text-primary border border-gold/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      New Stocks: {buffaloListings.filter(b => !isLegacySampleRecord(b) && isBuffaloNewStock(b)).length}
                    </span>
                    <span className="font-sans text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
                      In Stock: {buffaloListings.filter(b => !isLegacySampleRecord(b) && b.status !== "out_of_stock" && b.is_available !== false).length}
                    </span>
                    <span className="font-sans text-xs bg-red-500/10 text-red-600 border border-red-500/20 px-2.5 py-1 rounded-full font-semibold">
                      Out of Stock: {buffaloListings.filter(b => !isLegacySampleRecord(b) && (b.status === "out_of_stock" || b.is_available === false)).length}
                    </span>
                    <Button
                      size="sm"
                      onClick={handleOpenAddNewStock}
                      className="bg-primary text-gold hover:bg-green-medium border border-gold/50 font-sans font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold" />
                      <span>+ Add New Stock (AKB)</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleOpenAddBuffalo}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Breed Buffalo (BRD)</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab("gallery")}
                      className="border-gold/50 text-foreground hover:bg-gold/10 font-sans font-semibold text-xs h-9 px-3.5 gap-1.5"
                    >
                      <Camera className="w-4 h-4 text-gold" />
                      <span>Manage Gallery ({adminGalleryItems.length})</span>
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border">
                  <SearchBar
                    value={buffaloSearch}
                    onChange={setBuffaloSearch}
                    placeholder="Search AKB / BRD code, breed, milk yield, calf..."
                  />

                  {/* Stock Type Filter: All vs New Stocks vs All 10 Breeds Catalog */}
                  <Select value={buffaloStockTypeFilter} onValueChange={setBuffaloStockTypeFilter}>
                    <SelectTrigger className="w-[195px] h-9 font-sans text-xs border-gold/40">
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        All Buffaloes ({buffaloListings.filter(b => !isLegacySampleRecord(b)).length})
                      </SelectItem>
                      <SelectItem value="catalog">
                        🐃 All 10 Buffalo Breeds ({buffaloListings.filter(b => !isLegacySampleRecord(b) && !isBuffaloNewStock(b)).length})
                      </SelectItem>
                      <SelectItem value="new_stocks">
                        ✨ New Stocks ({buffaloListings.filter(b => !isLegacySampleRecord(b) && isBuffaloNewStock(b)).length})
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Breed Filter */}
                  <Select value={buffaloBreedFilter} onValueChange={setBuffaloBreedFilter}>
                    <SelectTrigger className="w-[175px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Breeds" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All 10 Breeds</SelectItem>
                      {BUFFALO_BREEDS.map((b) => (
                        <SelectItem key={b.slug} value={b.name}>
                          {b.name} ({b.shortPriceRange})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Calf / Pregnancy Filter */}
                  <Select value={buffaloCalfFilter} onValueChange={setBuffaloCalfFilter}>
                    <SelectTrigger className="w-[160px] h-9 font-sans text-xs">
                      <SelectValue placeholder="Calf / Pregnancy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Calf / Pregnancy</SelectItem>
                      <SelectItem value="with_calf">With Calf</SelectItem>
                      <SelectItem value="pregnant">Pregnant</SelectItem>
                      <SelectItem value="milking">Milking</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status Filter */}
                  <Select value={buffaloStatusFilter} onValueChange={setBuffaloStatusFilter}>
                    <SelectTrigger className="w-[150px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="available">In Stock (Send Enquiry)</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="limited_stock">Limited Stock</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Price Range Filter */}
                  <Select value={buffaloPriceFilter} onValueChange={setBuffaloPriceFilter}>
                    <SelectTrigger className="w-[155px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Price Ranges</SelectItem>
                      <SelectItem value="under_90k">Under ₹90,000</SelectItem>
                      <SelectItem value="90k_120k">₹90,000 – ₹1,20,000</SelectItem>
                      <SelectItem value="above_120k">Above ₹1,20,000</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Stock ID Code Filter */}
                  <Select value={buffaloStockCodeFilter} onValueChange={setBuffaloStockCodeFilter}>
                    <SelectTrigger className="w-[155px] h-9 font-sans text-xs">
                      <SelectValue placeholder="Stock ID Code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stock IDs</SelectItem>
                      {[...buffaloListings]
                        .filter(b => !isLegacySampleRecord(b) && b.stock_code)
                        .sort((a, b) => {
                          const numA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
                          const numB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
                          const prefA = (a.stock_code || "").replace(/[0-9-]/g, "");
                          const prefB = (b.stock_code || "").replace(/[0-9-]/g, "");
                          if (prefA !== prefB) return prefA.localeCompare(prefB);
                          return numA - numB;
                        })
                        .map(b => (
                          <SelectItem key={b.stock_code} value={b.stock_code!}>
                            {b.stock_code} — {b.name || b.subtitle_label || b.breed}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Order */}
                  <Select value={buffaloSort} onValueChange={setBuffaloSort}>
                    <SelectTrigger className="w-[165px] h-9 font-sans text-xs">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stock_code_asc">Stock ID: AKB/BRD Order</SelectItem>
                      <SelectItem value="price_asc">Price: Low → High</SelectItem>
                      <SelectItem value="price_desc">Price: High → Low</SelectItem>
                      <SelectItem value="breeds_first">10 Breeds First (BRD)</SelectItem>
                      <SelectItem value="new_stock_first">New Stocks First (AKB)</SelectItem>
                      <SelectItem value="name_asc">Name: A → Z</SelectItem>
                      <SelectItem value="newest">Newest Added</SelectItem>
                    </SelectContent>
                  </Select>

                  {(buffaloSearch ||
                    buffaloStockTypeFilter !== "all" ||
                    buffaloBreedFilter !== "all" ||
                    buffaloCalfFilter !== "all" ||
                    buffaloStatusFilter !== "all" ||
                    buffaloPriceFilter !== "all" ||
                    buffaloLocationFilter !== "all" ||
                    buffaloStockCodeFilter !== "all" ||
                    buffaloSort !== "stock_code_asc") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBuffaloSearch("");
                        setBuffaloStockTypeFilter("all");
                        setBuffaloBreedFilter("all");
                        setBuffaloCalfFilter("all");
                        setBuffaloStatusFilter("all");
                        setBuffaloPriceFilter("all");
                        setBuffaloLocationFilter("all");
                        setBuffaloStockCodeFilter("all");
                        setBuffaloSort("stock_code_asc");
                      }}
                      className="h-9 px-2.5 font-sans text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                  )}

                  <div className="ml-auto flex items-center gap-2">
                    <span className="font-sans text-xs text-muted-foreground hidden sm:inline">
                      Showing {filteredBuffaloes.length} of {buffaloListings.filter(b => !isLegacySampleRecord(b)).length} buffaloes
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 font-sans text-xs gap-1.5 hover:border-gold/60"
                        >
                          <Download className="w-3.5 h-3.5 text-gold" />
                          <span>Export</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 font-sans">
                        <DropdownMenuItem onClick={() => handleGeneratePDF("buffaloes")} className="cursor-pointer gap-2">
                          <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRecords("csv", "buffaloes")} className="cursor-pointer gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRecords("excel", "buffaloes")} className="cursor-pointer gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportRecords("json", "buffaloes")} className="cursor-pointer gap-2">
                          <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Buffalo Listings Table */}
              <div className="bg-background border border-border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans text-xs w-20">Photo</TableHead>
                      <TableHead className="font-sans text-xs">Stock / Breed ID, Name & Section</TableHead>
                      <TableHead className="font-sans text-xs">Price</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Specs, Lactation & Calf</TableHead>
                      <TableHead className="font-sans text-xs">User-Side Status</TableHead>
                      <TableHead className="font-sans text-xs text-right">Admin Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuffaloes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 font-sans text-muted-foreground text-sm">
                          No buffalo listings match your search or filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedBuffaloes.map((b, rowIdx) => {
                        const isOut = b.status === "out_of_stock" || b.is_available === false;
                        const isLim = b.status === "limited_stock";
                        const isNewArrival = isBuffaloNewStock(b);
                        const enriched = enrichBuffaloToNewStock(b, rowIdx);
                        const resolvedThumb = getAdminBuffaloThumb(b.breed, b.image_url, b.id);
                        const resolvedCode = b.stock_code || enriched.stock_code;

                        return (
                          <TableRow key={b.id} className="hover:bg-muted/30">
                            <TableCell className="p-2">
                              <div
                                className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-900 border border-border flex items-center justify-center group cursor-pointer"
                                title="Click to upload / update buffalo photo"
                                onClick={() => {
                                  setQuickBuffaloUploadTarget(b);
                                  quickBuffaloInputRef.current?.click();
                                }}
                              >
                                <img
                                  src={resolvedThumb}
                                  alt={b.name}
                                  className="w-full h-full object-cover object-top"
                                />
                                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-gold" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`font-display text-[11px] font-bold px-2 py-0.5 rounded border ${
                                      isNewArrival
                                        ? "bg-primary text-gold border-gold/40"
                                        : "bg-gold/15 text-green-dark dark:text-gold border-gold/40"
                                    }`}
                                  >
                                    {resolvedCode}
                                  </span>
                                  <p className="font-sans text-sm font-semibold text-foreground">
                                    {b.subtitle_label || b.name}
                                  </p>
                                  {isNewArrival ? (
                                    <Badge className="bg-gold/20 text-gold-dark border border-gold/40 font-sans text-[10px] px-1.5 py-0">
                                      New Stock
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-sans text-[10px] px-1.5 py-0">
                                      10 Breeds Catalog
                                    </Badge>
                                  )}
                                </div>
                                <span className="font-sans text-[11px] text-gold font-medium">
                                  {b.breed}
                                  {(b.calf_details || enriched.calf_details)
                                    ? ` • ${b.calf_details || enriched.calf_details}`
                                    : ""}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-0.5">
                                <Badge className="bg-gold text-green-dark font-sans text-xs font-bold">
                                  ₹{b.price.toLocaleString()}
                                </Badge>
                                {b.is_negotiable !== false && (
                                  <p className="font-sans text-[10px] text-emerald-700 font-medium">
                                    Negotiable
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-sans text-xs text-muted-foreground hidden sm:table-cell">
                              <div>
                                {b.age} • {b.weight} • <strong className="text-foreground">{b.milk_yield}</strong>
                              </div>
                              <div className="text-[11px] text-muted-foreground">
                                {(b.lactation || enriched.lactation)} • {(b.pregnancy_status || enriched.pregnancy_status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isOut ? (
                                <Badge variant="destructive" className="bg-red-500/15 text-red-600 border border-red-500/30 font-sans text-xs">
                                  Out of Stock
                                </Badge>
                              ) : isLim ? (
                                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-sans text-xs">
                                  Limited Stock
                                </Badge>
                              ) : (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-sans text-xs">
                                  In Stock (Send Enquiry)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setPreviewBuffaloDetail(b);
                                    setPreviewBuffaloMediaIdx(0);
                                    setPreviewBuffaloPlayingVideo(false);
                                  }}
                                  className="h-8 px-2.5 font-sans text-[11px] gap-1 border-gold/50 text-foreground hover:bg-gold/10"
                                  title="Preview the full Big Buffalo Detail Card (Photos, Video & 8 Specs)"
                                >
                                  <Eye className="w-3.5 h-3.5 text-gold" />
                                  <span className="hidden lg:inline">Detail Card</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant={isNewArrival ? "default" : "outline"}
                                  onClick={() => handleToggleNewStock(b)}
                                  className={`h-8 px-2.5 font-sans text-[11px] gap-1 ${
                                    isNewArrival
                                      ? "bg-primary text-gold hover:bg-green-medium border border-gold/40"
                                      : "border-gold/40 text-foreground hover:bg-gold/10"
                                  }`}
                                  title="Switch this buffalo between New Stocks (AKB) and All 10 Buffalo Breeds (BRD)"
                                >
                                  <Sparkles className="w-3 h-3 text-gold" />
                                  <span className="hidden xl:inline">
                                    {isNewArrival ? "In New Stocks" : "In 10 Breeds"}
                                  </span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setQuickBuffaloUploadTarget(b);
                                    quickBuffaloInputRef.current?.click();
                                  }}
                                  disabled={uploadingBuffaloImage}
                                  className="h-8 px-2.5 font-sans text-[11px] gap-1 border-gold/50 text-foreground hover:bg-gold/10"
                                  title="Upload a new photo for this buffalo from your device"
                                >
                                  <Camera className="w-3.5 h-3.5 text-gold" />
                                  <span className="hidden md:inline">
                                    {uploadingBuffaloImage && quickBuffaloUploadTarget?.id === b.id ? "Uploading..." : "Photo"}
                                  </span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setQuickBuffaloVideoTarget(b);
                                    quickBuffaloVideoInputRef.current?.click();
                                  }}
                                  disabled={uploadingBuffaloVideo}
                                  className="h-8 px-2.5 font-sans text-[11px] gap-1 border-emerald-500/50 text-foreground hover:bg-emerald-500/10"
                                  title="Upload / update video for this buffalo from your device"
                                >
                                  <Video className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="hidden md:inline">
                                    {uploadingBuffaloVideo && quickBuffaloVideoTarget?.id === b.id ? "Uploading..." : "Video"}
                                  </span>
                                </Button>

                                {isOut ? (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateBuffaloStatus(b.id, "available")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-[11px] h-8 px-2.5 font-semibold"
                                  >
                                    Mark In Stock
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateBuffaloStatus(b.id, "out_of_stock")}
                                    className="border-red-400 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-sans text-[11px] h-8 px-2.5 font-semibold"
                                  >
                                    Mark Out of Stock
                                  </Button>
                                )}

                                <Select
                                  value={b.status || (isOut ? "out_of_stock" : "available")}
                                  onValueChange={(val) => handleUpdateBuffaloStatus(b.id, val)}
                                >
                                  <SelectTrigger className="w-[115px] h-8 font-sans text-[11px]">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">In Stock</SelectItem>
                                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                    <SelectItem value="limited_stock">Limited Stock</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  onClick={() => handleEditBuffalo(b)}
                                  className="h-8 px-2.5 bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1 shadow-sm"
                                  title="Edit Buffalo Info, Specs, Photos & Video"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBuffalo(b)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete Buffalo Listing"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                <PaginationControls
                  currentPage={buffaloPage}
                  totalPages={totalPages(filteredBuffaloes.length)}
                  onPageChange={setBuffaloPage}
                />
              </div>
            </div>
          </TabsContent>

          {/* GALLERY PHOTOS & VIDEOS TAB (ADMIN PANEL ONLY) */}
          <TabsContent value="gallery">
            <div className="space-y-4">
              {/* Hidden file input for quick replace on gallery item */}
              <input
                ref={quickGalleryInputRef}
                type="file"
                accept="image/*,video/mp4,video/webm,video/ogg,video/*"
                onChange={handleQuickGalleryFileUpload}
                className="hidden"
              />

              {/* Gallery Management Header & Action Buttons */}
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <Camera className="w-5 h-5 text-gold" /> Gallery Photos & Videos Management
                    </h2>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      Add unlimited new photos or videos beyond the default 18 photos & 26 videos, replace existing media, or update details.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-gold" />
                      Photos: {adminGalleryItems.filter((i) => i.type === "image").length}
                    </span>
                    <span className="font-sans text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                      <VideoIcon className="w-3.5 h-3.5 text-blue-500" />
                      Videos: {adminGalleryItems.filter((i) => i.type === "video").length}
                    </span>

                    <Button
                      size="sm"
                      onClick={() => handleOpenAddGallery("image")}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Add Photo</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenAddGallery("video")}
                      className="bg-primary text-primary-foreground hover:opacity-90 font-sans font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <VideoIcon className="w-3.5 h-3.5" />
                      <span>Add Video</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadingGalleryMedia}
                      onClick={() => bulkGalleryInputRef.current?.click()}
                      className="border-gold/50 text-foreground hover:bg-gold/10 font-sans font-semibold text-xs h-9 px-3.5 gap-1.5 shadow-sm"
                      title="Select multiple photos and videos from your computer to add all at once"
                    >
                      <Upload className="w-3.5 h-3.5 text-gold" />
                      <span>{uploadingGalleryMedia ? "Uploading..." : "Upload Multiple Photos / Videos"}</span>
                    </Button>
                  </div>
                </div>

                {/* Filters, View Switcher & Search */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                  <SearchBar
                    value={gallerySearch}
                    onChange={setGallerySearch}
                    placeholder="Search gallery photos & videos..."
                  />

                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                    {[
                      { k: "all" as const, label: `All (${adminGalleryItems.length})` },
                      {
                        k: "image" as const,
                        label: `Photos (${adminGalleryItems.filter((i) => i.type === "image").length})`,
                      },
                      {
                        k: "video" as const,
                        label: `Videos (${adminGalleryItems.filter((i) => i.type === "video").length})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.k}
                        type="button"
                        onClick={() => setGalleryTypeFilter(tab.k)}
                        className={`px-3 py-1.5 rounded-md font-sans text-xs font-semibold transition-all ${
                          galleryTypeFilter === tab.k
                            ? "bg-gold text-green-dark shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Source Filter: Default Showcase vs Custom Uploaded */}
                  <Select value={gallerySourceFilter} onValueChange={setGallerySourceFilter}>
                    <SelectTrigger className="w-[175px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Media Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources ({adminGalleryItems.length})</SelectItem>
                      <SelectItem value="default">
                        Default Showcase ({adminGalleryItems.filter((i) => isDefaultGalleryItem(i.id)).length})
                      </SelectItem>
                      <SelectItem value="custom">
                        Custom Uploaded ({adminGalleryItems.filter((i) => !isDefaultGalleryItem(i.id)).length})
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* View Mode Toggle: Table vs Grid */}
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => setGalleryViewMode("table")}
                      className={`px-2.5 py-1.5 rounded-md font-sans text-xs font-semibold transition-all ${
                        galleryViewMode === "table"
                          ? "bg-background text-foreground shadow-sm border border-border/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Table View
                    </button>
                    <button
                      type="button"
                      onClick={() => setGalleryViewMode("grid")}
                      className={`px-2.5 py-1.5 rounded-md font-sans text-xs font-semibold transition-all ${
                        galleryViewMode === "grid"
                          ? "bg-background text-foreground shadow-sm border border-border/60"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Grid View
                    </button>
                  </div>

                  {(gallerySearch || galleryTypeFilter !== "all" || gallerySourceFilter !== "all") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setGallerySearch("");
                        setGalleryTypeFilter("all");
                        setGallerySourceFilter("all");
                      }}
                      className="h-9 px-2.5 font-sans text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                  )}

                  {deletedDefaultGalleryCount > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestoreDeletedGalleryDefaults}
                      className="h-9 font-sans text-xs gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-300"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore {deletedDefaultGalleryCount} Hidden Default(s)</span>
                    </Button>
                  )}

                  <div className="ml-auto font-sans text-xs text-muted-foreground hidden sm:block">
                    Showing {filteredGalleryItems.length} of {adminGalleryItems.length} media items
                  </div>
                </div>
              </div>

              {/* Gallery Items Table / Grid */}
              <div className="bg-background border border-border rounded-lg overflow-hidden">
                {filteredGalleryItems.length === 0 ? (
                  <div className="text-center py-12 font-sans text-muted-foreground text-sm">
                    No gallery photos or videos match your filter.
                  </div>
                ) : galleryViewMode === "table" ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-sans text-xs w-28">Preview</TableHead>
                          <TableHead className="font-sans text-xs">Title & Description</TableHead>
                          <TableHead className="font-sans text-xs w-28">Media Type</TableHead>
                          <TableHead className="font-sans text-xs hidden md:table-cell w-36">Source / Status</TableHead>
                          <TableHead className="font-sans text-xs text-right">Admin Actions (Add / Update / Delete)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedGallery.map((item) => {
                          const isCustom = !isDefaultGalleryItem(item.id);
                          const isModifiedDefault =
                            !isCustom && galleryDbRecords.some((r) => r.id === item.id && !r.is_deleted);

                          return (
                            <TableRow key={item.id}>
                              <TableCell className="py-2.5">
                                <div
                                  onClick={() => setPreviewGalleryItem(item)}
                                  className="relative group w-24 h-16 rounded-md overflow-hidden border border-border bg-neutral-950 cursor-pointer flex items-center justify-center"
                                  title="Click to preview full photo/video"
                                >
                                  {item.type === "image" ? (
                                    <img
                                      src={item.src}
                                      alt={item.alt}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <video
                                      src={item.src}
                                      preload="metadata"
                                      muted
                                      className="w-full h-full object-cover bg-black"
                                    />
                                  )}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-4 h-4 text-gold" />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-sans text-xs max-w-md">
                                <p className="font-display font-bold text-sm text-foreground line-clamp-1">
                                  {item.title}
                                </p>
                                <p className="text-muted-foreground text-xs line-clamp-2 mt-0.5">
                                  {item.description}
                                </p>
                              </TableCell>
                              <TableCell>
                                {item.type === "video" ? (
                                  <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-sans text-[11px] gap-1">
                                    <VideoIcon className="w-3 h-3" /> Video
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-sans text-[11px] gap-1">
                                    <ImageIcon className="w-3 h-3" /> Photo
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {isCustom ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-sans text-[10px]">
                                    Added by Admin
                                  </Badge>
                                ) : isModifiedDefault ? (
                                  <Badge className="bg-gold/20 text-amber-800 dark:text-gold border border-gold/40 font-sans text-[10px]">
                                    Updated Default
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="font-sans text-[10px] text-muted-foreground">
                                    Default Gallery
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-[11px] font-sans gap-1 border-gold/40 text-foreground hover:bg-gold/10"
                                    disabled={uploadingGalleryMedia}
                                    onClick={() => {
                                      setQuickGalleryUploadTarget(item);
                                      quickGalleryInputRef.current?.click();
                                    }}
                                    title={`Upload a new ${item.type === "video" ? "video" : "photo"} file from your device`}
                                  >
                                    <Upload className="w-3 h-3 text-gold" />
                                    <span>Update {item.type === "video" ? "Video" : "Photo"}</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2.5 text-[11px] font-sans gap-1"
                                    onClick={() => handleOpenEditGallery(item)}
                                    title="Edit title, description, media type, or file"
                                  >
                                    <Edit className="w-3 h-3 text-primary" />
                                    <span>Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => setPreviewGalleryItem(item)}
                                    title="Preview media"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-gold" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteGalleryItem(item)}
                                    title="Delete from Gallery"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {paginatedGallery.map((item) => {
                      const isCustom = !isDefaultGalleryItem(item.id);
                      const isModifiedDefault =
                        !isCustom && galleryDbRecords.some((r) => r.id === item.id && !r.is_deleted);

                      return (
                        <div
                          key={item.id}
                          className="group bg-card border border-border hover:border-gold/60 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-all"
                        >
                          {/* Media Preview */}
                          <div className="relative h-48 bg-neutral-950 flex items-center justify-center overflow-hidden">
                            {item.type === "image" ? (
                              <img
                                src={item.src}
                                alt={item.alt}
                                onClick={() => setPreviewGalleryItem(item)}
                                className="w-full h-full object-contain p-1 cursor-pointer"
                                loading="lazy"
                              />
                            ) : (
                              <video
                                src={item.src}
                                controls
                                preload="metadata"
                                className="w-full h-full object-contain bg-black"
                              />
                            )}

                            {/* Top Left Badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
                              <Badge className="bg-black/75 text-white border border-white/15 font-sans text-[10px] gap-1">
                                {item.type === "video" ? (
                                  <>
                                    <VideoIcon className="w-3 h-3 text-gold" /> Video
                                  </>
                                ) : (
                                  <>
                                    <ImageIcon className="w-3 h-3 text-gold" /> Photo
                                  </>
                                )}
                              </Badge>
                              {isCustom && (
                                <Badge className="bg-emerald-600/90 text-white font-sans text-[10px]">
                                  Added by Admin
                                </Badge>
                              )}
                              {isModifiedDefault && (
                                <Badge className="bg-gold text-green-dark font-sans text-[10px]">
                                  Edited
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Item Info & Admin Controls */}
                          <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              <h3 className="font-display font-bold text-sm text-foreground line-clamp-1">
                                {item.title}
                              </h3>
                              <p className="font-sans text-xs text-muted-foreground line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            </div>

                            <div className="pt-2.5 border-t border-border flex items-center justify-between gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEditGallery(item)}
                                className="flex-1 h-8 font-sans text-xs gap-1 hover:border-gold hover:text-gold"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Update / Edit</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setQuickGalleryUploadTarget(item);
                                  quickGalleryInputRef.current?.click();
                                }}
                                disabled={uploadingGalleryMedia}
                                className="h-8 px-2.5 font-sans text-xs gap-1 border-gold/40 text-foreground hover:bg-gold/10"
                                title="Upload replacement photo or video from device"
                              >
                                <Upload className="w-3.5 h-3.5 text-gold" />
                                <span className="sr-only sm:not-sr-only">Replace</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteGalleryItem(item)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                                title="Delete from Gallery"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="p-3 border-t border-border">
                  <PaginationControls
                    currentPage={galleryPage}
                    totalPages={totalGalleryPages(filteredGalleryItems.length)}
                    onPageChange={setGalleryPage}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* WEBSITE POPUP ADVERTISEMENT CARDS TAB (ADD MORE CARDS & ON/OFF SHOW/HIDE FOR ALL FESTIVALS) */}
          <TabsContent value="popups">
            <div className="space-y-6">
              {/* Top Control Header */}
              <div className="bg-background border border-gold/40 rounded-xl p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="w-5 h-5 text-gold" />
                      <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
                        Popup Ads (ON / OFF) — General &amp; All 32 Festivals
                      </h2>
                      <Badge className="bg-gold/20 text-green-dark border-gold/40 font-sans text-xs">
                        {activePromoPopupsCount} Showing (ON) / {adminPromoPopups.length} Total
                      </Badge>
                    </div>
                    <p className="font-sans text-xs sm:text-sm text-muted-foreground">
                      Manage the welcome popup advertisement cards for AK Buffaloes and all 32 Indian Festivals &amp; Special Days. Switch any festival popup <span className="font-bold text-emerald-700">ON (Show on Website)</span> or <span className="font-bold text-destructive">OFF (Do Not Show)</span> anytime, or keep them in <span className="font-bold text-foreground">Auto Festival Schedule</span> so each festival popup turns ON automatically on its live IST date.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetFestivalPopupsToAuto}
                      className="font-sans text-xs h-9 gap-1.5 border-gold/50 text-foreground hover:bg-gold/10"
                      title="Reset all 32 festival popup cards so they automatically turn ON only on their live festival date"
                    >
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span>Auto Festival Schedule</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAllPromoCards(true)}
                      className="font-sans text-xs h-9 gap-1.5 border-emerald-500/50 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {promoCategoryFilter === "all" && promoStatusFilter === "all" && !promoSearch.trim()
                          ? "Turn All ON"
                          : `Turn Filtered ON (${filteredPromoPopups.length})`}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleAllPromoCards(false)}
                      className="font-sans text-xs h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                      <span>
                        {promoCategoryFilter === "all" && promoStatusFilter === "all" && !promoSearch.trim()
                          ? "Turn All OFF"
                          : `Turn Filtered OFF (${filteredPromoPopups.length})`}
                      </span>
                    </Button>
                    {promoPopupDbRecords.some((r) => r.is_deleted === true && isDefaultPromoPopup(r.id)) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRestoreDefaultPromoPopup}
                        className="font-sans text-xs h-9 gap-1.5 border-gold/50 text-foreground hover:bg-gold/10"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-gold" />
                        <span>Restore Deleted Default Cards</span>
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenAddPromoCard}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-9 gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add More Popup Card</span>
                    </Button>
                  </div>
                </div>

                {/* Status Summary Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="bg-cream/60 border border-border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-sans text-[11px] text-muted-foreground uppercase font-semibold">
                        Total Popup Cards (Brand + All 32 Festivals)
                      </p>
                      <p className="font-display text-xl font-bold text-foreground">{adminPromoPopups.length}</p>
                    </div>
                    <Sparkles className="w-7 h-7 text-gold/70" />
                  </div>
                  <div className="bg-emerald-50/70 border border-emerald-300/70 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-sans text-[11px] text-emerald-800 uppercase font-semibold">Active • Showing on Website (ON)</p>
                      <p className="font-display text-xl font-bold text-emerald-700">{activePromoPopupsCount}</p>
                    </div>
                    <CheckCircle className="w-7 h-7 text-emerald-600" />
                  </div>
                  <div className="bg-rose-50/70 border border-rose-300/70 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-sans text-[11px] text-rose-800 uppercase font-semibold">Hidden • Not Showing (OFF)</p>
                      <p className="font-display text-xl font-bold text-rose-700">
                        {adminPromoPopups.length - activePromoPopupsCount}
                      </p>
                    </div>
                    <XCircle className="w-7 h-7 text-rose-500" />
                  </div>
                </div>

                {/* Search & Festival Category / Status Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border">
                  <SearchBar
                    value={promoSearch}
                    onChange={setPromoSearch}
                    placeholder="Search festival popup (Diwali, Eid, Holi, Republic Day, Shivaji Jayanti...)"
                  />

                  <Select value={promoCategoryFilter} onValueChange={setPromoCategoryFilter}>
                    <SelectTrigger className="w-[235px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Popup Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Popup Cards ({adminPromoPopups.length})</SelectItem>
                      <SelectItem value="general">
                        General Brand Popups ({adminPromoPopups.filter((c) => !c.festival_id).length})
                      </SelectItem>
                      <SelectItem value="festivals_all">
                        All Festival Popups ({adminPromoPopups.filter((c) => Boolean(c.festival_id)).length})
                      </SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({adminPromoPopups.filter((c) => c.festival_category === key).length})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={promoStatusFilter} onValueChange={setPromoStatusFilter}>
                    <SelectTrigger className="w-[180px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses (ON &amp; OFF)</SelectItem>
                      <SelectItem value="on">Active / Showing (ON Only)</SelectItem>
                      <SelectItem value="off">Hidden (OFF Only)</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={promoModeFilter} onValueChange={setPromoModeFilter}>
                    <SelectTrigger className="w-[175px] h-9 font-sans text-xs">
                      <SelectValue placeholder="All Schedule Modes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Schedule Modes</SelectItem>
                      <SelectItem value="auto">Auto Festival Schedule</SelectItem>
                      <SelectItem value="manual">Manual Admin Override</SelectItem>
                    </SelectContent>
                  </Select>

                  {(promoSearch ||
                    promoCategoryFilter !== "all" ||
                    promoStatusFilter !== "all" ||
                    promoModeFilter !== "all") && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPromoSearch("");
                        setPromoCategoryFilter("all");
                        setPromoStatusFilter("all");
                        setPromoModeFilter("all");
                      }}
                      className="h-9 px-2.5 font-sans text-xs gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset
                    </Button>
                  )}

                  <span className="ml-auto font-sans text-xs text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{filteredPromoPopups.length}</span> of{" "}
                    {adminPromoPopups.length} popup cards
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              {filteredPromoPopups.length === 0 ? (
                <div className="bg-background border border-border rounded-xl p-10 text-center space-y-3">
                  <Sparkles className="w-10 h-10 text-gold mx-auto" />
                  <h3 className="font-display text-lg font-bold text-foreground">No Matching Popup Advertisement Cards</h3>
                  <p className="font-sans text-xs text-muted-foreground max-w-md mx-auto">
                    Try clearing your search or category filter, or click &ldquo;Add More Popup Card&rdquo; to create a new website popup banner.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPromoSearch("");
                        setPromoCategoryFilter("all");
                        setPromoStatusFilter("all");
                      }}
                      className="font-sans text-xs gap-1.5"
                    >
                      Reset Filters
                    </Button>
                    <Button
                      onClick={handleOpenAddPromoCard}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Add New Popup Card
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {filteredPromoPopups.map((card, idx) => {
                    const isActive = card.is_active !== false;
                    const hasManualOverride = promoPopupDbRecords.some(
                      (r) => r.id === card.id && !r.is_deleted && typeof r.is_active === "boolean"
                    );
                    const isLiveFestivalToday =
                      Boolean(card.festival_id) && card.festival_id === festivalActiveOccasion?.id;

                    return (
                      <div
                        key={card.id}
                        className={`bg-background rounded-2xl border-2 transition-all overflow-hidden shadow-md flex flex-col justify-between ${
                          isActive ? "border-emerald-500/70 ring-1 ring-emerald-500/20" : "border-border opacity-90"
                        }`}
                      >
                        {/* Top Admin ON/OFF Control Bar */}
                        <div
                          className={`px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
                            isActive
                              ? "bg-emerald-50/80 border-emerald-200"
                              : "bg-muted/50 border-border"
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-dark text-gold font-display font-bold text-sm shrink-0 border border-gold/40"
                              style={
                                card.festival_primary_color
                                  ? { borderColor: card.festival_primary_color }
                                  : undefined
                              }
                            >
                              {card.festival_icon || `#${idx + 1}`}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-sans text-xs sm:text-sm font-bold text-foreground">
                                  {card.title_label || card.headline_en || `Popup Card #${idx + 1}`}
                                </span>
                                {card.festival_category && (
                                  <Badge variant="secondary" className="text-[10px] font-sans">
                                    {CATEGORY_LABELS[card.festival_category as OccasionCategory] || card.festival_category}
                                  </Badge>
                                )}
                                {card.festival_date_label && (
                                  <Badge variant="outline" className="text-[10px] font-mono border-gold/50 text-foreground">
                                    {card.festival_date_label}
                                  </Badge>
                                )}
                                {isLiveFestivalToday && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-sans">
                                    Active Festival Today
                                  </Badge>
                                )}
                                {card.festival_id && !hasManualOverride && (
                                  <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-700 font-sans">
                                    Auto-ON on Festival Date
                                  </Badge>
                                )}
                                {!card.festival_id && isDefaultPromoPopup(card.id) && (
                                  <Badge variant="outline" className="text-[10px] border-gold/50 text-foreground">
                                    Default Brand Card
                                  </Badge>
                                )}
                              </div>
                              <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                                {isActive
                                  ? "✅ Currently ON — Showing to visitors when website opens"
                                  : card.festival_id && !hasManualOverride
                                  ? "🗓️ Currently OFF (Auto Mode — Will turn ON automatically on its festival date, or switch ON manually now)"
                                  : "🚫 Currently OFF — Hidden from website visitors"}
                              </p>
                            </div>
                          </div>

                          {/* ON / OFF Switch + Status Pill */}
                          <div className="flex items-center gap-2.5 bg-background px-3 py-1.5 rounded-full border border-border shadow-sm shrink-0">
                            <span
                              className={`font-sans text-xs font-extrabold uppercase tracking-wider ${
                                isActive ? "text-emerald-700" : "text-muted-foreground"
                              }`}
                            >
                              {isActive ? "ON (Show)" : "OFF (Hide)"}
                            </span>
                            <Switch
                              checked={isActive}
                              onCheckedChange={(checked) => handleTogglePromoCardActive(card, checked)}
                              aria-label={`Toggle popup card ${card.title_label || idx + 1} ON or OFF`}
                            />
                          </div>
                        </div>

                        {/* Live Visual Preview of the Popup Card (Exact Website Look with Black × Button) */}
                        <div className="p-4 sm:p-5 bg-neutral-900/95 flex items-center justify-center">
                          <div className="w-full max-w-xl">
                            <PromoPopupCardView
                              card={card}
                              isPreview
                              onClose={() => handleTogglePromoCardActive(card, false)}
                            />
                          </div>
                        </div>

                        {/* Bottom Action Bar */}
                        <div className="px-4 py-3 bg-background border-t border-border flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={isActive ? "outline" : "default"}
                              onClick={() => handleTogglePromoCardActive(card, !isActive)}
                              className={
                                isActive
                                  ? "font-sans text-xs h-8 gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs h-8 gap-1.5"
                              }
                            >
                              {isActive ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Turn OFF (Do Not Show)</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Turn ON (Show on Website)</span>
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewPromoCard(card)}
                              className="font-sans text-xs h-8 gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              <span>Preview Popup</span>
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleOpenEditPromoCard(card)}
                              className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-8 gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit / Update Card</span>
                            </Button>

                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePromoCard(card)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Delete Popup Card"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* LIVE FESTIVAL & SPECIAL DAY THEMES TAB */}
          <TabsContent value="festivals">
            <FestivalThemeAdminSection />
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            {/* Admin Accounts Section */}
            <div className="mb-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold" /> Admin Accounts
              </h2>
              <div className="bg-background border border-border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans text-xs">Admin</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                      <TableHead className="font-sans text-xs hidden md:table-cell">Password</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="font-sans text-xs">Role</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="font-sans text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles.filter(p => adminUsers.some(a => a.user_id === p.user_id)).map((p) => {
                      const email = getUserEmail(p.user_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-sans text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <Shield className="w-3.5 h-3.5 text-gold" />}
                              </div>
                              <span className="font-medium">{p.full_name || "Admin"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{email}</TableCell>
                          <TableCell className="font-sans text-xs hidden md:table-cell">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <code className="bg-muted/50 px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wide border border-border">
                                {visiblePasswords[p.id] ? (p.user_password || "••••••••") : "••••••••"}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => togglePasswordVisibility(p.id)}
                                title={visiblePasswords[p.id] ? "Hide password" : "Show real password"}
                              >
                                {visiblePasswords[p.id] ? <EyeOff className="w-3.5 h-3.5 text-gold" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Real password when admin created</p>
                          </TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{p.phone || "—"}</TableCell>
                          <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">admin</Badge></TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(p.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(p)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProfile(p)}><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {profiles.filter(p => adminUsers.some(a => a.user_id === p.user_id)).length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center font-sans text-muted-foreground py-8">No admin accounts found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Regular Users Section */}
            <div>
              <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> User Accounts
              </h2>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search users by name, email, phone..." />
                <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                  <SelectTrigger className="h-9 w-[120px] font-sans text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                    <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                    <SelectItem value="user" className="text-xs">User</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userPhoneFilter} onValueChange={setUserPhoneFilter}>
                  <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Phone Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Contacts</SelectItem>
                    <SelectItem value="with_phone" className="text-xs">Has Phone Number</SelectItem>
                    <SelectItem value="without_phone" className="text-xs">No Phone Number</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userDateFilter} onValueChange={setUserDateFilter}>
                  <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{dateFilterOptions.map(df => <SelectItem key={df.value} value={df.value} className="text-xs">{df.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={userSort} onValueChange={setUserSort}>
                  <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                    <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                    <SelectItem value="name_asc" className="text-xs">Name (A → Z)</SelectItem>
                  </SelectContent>
                </Select>
                {(userSearch || userRoleFilter !== "all" || userPhoneFilter !== "all" || userDateFilter !== "all" || userSort !== "newest") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUserSearch("");
                      setUserRoleFilter("all");
                      setUserPhoneFilter("all");
                      setUserDateFilter("all");
                      setUserSort("newest");
                    }}
                    className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reset
                  </Button>
                )}
                <Badge variant="outline" className="font-sans text-[11px] px-2.5 py-1">
                  Showing {filteredUsers.length} of {profiles.length}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 font-sans text-xs gap-1.5 ml-auto hover:border-gold/60"
                    >
                      <Download className="w-3.5 h-3.5 text-gold" />
                      <span>Export</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 font-sans">
                    <DropdownMenuItem onClick={() => handleGeneratePDF("users", userDateFilter)} className="cursor-pointer gap-2">
                      <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("csv", "users", userDateFilter)} className="cursor-pointer gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("excel", "users", userDateFilter)} className="cursor-pointer gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("json", "users", userDateFilter)} className="cursor-pointer gap-2">
                      <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="bg-background border border-border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-sans text-xs">User</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                      <TableHead className="font-sans text-xs hidden md:table-cell">Password</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="font-sans text-xs">Role</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="font-sans text-xs w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((p) => {
                      const role = getUserRole(p.user_id);
                      const isCurrentAdmin = p.user_id === user?.id;
                      const email = getUserEmail(p.user_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-sans text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                                {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-3.5 h-3.5 text-gold" />}
                              </div>
                              <span className="font-medium">{p.full_name || "—"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{email}</TableCell>
                          <TableCell className="font-sans text-xs hidden md:table-cell">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <code className="bg-muted/50 px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wide border border-border">
                                {visiblePasswords[p.id] ? (p.user_password || "••••••••") : "••••••••"}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                onClick={() => togglePasswordVisibility(p.id)}
                                title={visiblePasswords[p.id] ? "Hide password" : "Show real password"}
                              >
                                {visiblePasswords[p.id] ? <EyeOff className="w-3.5 h-3.5 text-gold" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] gap-1 font-sans text-gold border-gold/40 hover:bg-gold/10"
                                onClick={() => {
                                  setPasswordModalUser(p);
                                  setAdminNewPassword("");
                                  setShowNewPassword(false);
                                  setShowModalRealPassword(false);
                                }}
                                title="View Real Password & Manage"
                              >
                                <KeyRound className="w-3 h-3 text-gold" />
                                <span>View / Manage</span>
                              </Button>
                            </div>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Real password when user created</p>
                          </TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{p.phone || "—"}</TableCell>
                          <TableCell><Badge className={`text-[10px] capitalize ${role === "admin" ? "bg-red-100 text-red-700 border-red-300" : "bg-blue-100 text-blue-700 border-blue-300"}`}>{role}</Badge></TableCell>
                          <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(p.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(p)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProfile(p)}><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                              {!isCurrentAdmin && role !== "admin" && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteUser(p)}><UserX className="w-3.5 h-3.5 text-destructive" /></Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {paginatedUsers.length === 0 && <TableRow><TableCell colSpan={7} className="text-center font-sans text-muted-foreground py-8">{userSearch ? "No matching users" : "No users yet"}</TableCell></TableRow>}
                  </TableBody>
                </Table>
                <PaginationControls currentPage={userPage} totalPages={totalPages(filteredUsers.length)} onPageChange={setUserPage} />
              </div>
            </div>
          </TabsContent>

          {/* PURCHASE INQUIRIES TAB */}
          <TabsContent value="purchase">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <SearchBar value={inquirySearch} onChange={setInquirySearch} placeholder="Search inquiries by name, buffalo, phone..." />
              <Select value={inquiryStatusFilter} onValueChange={(v) => { setInquiryStatusFilter(v); setInquiryPage(1); }}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                  <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={inquiryBreedFilter} onValueChange={(v) => { setInquiryBreedFilter(v); setInquiryPage(1); }}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="All Breeds" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Breeds</SelectItem>
                  <SelectItem value="general" className="text-xs">General Inquiry</SelectItem>
                  {["Murrah", "Jaffarabadi", "Surti", "Mehsana", "Nili-Ravi", "Bhadawari", "Nagpuri", "Pandharpuri", "Toda", "Banni"].map(breed => (
                    <SelectItem key={breed} value={breed} className="text-xs">{breed}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={inquiryNoteFilter} onValueChange={(v) => { setInquiryNoteFilter(v); setInquiryPage(1); }}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Admin Notes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Notes</SelectItem>
                  <SelectItem value="with_note" className="text-xs">With Admin Note</SelectItem>
                  <SelectItem value="without_note" className="text-xs">No Admin Note</SelectItem>
                </SelectContent>
              </Select>
              <Select value={inquiryDateFilter} onValueChange={(v) => { setInquiryDateFilter(v); setInquiryPage(1); }}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{dateFilterOptions.map(df => <SelectItem key={df.value} value={df.value} className="text-xs">{df.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={inquirySort} onValueChange={(v) => { setInquirySort(v); setInquiryPage(1); }}>
                <SelectTrigger className="h-9 w-[145px] font-sans text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                  <SelectItem value="price_desc" className="text-xs">Price: High → Low</SelectItem>
                  <SelectItem value="price_asc" className="text-xs">Price: Low → High</SelectItem>
                </SelectContent>
              </Select>
              {(inquirySearch || inquiryStatusFilter !== "all" || inquiryBreedFilter !== "all" || inquiryNoteFilter !== "all" || inquiryDateFilter !== "all" || inquirySort !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInquirySearch("");
                    setInquiryStatusFilter("all");
                    setInquiryBreedFilter("all");
                    setInquiryNoteFilter("all");
                    setInquiryDateFilter("all");
                    setInquirySort("newest");
                  }}
                  className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-sans text-xs gap-1.5 ml-auto hover:border-gold/60"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem onClick={() => handleGeneratePDF("inquiries", inquiryDateFilter)} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("csv", "inquiries", inquiryDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("excel", "inquiries", inquiryDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("json", "inquiries", inquiryDateFilter)} className="cursor-pointer gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Quick status filter chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: "all", label: "All", count: purchaseInquiries.length },
                { key: "pending", label: "Pending", count: purchaseInquiries.filter(pi => (pi.status || "pending") === "pending").length },
                { key: "accepted", label: "Accepted", count: purchaseInquiries.filter(pi => pi.status === "accepted").length },
                { key: "confirmed", label: "Confirmed", count: purchaseInquiries.filter(pi => pi.status === "confirmed").length },
                { key: "completed", label: "Completed", count: purchaseInquiries.filter(pi => pi.status === "completed").length },
                { key: "rejected", label: "Rejected", count: purchaseInquiries.filter(pi => pi.status === "rejected").length },
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => { setInquiryStatusFilter(st.key); setInquiryPage(1); }}
                  className={`text-xs font-sans px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    inquiryStatusFilter === st.key
                      ? "bg-gold text-green-dark border-gold font-semibold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {st.label} <span className="text-[10px] opacity-80">({st.count})</span>
                </button>
              ))}
              <Badge variant="outline" className="ml-auto font-sans text-[11px] px-2.5 py-1">
                Showing {filteredInquiries.length} of {purchaseInquiries.length}
              </Badge>
            </div>

            <div className="bg-background border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Name</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-sans text-xs">Phone</TableHead>
                    <TableHead className="font-sans text-xs hidden md:table-cell">Buffalo</TableHead>
                    <TableHead className="font-sans text-xs">Message</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="font-sans text-xs w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInquiries.map((pi) => (
                    <TableRow key={pi.id}>
                      <TableCell className="font-sans text-xs font-medium">{pi.name}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{pi.email}</TableCell>
                      <TableCell className="font-sans text-xs">{pi.phone}</TableCell>
                      <TableCell className="font-sans text-xs hidden md:table-cell">{pi.buffalo_name ? `${pi.buffalo_name} · ₹${pi.buffalo_price?.toLocaleString()}` : "General"}</TableCell>
                      <TableCell className="font-sans text-xs max-w-[100px] md:max-w-[200px] truncate">{pi.message}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openStatusModal("purchase_inquiries", pi)}
                          className="hover:opacity-80 transition-opacity cursor-pointer text-left"
                          title="Click to update status"
                        >
                          {statusBadge(pi.status)}
                        </button>
                      </TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(pi.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInquiry(pi)} title="View Details"><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => openStatusModal("purchase_inquiries", pi)} title="Update Status"><CheckCircle className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditInquiry(pi)} title="Edit"><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRecord("purchase_inquiries", pi.id, setPurchaseInquiries)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedInquiries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center font-sans text-muted-foreground py-8">{inquirySearch || inquiryStatusFilter !== "all" ? "No matching inquiries" : "No inquiries yet"}</TableCell></TableRow>}
                </TableBody>
              </Table>
              <PaginationControls currentPage={inquiryPage} totalPages={totalPages(filteredInquiries.length)} onPageChange={setInquiryPage} />
            </div>
          </TabsContent>

          {/* CONSULTATIONS TAB */}
          <TabsContent value="consultations">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <SearchBar value={consultSearch} onChange={setConsultSearch} placeholder="Search consultations by name, email, phone..." />
              <Select value={consultStatusFilter} onValueChange={setConsultStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                  <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={consultNoteFilter} onValueChange={setConsultNoteFilter}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Admin Notes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Notes</SelectItem>
                  <SelectItem value="with_note" className="text-xs">With Admin Note</SelectItem>
                  <SelectItem value="without_note" className="text-xs">No Admin Note</SelectItem>
                </SelectContent>
              </Select>
              <Select value={consultDateFilter} onValueChange={setConsultDateFilter}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{dateFilterOptions.map(df => <SelectItem key={df.value} value={df.value} className="text-xs">{df.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={consultSort} onValueChange={setConsultSort}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                  <SelectItem value="name_asc" className="text-xs">Name (A → Z)</SelectItem>
                </SelectContent>
              </Select>
              {(consultSearch || consultStatusFilter !== "all" || consultNoteFilter !== "all" || consultDateFilter !== "all" || consultSort !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConsultSearch("");
                    setConsultStatusFilter("all");
                    setConsultNoteFilter("all");
                    setConsultDateFilter("all");
                    setConsultSort("newest");
                  }}
                  className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-sans text-xs gap-1.5 ml-auto hover:border-gold/60"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem onClick={() => handleGeneratePDF("consultations", consultDateFilter)} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("csv", "consultations", consultDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("excel", "consultations", consultDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("json", "consultations", consultDateFilter)} className="cursor-pointer gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Quick status filter chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: "all", label: "All", count: consultations.length },
                { key: "pending", label: "Pending", count: consultations.filter(c => (c.status || "pending") === "pending").length },
                { key: "accepted", label: "Accepted", count: consultations.filter(c => c.status === "accepted").length },
                { key: "confirmed", label: "Confirmed", count: consultations.filter(c => c.status === "confirmed").length },
                { key: "completed", label: "Completed", count: consultations.filter(c => c.status === "completed").length },
                { key: "rejected", label: "Rejected", count: consultations.filter(c => c.status === "rejected").length },
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => { setConsultStatusFilter(st.key); setConsultPage(1); }}
                  className={`text-xs font-sans px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    consultStatusFilter === st.key
                      ? "bg-gold text-green-dark border-gold font-semibold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {st.label} <span className="text-[10px] opacity-80">({st.count})</span>
                </button>
              ))}
              <Badge variant="outline" className="ml-auto font-sans text-[11px] px-2.5 py-1">
                Showing {filteredConsultations.length} of {consultations.length}
              </Badge>
            </div>
            <div className="bg-background border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Name</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-sans text-xs">Phone</TableHead>
                     <TableHead className="font-sans text-xs">Status</TableHead>
                     <TableHead className="font-sans text-xs hidden sm:table-cell">Date</TableHead>
                     <TableHead className="font-sans text-xs w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedConsultations.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-sans text-xs font-medium">{c.name}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{c.email}</TableCell>
                      <TableCell className="font-sans text-xs">{c.phone}</TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(c.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewConsult(c)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStatusModal("consultation_requests", c)} title="Update Status"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditConsult(c)}><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRecord("consultation_requests", c.id, setConsultations)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedConsultations.length === 0 && <TableRow><TableCell colSpan={6} className="text-center font-sans text-muted-foreground py-8">{consultSearch ? "No matching consultations" : "No consultations yet"}</TableCell></TableRow>}
                </TableBody>
              </Table>
              <PaginationControls currentPage={consultPage} totalPages={totalPages(filteredConsultations.length)} onPageChange={setConsultPage} />
            </div>
          </TabsContent>

          {/* MESSAGES TAB */}
          <TabsContent value="messages">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <SearchBar value={messageSearch} onChange={setMessageSearch} placeholder="Search messages by name, email, content..." />
              <Select value={messageStatusFilter} onValueChange={setMessageStatusFilter}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                  <SelectItem value="pending" className="text-xs">Pending</SelectItem>
                  <SelectItem value="accepted" className="text-xs">Accepted</SelectItem>
                  <SelectItem value="confirmed" className="text-xs">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={messagePhoneFilter} onValueChange={setMessagePhoneFilter}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Contact Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Contacts</SelectItem>
                  <SelectItem value="with_phone" className="text-xs">With Phone</SelectItem>
                  <SelectItem value="email_only" className="text-xs">Email Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={messageDateFilter} onValueChange={setMessageDateFilter}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{dateFilterOptions.map(df => <SelectItem key={df.value} value={df.value} className="text-xs">{df.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={messageSort} onValueChange={setMessageSort}>
                <SelectTrigger className="h-9 w-[140px] font-sans text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                  <SelectItem value="name_asc" className="text-xs">Name (A → Z)</SelectItem>
                </SelectContent>
              </Select>
              {(messageSearch || messageStatusFilter !== "all" || messagePhoneFilter !== "all" || messageDateFilter !== "all" || messageSort !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMessageSearch("");
                    setMessageStatusFilter("all");
                    setMessagePhoneFilter("all");
                    setMessageDateFilter("all");
                    setMessageSort("newest");
                  }}
                  className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-sans text-xs gap-1.5 ml-auto hover:border-gold/60"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem onClick={() => handleGeneratePDF("consultations", messageDateFilter)} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("csv", "consultations", messageDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("excel", "consultations", messageDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("json", "consultations", messageDateFilter)} className="cursor-pointer gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {/* Quick status filter chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: "all", label: "All", count: contacts.length },
                { key: "pending", label: "Pending", count: contacts.filter(m => (m.status || "pending") === "pending").length },
                { key: "accepted", label: "Accepted", count: contacts.filter(m => m.status === "accepted").length },
                { key: "confirmed", label: "Confirmed", count: contacts.filter(m => m.status === "confirmed").length },
                { key: "completed", label: "Completed", count: contacts.filter(m => m.status === "completed").length },
                { key: "rejected", label: "Rejected", count: contacts.filter(m => m.status === "rejected").length },
              ].map(st => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => { setMessageStatusFilter(st.key); setMessagePage(1); }}
                  className={`text-xs font-sans px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    messageStatusFilter === st.key
                      ? "bg-gold text-green-dark border-gold font-semibold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {st.label} <span className="text-[10px] opacity-80">({st.count})</span>
                </button>
              ))}
              <Badge variant="outline" className="ml-auto font-sans text-[11px] px-2.5 py-1">
                Showing {filteredMessages.length} of {contacts.length}
              </Badge>
            </div>
            <div className="bg-background border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-sans text-xs">Name</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                    <TableHead className="font-sans text-xs">Message</TableHead>
                    <TableHead className="font-sans text-xs">Status</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Date</TableHead>
                    <TableHead className="font-sans text-xs w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMessages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-sans text-xs font-medium">{m.name}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{m.email}</TableCell>
                      <TableCell className="font-sans text-xs max-w-[100px] md:max-w-[200px] truncate">{m.message}</TableCell>
                      <TableCell>{statusBadge(m.status)}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(m.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewContact(m)}><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openStatusModal("contact_messages", m)} title="Update Status"><CheckCircle className="w-3.5 h-3.5 text-green-600" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditMessage(m)}><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteRecord("contact_messages", m.id, setContacts)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedMessages.length === 0 && <TableRow><TableCell colSpan={6} className="text-center font-sans text-muted-foreground py-8">{messageSearch ? "No matching messages" : "No messages yet"}</TableCell></TableRow>}
                </TableBody>
              </Table>
              <PaginationControls currentPage={messagePage} totalPages={totalPages(filteredMessages.length)} onPageChange={setMessagePage} />
            </div>
          </TabsContent>

          {/* CREDENTIALS TAB */}
          <TabsContent value="credentials">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3 bg-background border border-border rounded-lg p-3">
                <SearchBar value={credSearch} onChange={setCredSearch} placeholder="Search credentials by name, email, phone..." />
                <Select value={credRoleFilter} onValueChange={setCredRoleFilter}>
                  <SelectTrigger className="h-9 w-[135px] font-sans text-xs"><SelectValue placeholder="All Roles" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                    <SelectItem value="admin" className="text-xs">Admins Only</SelectItem>
                    <SelectItem value="user" className="text-xs">Users Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={credPasswordFilter} onValueChange={setCredPasswordFilter}>
                  <SelectTrigger className="h-9 w-[160px] font-sans text-xs"><SelectValue placeholder="Password Filter" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Accounts</SelectItem>
                    <SelectItem value="with_password" className="text-xs">Saved Plain Password</SelectItem>
                    <SelectItem value="masked" className="text-xs">Masked / Encrypted</SelectItem>
                  </SelectContent>
                </Select>
                {(credSearch || credRoleFilter !== "all" || credPasswordFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCredSearch("");
                      setCredRoleFilter("all");
                      setCredPasswordFilter("all");
                    }}
                    className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reset
                  </Button>
                )}
              </div>
              {credRoleFilter !== "user" && (
              <div>
                <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2"><Shield className="w-5 h-5 text-gold" /> Admin Accounts</h2>
                <div className="bg-background border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="font-sans text-xs">Admin</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                      <TableHead className="font-sans text-xs hidden md:table-cell">Password</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="font-sans text-xs">Role</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="font-sans text-xs w-28">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {profiles
                        .filter(p => adminUsers.some(a => a.user_id === p.user_id))
                        .filter(p => {
                          if (credPasswordFilter === "with_password" && !p.user_password) return false;
                          if (credPasswordFilter === "masked" && p.user_password) return false;
                          if (credSearch) {
                            const email = getUserEmail(p.user_id);
                            return s(p.full_name || "", credSearch) || s(email, credSearch) || s(p.phone || "", credSearch);
                          }
                          return true;
                        })
                        .map((p) => {
                        const isSelf = p.user_id === user?.id;
                        const email = getUserEmail(p.user_id);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-sans text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden shrink-0">
                                  {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" /> : <Shield className="w-3.5 h-3.5 text-gold" />}
                                </div>
                                <span className="font-medium">{p.full_name || "Admin"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{email !== "—" ? email : ADMIN_EMAIL}</TableCell>
                            <TableCell className="font-sans text-xs hidden md:table-cell">
                              <code className="bg-muted/30 px-1.5 py-0.5 rounded text-[10px]">••••••••</code>
                            </TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{p.phone || "—"}</TableCell>
                            <TableCell><Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">admin</Badge></TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(p.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(p)} title="View"><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProfile(p)} title="Edit"><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                                {!isSelf && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleUserRole(p)} title="Demote to user"><UserX className="w-3.5 h-3.5 text-orange-500" /></Button>}
                                {!isSelf && <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteUser(p)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {profiles.filter(p => adminUsers.some(a => a.user_id === p.user_id)).length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center font-sans text-muted-foreground py-8">No admin accounts found</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              )}
              {credRoleFilter !== "admin" && (
              <div>
                <h2 className="font-display text-lg font-bold text-foreground mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> User Accounts</h2>
                <div className="bg-background border border-border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead className="font-sans text-xs">Name</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Email</TableHead>
                      <TableHead className="font-sans text-xs hidden md:table-cell">Password</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Phone</TableHead>
                      <TableHead className="font-sans text-xs">Role</TableHead>
                      <TableHead className="font-sans text-xs hidden sm:table-cell">Joined</TableHead>
                      <TableHead className="font-sans text-xs w-28">Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {regularUsers
                        .filter(p => {
                          if (credPasswordFilter === "with_password" && !p.user_password) return false;
                          if (credPasswordFilter === "masked" && p.user_password) return false;
                          if (credSearch) {
                            const email = getUserEmail(p.user_id);
                            return s(p.full_name || "", credSearch) || s(email, credSearch) || s(p.phone || "", credSearch);
                          }
                          return true;
                        })
                        .map((p) => {
                        const email = getUserEmail(p.user_id);
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-sans text-xs font-medium">{p.full_name || "—"}</TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{email}</TableCell>
                            <TableCell className="font-sans text-xs hidden md:table-cell">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <code className="bg-muted/50 px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wide border border-border">
                                  {visiblePasswords[p.id] ? (p.user_password || "••••••••") : "••••••••"}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                  onClick={() => togglePasswordVisibility(p.id)}
                                  title={visiblePasswords[p.id] ? "Hide password" : "Show real password"}
                                >
                                  {visiblePasswords[p.id] ? <EyeOff className="w-3.5 h-3.5 text-gold" /> : <Eye className="w-3.5 h-3.5" />}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-1.5 text-[10px] gap-1 font-sans text-gold border-gold/40 hover:bg-gold/10"
                                  onClick={() => {
                                    setPasswordModalUser(p);
                                    setAdminNewPassword("");
                                    setShowNewPassword(false);
                                    setShowModalRealPassword(false);
                                  }}
                                  title="View Real Password & Manage"
                                >
                                  <KeyRound className="w-3 h-3 text-gold" />
                                  <span>View / Manage</span>
                                </Button>
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-0.5">Real password when user created</p>
                            </TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{p.phone || "—"}</TableCell>
                            <TableCell><Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">user</Badge></TableCell>
                            <TableCell className="font-sans text-xs hidden sm:table-cell">{formatDate(p.created_at)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewUser(p)} title="View"><Eye className="w-3.5 h-3.5 text-primary" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditProfile(p)} title="Edit"><Edit className="w-3.5 h-3.5 text-gold" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteUser(p)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {regularUsers.length === 0 && <TableRow><TableCell colSpan={7} className="text-center font-sans text-muted-foreground py-8">No regular users yet</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </div>
              </div>
              )}
            </div>
          </TabsContent>

          {/* ACTIVITY HISTORY TAB */}
          <TabsContent value="activity">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <SearchBar value={activitySearch} onChange={setActivitySearch} placeholder="Search activity logs..." />
              <Select value={activityRoleFilter} onValueChange={setActivityRoleFilter}>
                <SelectTrigger className="h-9 w-[120px] font-sans text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Roles</SelectItem>
                  <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                  <SelectItem value="user" className="text-xs">User</SelectItem>
                  <SelectItem value="guest" className="text-xs">Guest</SelectItem>
                  <SelectItem value="system" className="text-xs">System</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activityEntityFilter} onValueChange={setActivityEntityFilter}>
                <SelectTrigger className="h-9 w-[150px] font-sans text-xs"><SelectValue placeholder="Operation Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All Operations</SelectItem>
                  <SelectItem value="auth" className="text-xs">Authentication</SelectItem>
                  <SelectItem value="purchase_inquiry" className="text-xs">Purchase Enquiries</SelectItem>
                  <SelectItem value="consultation_request" className="text-xs">Consultations</SelectItem>
                  <SelectItem value="contact_message" className="text-xs">Messages</SelectItem>
                  <SelectItem value="profile" className="text-xs">User Profiles</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activityDateFilter} onValueChange={setActivityDateFilter}>
                <SelectTrigger className="h-9 w-[130px] font-sans text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{dateFilterOptions.map(df => <SelectItem key={df.value} value={df.value} className="text-xs">{df.label}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={activitySort} onValueChange={setActivitySort}>
                <SelectTrigger className="h-9 w-[135px] font-sans text-xs"><SelectValue placeholder="Sort By" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                  <SelectItem value="oldest" className="text-xs">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              {(activitySearch || activityRoleFilter !== "all" || activityEntityFilter !== "all" || activityDateFilter !== "all" || activitySort !== "newest") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActivitySearch("");
                    setActivityRoleFilter("all");
                    setActivityEntityFilter("all");
                    setActivityDateFilter("all");
                    setActivitySort("newest");
                  }}
                  className="h-9 font-sans text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Reset
                </Button>
              )}
              <Badge variant="outline" className="font-sans text-[11px] px-2.5 py-1">
                Showing {filteredActivityLogs.length} of {activityLogs.length}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-sans text-xs gap-1.5 ml-auto hover:border-gold/60"
                  >
                    <Download className="w-3.5 h-3.5 text-gold" />
                    <span>Export</span>
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-sans">
                  <DropdownMenuItem onClick={() => handleGeneratePDF("activity", activityDateFilter)} className="cursor-pointer gap-2">
                    <FileText className="w-4 h-4 text-gold" /> Download PDF (.pdf)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("csv", "activity", activityDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export CSV (.csv)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("excel", "activity", activityDateFilter)} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel (.xls)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportRecords("json", "activity", activityDateFilter)} className="cursor-pointer gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" /> Export JSON (.json)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Bulk action bar */}
            {activitySelectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2.5">
                <span className="font-sans text-xs font-semibold text-foreground">{activitySelectedIds.size} selected</span>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 font-sans text-xs gap-1.5"
                  onClick={() => setActivityBulkDeleteConfirm(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 font-sans text-xs text-muted-foreground"
                  onClick={() => setActivitySelectedIds(new Set())}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="bg-background border border-border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 pl-3">
                      <input
                        type="checkbox"
                        className="rounded border-border w-3.5 h-3.5 accent-gold cursor-pointer"
                        checked={paginatedActivityLogs.length > 0 && paginatedActivityLogs.every((a) => activitySelectedIds.has(a.id))}
                        onChange={() => toggleActivitySelectAll(paginatedActivityLogs)}
                        title="Select all on this page"
                      />
                    </TableHead>
                    <TableHead className="font-sans text-xs">Date</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">User</TableHead>
                    <TableHead className="font-sans text-xs">Role</TableHead>
                    <TableHead className="font-sans text-xs">Action</TableHead>
                    <TableHead className="font-sans text-xs hidden sm:table-cell">Type</TableHead>
                    <TableHead className="font-sans text-xs hidden md:table-cell">Details</TableHead>
                    <TableHead className="font-sans text-xs text-right pr-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActivityLogs.map((a) => (
                    <TableRow key={a.id} className={activitySelectedIds.has(a.id) ? "bg-gold/5" : ""}>
                      <TableCell className="pl-3 w-8">
                        <input
                          type="checkbox"
                          className="rounded border-border w-3.5 h-3.5 accent-gold cursor-pointer"
                          checked={activitySelectedIds.has(a.id)}
                          onChange={() => toggleActivitySelect(a.id)}
                        />
                      </TableCell>
                      <TableCell className="font-sans text-[10px] sm:text-xs whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-sans text-xs hidden sm:table-cell truncate max-w-[120px]">{a.user_email || "—"}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] capitalize ${a.user_role === "admin" ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/10 text-primary border-primary/30"}`}>{a.user_role}</Badge>
                      </TableCell>
                      <TableCell className="font-sans text-[10px] sm:text-xs capitalize">{a.action.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-sans text-xs capitalize hidden sm:table-cell">{a.entity_type.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-sans text-xs hidden md:table-cell max-w-[200px] truncate">{a.details || "—"}</TableCell>
                      <TableCell className="text-right pr-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-gold/10 hover:text-gold"
                            title="Edit log"
                            onClick={() => {
                              setActivityEditLog(a);
                              setActivityEditAction(a.action);
                              setActivityEditDetails(a.details || "");
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete log"
                            onClick={() => setActivityDeleteConfirmId(a.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedActivityLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center font-sans text-muted-foreground py-8">
                        {activitySearch ? "No matching activity" : "No activity recorded yet"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls currentPage={activityPage} totalPages={totalPages(filteredActivityLogs.length)} onPageChange={setActivityPage} />
            </div>

            {/* ── Edit Log Dialog ── */}
            <Dialog open={!!activityEditLog} onOpenChange={(o) => { if (!o) setActivityEditLog(null); }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-base flex items-center gap-2">
                    <Edit className="w-4 h-4 text-gold" /> Edit Activity Log
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</Label>
                    <Input
                      className="mt-1 font-sans text-sm h-9"
                      value={activityEditAction}
                      onChange={(e) => setActivityEditAction(e.target.value)}
                      placeholder="e.g. login, create_inquiry"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Details</Label>
                    <Textarea
                      className="mt-1 font-sans text-sm min-h-[80px] resize-none"
                      value={activityEditDetails}
                      onChange={(e) => setActivityEditDetails(e.target.value)}
                      placeholder="Optional notes or context…"
                    />
                  </div>
                  {activityEditLog && (
                    <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t border-border">
                      <p><span className="font-semibold">User:</span> {activityEditLog.user_email || "—"}</p>
                      <p><span className="font-semibold">Entity:</span> {activityEditLog.entity_type.replace(/_/g, " ")}</p>
                      <p><span className="font-semibold">Date:</span> {new Date(activityEditLog.created_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setActivityEditLog(null)} className="font-sans text-xs">Cancel</Button>
                  <Button
                    size="sm"
                    className="font-sans text-xs bg-gold hover:bg-gold-light text-green-dark gap-1.5"
                    disabled={activityEditSaving || !activityEditAction.trim()}
                    onClick={handleActivityEditSave}
                  >
                    {activityEditSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Single Delete Confirm ── */}
            <Dialog open={!!activityDeleteConfirmId} onOpenChange={(o) => { if (!o) setActivityDeleteConfirmId(null); }}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display text-base flex items-center gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" /> Delete Log Entry
                  </DialogTitle>
                </DialogHeader>
                <p className="font-sans text-sm text-muted-foreground">This will permanently remove this activity record. This action cannot be undone.</p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setActivityDeleteConfirmId(null)} className="font-sans text-xs">Cancel</Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-sans text-xs gap-1.5"
                    onClick={() => activityDeleteConfirmId && handleActivityDelete(activityDeleteConfirmId)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── Bulk Delete Confirm ── */}
            <Dialog open={activityBulkDeleteConfirm} onOpenChange={setActivityBulkDeleteConfirm}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle className="font-display text-base flex items-center gap-2 text-destructive">
                    <Trash2 className="w-4 h-4" /> Delete {activitySelectedIds.size} Logs
                  </DialogTitle>
                </DialogHeader>
                <p className="font-sans text-sm text-muted-foreground">
                  This will permanently delete <strong>{activitySelectedIds.size}</strong> selected activity records. This cannot be undone.
                </p>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setActivityBulkDeleteConfirm(false)} className="font-sans text-xs">Cancel</Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="font-sans text-xs gap-1.5"
                    onClick={handleActivityBulkDelete}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete All Selected
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings">
            <div className="space-y-6 max-w-4xl">
              {/* Header */}
              <div className="bg-background border border-border rounded-lg p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                      <SettingsIcon className="w-5 h-5 text-gold" /> System & Farm Management Settings
                    </h2>
                    <p className="font-sans text-xs text-muted-foreground mt-0.5">
                      Configure farm helpline contacts, real-time audio/email alerts, marketplace automation, and site-wide announcement banners.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleSaveFarmSettings}
                    disabled={savingFarmSettings}
                    className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs h-9 gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingFarmSettings ? "Saving Settings..." : "Save All Settings"}
                  </Button>
                </div>
              </div>

              {/* 1. Admin Notifications & Audio Preferences */}
              <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <Bell className="w-4 h-4 text-gold" /> Admin Notifications & Audio Preferences
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestAdminNotifications}
                    className="font-sans text-xs h-7 px-2.5 gap-1.5 border-gold/40 text-gold hover:bg-gold hover:text-green-dark transition-colors"
                  >
                    <BellRing className="w-3.5 h-3.5" /> Test Admin Alerts
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Admin Email Notifications */}
                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans text-xs font-semibold text-foreground">Admin Email Notifications</p>
                        <p className="font-sans text-[11px] text-muted-foreground">Receive instant email copies when a new inquiry or consultation is submitted.</p>
                      </div>
                    </div>
                    <Switch
                      checked={adminEmailNotifications}
                      onCheckedChange={handleAdminEmailToggle}
                    />
                  </div>

                  {/* Daily Inquiries Digest */}
                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-sans text-xs font-semibold text-foreground">Daily Inquiries Digest Email</p>
                        <p className="font-sans text-[11px] text-muted-foreground">Receive a consolidated morning email summarizing pending inquiries.</p>
                      </div>
                    </div>
                    <Switch
                      checked={Boolean(farmSettings.dailyDigestEmail)}
                      onCheckedChange={handleDailyDigestToggle}
                    />
                  </div>

                  {/* AI Voice Messages & Announcements */}
                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                        {adminVoiceNotifications ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-sans text-xs font-semibold text-foreground">AI Voice Announcements</p>
                        <p className="font-sans text-[11px] text-muted-foreground">Speak dashboard events and new inquiries aloud in clear AI voice.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminVoiceNotifications && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => voiceAnnouncer.speak("Admin AI voice system is operational and active.")}
                          className="font-sans text-[11px] h-7 px-2 gap-1"
                        >
                          <Volume2 className="w-3 h-3" /> Test
                        </Button>
                      )}
                      <Switch
                        checked={adminVoiceNotifications}
                        onCheckedChange={handleAdminVoiceToggle}
                      />
                    </div>
                  </div>

                  {/* Sound Effects */}
                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                        {adminSoundNotifications ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <p className="font-sans text-xs font-semibold text-foreground">Sound Effects & Chimes</p>
                        <p className="font-sans text-[11px] text-muted-foreground">Play soft audio feedback on new inquiries and operations.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {adminSoundNotifications && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => sound.playSuccess()}
                          className="font-sans text-[11px] h-7 px-2 gap-1"
                        >
                          <Bell className="w-3 h-3" /> Test
                        </Button>
                      )}
                      <Switch
                        checked={adminSoundNotifications}
                        onCheckedChange={handleAdminSoundToggle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Farm Business & Helpline Configuration */}
              <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
                  <Phone className="w-4 h-4 text-emerald-500" /> Farm Business & Helpline Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" /> Primary Phone / Helpline Number
                    </Label>
                    <Input
                      value={farmSettings.farmPhone}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, farmPhone: e.target.value }))
                      }
                      placeholder="+91-9022273915"
                      className="font-sans h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gold" /> Secondary / Alternate Helpline
                    </Label>
                    <Input
                      value={farmSettings.farmPhoneAlternate || ""}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, farmPhoneAlternate: e.target.value }))
                      }
                      placeholder="+91-7499553033"
                      className="font-sans h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Support Number
                    </Label>
                    <Input
                      value={farmSettings.farmWhatsapp}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, farmWhatsapp: e.target.value }))
                      }
                      placeholder="+91-9022273915"
                      className="font-sans h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gold" /> Official Farm Contact Email
                    </Label>
                    <Input
                      value={farmSettings.supportEmail}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, supportEmail: e.target.value }))
                      }
                      placeholder="contact@akbuffaloes.com"
                      className="font-sans h-9 text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gold" /> Working Hours & Visiting Schedule
                    </Label>
                    <Input
                      value={farmSettings.businessHours}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, businessHours: e.target.value }))
                      }
                      placeholder="Mon – Sat: 08:00 AM – 07:00 PM (IST)"
                      className="font-sans h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gold" /> Farm Physical Address & Location
                    </Label>
                    <Input
                      value={farmSettings.farmAddress}
                      onChange={(e) =>
                        setFarmSettings((prev: typeof farmSettings) => ({ ...prev, farmAddress: e.target.value }))
                      }
                      placeholder="AK Buffaloes Dairy Farm, Survey No. 42, Dairy Zone, Western Highway"
                      className="font-sans h-9 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Marketplace & Customer Interaction Controls */}
              <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-2">
                  <Sparkles className="w-4 h-4 text-gold" /> Marketplace & Live Website Controls
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div>
                      <p className="font-sans text-xs font-semibold text-foreground">Direct WhatsApp Inquiries Button</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Show instant WhatsApp chat button on all buffalo cards.</p>
                    </div>
                    <Switch
                      checked={Boolean(farmSettings.directWhatsappInquiry)}
                      onCheckedChange={handleDirectWhatsappToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div>
                      <p className="font-sans text-xs font-semibold text-foreground">Price Negotiable Badge</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Display "Price Negotiable" badge on eligible listings.</p>
                    </div>
                    <Switch
                      checked={Boolean(farmSettings.negotiableBadgeEnabled)}
                      onCheckedChange={handleNegotiableBadgeToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div>
                      <p className="font-sans text-xs font-semibold text-foreground">Customer Auto-Reply Email</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Send instant receipt email to buyers after submitting an inquiry.</p>
                    </div>
                    <Switch
                      checked={Boolean(farmSettings.customerAutoReplyEmail)}
                      onCheckedChange={handleCustomerAutoReplyToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between bg-muted/20 border border-border/60 rounded-lg p-3.5">
                    <div>
                      <p className="font-sans text-xs font-semibold text-foreground">New Stock Auto-Broadcast</p>
                      <p className="font-sans text-[11px] text-muted-foreground">Automatically email subscribed buyers when new buffaloes arrive.</p>
                    </div>
                    <Switch
                      checked={Boolean(farmSettings.autoStockArrivalEmail)}
                      onCheckedChange={handleAutoStockArrivalToggle}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Site-Wide Announcement & Promotional Banner */}
              <div className="bg-background border border-border rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-gold" /> Site-Wide Announcement Banner
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-sans text-muted-foreground">
                      {farmSettings.announcementBannerEnabled ? "Banner Active" : "Banner Hidden"}
                    </span>
                    <Switch
                      checked={Boolean(farmSettings.announcementBannerEnabled)}
                      onCheckedChange={handleAnnouncementBannerToggle}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground">
                    Banner Announcement Message
                  </Label>
                  <Textarea
                    value={farmSettings.announcementBannerText}
                    onChange={(e) =>
                      setFarmSettings((prev: typeof farmSettings) => ({ ...prev, announcementBannerText: e.target.value }))
                    }
                    placeholder="Enter special farm announcement, seasonal discount, or new stock notice..."
                    className="font-sans text-xs min-h-[70px]"
                  />
                  {farmSettings.announcementBannerEnabled && (
                    <div className="p-2.5 rounded-md bg-gold/15 border border-gold/40 text-green-dark font-sans text-xs flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-gold shrink-0" />
                      <span className="font-medium">{farmSettings.announcementBannerText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Session & Action Confirmation */}
              <div className="bg-background border border-border rounded-lg p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center text-gold shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-sans text-xs font-semibold text-foreground">Admin Session Inactivity Timeout</p>
                    <p className="font-sans text-[11px] text-muted-foreground">Auto-logout duration when inactive to protect admin controls.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Select
                    value={farmSettings.adminSessionTimeout}
                    onValueChange={(val) =>
                      setFarmSettings((prev: typeof farmSettings) => ({ ...prev, adminSessionTimeout: val }))
                    }
                  >
                    <SelectTrigger className="w-[140px] h-8 font-sans text-xs">
                      <SelectValue placeholder="Timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 Minutes">30 Minutes</SelectItem>
                      <SelectItem value="2 Hours">2 Hours</SelectItem>
                      <SelectItem value="12 Hours">12 Hours (Default)</SelectItem>
                      <SelectItem value="24 Hours">24 Hours</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFarmSettings(DEFAULT_FARM_SETTINGS);
                      saveFarmSiteSettings(DEFAULT_FARM_SETTINGS);
                      toast({ title: "Settings Reset to Defaults", description: "Default admin settings restored." });
                    }}
                    className="font-sans text-xs h-8 gap-1 text-muted-foreground"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSaveFarmSettings}
                    disabled={savingFarmSettings}
                    className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs h-8 gap-1.5 shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Save
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* VIEW CONTACT MODAL */}
      <Dialog open={!!viewContact} onOpenChange={() => setViewContact(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Message Details</DialogTitle></DialogHeader>
          {viewContact && (
            <div className="space-y-2 font-sans text-sm">
              <p><span className="text-muted-foreground">From:</span> {viewContact.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {viewContact.email}</p>
              {viewContact.phone && <p><span className="text-muted-foreground">Phone:</span> {viewContact.phone}</p>}
              <p><span className="text-muted-foreground">Date:</span> {formatDateTime(viewContact.created_at)}</p>
              <div className="bg-muted/10 border border-border rounded p-3 mt-2"><p className="text-muted-foreground text-xs mb-1">Message</p><p className="whitespace-pre-wrap">{viewContact.message}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW INQUIRY MODAL */}
      <Dialog open={!!viewInquiry} onOpenChange={() => setViewInquiry(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Inquiry Details</DialogTitle></DialogHeader>
          {viewInquiry && (
            <div className="space-y-3 font-sans text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status:</span>
                  {statusBadge(viewInquiry.status)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="font-sans text-xs gap-1.5 h-8 text-green-700 hover:text-green-800"
                  onClick={() => {
                    const cur = viewInquiry;
                    setViewInquiry(null);
                    openStatusModal("purchase_inquiries", cur);
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Update Status
                </Button>
              </div>
              <p><span className="text-muted-foreground">From:</span> {viewInquiry.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {viewInquiry.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {viewInquiry.phone}</p>
              {viewInquiry.buffalo_name && (
                <p><span className="text-muted-foreground">Buffalo:</span> <strong>{viewInquiry.buffalo_name}</strong> ({viewInquiry.buffalo_breed}) — ₹{viewInquiry.buffalo_price?.toLocaleString()}</p>
              )}
              <p><span className="text-muted-foreground">Date:</span> {formatDateTime(viewInquiry.created_at)}</p>
              {viewInquiry.admin_note && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2.5">
                  <p className="text-amber-800 dark:text-amber-300 text-xs font-semibold">Admin Note</p>
                  <p className="text-xs mt-0.5">{viewInquiry.admin_note}</p>
                </div>
              )}
              <div className="bg-muted/10 border border-border rounded p-3 mt-2">
                <p className="text-muted-foreground text-xs mb-1">Message</p>
                <p className="whitespace-pre-wrap">{viewInquiry.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* VIEW USER MODAL */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">User Details & History</DialogTitle></DialogHeader>
          {viewUser && (() => {
            const userInquiries = purchaseInquiries.filter(pi => pi.user_id === viewUser.user_id);
            const userLogs = activityLogs.filter(al => al.user_id === viewUser.user_id);
            return (
            <div className="space-y-5 font-sans text-sm">
              {/* User Info */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-2 border-border shrink-0">
                  {viewUser.avatar_url ? <img src={viewUser.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-7 h-7 text-gold" />}
                </div>
                <div>
                  <p className="font-bold text-foreground">{viewUser.full_name || "—"}</p>
                  <Badge className={`text-[10px] capitalize ${getUserRole(viewUser.user_id) === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{getUserRole(viewUser.user_id)}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p><span className="text-muted-foreground">Email:</span> {getUserEmail(viewUser.user_id)}</p>
                <p><span className="text-muted-foreground">Phone:</span> {viewUser.phone || "—"}</p>
                <p><span className="text-muted-foreground">Joined:</span> {formatDateTime(viewUser.created_at)}</p>
                <p><span className="text-muted-foreground">Inquiries:</span> {userInquiries.length}</p>
              </div>

              {/* Real User Password Display in View User Dialog */}
              <div className="p-3 bg-gold/10 border border-gold/40 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-gold" /> Real User Password:
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Password created by user at registration</p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-semibold bg-background px-2.5 py-1 rounded border text-xs">
                    {viewUserPasswordVisible ? (viewUser.user_password || "••••••••") : "••••••••"}
                  </code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setViewUserPasswordVisible(!viewUserPasswordVisible)}
                    title={viewUserPasswordVisible ? "Hide password" : "Show real password"}
                  >
                    {viewUserPasswordVisible ? <EyeOff className="w-3.5 h-3.5 text-gold" /> : <Eye className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              {/* User Inquiries History */}
              <div>
                <h3 className="font-display text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Inquiry History ({userInquiries.length})
                </h3>
                {userInquiries.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {userInquiries.map(pi => (
                      <div key={pi.id} className="bg-muted/20 border border-border rounded-md p-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold">{pi.buffalo_name || "General Enquiry"}</span>
                          {statusBadge(pi.status)}
                        </div>
                        <p className="line-clamp-2">{pi.message}</p>
                        <p className="text-muted-foreground mt-1 text-[10px]">{formatDate(pi.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No inquiries yet</p>
                )}
              </div>

              {/* User Activity Logs */}
              <div>
                <h3 className="font-display text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-gold" /> Activity History ({userLogs.length})
                </h3>
                {userLogs.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {userLogs.map(log => (
                      <div key={log.id} className="bg-muted/20 border border-border rounded-md px-2.5 py-2 text-xs flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-semibold capitalize">{log.action}</span>
                          <span className="text-muted-foreground"> · {log.entity_type}</span>
                          {log.details && <p className="text-muted-foreground mt-0.5 line-clamp-1">{log.details}</p>}
                        </div>
                        <span className="text-muted-foreground shrink-0 text-[10px]">{formatDateTime(log.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No activity recorded</p>
                )}
              </div>
            </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* EDIT PROFILE MODAL */}
      <Dialog open={editProfileModal} onOpenChange={setEditProfileModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Edit Account</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center overflow-hidden border-2 border-border cursor-pointer" onClick={() => adminAvatarRef.current?.click()}>
                  {editingProfile?.avatar_url ? (
                    <img src={editingProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-gold" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => adminAvatarRef.current?.click()}>
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input ref={adminAvatarRef} type="file" accept="image/*" onChange={handleAdminAvatarUpload} className="hidden" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-sans text-xs text-muted-foreground">{uploadingAdminAvatar ? "Uploading..." : "Click to change photo"}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] font-sans gap-1" onClick={() => adminAvatarRef.current?.click()} disabled={uploadingAdminAvatar}>
                    <Camera className="w-3 h-3" /> Upload
                  </Button>
                  {editingProfile?.avatar_url && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] font-sans gap-1 text-destructive hover:text-destructive" onClick={removeAdminAvatar} disabled={uploadingAdminAvatar}>
                      <ImageOff className="w-3 h-3" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="font-sans text-xs text-muted-foreground mb-1 block">Full Name</label>
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Full Name" className="font-sans h-10 text-sm" />
            </div>
            <div>
              <label className="font-sans text-xs text-muted-foreground mb-1 block">Phone</label>
              <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone Number" className="font-sans h-10 text-sm" />
            </div>
            <div>
              <label className="font-sans text-xs text-muted-foreground mb-1 block">Email</label>
              <Input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="Email Address" className="font-sans h-10 text-sm" />
            </div>
            <div>
              <label className="font-sans text-xs text-muted-foreground mb-1 block">New Password <span className="text-muted-foreground">(leave blank to keep current)</span></label>
              <Input type="password" autoComplete="new-password" value={profileForm.password} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} placeholder="Enter new password" className="font-sans h-10 text-sm" />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 gap-2">
              <Save className="w-4 h-4" />{savingProfile ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT INQUIRY MODAL */}
      <Dialog open={editInquiryModal} onOpenChange={setEditInquiryModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Edit Inquiry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Name</label>
            <Input value={inquiryForm.name} onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Phone</label>
            <Input value={inquiryForm.phone} onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Email</label>
            <Input value={inquiryForm.email} onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Message</label>
            <Textarea value={inquiryForm.message} onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} className="font-sans min-h-[80px] text-sm" /></div>
            <div>
              <label className="font-sans text-xs text-muted-foreground mb-1 block">Status</label>
              <Select value={inquiryForm.status} onValueChange={(val) => setInquiryForm({ ...inquiryForm, status: val })}>
                <SelectTrigger className="font-sans h-10 text-sm capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending" className="text-sm">Pending</SelectItem>
                  <SelectItem value="accepted" className="text-sm">Accepted</SelectItem>
                  <SelectItem value="confirmed" className="text-sm">Confirmed</SelectItem>
                  <SelectItem value="completed" className="text-sm">Completed</SelectItem>
                  <SelectItem value="rejected" className="text-sm">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveInquiry} disabled={savingInquiry} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 gap-2">
              <Save className="w-4 h-4" />{savingInquiry ? "Saving..." : "Update Inquiry"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* EDIT CONSULTATION MODAL */}
      <Dialog open={editConsultModal} onOpenChange={setEditConsultModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Edit Consultation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Name</label>
            <Input value={consultForm.name} onChange={(e) => setConsultForm({ ...consultForm, name: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Phone</label>
            <Input value={consultForm.phone} onChange={(e) => setConsultForm({ ...consultForm, phone: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Email</label>
            <Input value={consultForm.email} onChange={(e) => setConsultForm({ ...consultForm, email: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <Button onClick={saveConsult} disabled={savingConsult} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 gap-2">
              <Save className="w-4 h-4" />{savingConsult ? "Saving..." : "Update Consultation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW CONSULTATION MODAL */}
      <Dialog open={!!viewConsult} onOpenChange={() => setViewConsult(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Consultation Details</DialogTitle></DialogHeader>
          {viewConsult && (
            <div className="space-y-2 font-sans text-sm">
              <p><span className="text-muted-foreground">Name:</span> {viewConsult.name}</p>
              <p><span className="text-muted-foreground">Email:</span> {viewConsult.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {viewConsult.phone}</p>
              <p><span className="text-muted-foreground">Date:</span> {formatDateTime(viewConsult.created_at)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT MESSAGE MODAL */}
      <Dialog open={editMessageModal} onOpenChange={setEditMessageModal}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Edit Message</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Name</label>
            <Input value={messageForm.name} onChange={(e) => setMessageForm({ ...messageForm, name: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Phone</label>
            <Input value={messageForm.phone} onChange={(e) => setMessageForm({ ...messageForm, phone: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Email</label>
            <Input value={messageForm.email} onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })} className="font-sans h-10 text-sm" /></div>
            <div><label className="font-sans text-xs text-muted-foreground mb-1 block">Message</label>
            <Textarea value={messageForm.message} onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })} className="font-sans min-h-[80px] text-sm" /></div>
            <Button onClick={saveMessage} disabled={savingMessage} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold h-10 gap-2">
              <Save className="w-4 h-4" />{savingMessage ? "Saving..." : "Update Message"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* STATUS UPDATE MODAL */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent className="max-w-md mx-4 sm:mx-auto">
          <DialogHeader><DialogTitle className="font-display text-lg">Update Status & Notify User</DialogTitle></DialogHeader>
          {statusModal && (
            <div className="space-y-4">
              <div className="bg-muted/20 border border-border rounded-lg p-3">
                <p className="font-sans text-xs text-muted-foreground">Target Record</p>
                <p className="font-sans text-sm font-semibold text-foreground">{statusModal.record.name} — {statusModal.record.email}</p>
                {statusModal.record.buffalo_name && (
                  <p className="font-sans text-xs text-gold font-medium mt-1">
                    {statusModal.record.buffalo_name} ({statusModal.record.buffalo_breed})
                    {statusModal.record.buffalo_price ? ` — ₹${statusModal.record.buffalo_price.toLocaleString()}` : ""}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-sans text-xs text-muted-foreground">Current status:</span>
                  {statusBadge(statusModal.record.status)}
                </div>
              </div>

              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">New Status</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { s: "pending", label: "Pending", desc: "Awaiting review", badgeCls: "border-yellow-400 bg-yellow-50 text-yellow-800" },
                    { s: "accepted", label: "Accepted", desc: "Enquiry accepted", badgeCls: "border-green-400 bg-green-50 text-green-800" },
                    { s: "confirmed", label: "Confirmed", desc: "Details confirmed", badgeCls: "border-blue-400 bg-blue-50 text-blue-800" },
                    { s: "completed", label: "Completed", desc: "Process finished", badgeCls: "border-emerald-400 bg-emerald-50 text-emerald-800" },
                    { s: "rejected", label: "Rejected", desc: "Declined / rejected", badgeCls: "border-red-400 bg-red-50 text-red-800" },
                  ].map(({ s, label, desc, badgeCls }) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusAction(s)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all font-sans cursor-pointer ${
                        statusAction === s
                          ? `${badgeCls} ring-2 ring-gold font-bold shadow-sm`
                          : "border-border bg-background hover:bg-muted/40 text-foreground"
                      }`}
                    >
                      <span className="text-xs font-bold capitalize flex items-center gap-1">
                        {label}
                        {statusAction === s && <CheckCircle className="w-3 h-3 text-gold shrink-0 inline" />}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-sans text-sm font-medium mb-1">Note to user (optional)</p>
                <textarea
                  className="w-full border border-border rounded-md p-2.5 font-sans text-sm min-h-[80px] bg-background text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-gold"
                  placeholder="Add a message for the user about this status change..."
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  maxLength={500}
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" className="font-sans text-sm" onClick={() => setStatusModal(null)}>Cancel</Button>
                <Button disabled={updatingStatus} className="bg-gold text-green-dark hover:bg-gold-light font-sans text-sm font-semibold gap-2" onClick={applyStatusUpdate}>
                  <CheckCircle className="w-4 h-4" />
                  {updatingStatus ? "Updating..." : "Update & Notify"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT BUFFALO & NEW STOCK MODAL */}
      <Dialog open={editBuffaloModal} onOpenChange={setEditBuffaloModal}>
        <DialogContent className="max-w-2xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              {isCreatingBuffalo ? (
                <>
                  <Plus className="w-4 h-4 text-gold" />{" "}
                  {buffaloForm.is_new_stock
                    ? `Add New Stock (${buffaloForm.stock_code || "AKB"})`
                    : `Add Breed Catalog Buffalo (${buffaloForm.stock_code || "BRD"})`}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 text-gold" />{" "}
                  {buffaloForm.is_new_stock
                    ? `Edit New Stock (${buffaloForm.stock_code || "AKB"})`
                    : `Edit Breed Catalog Buffalo (${buffaloForm.stock_code || "BRD"})`}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {(isCreatingBuffalo || editingBuffalo) && (
            <div className="space-y-4 font-sans text-sm pt-2">
              {/* Section Switch (New Stocks AKB vs All 10 Buffalo Breeds BRD) & Stock Code Banner */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-green-dark via-primary to-green-dark text-cream border border-gold/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-gold text-green-dark flex items-center justify-center font-bold shadow-sm">
                      {buffaloForm.is_new_stock ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Layers className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <p className="font-display font-bold text-sm text-cream flex items-center gap-2">
                        {buffaloForm.is_new_stock
                          ? 'New Stocks Section ("New Arrival" Tab)'
                          : 'All 10 Buffalo Breeds Section ("Explore All 10 Breeds" Tab)'}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-extrabold uppercase tracking-wider bg-gold text-green-dark">
                          {buffaloForm.is_new_stock ? "New Stocks (AKB)" : "10 Breeds Catalog (BRD)"}
                        </span>
                      </p>
                      <p className="text-[11px] text-cream/75">
                        Both sections use the exact same Filter Bar + Left Cards Grid + Right Big Buffalo Detail Card format.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-semibold text-cream/90">
                      {buffaloForm.is_new_stock ? "New Stock" : "10 Breeds"}
                    </span>
                    <Switch
                      checked={buffaloForm.is_new_stock}
                      onCheckedChange={(checked) =>
                        setBuffaloForm((prev) => ({
                          ...prev,
                          is_new_stock: checked,
                          stock_code: isCreatingBuffalo
                            ? getNextStockCode(checked)
                            : prev.stock_code || getNextStockCode(checked),
                          subtitle_label:
                            prev.subtitle_label ||
                            `${prev.breed} Buffalo (${prev.calf_details || "With Calf"})`,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gold/20">
                  <div>
                    <Label className="text-[11px] text-gold font-bold uppercase tracking-wider">
                      {buffaloForm.is_new_stock
                        ? "Stock ID Code (e.g. AKB-001)"
                        : "Breed Catalog ID Code (e.g. BRD-001)"}
                    </Label>
                    <Input
                      value={buffaloForm.stock_code}
                      onChange={(e) =>
                        setBuffaloForm({ ...buffaloForm, stock_code: e.target.value.toUpperCase() })
                      }
                      placeholder={buffaloForm.is_new_stock ? "AKB-001" : "BRD-001"}
                      className="font-sans font-bold h-8 text-xs mt-1 bg-white/95 text-green-dark border-gold/40"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gold font-bold uppercase tracking-wider">
                      Card Title / Subtitle (Breed + Calf Status)
                    </Label>
                    <Input
                      value={buffaloForm.subtitle_label}
                      onChange={(e) =>
                        setBuffaloForm({ ...buffaloForm, subtitle_label: e.target.value })
                      }
                      placeholder="Jaffarabadi Buffalo (With Calf)"
                      className="font-sans h-8 text-xs mt-1 bg-white/95 text-green-dark border-gold/40"
                    />
                  </div>
                </div>
              </div>

              {/* Buffalo Photos (2 Photos Only per Buffalo Type) & Video Media Section */}
              <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <Label className="text-xs text-foreground font-bold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-gold" /> Buffalo Photos (2 Images Per Buffalo Type)
                  </Label>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-sans font-bold bg-gold/15 text-gold border border-gold/30">
                    Strictly 2 Images (Photo 1 + Photo 2)
                  </span>
                </div>

                {/* Photo 1: Primary Profile Photo */}
                <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center text-[11px] font-bold">1</span>
                      Photo 1 of 2 (Main Profile Photo)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">Primary listing card display</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-950 border-2 border-gold/40 shrink-0 flex items-center justify-center">
                      {buffaloForm.image_url ? (
                        <img
                          src={resolveBuffaloImage({ breed: buffaloForm.breed, image_url: buffaloForm.image_url }, 0, buffaloForm.breed)}
                          alt={buffaloForm.name || "Buffalo Photo 1 preview"}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground text-[10px]">
                          <ImageOff className="w-6 h-6 mb-1 text-gold/40" />
                          <span className="font-semibold text-foreground/80">No Photo 1</span>
                          <span className="text-[9px] text-muted-foreground">Click Add Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        ref={buffaloImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBuffaloImageFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => buffaloImageInputRef.current?.click()}
                          disabled={uploadingBuffaloImage}
                          className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-7 gap-1.5"
                        >
                          {buffaloForm.image_url ? <Upload className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>
                            {uploadingBuffaloImage
                              ? "Uploading Photo 1..."
                              : buffaloForm.image_url
                              ? "Upload / Change Photo 1"
                              : "+ Add Photo 1 from Device"}
                          </span>
                        </Button>

                        {buffaloForm.image_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveBuffaloImage}
                            className="h-7 font-sans text-xs gap-1 border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Photo 1 from this buffalo"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" /> Remove Photo 1
                          </Button>
                        )}

                        {buffaloForm.image_url &&
                          buffaloForm.image_url !== getDefaultBreedImage(buffaloForm.breed) && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setBuffaloForm((prev) => ({
                                  ...prev,
                                  image_url: getDefaultBreedImage(prev.breed),
                                }));
                              }}
                              className="h-7 font-sans text-xs gap-1 text-muted-foreground"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset Default
                            </Button>
                          )}
                      </div>

                      {/* Built-in Breed Photo 1 Preset (Strictly 1 Selected Photo) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-muted-foreground">
                            Preset photo for {buffaloForm.breed} (1 photo):
                          </p>
                          <span className="text-[10px] text-gold/90 font-medium">Selected Photo 1</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dynamicPhoto1Presets.length > 0 ? (
                            dynamicPhoto1Presets.map((preset, idx) => {
                              return (
                                <button
                                  key={`photo1-${preset.value}-${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setBuffaloForm((prev) => ({ ...prev, image_url: preset.value }))
                                  }
                                  className="relative w-11 h-11 rounded-lg overflow-hidden border-2 border-gold ring-2 ring-gold/60 scale-105 shadow-md transition-all cursor-pointer"
                                  title={`Selected Photo 1: ${preset.label}`}
                                >
                                  <img
                                    src={preset.preview}
                                    alt="Selected Photo 1"
                                    className="w-full h-full object-cover object-top"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-gold text-green-dark text-[8px] font-bold px-1 rounded-tl">✓</span>
                                </button>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">No Photo 1 selected</span>
                          )}
                        </div>
                      </div>

                      <Input
                        value={buffaloForm.image_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBuffaloForm((prev) => ({ ...prev, image_url: val }));
                        }}
                        placeholder="Or paste Photo 1 image URL (https://...)"
                        className="font-sans h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Photo 2: Secondary / Alternate Angle Photo */}
                <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-gold/20 text-gold flex items-center justify-center text-[11px] font-bold">2</span>
                      Photo 2 of 2 (Alternate Angle / Second Photo)
                    </span>
                    <span className="text-[10px] text-muted-foreground font-sans">Detail card second photo</span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-neutral-950 border-2 border-gold/40 shrink-0 flex items-center justify-center">
                      {buffaloForm.extra_image_url ? (
                        <img
                          src={resolveBuffaloImage({ breed: buffaloForm.breed, image_url: buffaloForm.extra_image_url }, 1, buffaloForm.breed)}
                          alt={buffaloForm.name || "Buffalo Photo 2 preview"}
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-2 text-center text-muted-foreground text-[10px]">
                          <ImageOff className="w-6 h-6 mb-1 text-gold/40" />
                          <span className="font-semibold text-foreground/80">No Photo 2</span>
                          <span className="text-[9px] text-muted-foreground">Click Add Photo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 w-full space-y-2">
                      <input
                        ref={buffaloExtraImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBuffaloExtraImageFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => buffaloExtraImageInputRef.current?.click()}
                          disabled={uploadingBuffaloExtraImage}
                          className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-7 gap-1.5"
                        >
                          {buffaloForm.extra_image_url ? <Upload className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>
                            {uploadingBuffaloExtraImage
                              ? "Uploading Photo 2..."
                              : buffaloForm.extra_image_url
                              ? "Upload / Change Photo 2"
                              : "+ Add Photo 2 from Device"}
                          </span>
                        </Button>

                        {buffaloForm.extra_image_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveBuffaloExtraImage}
                            className="h-7 font-sans text-xs gap-1 border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Photo 2 from this buffalo"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" /> Remove Photo 2
                          </Button>
                        )}

                        {buffaloForm.extra_image_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const presets = (BREED_PRESET_OPTIONS[buffaloForm.breed] || BREED_PRESET_OPTIONS.Murrah).slice(0, 2);
                              const fallback2nd = presets.length > 1 ? presets[1].value : presets[0].value;
                              setBuffaloForm((prev) => ({
                                ...prev,
                                extra_image_url: fallback2nd,
                              }));
                            }}
                            className="h-7 font-sans text-xs gap-1 text-muted-foreground"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset Default
                          </Button>
                        )}
                      </div>

                      {/* Built-in Breed Photo 2 Preset (Strictly 1 Selected Photo) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] text-muted-foreground">
                            Preset photo for {buffaloForm.breed} ({dynamicPhoto2Presets.length} photo):
                          </p>
                          <span className="text-[10px] text-gold/90 font-medium">Selected Photo 2</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {dynamicPhoto2Presets.length > 0 ? (
                            dynamicPhoto2Presets.map((preset, idx) => {
                              return (
                                <button
                                  key={`photo2-${preset.value}-${idx}`}
                                  type="button"
                                  onClick={() =>
                                    setBuffaloForm((prev) => ({ ...prev, extra_image_url: preset.value }))
                                  }
                                  className="relative w-11 h-11 rounded-lg overflow-hidden border-2 border-gold ring-2 ring-gold/60 scale-105 shadow-md transition-all cursor-pointer"
                                  title={`Selected Photo 2: ${preset.label}`}
                                >
                                  <img
                                    src={preset.preview}
                                    alt="Selected Photo 2"
                                    className="w-full h-full object-cover object-top"
                                  />
                                  <span className="absolute bottom-0 right-0 bg-gold text-green-dark text-[8px] font-bold px-1 rounded-tl">✓</span>
                                </button>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-muted-foreground italic">No Photo 2 selected</span>
                          )}
                        </div>
                      </div>

                      <Input
                        value={buffaloForm.extra_image_url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBuffaloForm((prev) => ({ ...prev, extra_image_url: val }));
                        }}
                        placeholder="Or paste Photo 2 image URL (https://...)"
                        className="font-sans h-7 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Buffalo Video Media & Live Player Preview Section */}
                <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Video className="w-3.5 h-3.5 text-gold" /> Buffalo Video (Upload or Select Farm Video)
                    </Label>
                    <span className="text-[10px] text-muted-foreground font-sans">
                      Featured in Buffalo Detail Card & Fullscreen Video Player
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Video Player Preview */}
                    <div className="relative rounded-lg overflow-hidden border-2 border-gold/40 bg-black aspect-video max-h-36 flex items-center justify-center">
                      {buffaloForm.video_url ? (
                        <video
                          key={buffaloForm.video_url}
                          src={buffaloForm.video_url}
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-3 text-muted-foreground text-xs flex flex-col items-center justify-center gap-1.5 h-full">
                          <Video className="w-6 h-6 text-gold/50" />
                          <span className="font-semibold text-foreground text-[11px]">No Video Attached</span>
                          <span className="text-[10px] text-muted-foreground">Click "+ Add Video from Device" or choose a preset</span>
                        </div>
                      )}
                    </div>

                    {/* Video Actions & Inputs */}
                    <div className="space-y-2.5">
                      <input
                        ref={buffaloVideoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleBuffaloVideoFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => buffaloVideoInputRef.current?.click()}
                          disabled={uploadingBuffaloVideo}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs h-7 gap-1.5"
                        >
                          {buffaloForm.video_url ? <Upload className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>
                            {uploadingBuffaloVideo
                              ? "Uploading Video..."
                              : buffaloForm.video_url
                              ? "Upload / Change Video"
                              : "+ Add Video from Device"}
                          </span>
                        </Button>

                        {buffaloForm.video_url && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveBuffaloVideo}
                            className="h-7 font-sans text-xs gap-1 border-red-500/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove video from this buffalo"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" /> Remove Video
                          </Button>
                        )}

                        {buffaloForm.video_url && buffaloForm.video_url !== BUFFALO_VIDEO_PRESETS[0].value && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setBuffaloForm((prev) => ({
                                ...prev,
                                video_url: BUFFALO_VIDEO_PRESETS[0].value,
                              }))
                            }
                            className="h-7 font-sans text-xs gap-1 text-muted-foreground"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset Default
                          </Button>
                        )}
                      </div>

                      <div>
                        <Label className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                          <Video className="w-3 h-3 text-gold" /> Detail Card Farm Video Preset
                        </Label>
                        <Select
                          value={buffaloForm.video_url || "__none__"}
                          onValueChange={(val) => {
                            if (val === "__none__") {
                              handleRemoveBuffaloVideo();
                            } else {
                              setBuffaloForm((prev) => ({ ...prev, video_url: val }));
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 font-sans text-xs mt-1">
                            <SelectValue placeholder="Select Farm Video" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__" className="text-red-500 font-medium">
                              🚫 None (No Video / Remove Video)
                            </SelectItem>
                            {BUFFALO_VIDEO_PRESETS.map((v) => (
                              <SelectItem key={v.value} value={v.value}>
                                {v.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-[11px] text-muted-foreground font-semibold">
                          Or Paste Custom Video URL (.mp4 / .webm)
                        </Label>
                        <Input
                          value={buffaloForm.video_url}
                          onChange={(e) =>
                            setBuffaloForm((prev) => ({ ...prev, video_url: e.target.value }))
                          }
                          placeholder="/videos/farm-video-1.mp4 or https://..."
                          className="font-sans h-7 text-xs mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Buffalo Name</Label>
                  <Input
                    value={buffaloForm.name}
                    onChange={(e) => setBuffaloForm({ ...buffaloForm, name: e.target.value })}
                    className="font-sans h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Breed</Label>
                  <Select
                    value={buffaloForm.breed}
                    onValueChange={(val) => {
                      const nextDefault = getDefaultBreedImage(val);
                      const wasUsingDefault =
                        !buffaloForm.image_url ||
                        Object.values(BREED_PRESET_OPTIONS)
                          .flat()
                          .some((p) => p.value === buffaloForm.image_url);
                      setBuffaloForm({
                        ...buffaloForm,
                        breed: val,
                        name: !buffaloForm.name || buffaloForm.name.includes("Buffalo") ? `${val} Buffalo` : buffaloForm.name,
                        image_url: wasUsingDefault ? nextDefault : buffaloForm.image_url,
                        subtitle_label: `${val} Buffalo (${buffaloForm.calf_details || "With Calf"})`,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 font-sans text-xs mt-1">
                      <SelectValue placeholder="Select Breed" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUFFALO_BREEDS.map((b) => (
                        <SelectItem key={b.slug} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Price (₹)</Label>
                  <Input
                    type="number"
                    value={buffaloForm.price}
                    onChange={(e) => setBuffaloForm({ ...buffaloForm, price: Number(e.target.value) })}
                    className="font-sans h-9 mt-1 font-bold text-gold"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Availability Status</Label>
                  <Select
                    value={buffaloForm.status}
                    onValueChange={(val) => setBuffaloForm({ ...buffaloForm, status: val })}
                  >
                    <SelectTrigger className="h-9 font-sans text-xs mt-1">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">In Stock (Send Enquiry)</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="limited_stock">Limited Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col justify-end">
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Show "(Negotiable)"
                    </span>
                    <Switch
                      checked={buffaloForm.is_negotiable}
                      onCheckedChange={(checked) =>
                        setBuffaloForm({ ...buffaloForm, is_negotiable: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Milk Yield</Label>
                  <Input
                    value={buffaloForm.milk_yield}
                    onChange={(e) => setBuffaloForm({ ...buffaloForm, milk_yield: e.target.value })}
                    placeholder="14 - 16 L/Day"
                    className="font-sans h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Age</Label>
                  <Input
                    value={buffaloForm.age}
                    onChange={(e) => setBuffaloForm({ ...buffaloForm, age: e.target.value })}
                    placeholder="4 Years"
                    className="font-sans h-9 mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Lactation</Label>
                  <Select
                    value={buffaloForm.lactation || "2nd Lactation"}
                    onValueChange={(val) => setBuffaloForm({ ...buffaloForm, lactation: val })}
                  >
                    <SelectTrigger className="h-9 font-sans text-xs mt-1">
                      <SelectValue placeholder="Select Lactation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Lactation">1st Lactation</SelectItem>
                      <SelectItem value="2nd Lactation">2nd Lactation</SelectItem>
                      <SelectItem value="3rd Lactation">3rd Lactation</SelectItem>
                      <SelectItem value="4th Lactation">4th Lactation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground font-semibold">Weight</Label>
                  <Input
                    value={buffaloForm.weight}
                    onChange={(e) => setBuffaloForm({ ...buffaloForm, weight: e.target.value })}
                    placeholder="520 kg"
                    className="font-sans h-9 mt-1 text-xs"
                  />
                </div>
              </div>

              {/* Detail Card Specifications (Pregnancy, Calf, Health — Location Removed) */}
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-3">
                <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold" /> Right-Side Big Detail Card Specifications
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Pregnancy / Milking Status
                    </Label>
                    <Input
                      value={buffaloForm.pregnancy_status}
                      onChange={(e) =>
                        setBuffaloForm({ ...buffaloForm, pregnancy_status: e.target.value })
                      }
                      placeholder="Pregnant (3 Months)"
                      className="font-sans h-8 text-xs mt-1"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      {[
                        "Pregnant (3 Months)",
                        "Milking (Freshly Calved)",
                        "Milking",
                        "Pregnant (5 Months)",
                      ].map((pStatus) => (
                        <button
                          key={pStatus}
                          type="button"
                          onClick={() =>
                            setBuffaloForm({ ...buffaloForm, pregnancy_status: pStatus })
                          }
                          className="text-[10px] px-1.5 py-0.5 rounded bg-muted hover:bg-gold/20 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {pStatus}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Calf Details (Filter & Spec Badge)
                    </Label>
                    <Select
                      value={buffaloForm.calf_details || "With Calf"}
                      onValueChange={(val) =>
                        setBuffaloForm((prev) => ({
                          ...prev,
                          calf_details: val,
                          subtitle_label: `${prev.breed} Buffalo (${val})`,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 font-sans text-xs mt-1">
                        <SelectValue placeholder="Select Calf Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="With Calf">With Calf</SelectItem>
                        <SelectItem value="With Female Calf">With Female Calf</SelectItem>
                        <SelectItem value="Pregnant">Pregnant</SelectItem>
                        <SelectItem value="No Calf">No Calf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground font-semibold">
                      Health Records
                    </Label>
                    <Input
                      value={buffaloForm.health_records}
                      onChange={(e) =>
                        setBuffaloForm({ ...buffaloForm, health_records: e.target.value })
                      }
                      placeholder="Vaccinated & Vet Certified"
                      className="font-sans h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  About This Buffalo (Detail Card Description)
                </Label>
                <Textarea
                  value={buffaloForm.description}
                  onChange={(e) => setBuffaloForm({ ...buffaloForm, description: e.target.value })}
                  className="font-sans text-xs min-h-[70px] mt-1 resize-none"
                  placeholder="Enter details shown in the 'About This Buffalo' section of the right-side big detail card..."
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditBuffaloModal(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={savingBuffalo || uploadingBuffaloImage}
                  onClick={handleSaveBuffalo}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingBuffalo
                    ? "Saving..."
                    : isCreatingBuffalo
                    ? buffaloForm.is_new_stock
                      ? "Publish New Stock (AKB)"
                      : "Publish Breed Buffalo (BRD)"
                    : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADMIN PREVIEW: BIG BUFFALO DETAIL CARD MODAL (FOR BOTH 10 BREEDS & NEW STOCKS) */}
      <Dialog
        open={!!previewBuffaloDetail}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewBuffaloDetail(null);
            setPreviewBuffaloPlayingVideo(false);
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[92vh] overflow-y-auto border-gold/40 bg-background">
          {previewBuffaloDetail && (() => {
            const enriched = enrichBuffaloToNewStock(previewBuffaloDetail, 0);
            const hasPhoto1 = Boolean(previewBuffaloDetail.image_url && previewBuffaloDetail.image_url.trim() !== "");
            const hasPhoto2 = Boolean(
              Array.isArray(previewBuffaloDetail.extra_images) &&
              previewBuffaloDetail.extra_images.length > 0 &&
              previewBuffaloDetail.extra_images[0]?.trim() !== ""
            );
            const hasVideo = Boolean(previewBuffaloDetail.video_url && previewBuffaloDetail.video_url.trim() !== "");
            const videoSrc = previewBuffaloDetail.video_url?.trim() || "";

            const sliderImages = getBuffaloSliderImages(
              previewBuffaloDetail,
              0,
              previewBuffaloDetail.breed
            );
            const totalSlides = Math.max(1, sliderImages.length);
            const currentImg =
              sliderImages[previewBuffaloMediaIdx % totalSlides] ||
              sliderImages[0] ||
              resolveBuffaloImage(previewBuffaloDetail, 0, previewBuffaloDetail.breed);
            const isOut =
              previewBuffaloDetail.status === "out_of_stock" ||
              previewBuffaloDetail.is_available === false;
            const isNewArrival = isBuffaloNewStock(previewBuffaloDetail);
            const resolvedCode = previewBuffaloDetail.stock_code || enriched.stock_code;

            return (
              <div>
                <div className="bg-gradient-to-r from-green-dark via-primary to-green-dark px-5 py-3.5 flex items-center justify-between border-b border-gold/30">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-display font-bold bg-gold text-green-dark">
                      {resolvedCode}
                    </span>
                    <span className="font-display font-bold text-sm text-cream">
                      {isNewArrival ? "New Stock Detail Card" : "Breed Catalog Detail Card"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      const target = previewBuffaloDetail;
                      setPreviewBuffaloDetail(null);
                      handleEditBuffalo(target);
                    }}
                    className="h-7 px-2.5 bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1"
                  >
                    <Edit className="w-3 h-3" /> Edit Specs
                  </Button>
                </div>

                {/* Main Image / Video Viewer */}
                <div className="relative aspect-[16/10] bg-neutral-950 overflow-hidden">
                  {previewBuffaloPlayingVideo ? (
                    <div className="relative w-full h-full bg-black">
                      {hasVideo ? (
                        <video
                          src={videoSrc}
                          controls
                          autoPlay
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                          <Video className="w-10 h-10 text-gold/60 mb-2" />
                          <p className="text-sm font-sans font-bold text-cream">No Video Attached</p>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">Upload a video to showcase this buffalo to customers.</p>
                          <Button
                            size="sm"
                            onClick={() => quickDetailVideoInputRef.current?.click()}
                            disabled={uploadingBuffaloVideo}
                            className="bg-gold text-green-dark hover:bg-gold-light text-xs font-bold gap-1.5 h-7"
                          >
                            <Plus className="w-3 h-3" /> Add Video from Device
                          </Button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPreviewBuffaloPlayingVideo(false)}
                        className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/75 text-cream text-xs font-sans font-semibold border border-gold/40 hover:bg-black"
                      >
                        Back to Photos
                      </button>
                    </div>
                  ) : (
                    <>
                      <img
                        src={currentImg}
                        alt={previewBuffaloDetail.name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-green-dark/80 backdrop-blur-sm text-gold font-sans text-xs font-bold border border-gold/30">
                        {(previewBuffaloMediaIdx % totalSlides) + 1}/{totalSlides}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip: Photo Thumbs + Video Thumb */}
                <div className="grid grid-cols-3 gap-2.5 px-5 pt-3.5">
                  {sliderImages.slice(0, 2).map((thumb, idx) => {
                    const isActive =
                      !previewBuffaloPlayingVideo &&
                      previewBuffaloMediaIdx % totalSlides === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPreviewBuffaloPlayingVideo(false);
                          setPreviewBuffaloMediaIdx(idx);
                        }}
                        className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all ${
                          isActive
                            ? "border-gold ring-2 ring-gold/30 scale-[1.02]"
                            : "border-border opacity-80 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={thumb}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover object-top"
                        />
                      </button>
                    );
                  })}

                  {hasVideo ? (
                    <button
                      type="button"
                      onClick={() => setPreviewBuffaloPlayingVideo(true)}
                      className={`relative aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all group ${
                        previewBuffaloPlayingVideo
                          ? "border-gold ring-2 ring-gold/30 scale-[1.02]"
                          : "border-border opacity-90 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={sliderImages[1] || sliderImages[0]}
                        alt="Watch Video"
                        className="w-full h-full object-cover object-top brightness-75"
                      />
                      <div className="absolute inset-0 bg-green-dark/45 flex items-center justify-center">
                        <span className="w-8 h-8 rounded-full bg-gold text-green-dark flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => quickDetailVideoInputRef.current?.click()}
                      disabled={uploadingBuffaloVideo}
                      className="relative aspect-[16/10] rounded-xl overflow-hidden border-2 border-dashed border-gold/50 bg-black/40 hover:bg-gold/10 transition-all flex flex-col items-center justify-center text-center p-1 group"
                      title="Attach a live video for this buffalo"
                    >
                      <Video className="w-5 h-5 text-gold group-hover:scale-110 transition-transform mb-0.5" />
                      <span className="text-[10px] font-sans font-bold text-gold">
                        {uploadingBuffaloVideo ? "Uploading..." : "+ Add Video"}
                      </span>
                    </button>
                  )}
                </div>

                {/* Hidden File Inputs for Detail Quick Uploads */}
                <input
                  ref={quickDetailPhoto1InputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDetailPhoto1Upload}
                  className="hidden"
                />
                <input
                  ref={quickDetailPhoto2InputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleDetailPhoto2Upload}
                  className="hidden"
                />
                <input
                  ref={quickDetailVideoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleDetailVideoUpload}
                  className="hidden"
                />

                {/* Media Manager Section inside Buffalo Detail Card */}
                <div className="mx-5 mt-3 p-3 rounded-xl bg-card border border-gold/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-gold" /> Add / Remove Photos & Video
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          const target = previewBuffaloDetail;
                          setPreviewBuffaloDetail(null);
                          handleEditBuffalo(target);
                        }}
                        className="h-6 px-2 text-[10px] bg-gold text-green-dark hover:bg-gold-light font-bold gap-1 shadow-sm"
                      >
                        <Edit className="w-2.5 h-2.5" /> Edit Full Info
                      </Button>
                      <span className="text-[10px] text-muted-foreground font-sans hidden sm:inline">
                        Live sync
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-sans">
                    {/* Photo 1 Control */}
                    <div className="p-2 rounded-lg bg-background/80 border border-border flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">Photo 1</span>
                        <Badge className={hasPhoto1 ? "bg-emerald-500/15 text-emerald-600 text-[9px] h-4 px-1.5" : "bg-muted text-muted-foreground text-[9px] h-4 px-1.5"}>
                          {hasPhoto1 ? "Attached" : "None"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => quickDetailPhoto1InputRef.current?.click()}
                          disabled={uploadingBuffaloImage}
                          className="flex-1 h-6 text-[10px] bg-gold text-green-dark hover:bg-gold-light font-bold px-1.5 gap-1"
                        >
                          {hasPhoto1 ? <Upload className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                          <span>{uploadingBuffaloImage ? "Uploading..." : hasPhoto1 ? "Change" : "Add"}</span>
                        </Button>
                        {hasPhoto1 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDetailRemovePhoto1}
                            className="h-6 px-1.5 text-[10px] border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Photo 1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Photo 2 Control */}
                    <div className="p-2 rounded-lg bg-background/80 border border-border flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">Photo 2</span>
                        <Badge className={hasPhoto2 ? "bg-emerald-500/15 text-emerald-600 text-[9px] h-4 px-1.5" : "bg-muted text-muted-foreground text-[9px] h-4 px-1.5"}>
                          {hasPhoto2 ? "Attached" : "None"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => quickDetailPhoto2InputRef.current?.click()}
                          disabled={uploadingBuffaloExtraImage}
                          className="flex-1 h-6 text-[10px] bg-gold text-green-dark hover:bg-gold-light font-bold px-1.5 gap-1"
                        >
                          {hasPhoto2 ? <Upload className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                          <span>{uploadingBuffaloExtraImage ? "Uploading..." : hasPhoto2 ? "Change" : "Add"}</span>
                        </Button>
                        {hasPhoto2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDetailRemovePhoto2}
                            className="h-6 px-1.5 text-[10px] border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Photo 2"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Video Control */}
                    <div className="p-2 rounded-lg bg-background/80 border border-border flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">Farm Video</span>
                        <Badge className={hasVideo ? "bg-emerald-500/15 text-emerald-600 text-[9px] h-4 px-1.5" : "bg-muted text-muted-foreground text-[9px] h-4 px-1.5"}>
                          {hasVideo ? "Attached" : "None"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => quickDetailVideoInputRef.current?.click()}
                          disabled={uploadingBuffaloVideo}
                          className="flex-1 h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-1.5 gap-1"
                        >
                          {hasVideo ? <Upload className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                          <span>{uploadingBuffaloVideo ? "Uploading..." : hasVideo ? "Change" : "Add"}</span>
                        </Button>
                        {hasVideo && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleDetailRemoveVideo}
                            className="h-6 px-1.5 text-[10px] border-red-500/30 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Remove Video"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details & 8-Spec Grid */}
                <div className="p-5 space-y-4">
                  <div className="pb-3 border-b border-border">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-display text-lg font-bold text-foreground">
                        {resolvedCode} - {previewBuffaloDetail.subtitle_label || previewBuffaloDetail.name}
                      </h3>
                      <Badge
                        className={
                          isOut
                            ? "bg-red-500/15 text-red-600 border border-red-500/30 font-sans text-xs"
                            : "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 font-sans text-xs"
                        }
                      >
                        {isOut ? "Out of Stock" : "Available"}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <span className="font-sans text-xs text-muted-foreground font-medium">
                        Price:
                      </span>
                      <span className="font-display text-xl font-bold text-primary dark:text-gold">
                        ₹{previewBuffaloDetail.price.toLocaleString("en-IN")}
                      </span>
                      {previewBuffaloDetail.is_negotiable !== false && (
                        <span className="font-sans text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          (Negotiable)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-1 border-b border-border pb-4 font-sans text-xs">
                    <div className="flex items-start gap-2">
                      <Milk className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Milk Yield:</p>
                        <p className="font-bold text-foreground">{previewBuffaloDetail.milk_yield}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Pregnancy Status:</p>
                        <p className="font-bold text-foreground">
                          {previewBuffaloDetail.pregnancy_status || enriched.pregnancy_status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Age:</p>
                        <p className="font-bold text-foreground">{previewBuffaloDetail.age}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Scale className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Body Weight:</p>
                        <p className="font-bold text-foreground">{previewBuffaloDetail.weight}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Lactation:</p>
                        <p className="font-bold text-foreground">
                          {previewBuffaloDetail.lactation || enriched.lactation}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Health Records:</p>
                        <p className="font-bold text-foreground">
                          {previewBuffaloDetail.health_records || enriched.health_records}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">Calf Details:</p>
                        <p className="font-bold text-foreground">
                          {previewBuffaloDetail.calf_details || enriched.calf_details}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Tag className="w-4 h-4 text-primary dark:text-gold shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] text-muted-foreground">
                          {isNewArrival ? "Stock ID:" : "Breed ID:"}
                        </p>
                        <p className="font-bold text-foreground">
                          {resolvedCode} ({previewBuffaloDetail.breed})
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-sm font-bold text-foreground mb-1">
                      About This Buffalo
                    </h4>
                    <p className="font-sans text-xs text-muted-foreground leading-relaxed">
                      {previewBuffaloDetail.description || enriched.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewBuffaloDetail(null)}
                      className="font-sans text-xs"
                    >
                      Close Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const target = previewBuffaloDetail;
                        setPreviewBuffaloDetail(null);
                        handleEditBuffalo(target);
                      }}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Buffalo & Specs
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT GALLERY PHOTO & VIDEO MODAL (ADMIN PANEL ONLY) */}
      <Dialog open={editGalleryModal} onOpenChange={setEditGalleryModal}>
        <DialogContent className="max-w-xl mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              {isCreatingGalleryItem ? (
                <>
                  <Plus className="w-4 h-4 text-gold" /> Add New Gallery{" "}
                  {galleryForm.type === "video" ? "Video" : "Photo"}
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 text-gold" /> Update Gallery{" "}
                  {galleryForm.type === "video" ? "Video" : "Photo"}
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 font-sans text-sm pt-2">
            {/* Media Type Selector */}
            <div>
              <Label className="text-xs text-muted-foreground font-semibold mb-1.5 block">
                Media Type
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextPhotoNum = adminGalleryItems.filter((i) => i.type === "image").length + 1;
                    setGalleryForm((prev) => {
                      const isAutoTitle = /^AK Buffaloes Farm (Photo|Video) #\d+$/i.test(prev.title.trim());
                      const nextTitle = isCreatingGalleryItem && (isAutoTitle || !prev.title.trim())
                        ? `AK Buffaloes Farm Photo #${nextPhotoNum}`
                        : prev.title;
                      return { ...prev, type: "image", title: nextTitle, alt: nextTitle };
                    });
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    galleryForm.type === "image"
                      ? "bg-gold text-green-dark border-gold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photograph (Image)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextVideoNum = adminGalleryItems.filter((i) => i.type === "video").length + 1;
                    setGalleryForm((prev) => {
                      const isAutoTitle = /^AK Buffaloes Farm (Photo|Video) #\d+$/i.test(prev.title.trim());
                      const nextTitle = isCreatingGalleryItem && (isAutoTitle || !prev.title.trim())
                        ? `AK Buffaloes Farm Video #${nextVideoNum}`
                        : prev.title;
                      return { ...prev, type: "video", title: nextTitle, alt: nextTitle };
                    });
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                    galleryForm.type === "video"
                      ? "bg-gold text-green-dark border-gold shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <VideoIcon className="w-4 h-4" />
                  <span>Video (MP4 / WebM)</span>
                </button>
              </div>
            </div>

            {/* File Upload & Live Media Preview */}
            <div className="p-3.5 bg-muted/20 border border-border rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  {galleryForm.type === "video"
                    ? "Upload Video or Enter Video URL"
                    : "Upload Photo or Enter Image URL"}
                </Label>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept={
                    galleryForm.type === "video"
                      ? "video/mp4,video/webm,video/ogg,video/*"
                      : "image/*"
                  }
                  onChange={handleGalleryFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={uploadingGalleryMedia}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-8 gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {uploadingGalleryMedia
                      ? "Uploading Media..."
                      : galleryForm.type === "video"
                      ? "Choose Video from Device"
                      : "Choose Photo from Device"}
                  </span>
                </Button>
              </div>

              {/* Media Preview Box */}
              {galleryForm.src ? (
                <div className="relative h-52 w-full rounded-xl overflow-hidden bg-neutral-950 border border-border flex items-center justify-center">
                  {galleryForm.type === "image" ? (
                    <img
                      src={galleryForm.src}
                      alt={galleryForm.alt || "Preview"}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  ) : (
                    <video
                      src={galleryForm.src}
                      controls
                      className="max-h-full max-w-full object-contain bg-black"
                    />
                  )}
                </div>
              ) : (
                <div
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="h-36 w-full rounded-xl border-2 border-dashed border-border hover:border-gold/60 bg-background/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  {galleryForm.type === "video" ? (
                    <VideoIcon className="w-8 h-8 text-gold/80" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gold/80" />
                  )}
                  <p className="text-xs text-muted-foreground font-medium">
                    Click to select a {galleryForm.type === "video" ? "video (MP4/WebM)" : "photo (JPG/PNG/WEBP)"} from your computer
                  </p>
                </div>
              )}

              {/* Direct Media URL Input */}
              <div>
                <Label className="text-[11px] text-muted-foreground">
                  Media Source / URL
                </Label>
                <Input
                  value={galleryForm.src}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, src: e.target.value }))}
                  placeholder={
                    galleryForm.type === "video"
                      ? "Uploaded video path or https://...mp4"
                      : "Uploaded photo path or https://...jpg"
                  }
                  className="font-sans h-8 text-xs mt-1"
                />
              </div>
            </div>

            {/* Title & Alt Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">Title</Label>
                <Input
                  value={galleryForm.title}
                  onChange={(e) =>
                    setGalleryForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                      alt: prev.alt || e.target.value,
                    }))
                  }
                  placeholder="e.g. Champion Murrah Buffalo"
                  className="font-sans h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Alt Text (Accessibility)
                </Label>
                <Input
                  value={galleryForm.alt}
                  onChange={(e) => setGalleryForm((prev) => ({ ...prev, alt: e.target.value }))}
                  placeholder="Short image/video description"
                  className="font-sans h-9 mt-1"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xs text-muted-foreground font-semibold">
                Description
              </Label>
              <Textarea
                value={galleryForm.description}
                onChange={(e) =>
                  setGalleryForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Describe this photo or video for visitors..."
                className="font-sans text-xs min-h-[75px] mt-1 resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              {isCreatingGalleryItem ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingGalleryItem || uploadingGalleryMedia}
                  onClick={() => {
                    setEditGalleryModal(false);
                    bulkGalleryInputRef.current?.click();
                  }}
                  className="font-sans text-xs gap-1.5 border-gold/50 hover:bg-gold/10"
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  <span>Bulk Upload Multiple Files</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex flex-wrap gap-2 justify-end ml-auto">
                <Button variant="outline" size="sm" onClick={() => setEditGalleryModal(false)}>
                  Cancel
                </Button>
                {isCreatingGalleryItem && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={savingGalleryItem || uploadingGalleryMedia}
                    onClick={() => handleSaveGalleryItem(true)}
                    className="font-sans font-semibold text-xs gap-1.5 border-gold/50 hover:bg-gold/10"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Save & Add Another</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  disabled={savingGalleryItem || uploadingGalleryMedia}
                  onClick={() => handleSaveGalleryItem(false)}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingGalleryItem
                    ? "Saving..."
                    : isCreatingGalleryItem
                    ? `Add ${galleryForm.type === "video" ? "Video" : "Photo"} to Gallery`
                    : "Save Gallery Updates"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PREVIEW GALLERY PHOTO / VIDEO MODAL */}
      <Dialog open={!!previewGalleryItem} onOpenChange={(open) => { if (!open) setPreviewGalleryItem(null); }}>
        <DialogContent className="max-w-2xl bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              {previewGalleryItem?.type === "video" ? (
                <VideoIcon className="w-5 h-5 text-gold" />
              ) : (
                <ImageIcon className="w-5 h-5 text-gold" />
              )}
              <span>{previewGalleryItem?.title || "Gallery Media Preview"}</span>
            </DialogTitle>
          </DialogHeader>

          {previewGalleryItem && (
            <div className="space-y-4">
              <div className="w-full max-h-[65vh] rounded-lg overflow-hidden border border-border bg-neutral-950 flex items-center justify-center">
                {previewGalleryItem.type === "video" ? (
                  <video
                    src={previewGalleryItem.src}
                    controls
                    autoPlay
                    className="w-full max-h-[62vh] object-contain bg-black"
                  />
                ) : (
                  <img
                    src={previewGalleryItem.src}
                    alt={previewGalleryItem.alt}
                    className="w-full max-h-[62vh] object-contain p-1"
                  />
                )}
              </div>

              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <p className="font-sans text-xs text-muted-foreground">
                  {previewGalleryItem.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-sans text-xs gap-1.5 border-gold/40"
                  onClick={() => {
                    const target = previewGalleryItem;
                    setPreviewGalleryItem(null);
                    setQuickGalleryUploadTarget(target);
                    quickGalleryInputRef.current?.click();
                  }}
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  <span>Replace {previewGalleryItem.type === "video" ? "Video" : "Photo"} File</span>
                </Button>
                <Button
                  size="sm"
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs gap-1.5"
                  onClick={() => {
                    const target = previewGalleryItem;
                    setPreviewGalleryItem(null);
                    handleOpenEditGallery(target);
                  }}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Update / Edit Details</span>
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="font-sans text-xs gap-1.5"
                  onClick={() => {
                    const target = previewGalleryItem;
                    setPreviewGalleryItem(null);
                    handleDeleteGalleryItem(target);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT WEBSITE POPUP ADVERTISEMENT CARD MODAL */}
      <Dialog open={editPromoModal} onOpenChange={setEditPromoModal}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold" />
              <span>
                {isCreatingPromo
                  ? "Add New Website Popup Advertisement Card"
                  : `Edit Popup Card: ${editingPromoCard?.title_label || "Popup Card"}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {/* ON / OFF (Show / Not Show on Website) Toggle */}
            <div
              className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 ${
                promoForm.is_active
                  ? "bg-emerald-50/80 border-emerald-400"
                  : "bg-muted/40 border-border"
              }`}
            >
              <div>
                <p className="font-sans text-xs sm:text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Show This Popup Card on Website (ON / OFF)</span>
                  <Badge
                    className={
                      promoForm.is_active
                        ? "bg-emerald-600 text-white text-[10px]"
                        : "bg-rose-600 text-white text-[10px]"
                    }
                  >
                    {promoForm.is_active ? "ON • SHOWING" : "OFF • HIDDEN"}
                  </Badge>
                </p>
                <p className="font-sans text-[11px] text-muted-foreground mt-0.5">
                  {promoForm.is_active
                    ? "Visitors will see this popup card immediately when the website opens (with the top-right black × close button)."
                    : "This card is currently turned OFF and will not be shown on the website."}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-full border border-border">
                <span className="font-sans text-xs font-bold">
                  {promoForm.is_active ? "ON" : "OFF"}
                </span>
                <Switch
                  checked={promoForm.is_active}
                  onCheckedChange={(checked) =>
                    setPromoForm((prev) => ({ ...prev, is_active: checked }))
                  }
                />
              </div>
            </div>

            {/* Live Card Preview */}
            <div className="p-3.5 bg-neutral-900 rounded-xl border border-gold/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold">
                  Live Website Popup Preview (Matches Website Theme + Black × Close Button)
                </span>
              </div>
              <div className="max-w-xl mx-auto">
                <PromoPopupCardView
                  card={{
                    id: editingPromoCard?.id || "preview-card",
                    ...promoForm,
                  }}
                  isPreview
                />
              </div>
            </div>

            {/* Card Label & Top Badge Text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold text-foreground">
                  Card Title / Admin Label
                </Label>
                <Input
                  value={promoForm.title_label}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, title_label: e.target.value }))
                  }
                  placeholder="e.g. Official Instagram Advertisement Card"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Badge Text (e.g. 24×7)
                </Label>
                <Input
                  value={promoForm.badge_text}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, badge_text: e.target.value }))
                  }
                  placeholder="24×7"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
            </div>

            {/* English Announcement Box */}
            <div className="p-3.5 bg-cream/60 border border-border rounded-xl space-y-3">
              <p className="font-sans text-xs font-bold text-green-dark uppercase tracking-wider">
                English Announcement Section (Left Column)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    English Brand Title
                  </Label>
                  <Input
                    value={promoForm.brand_title_en}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, brand_title_en: e.target.value }))
                    }
                    placeholder="AK Buffaloes"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    English Brand Subtitle
                  </Label>
                  <Input
                    value={promoForm.brand_subtitle_en}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, brand_subtitle_en: e.target.value }))
                    }
                    placeholder="Official Instagram"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    English Main Headline
                  </Label>
                  <Input
                    value={promoForm.headline_en}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, headline_en: e.target.value }))
                    }
                    placeholder="Follow Us on Instagram !"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    Highlighted Text (Gold)
                  </Label>
                  <Input
                    value={promoForm.highlight_text_en}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, highlight_text_en: e.target.value }))
                    }
                    placeholder="Daily Live"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold">
                  English Description
                </Label>
                <Input
                  value={promoForm.description_en}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, description_en: e.target.value }))
                  }
                  placeholder="Watch daily reels, live milking proofs, and new arrivals..."
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
            </div>

            {/* Hindi Announcement Box */}
            <div className="p-3.5 bg-green-dark/5 border border-border rounded-xl space-y-3">
              <p className="font-sans text-xs font-bold text-green-dark uppercase tracking-wider">
                Hindi Announcement Section (Right Column)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    Hindi Brand Title
                  </Label>
                  <Input
                    value={promoForm.brand_title_hi}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, brand_title_hi: e.target.value }))
                    }
                    placeholder="एके बफेलोज़"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    Hindi Brand Subtitle
                  </Label>
                  <Input
                    value={promoForm.brand_subtitle_hi}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, brand_subtitle_hi: e.target.value }))
                    }
                    placeholder="ऑफिशियल इंस्टाग्राम"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    Hindi Main Headline
                  </Label>
                  <Input
                    value={promoForm.headline_hi}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, headline_hi: e.target.value }))
                    }
                    placeholder="इंस्टाग्राम पर फॉलो करें !"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-muted-foreground font-semibold">
                    Highlighted Text (Hindi)
                  </Label>
                  <Input
                    value={promoForm.highlight_text_hi}
                    onChange={(e) =>
                      setPromoForm((prev) => ({ ...prev, highlight_text_hi: e.target.value }))
                    }
                    placeholder="रोज़ाना लाइव"
                    className="font-sans text-xs h-9 mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground font-semibold">
                  Hindi Description
                </Label>
                <Input
                  value={promoForm.description_hi}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, description_hi: e.target.value }))
                  }
                  placeholder="मुर्रा, नीली-रावी, जाफराबादी, सुरती व मेहसाणा भैंसों के नए वीडियो और कीमत तुरंत देखें!"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
            </div>

            {/* Link, Handle Label & Button Text */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Action Link / QR Code URL
                </Label>
                <Input
                  value={promoForm.link_url}
                  onChange={(e) =>
                    setPromoForm((prev) => ({
                      ...prev,
                      link_url: e.target.value,
                    }))
                  }
                  placeholder="https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Account Handle / Link Label
                </Label>
                <Input
                  value={promoForm.link_label}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, link_label: e.target.value }))
                  }
                  placeholder="@ak_buffaloes"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Action Button Text
                </Label>
                <Input
                  value={promoForm.button_text}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, button_text: e.target.value }))
                  }
                  placeholder="Follow Now"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
            </div>

            {/* Optional Banner Image Upload + Footer Texts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  QR Box Title
                </Label>
                <Input
                  value={promoForm.qr_box_title}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, qr_box_title: e.target.value }))
                  }
                  placeholder="Link to Follow / QR Code"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Bottom Footer Text
                </Label>
                <Input
                  value={promoForm.footer_text}
                  onChange={(e) =>
                    setPromoForm((prev) => ({ ...prev, footer_text: e.target.value }))
                  }
                  placeholder="🐃 Official Instagram: @ak_buffaloes — Nurani Nagar, Pachora"
                  className="font-sans text-xs h-9 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground font-semibold">
                  Optional Banner Image
                </Label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    ref={promoBannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePromoBannerUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploadingPromoBanner}
                    onClick={() => promoBannerInputRef.current?.click()}
                    className="h-9 text-xs font-sans gap-1.5 flex-1 border-gold/50"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    <span>{uploadingPromoBanner ? "Uploading..." : "Upload Photo"}</span>
                  </Button>
                  {promoForm.banner_image_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setPromoForm((prev) => ({ ...prev, banner_image_url: null }))}
                      className="h-9 px-2 text-destructive"
                      title="Remove Banner Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setEditPromoModal(false)}>
                Cancel
              </Button>
              {isCreatingPromo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingPromoCard || uploadingPromoBanner}
                  onClick={() => handleSavePromoCard(true)}
                  className="font-sans font-semibold text-xs gap-1.5 border-gold/50 hover:bg-gold/10"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>Save & Add Another Card</span>
                </Button>
              )}
              <Button
                size="sm"
                disabled={savingPromoCard || uploadingPromoBanner}
                onClick={() => handleSavePromoCard(false)}
                className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {savingPromoCard
                    ? "Saving..."
                    : isCreatingPromo
                    ? "Add Popup Card to Website"
                    : "Save Popup Card Changes"}
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PREVIEW WEBSITE POPUP CARD MODAL */}
      <Dialog open={!!previewPromoCard} onOpenChange={(open) => { if (!open) setPreviewPromoCard(null); }}>
        <DialogContent className="max-w-2xl bg-neutral-950 border border-gold/50 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg font-bold text-cream flex items-center justify-between pr-6">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                Live Website Popup Preview
              </span>
              {previewPromoCard && (
                <Badge
                  className={
                    previewPromoCard.is_active !== false
                      ? "bg-emerald-600 text-white text-xs"
                      : "bg-rose-600 text-white text-xs"
                  }
                >
                  {previewPromoCard.is_active !== false ? "ON (Showing on Website)" : "OFF (Hidden)"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {previewPromoCard && (
            <div className="space-y-4 pt-2">
              <PromoPopupCardView
                card={previewPromoCard}
                onClose={() => setPreviewPromoCard(null)}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/15">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const nextState = previewPromoCard.is_active === false;
                    handleTogglePromoCardActive(previewPromoCard, nextState);
                    setPreviewPromoCard({ ...previewPromoCard, is_active: nextState });
                  }}
                  className={
                    previewPromoCard.is_active !== false
                      ? "bg-rose-600 hover:bg-rose-700 text-white font-sans font-bold text-xs gap-1.5"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white font-sans font-bold text-xs gap-1.5"
                  }
                >
                  {previewPromoCard.is_active !== false ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Switch OFF (Do Not Show on Website)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Switch ON (Show on Website)</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const target = previewPromoCard;
                      setPreviewPromoCard(null);
                      handleOpenEditPromoCard(target);
                    }}
                    className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Card</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewPromoCard(null)}
                    className="font-sans text-xs text-cream border-white/30 hover:bg-white/10"
                  >
                    Close Preview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PASSWORD MANAGEMENT & REAL USER PASSWORD DIALOG */}
      <Dialog open={!!passwordModalUser} onOpenChange={(open) => { if (!open) setPasswordModalUser(null); }}>
        <DialogContent className="max-w-md bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-gold" /> Real User Password & Management
            </DialogTitle>
          </DialogHeader>

          {passwordModalUser && (
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-muted/20 border border-border rounded-lg text-xs space-y-1">
                <p className="text-foreground font-semibold">User: {passwordModalUser.full_name || "Account"}</p>
                <p className="text-muted-foreground font-mono">{getUserEmail(passwordModalUser.user_id)}</p>
              </div>

              {/* REAL USER PASSWORD DISPLAY */}
              <div className="p-3 bg-gold/10 border border-gold/40 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-gold" /> Real Password (Created by User)
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-sans">
                    Original Created
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background px-3 py-2 rounded border border-border flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-foreground tracking-wide select-all">
                      {showModalRealPassword ? (passwordModalUser.user_password || "••••••••") : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowModalRealPassword(!showModalRealPassword)}
                      className="text-muted-foreground hover:text-foreground ml-2"
                      title={showModalRealPassword ? "Hide password" : "Show real password"}
                    >
                      {showModalRealPassword ? <EyeOff className="w-4 h-4 text-gold" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 text-xs gap-1 font-sans"
                    onClick={() => {
                      if (passwordModalUser.user_password) {
                        navigator.clipboard.writeText(passwordModalUser.user_password);
                        toast({ title: "Copied!", description: "Real password copied to clipboard." });
                      }
                    }}
                    disabled={!passwordModalUser.user_password}
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground font-sans">
                  This is the real password the user created during registration.
                </p>
              </div>

              {/* Admin Action: Change / Update Password */}
              <div className="space-y-2 pt-1 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Change / Assign New Password</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={generateTemporaryPassword}
                    className="text-[10px] h-6 px-1.5 text-gold font-sans font-semibold gap-1 hover:bg-gold/10"
                  >
                    Generate Random
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 chars)..."
                    className="font-sans text-xs h-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Admins can assign a new password directly if the user needs an update.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs h-9 gap-1.5"
                  disabled={savingUserPassword || adminNewPassword.length < 8}
                  onClick={handleAdminSetPassword}
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingUserPassword ? "Updating Password..." : "Save & Update Password"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-sans text-xs h-9 gap-1.5"
                  disabled={resetEmailSending}
                  onClick={handleAdminSendResetEmail}
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {resetEmailSending ? "Sending Email..." : "Send Password Reset Link via Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* RECORD REPORT GENERATION & PDF DOWNLOAD DIALOG */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-lg bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
              <Download className="w-5 h-5 text-gold" /> Generate & Export Farm Records Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <p className="font-sans text-xs text-muted-foreground">
              Generate and download official reports in PDF, CSV, Excel, or JSON format for farm audits, inventory management, buyer inquiries, and customer records.
            </p>

            {/* Report Type Selection */}
            <div className="space-y-1.5">
              <Label className="font-sans text-xs font-semibold text-foreground">Select Report Type</Label>
              <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType)}>
                <SelectTrigger className="font-sans text-xs h-9">
                  <SelectValue placeholder="Choose report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive" className="font-sans text-xs">
                    🌟 Master Comprehensive Report (All Records & KPIs)
                  </SelectItem>
                  <SelectItem value="buffaloes" className="font-sans text-xs">
                    🐃 Buffalo Livestock Inventory & Availability
                  </SelectItem>
                  <SelectItem value="inquiries" className="font-sans text-xs">
                    📋 Purchase Inquiries & Deals Tracking
                  </SelectItem>
                  <SelectItem value="users" className="font-sans text-xs">
                    👥 Registered Customer & Farmer Directory
                  </SelectItem>
                  <SelectItem value="consultations" className="font-sans text-xs">
                    🩺 Consultations & Contact Messages
                  </SelectItem>
                  <SelectItem value="activity" className="font-sans text-xs">
                    📊 Operations & Platform Audit Trail
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Selection */}
            <div className="space-y-1.5">
              <Label className="font-sans text-xs font-semibold text-foreground">Record Time Period</Label>
              <Select value={selectedReportDateRange} onValueChange={setSelectedReportDateRange}>
                <SelectTrigger className="font-sans text-xs h-9">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="font-sans text-xs">All Time Records</SelectItem>
                  <SelectItem value="7" className="font-sans text-xs">Last 7 Days</SelectItem>
                  <SelectItem value="30" className="font-sans text-xs">Last 30 Days</SelectItem>
                  <SelectItem value="90" className="font-sans text-xs">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Live Preview Box of Records to be included */}
            <div className="p-3 bg-muted/30 border border-border rounded-lg space-y-2">
              <p className="font-sans text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Included in this Export:</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                  {selectedReportDateRange === "all" ? "All Time" : `Past ${selectedReportDateRange} Days`}
                </span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-background border border-border/80 rounded p-1.5">
                  <p className="text-muted-foreground text-[10px] font-sans">Livestock</p>
                  <p className="font-display font-bold text-sm text-foreground">{buffaloListings.length}</p>
                </div>
                <div className="bg-background border border-border/80 rounded p-1.5">
                  <p className="text-muted-foreground text-[10px] font-sans">Inquiries</p>
                  <p className="font-display font-bold text-sm text-foreground">{purchaseInquiries.length}</p>
                </div>
                <div className="bg-background border border-border/80 rounded p-1.5">
                  <p className="text-muted-foreground text-[10px] font-sans">Accounts</p>
                  <p className="font-display font-bold text-sm text-foreground">{profiles.length}</p>
                </div>
                <div className="bg-background border border-border/80 rounded p-1.5">
                  <p className="text-muted-foreground text-[10px] font-sans">Support</p>
                  <p className="font-display font-bold text-sm text-foreground">{consultations.length + contacts.length}</p>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-sans pt-1">
                Includes official AK Buffaloes farm data, formatted tables, and multiple export formats (PDF, CSV, Excel, JSON).
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-border flex-wrap">
              <span className="text-[11px] text-muted-foreground font-sans hidden sm:inline">
                Multiple formats supported (PDF, CSV, Excel, JSON)
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => setShowReportDialog(false)} className="font-sans text-xs">
                  Cancel
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      disabled={generatingPDF}
                      className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-xs gap-1.5 shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{generatingPDF ? "Generating..." : "Download / Export Report"}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 font-sans">
                    <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Select Format
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleGeneratePDF()} className="cursor-pointer gap-2 py-2">
                      <FileText className="w-4 h-4 text-gold" />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">Download PDF (.pdf)</span>
                        <span className="text-[10px] text-muted-foreground">Official styled letterhead document</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("csv")} className="cursor-pointer gap-2 py-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">Export CSV (.csv)</span>
                        <span className="text-[10px] text-muted-foreground">Standard comma-separated table</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("excel")} className="cursor-pointer gap-2 py-2">
                      <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">Export Excel (.xls)</span>
                        <span className="text-[10px] text-muted-foreground">Formatted workbook with headers</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportRecords("json")} className="cursor-pointer gap-2 py-2">
                      <FileCode className="w-4 h-4 text-indigo-600" />
                      <div className="flex flex-col">
                        <span className="font-medium text-xs">Export JSON (.json)</span>
                        <span className="text-[10px] text-muted-foreground">Complete structured database backup</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </main>
  );
};

export default AdminPanel;
