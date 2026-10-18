import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { backend } from "@/lib/backendClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BUFFALO_BREEDS,
  BUFFALO_UPDATED_EVENT,
  DEFAULT_BREED_CATALOG_PROFILES,
  DEFAULT_NEW_STOCK_PROFILES,
  getBuffaloSliderImages,
  getMergedBreedCatalog,
  getMergedNewStocks,
  resolveBuffaloImage,
  type NewStockBuffaloRecord,
} from "@/data/buffaloBreedsData";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";
import BuffaloEnquiryDialog from "@/components/BuffaloEnquiryDialog";
import { useToast } from "@/hooks/use-toast";
import galleryHerd from "@/assets/gallery/gallery-herd.jpg";
import { useFarmSettings } from "@/lib/farmSettings";
import { useUserPreferences } from "@/lib/userPreferences";
import {
  Award,
  Calendar,
  CameraOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Heart,
  IndianRupee,
  Layers,
  MessageCircle,
  MessageSquare,
  Milk,
  Phone,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

const parseMilkLiters = (milkStr: string): number => {
  const m = (milkStr || "").match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 10;
};

const parseAgeYears = (ageStr: string): number => {
  const m = (ageStr || "").match(/(\d+(\.\d+)?)/);
  return m ? parseFloat(m[1]) : 4;
};

const Buffaloes = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const detailPanelRef = useRef<HTMLDivElement>(null);
  const farmSettings = useFarmSettings();
  const userPrefs = useUserPreferences();

  // Admin-panel style Tabs inside Buffaloes Section:
  // "breeds" = Explore All 10 Buffalo Breeds (BRD-001 to BRD-010+)
  // "new-stocks" = New Stocks (AKB-001 to AKB-008+)
  const sectionParam = searchParams.get("section") || searchParams.get("tab");
  const [activeSection, setActiveSection] = useState<"breeds" | "new-stocks">(
    sectionParam === "new-stocks" ? "new-stocks" : "breeds"
  );

  useEffect(() => {
    if (sectionParam === "new-stocks") {
      setActiveSection("new-stocks");
    } else if (sectionParam === "breeds") {
      setActiveSection("breeds");
    }
  }, [sectionParam]);

  const handleSwitchSection = (nextSection: "breeds" | "new-stocks") => {
    setActiveSection(nextSection);
    setActiveMediaIndex(0);
    setIsPlayingVideo(false);
    setSearchParams({ section: nextSection });
  };

  const [dbListings, setDbListings] = useState<
    Array<Partial<NewStockBuffaloRecord> & { id: string }>
  >([]);
  const [liveSyncTick, setLiveSyncTick] = useState(0);

  // Filter states (shared across both tabs: Breed, Price Range, Milk Yield, Age, With Calf / Pregnant / Status, Stock ID)
  const [draftBreed, setDraftBreed] = useState("all");
  const [draftPrice, setDraftPrice] = useState("all");
  const [draftMilk, setDraftMilk] = useState("all");
  const [draftAge, setDraftAge] = useState("all");
  const [draftCalfStatus, setDraftCalfStatus] = useState("all");
  const [draftStockCode, setDraftStockCode] = useState("all");

  // Active applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    breed: "all",
    price: "all",
    stockCode: "all",
    milk: "all",
    age: "all",
    calfStatus: "all",
  });

  // Favorites / Wishlist stored in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("ak_buffaloes_saved_stocks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Selected Buffalo ID for each tab's right-side Big Buffalo Detail Card
  const [selectedBreedId, setSelectedBreedId] = useState<string>(
    DEFAULT_BREED_CATALOG_PROFILES[0].id
  );
  const [selectedNewStockId, setSelectedNewStockId] = useState<string>(
    DEFAULT_NEW_STOCK_PROFILES[0].id
  );

  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  // Online Enquiry Dialog target
  const [enquiryTarget, setEnquiryTarget] = useState<NewStockBuffaloRecord | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;
    const loadStock = async () => {
      const { data } = await backend.from("buffalo_listings").select("*");
      if (isMounted && data && Array.isArray(data)) {
        const typedData = data as Array<
          Partial<NewStockBuffaloRecord> & { id: string }
        >;
        setDbListings(typedData);
      }
    };

    const handleLiveUpdate = () => {
      if (!isMounted) return;
      setLiveSyncTick((prev) => prev + 1);
      void loadStock();
    };

    void loadStock();

    window.addEventListener(BUFFALO_UPDATED_EVENT, handleLiveUpdate);
    window.addEventListener("storage", handleLiveUpdate);
    window.addEventListener("focus", handleLiveUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        bc = new BroadcastChannel("ak_buffaloes_live_sync");
        bc.onmessage = handleLiveUpdate;
      } catch {
        bc = null;
      }
    }

    const pollInterval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadStock();
      }
    }, 4000);

    return () => {
      isMounted = false;
      window.removeEventListener(BUFFALO_UPDATED_EVENT, handleLiveUpdate);
      window.removeEventListener("storage", handleLiveUpdate);
      window.removeEventListener("focus", handleLiveUpdate);
      window.clearInterval(pollInterval);
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Merge DB listings + live overrides with All 10 Buffalo Breeds (BRD-001 to BRD-010+)
  const allBreedStocks = useMemo(() => {
    void liveSyncTick;
    return getMergedBreedCatalog(dbListings);
  }, [dbListings, liveSyncTick]);

  // Merge DB listings + live overrides with curated New Stock arrivals (AKB-001 to AKB-008+)
  const allNewStocks = useMemo(() => {
    void liveSyncTick;
    return getMergedNewStocks(dbListings);
  }, [dbListings, liveSyncTick]);

  // Filter helper used for both All 10 Buffalo Breeds and New Stocks
  const filterItems = (items: NewStockBuffaloRecord[]) => {
    return items.filter((item) => {
      const isOut = item.status === "out_of_stock" || !item.is_available;
      const isLim = item.status === "limited_stock";

      // Stock ID Code filter
      if (
        appliedFilters.stockCode !== "all" &&
        (item.stock_code || "").toUpperCase() !== appliedFilters.stockCode.toUpperCase()
      ) {
        return false;
      }

      // Breed filter
      if (
        appliedFilters.breed !== "all" &&
        item.breed.toLowerCase() !== appliedFilters.breed.toLowerCase()
      ) {
        return false;
      }

      // Price filter
      if (appliedFilters.price === "under_95k" && item.price >= 95000) {
        return false;
      }
      if (
        appliedFilters.price === "95k_120k" &&
        (item.price < 95000 || item.price > 120000)
      ) {
        return false;
      }
      if (appliedFilters.price === "above_120k" && item.price <= 120000) {
        return false;
      }

      // Milk Yield filter
      const liters = parseMilkLiters(item.milk_yield);
      if (appliedFilters.milk === "8_10" && (liters < 6 || liters > 10)) {
        return false;
      }
      if (appliedFilters.milk === "11_13" && (liters < 11 || liters > 13)) {
        return false;
      }
      if (appliedFilters.milk === "14_plus" && liters < 14) {
        return false;
      }

      // Age filter
      const years = parseAgeYears(item.age);
      if (appliedFilters.age === "3_3.5" && (years < 2.5 || years > 3.6)) {
        return false;
      }
      if (appliedFilters.age === "4" && (years < 3.7 || years > 4.2)) {
        return false;
      }
      if (appliedFilters.age === "4.5_plus" && years < 4.3) {
        return false;
      }

      // Calf / Pregnancy / Stock Availability status filter
      if (appliedFilters.calfStatus !== "all") {
        if (appliedFilters.calfStatus === "in_stock" && isOut) {
          return false;
        }
        if (appliedFilters.calfStatus === "out_of_stock" && !isOut) {
          return false;
        }
        if (appliedFilters.calfStatus === "limited_stock" && !isLim) {
          return false;
        }
        const combined =
          `${item.calf_details} ${item.pregnancy_status} ${item.subtitle_label}`.toLowerCase();
        if (
          appliedFilters.calfStatus === "with_calf" &&
          !combined.includes("with calf") &&
          !combined.includes("female calf")
        ) {
          return false;
        }
        if (
          appliedFilters.calfStatus === "pregnant" &&
          !combined.includes("pregnant")
        ) {
          return false;
        }
        if (
          appliedFilters.calfStatus === "milking" &&
          !combined.includes("milking") &&
          !combined.includes("calved")
        ) {
          return false;
        }
      }

      return true;
    });
  };

  const sortByCode = (arr: NewStockBuffaloRecord[]) =>
    arr.slice().sort((a, b) => {
      const nA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      const nB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      const pA = (a.stock_code || "").replace(/[0-9-]/g, "");
      const pB = (b.stock_code || "").replace(/[0-9-]/g, "");
      if (pA === pB) return nA - nB;
      return (a.stock_code || "").localeCompare(b.stock_code || "");
    });

  const filteredBreedStocks = useMemo(
    () => sortByCode(filterItems(allBreedStocks)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allBreedStocks, appliedFilters]
  );

  const filteredNewStocks = useMemo(
    () => sortByCode(filterItems(allNewStocks)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allNewStocks, appliedFilters]
  );

  // Active right-side detail buffalo for the currently active tab
  const activeStock = useMemo(() => {
    if (activeSection === "breeds") {
      return (
        filteredBreedStocks.find((s) => s.id === selectedBreedId) ||
        allBreedStocks.find((s) => s.id === selectedBreedId) ||
        filteredBreedStocks[0] ||
        allBreedStocks[0]
      );
    }
    return (
      filteredNewStocks.find((s) => s.id === selectedNewStockId) ||
      allNewStocks.find((s) => s.id === selectedNewStockId) ||
      filteredNewStocks[0] ||
      allNewStocks[0]
    );
  }, [
    activeSection,
    filteredBreedStocks,
    allBreedStocks,
    selectedBreedId,
    filteredNewStocks,
    allNewStocks,
    selectedNewStockId,
  ]);

  const activeStockImages = useMemo(() => {
    if (!activeStock) return [];
    return getBuffaloSliderImages(activeStock, 0, activeStock.breed);
  }, [activeStock]);

  const handleApplyFilters = () => {
    setAppliedFilters({
      breed: draftBreed,
      price: draftPrice,
      milk: draftMilk,
      age: draftAge,
      calfStatus: draftCalfStatus,
      stockCode: draftStockCode,
    });
    toast({
      title: "Filters Applied",
      description:
        activeSection === "breeds"
          ? "Showing matching buffaloes from All 10 Buffalo Breeds."
          : "Showing matching buffaloes from New Stocks.",
    });
  };

  const handleResetFilters = () => {
    setDraftBreed("all");
    setDraftPrice("all");
    setDraftMilk("all");
    setDraftAge("all");
    setDraftCalfStatus("all");
    setDraftStockCode("all");
    setAppliedFilters({
      breed: "all",
      price: "all",
      milk: "all",
      age: "all",
      calfStatus: "all",
      stockCode: "all",
    });
  };

  const toggleFavorite = (stock: NewStockBuffaloRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const exists = prev.includes(stock.id);
      const next = exists
        ? prev.filter((id) => id !== stock.id)
        : [...prev, stock.id];
      try {
        localStorage.setItem("ak_buffaloes_saved_stocks", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      toast({
        title: exists ? "Removed from Saved Buffaloes" : "Saved to Wishlist ❤️",
        description: `${stock.stock_code} — ${stock.subtitle_label} (₹${stock.price.toLocaleString()})`,
      });
      return next;
    });
  };

  const handleSelectStockDetail = (
    stock: NewStockBuffaloRecord,
    openMobileDrawer = false
  ) => {
    if (activeSection === "breeds") {
      setSelectedBreedId(stock.id);
    } else {
      setSelectedNewStockId(stock.id);
    }
    setActiveMediaIndex(0);
    setIsPlayingVideo(false);
    if (openMobileDrawer && window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    } else if (detailPanelRef.current && window.innerWidth >= 1024) {
      detailPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  const getWhatsAppUrl = (stock: NewStockBuffaloRecord) => {
    const labelType = stock.is_new_stock ? "New Stock" : "Purebred Breed";
    const text = `Hello AK Buffaloes! I want to enquire about ${labelType} *${stock.stock_code}* (${stock.subtitle_label}) listed at *₹${stock.price.toLocaleString()}* (${stock.milk_yield}, ${stock.age}, ${stock.lactation}). Please share live video and availability.`;
    const targetPhone = (farmSettings.farmWhatsapp || farmSettings.farmPhone || "919022273915").replace(/\D/g, "");
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  };

  // Reusable Big Right-Side Buffalo Details Card (Used for BOTH All 10 Buffalo Breeds & New Stocks)
  const renderStockDetailCard = (
    stock: NewStockBuffaloRecord,
    isModal = false
  ) => {
    const images = activeStockImages;
    const hasImages = images.length > 0;
    const currentImage = hasImages
      ? images[activeMediaIndex % images.length]
      : resolveBuffaloImage(stock, 0, stock.breed);
    const hasThumbStrip = images.length > 1 || Boolean(stock.video_url);
    const isNewArrival = Boolean(stock.is_new_stock);
    const isOut = stock.status === "out_of_stock" || !stock.is_available;
    const isLim = stock.status === "limited_stock";

    return (
      <div className="bg-card rounded-2xl border-2 border-gold/40 shadow-elevated overflow-hidden">
        {/* Top Header Bar: Dark Forest Green + Gold Accent */}
        <div className="bg-green-dark text-primary-foreground px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-gold/40">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg sm:text-xl font-bold text-gold tracking-wide">
              {stock.stock_code}
            </span>
            <Badge className="bg-gold text-green-dark hover:bg-gold-light border-0 font-sans text-[11px] font-bold px-2.5 py-0.5 shadow-sm">
              {isNewArrival ? "New Arrival" : "Purebred Breed"}
            </Badge>
            {isOut ? (
              <Badge className="bg-red-600 text-white border-0 font-sans text-[11px] font-bold px-2.5 py-0.5 shadow-sm">
                Out of Stock
              </Badge>
            ) : isLim ? (
              <Badge className="bg-amber-500 text-green-dark border-0 font-sans text-[11px] font-bold px-2.5 py-0.5 shadow-sm">
                Limited Stock
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white border-0 font-sans text-[11px] font-bold px-2.5 py-0.5 shadow-sm">
                In Stock
              </Badge>
            )}
          </div>
          {isModal ? (
            <button
              type="button"
              onClick={() => setMobileDetailOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-gold hover:text-green-dark flex items-center justify-center text-primary-foreground transition-colors"
              aria-label="Close detail view"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="font-sans text-[11px] text-gold font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-gold" />{" "}
              {isNewArrival ? "Verified Stock" : "Verified Breed"}
            </span>
          )}
        </div>

        {/* Media Gallery: Main Image/Video Viewer + Right Vertical Thumbnail Strip (2 Photos + 1 Video) */}
        <div className="p-3.5 sm:p-4 bg-muted/40 border-b border-border">
          <div className="grid grid-cols-12 gap-2.5">
            {/* Main Viewer */}
            <div className={`${hasThumbStrip ? "col-span-9" : "col-span-12"} relative h-52 sm:h-60 rounded-xl overflow-hidden bg-neutral-950 border border-gold/30 group`}>
              {isPlayingVideo && stock.video_url ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={stock.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                  {hasImages && (
                    <button
                      type="button"
                      onClick={() => setIsPlayingVideo(false)}
                      className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-gold text-[10px] font-sans font-bold border border-gold/40 shadow-md transition-all flex items-center gap-1 z-10"
                      title="Back to photos"
                    >
                      <Eye className="w-3 h-3" /> Back to Photos
                    </button>
                  )}
                </div>
              ) : hasImages ? (
                <>
                  <img
                    src={currentImage}
                    alt={`${stock.stock_code} - ${stock.subtitle_label}`}
                    className={`w-full h-full object-cover object-top transition-all duration-300 ${
                      isOut ? "grayscale-[25%] opacity-90" : ""
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />

                  {isOut && (
                    <div className="absolute top-2.5 left-2.5 bg-red-600/95 text-white font-sans text-[11px] font-bold px-3 py-1 rounded-full shadow-md border border-white/20">
                      Out of Stock
                    </div>
                  )}

                  {/* Prev / Next Arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveMediaIndex(
                            (prev) => (prev - 1 + images.length) % images.length
                          );
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-dark/80 hover:bg-gold text-primary-foreground hover:text-green-dark border border-gold/40 flex items-center justify-center transition-all shadow-md"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsPlayingVideo(false);
                          setActiveMediaIndex(
                            (prev) => (prev + 1) % images.length
                          );
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-green-dark/80 hover:bg-gold text-primary-foreground hover:text-green-dark border border-gold/40 flex items-center justify-center transition-all shadow-md"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Photo counter pill */}
                  <div className="absolute bottom-2 left-2.5 bg-green-dark/85 backdrop-blur-sm text-gold font-sans text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-gold/40">
                    Photo {(activeMediaIndex % images.length) + 1} of{" "}
                    {images.length}
                  </div>
                </>
              ) : stock.video_url ? (
                <div className="relative w-full h-full bg-black">
                  <video
                    src={stock.video_url}
                    controls
                    autoPlay
                    className="w-full h-full object-contain bg-black"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                  <CameraOff className="w-8 h-8 text-gold/40 mb-1" />
                  <span className="font-sans text-xs">No photos attached</span>
                </div>
              )}
            </div>

            {/* Right Vertical Strip: 2 Photo Thumbnails + 1 Video Thumbnail */}
            {hasThumbStrip && (
              <div className="col-span-3 flex flex-col gap-2 h-52 sm:h-60">
                {images.slice(0, 2).map((thumbUrl, idx) => {
                  const isSelected =
                    !isPlayingVideo && activeMediaIndex % images.length === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsPlayingVideo(false);
                        setActiveMediaIndex(idx);
                      }}
                      className={`relative flex-1 rounded-lg overflow-hidden border-2 transition-all bg-neutral-900 ${
                        isSelected
                          ? "border-gold ring-2 ring-gold/40 shadow-sm"
                          : "border-border opacity-80 hover:opacity-100"
                      }`}
                      title={`View Photo ${idx + 1}`}
                    >
                      <img
                        src={thumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  );
                })}

                {/* Video Thumbnail Button */}
                {Boolean(stock.video_url) && (
                  <button
                    type="button"
                    onClick={() => setIsPlayingVideo(true)}
                    className={`relative flex-1 rounded-lg overflow-hidden border-2 transition-all bg-neutral-950 group ${
                      isPlayingVideo
                        ? "border-gold ring-2 ring-gold/40 shadow-sm"
                        : "border-border hover:border-gold/70"
                    }`}
                    title="Watch Live Buffalo Video"
                  >
                    <img
                      src={images[1] || images[0] || resolveBuffaloImage(stock, 0, stock.breed)}
                      alt="Video preview"
                      className="w-full h-full object-cover object-top brightness-50 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45">
                      <div className="w-7 h-7 rounded-full bg-gold text-green-dark flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                      <span className="font-sans text-[10px] font-bold text-gold mt-0.5 tracking-wide">
                        Video
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title & Price Header */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border bg-card">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                {stock.subtitle_label}
              </h3>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                Breed:{" "}
                <span className="font-semibold text-foreground">
                  {stock.breed}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => toggleFavorite(stock, e)}
              className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                favoriteIds.includes(stock.id)
                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                  : "bg-muted/50 border-border text-muted-foreground hover:text-red-500"
              }`}
              title="Save to Wishlist"
            >
              <Heart
                className={`w-4 h-4 ${
                  favoriteIds.includes(stock.id) ? "fill-current" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="font-display text-2xl sm:text-3xl font-extrabold text-gold">
              ₹ {stock.price.toLocaleString("en-IN")}
            </span>
            {stock.is_negotiable && (
              <span className="font-sans text-xs font-semibold text-primary bg-primary/10 border border-primary/25 px-2.5 py-0.5 rounded-full">
                (Negotiable)
              </span>
            )}
            {isOut ? (
              <span className="font-sans text-xs font-bold text-red-600 bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full ml-auto">
                Out of Stock
              </span>
            ) : isLim ? (
              <span className="font-sans text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full ml-auto">
                Limited Stock
              </span>
            ) : (
              <span className="font-sans text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full ml-auto">
                In Stock
              </span>
            )}
          </div>
        </div>

        {/* 2-Column 8-Attribute Specification Grid */}
        <div className="p-4 sm:px-5 grid grid-cols-2 gap-x-4 gap-y-3.5 bg-card border-b border-border font-sans">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Milk className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Milk Yield:</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.milk_yield}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Pregnancy Status:
              </p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.pregnancy_status}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Age:</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.age}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
              <Scale className="w-3.5 h-3.5 text-gold-dark" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Body Weight:</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.weight}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Lactation:</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.lactation}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                Health Records:
              </p>
              <p className="text-xs sm:text-sm font-bold text-primary">
                {stock.health_records}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-3.5 h-3.5 text-gold-dark" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Calf Details:</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">
                {stock.calf_details}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center shrink-0 mt-0.5">
              <Tag className="w-3.5 h-3.5 text-gold-dark" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                {isNewArrival ? "Stock ID:" : "Breed ID:"}
              </p>
              <p className="text-xs sm:text-sm font-bold text-gold-dark">
                {stock.stock_code}
              </p>
            </div>
          </div>
        </div>

        {/* Description / About This Buffalo */}
        {stock.description && (
          <div className="px-4 sm:px-5 py-3 bg-card border-b border-border">
            <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-gold-dark mb-1">
              About This Buffalo
            </p>
            <p className="font-sans text-xs text-muted-foreground leading-relaxed">
              {stock.description}
            </p>
          </div>
        )}

        {/* Bottom CTA Buttons: Enquire on WhatsApp + Call Now + Book Enquiry */}
        <div className="p-4 sm:px-5 space-y-2.5 bg-muted/30">
          {farmSettings.directWhatsappInquiry && (
            <a
              href={getWhatsAppUrl(stock)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-green-dark hover:bg-primary text-primary-foreground font-sans font-bold text-sm shadow-md border border-gold/40 transition-all"
            >
              <MessageCircle className="w-4 h-4 text-gold fill-gold/20" />
              <span>Enquire on WhatsApp</span>
            </a>
          )}

          <div
            className={`grid ${
              farmSettings.directWhatsappInquiry
                ? "grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2"
            } gap-2.5`}
          >
            <a
              href={`tel:${farmSettings.farmPhone.replace(/\s+/g, "")}`}
              className="flex items-center justify-center gap-2 h-10 rounded-xl bg-card hover:bg-primary/10 text-foreground font-sans font-bold text-xs sm:text-sm border border-gold/40 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-gold-dark" />
              <span>Call Now</span>
            </a>

            <Button
              type="button"
              onClick={() => {
                setMobileDetailOpen(false);
                setEnquiryTarget(stock);
              }}
              disabled={isOut}
              className={`h-10 rounded-xl font-sans font-bold text-xs sm:text-sm gap-1.5 shadow-sm ${
                isOut
                  ? "bg-red-500/15 text-red-600 border border-red-500/30 cursor-not-allowed"
                  : "bg-gold text-green-dark hover:bg-gold-light"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isOut ? "Out of Stock" : "Book Enquiry"}</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Shared Renderer for Both Tabs ("Explore All 10 Buffalo Breeds" & "New Stocks")
  // Same Filter Bar + Left Cards Grid + Right Sticky Big Buffalo Details Card
  const renderBuffaloCatalogLayout = (mode: "breeds" | "new-stocks") => {
    const isBreedsMode = mode === "breeds";
    const items = isBreedsMode ? filteredBreedStocks : filteredNewStocks;
    const totalUnfilteredCount = isBreedsMode
      ? allBreedStocks.length
      : allNewStocks.length;

    return (
      <section
        id={isBreedsMode ? "all-breeds-catalog" : "new-stocks-section"}
        className="space-y-6"
      >
        {/* User Saved Dairy Preference Banner */}
        {userPrefs.preferredBreed && userPrefs.preferredBreed !== "all" && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-gold/10 border border-gold/40 text-xs font-sans text-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>
                Personalized Preference:{" "}
                <strong className="text-gold-dark font-bold">
                  {userPrefs.preferredBreed} Buffalo
                </strong>
                {userPrefs.targetYield && userPrefs.targetYield !== "any"
                  ? ` • Target: ${userPrefs.targetYield} L/day`
                  : ""}
                {userPrefs.purchasePurpose
                  ? ` • Purpose: ${userPrefs.purchasePurpose}`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDraftBreed(userPrefs.preferredBreed);
                  setAppliedFilters((prev) => ({
                    ...prev,
                    breed: userPrefs.preferredBreed,
                  }));
                  toast({
                    title: "Applied Preference Filter",
                    description: `Showing purebred ${userPrefs.preferredBreed} buffaloes based on your settings.`,
                  });
                }}
                className="h-7 px-3 text-xs bg-gold text-green-dark hover:bg-gold-light font-bold"
              >
                Filter by My Breed
              </Button>
            </div>
          </div>
        )}

        {/* Multi-Dropdown Filter Bar (5 Filters: Breed, Price Range, Milk Yield, Age, Status / Calf) */}
        <div className="bg-card rounded-2xl border-2 border-gold/30 shadow-card p-3.5 sm:p-5">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Stock ID Code */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <Tag className="w-3 h-3 text-gold-dark" /> Stock ID Code
              </label>
              <Select value={draftStockCode} onValueChange={setDraftStockCode}>
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="All Stock IDs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock IDs</SelectItem>
                  {[...allNewStocks, ...allBreedStocks]
                    .filter((item, idx, arr) => arr.findIndex(x => x.stock_code === item.stock_code) === idx && item.stock_code)
                    .sort((a, b) => {
                      const numA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
                      const numB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
                      const prefA = (a.stock_code || "").replace(/[0-9-]/g, "");
                      const prefB = (b.stock_code || "").replace(/[0-9-]/g, "");
                      if (prefA !== prefB) return prefA.localeCompare(prefB);
                      return numA - numB;
                    })
                    .map(item => (
                      <SelectItem key={item.stock_code} value={item.stock_code}>
                        {item.stock_code} — {item.subtitle_label || item.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 2. Breed */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <Tag className="w-3 h-3 text-gold-dark" /> Breed
              </label>
              <Select value={draftBreed} onValueChange={setDraftBreed}>
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="All Breeds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All 10 Breeds</SelectItem>
                  {BUFFALO_BREEDS.map((b) => (
                    <SelectItem key={b.slug} value={b.name}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Price Range */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <IndianRupee className="w-3 h-3 text-gold-dark" /> Price Range
              </label>
              <Select value={draftPrice} onValueChange={setDraftPrice}>
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="under_95k">Under ₹95,000</SelectItem>
                  <SelectItem value="95k_120k">₹95,000 – ₹1,20,000</SelectItem>
                  <SelectItem value="above_120k">Above ₹1,20,000</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 4. Milk Yield */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <Milk className="w-3 h-3 text-gold-dark" /> Milk Yield
              </label>
              <Select value={draftMilk} onValueChange={setDraftMilk}>
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="All Yields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="8_10">8 – 10 L/day</SelectItem>
                  <SelectItem value="11_13">11 – 13 L/day</SelectItem>
                  <SelectItem value="14_plus">14+ L/day</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 5. Age */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <Calendar className="w-3 h-3 text-gold-dark" /> Age
              </label>
              <Select value={draftAge} onValueChange={setDraftAge}>
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="All Ages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="3_3.5">3 – 3.5 Years</SelectItem>
                  <SelectItem value="4">4 Years</SelectItem>
                  <SelectItem value="4.5_plus">4.5+ Years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 6. Status / Calf / Pregnancy */}
            <div className="space-y-1">
              <label className="font-sans text-[11px] font-bold text-foreground flex items-center gap-1.5 px-0.5">
                <Sparkles className="w-3 h-3 text-gold-dark" /> Status / Calf
              </label>
              <Select
                value={draftCalfStatus}
                onValueChange={setDraftCalfStatus}
              >
                <SelectTrigger className="h-9 font-sans text-xs bg-background border-border focus:ring-gold">
                  <SelectValue placeholder="Status / Calf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses & Calf</SelectItem>
                  <SelectItem value="in_stock">In Stock Only</SelectItem>
                  <SelectItem value="limited_stock">Limited Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="with_calf">With Calf</SelectItem>
                  <SelectItem value="pregnant">Pregnant</SelectItem>
                  <SelectItem value="milking">Milking / Freshly Calved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filter Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3.5 pt-3 border-t border-border">
            <p className="font-sans text-xs text-muted-foreground">
              Select your preferred breed, milk capacity, age, or stock status and click{" "}
              <strong className="text-foreground">Apply Filters</strong>.
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                size="sm"
                onClick={handleApplyFilters}
                className="bg-green-dark hover:bg-primary text-primary-foreground border border-gold/40 font-sans font-bold text-xs h-9 px-4 gap-1.5 shadow-sm"
              >
                <Filter className="w-3.5 h-3.5 text-gold" />
                <span>Apply Filters</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3.5 font-sans font-semibold text-xs border-gold/40 text-foreground hover:bg-gold/10 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gold-dark" />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Section Header + Total Counter */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gold/30 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-sans font-bold uppercase tracking-wider text-gold-dark mb-1">
              {isBreedsMode ? (
                <>
                  <Layers className="w-3.5 h-3.5 text-gold" /> Complete Purebred Directory
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-gold" /> Latest Farm Arrivals
                </>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {isBreedsMode ? "Explore All 10 Buffalo Breeds" : "New Stocks"}
            </h2>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground mt-0.5">
              {isBreedsMode
                ? "Click any buffalo breed card to inspect its 2-photo gallery, live farm video, and full dairy specifications on the right."
                : "Here are our latest arrivals. Click any buffalo card to view its full specifications, 2-photo gallery, and video on the right."}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-green-dark text-primary-foreground px-4 py-2 rounded-xl border border-gold/40 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-gold animate-pulse" />
            <span className="font-sans text-xs sm:text-sm font-semibold">
              Total:{" "}
              <strong className="text-gold font-bold">
                {items.length} {items.length === 1 ? "Buffalo" : "Buffaloes"}
              </strong>
            </span>
          </div>
        </div>

        {/* Main Grid: Left Cards Grid + Right Sticky Big Buffalo Details Card */}
        {items.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-3 shadow-card">
            <p className="font-display text-lg font-bold text-foreground">
              No buffaloes match the selected filters.
            </p>
            <p className="font-sans text-xs text-muted-foreground">
              Try resetting the filters to view all {totalUnfilteredCount} available buffaloes.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleResetFilters}
              className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Buffalo Cards Grid (7 cols on lg, 8 cols on xl) */}
            <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {items.map((stock, idx) => {
                const isSelected = activeStock?.id === stock.id;
                const isFav = favoriteIds.includes(stock.id);
                const isOut =
                  stock.status === "out_of_stock" || !stock.is_available;
                const isLim = stock.status === "limited_stock";
                const cardImg = resolveBuffaloImage(stock, idx, stock.breed);

                return (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    onClick={() => handleSelectStockDetail(stock, false)}
                    className={`group rounded-2xl overflow-hidden bg-card transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-2 border-gold ring-2 ring-gold/30 shadow-elevated"
                        : "border border-border hover:border-gold/60 shadow-card hover:shadow-elevated"
                    }`}
                  >
                    <div>
                      {/* Card Top Photo + Badge + Heart Button */}
                      <div className="relative h-48 sm:h-52 bg-neutral-900 overflow-hidden">
                        <img
                          src={cardImg}
                          alt={`${stock.stock_code} ${stock.subtitle_label}`}
                          className={`w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
                            isOut ? "grayscale-[25%] opacity-90" : ""
                          }`}
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/15" />

                        {/* Top-Left Badge + Live Stock Status Badge */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-dark/95 text-gold border border-gold/50 font-sans text-[11px] font-bold shadow-md">
                            {isBreedsMode ? (
                              <>
                                <Layers className="w-3 h-3 text-gold" />
                                Purebred Breed
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3 text-gold" />
                                New Arrival
                              </>
                            )}
                          </span>
                          {isOut ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-red-600 text-white font-sans text-[10px] font-bold shadow-md">
                              Out of Stock
                            </span>
                          ) : isLim ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-amber-500 text-green-dark font-sans text-[10px] font-bold shadow-md">
                              Limited Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded bg-emerald-600/95 text-white font-sans text-[10px] font-bold shadow-md">
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* Top-Right Wishlist Heart Button */}
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(stock, e)}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all ${
                            isFav
                              ? "bg-white text-red-500 scale-105"
                              : "bg-green-dark/85 text-gold border border-gold/40 hover:bg-gold hover:text-green-dark"
                          }`}
                          aria-label="Save to wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 ${isFav ? "fill-current" : ""}`}
                          />
                        </button>

                        {/* Bottom-Right Calf / Pregnancy Tag */}
                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="font-sans text-[10px] font-semibold bg-green-dark/90 text-gold px-2.5 py-0.5 rounded-full border border-gold/40 backdrop-blur-sm">
                            {stock.calf_details}
                          </span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4">
                        {/* Stock Code & Status / Health Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display text-lg font-bold text-foreground">
                              {stock.stock_code}
                            </h3>
                            {isOut ? (
                              <span className="font-sans text-[10px] font-bold text-red-600 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                                Out of Stock
                              </span>
                            ) : isLim ? (
                              <span className="font-sans text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                Limited Stock
                              </span>
                            ) : null}
                          </div>
                          <span className="font-sans text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full truncate max-w-[130px]">
                            {stock.health_records}
                          </span>
                        </div>
                        <p className="font-sans text-xs font-medium text-muted-foreground mt-0.5 line-clamp-1">
                          {stock.subtitle_label}
                        </p>

                        {/* Price */}
                        <div className="mt-2 pb-2.5 border-b border-border flex items-baseline justify-between">
                          <span className="font-display text-xl font-extrabold text-gold">
                            ₹ {stock.price.toLocaleString("en-IN")}
                          </span>
                          {farmSettings.negotiableBadgeEnabled &&
                            (stock.is_negotiable ?? true) && (
                              <span className="font-sans text-[10px] text-muted-foreground">
                                Negotiable
                              </span>
                            )}
                        </div>

                        {/* User Preferred Breed Match Highlight */}
                        {userPrefs.preferredBreed &&
                          userPrefs.preferredBreed !== "all" &&
                          stock.breed.toLowerCase() ===
                            userPrefs.preferredBreed.toLowerCase() && (
                            <div className="mt-2 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1.5 text-[10px] font-sans font-bold text-emerald-700 dark:text-emerald-400">
                              <Sparkles className="w-3 h-3 text-gold shrink-0" />
                              <span>Matches Your Preferred Breed</span>
                            </div>
                          )}

                        {/* Key Specs with Icons (Milk Yield, Age, Lactation, Pregnancy/Calf Status) */}
                        <div className="mt-3 space-y-1.5 font-sans text-xs text-foreground">
                          <div className="flex items-center gap-2">
                            <Milk className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold">
                              {stock.milk_yield}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{stock.age}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                            <span>{stock.lactation}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                            <span className="truncate">
                              {stock.pregnancy_status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Buttons: View Details + Enquire / Out of Stock */}
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectStockDetail(stock, true);
                        }}
                        className={`font-sans text-xs font-bold h-9 gap-1 transition-all ${
                          isSelected
                            ? "bg-green-dark text-gold border border-gold"
                            : "bg-primary hover:bg-green-medium text-primary-foreground"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isOut}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEnquiryTarget(stock);
                        }}
                        className={`font-sans text-xs font-bold h-9 gap-1 shadow-sm ${
                          isOut
                            ? "bg-red-500/15 text-red-600 border border-red-500/30 cursor-not-allowed"
                            : "bg-gold text-green-dark hover:bg-gold-light"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isOut ? "Out of Stock" : "Enquire"}</span>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* RIGHT: Sticky Interactive Big Buffalo Details Card (5 cols on lg, 4 cols on xl) */}
            {activeStock && (
              <div
                ref={detailPanelRef}
                className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24"
              >
                {renderStockDetailCard(activeStock, false)}
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="pt-14 sm:pt-16 md:pt-20 min-h-screen bg-background">
      {/* HERO BANNER */}
      <section className="relative py-10 sm:py-16 md:py-22 border-b border-gold/30">
        <img
          src={galleryHerd}
          alt="Buffalo herd"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <p className="font-sans text-gold font-semibold tracking-widest uppercase mb-1.5 sm:mb-2 text-[11px] sm:text-xs md:text-sm">
              {t("buffaloes.subtitle") || "AK Buffaloes • Purebred Breeds & New Stocks"}
            </p>
            <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
              {activeSection === "new-stocks"
                ? "New Stocks — Available Buffaloes for Sale"
                : t("buffaloes.title") || "Our Buffalo Breeds"}
            </h1>
            <p className="font-sans text-primary-foreground/85 mt-2.5 sm:mt-3.5 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
              {activeSection === "new-stocks"
                ? "Inspect our latest healthy arrivals with verified milk yields, lactation details, and video previews."
                : "Explore all 10 purebred Indian buffalo breeds with verified milk yields, 2-photo galleries, and live farm video previews."}
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-3.5 sm:px-4 py-6 sm:py-10 space-y-6">
        <FestivalSectionCard section="buffaloes" />

        {/* ADMIN-PANEL STYLE TABS FOR BUFFALOES SECTION */}
        <Tabs
          value={activeSection}
          className="space-y-4 md:space-y-6"
          onValueChange={(v) => handleSwitchSection(v as "breeds" | "new-stocks")}
        >
          <TabsList className="bg-background border border-border w-full flex flex-wrap items-center justify-start h-auto gap-1.5 p-1.5">
            {[
              {
                v: "breeds",
                icon: Layers,
                label: "Explore All 10 Buffalo Breeds",
                count: allBreedStocks.length,
              },
              {
                v: "new-stocks",
                icon: Sparkles,
                label: "New Stocks",
                count: allNewStocks.length,
              },
            ].map((tItem) => (
              <TabsTrigger
                key={tItem.v}
                value={tItem.v}
                className="font-sans text-xs sm:text-sm font-medium gap-1.5 shrink-0 px-3 py-2 rounded-md relative whitespace-nowrap data-[state=active]:bg-gold/15 data-[state=active]:text-foreground data-[state=active]:border-gold/50 border border-transparent"
              >
                <tItem.icon className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{tItem.label}</span>
                {tItem.count > 0 && (
                  <span className="font-semibold">({tItem.count})</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* TAB 1: EXPLORE ALL 10 BUFFALO BREEDS (Same Left Cards + Right Big Detail Card Format) */}
          <TabsContent value="breeds" className="space-y-6 mt-0">
            {renderBuffaloCatalogLayout("breeds")}
          </TabsContent>

          {/* TAB 2: NEW STOCKS (Same Left Cards + Right Big Detail Card Format) */}
          <TabsContent value="new-stocks" className="space-y-6 mt-0">
            {renderBuffaloCatalogLayout("new-stocks")}
          </TabsContent>
        </Tabs>
      </div>

      {/* MOBILE / TABLET BUFFALO DETAIL DIALOG */}
      <Dialog open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {activeStock?.stock_code} — {activeStock?.subtitle_label}
            </DialogTitle>
          </DialogHeader>
          {activeStock && renderStockDetailCard(activeStock, true)}
        </DialogContent>
      </Dialog>

      {/* ONLINE BUFFALO ENQUIRY DIALOG */}
      {enquiryTarget && (
        <BuffaloEnquiryDialog
          buffalo={{
            id: enquiryTarget.id,
            name: `${enquiryTarget.stock_code} — ${enquiryTarget.subtitle_label}`,
            breed: enquiryTarget.breed,
            price: enquiryTarget.price,
            age: enquiryTarget.age,
            weight: enquiryTarget.weight,
            milk_yield: enquiryTarget.milk_yield,
            description: enquiryTarget.description,
          }}
          imageUrl={resolveBuffaloImage(
            enquiryTarget,
            0,
            enquiryTarget.breed
          )}
          onClose={() => setEnquiryTarget(null)}
        />
      )}
    </main>
  );
};

export default Buffaloes;
