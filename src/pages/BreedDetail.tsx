import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { backend } from "@/lib/backendClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Award,
  Calendar,
  CameraOff,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  MessageCircle,
  MessageSquare,
  Milk,
  Phone,
  Play,
  Scale,
  ShieldCheck,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import BuffaloEnquiryDialog from "@/components/BuffaloEnquiryDialog";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";
import { useFarmSettings } from "@/lib/farmSettings";
import {
  BREED_SLUG_TO_NAME,
  BUFFALO_UPDATED_EVENT,
  getBreedMetaByNameOrSlug,
  getBuffaloSliderImages,
  getMergedBreedCatalog,
  getMergedNewStocks,
  resolveBuffaloImage,
  type NewStockBuffaloRecord,
} from "@/data/buffaloBreedsData";

const BreedDetail = () => {
  const farmSettings = useFarmSettings();
  const { breed } = useParams<{ breed: string }>();
  const [dbListings, setDbListings] = useState<
    Array<Partial<NewStockBuffaloRecord> & { id: string }>
  >([]);
  const [liveSyncTick, setLiveSyncTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [enquiryTarget, setEnquiryTarget] = useState<NewStockBuffaloRecord | null>(
    null
  );

  const breedMeta = getBreedMetaByNameOrSlug(breed);
  const breedDisplay =
    BREED_SLUG_TO_NAME[breed || ""] || breedMeta.name || breed || "Murrah";

  useEffect(() => {
    let isMounted = true;
    const fetchListings = async (showSpinner = false) => {
      if (showSpinner) setLoading(true);
      const { data } = await backend.from("buffalo_listings").select("*");
      if (isMounted && data && Array.isArray(data)) {
        setDbListings(
          data as Array<Partial<NewStockBuffaloRecord> & { id: string }>
        );
      }
      if (isMounted && showSpinner) setLoading(false);
    };

    const handleLiveUpdate = () => {
      if (!isMounted) return;
      setLiveSyncTick((prev) => prev + 1);
      void fetchListings(false);
    };

    void fetchListings(true);

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

    return () => {
      isMounted = false;
      window.removeEventListener(BUFFALO_UPDATED_EVENT, handleLiveUpdate);
      window.removeEventListener("storage", handleLiveUpdate);
      window.removeEventListener("focus", handleLiveUpdate);
      if (bc) {
        try {
          bc.close();
        } catch {
          // ignore
        }
      }
    };
  }, [breed]);

  // Combine matching Breed Catalog + New Stock items for this breed (no 5-sample records)
  const breedListings = useMemo(() => {
    void liveSyncTick;
    const catalog = getMergedBreedCatalog(dbListings);
    const newStocks = getMergedNewStocks(dbListings);
    const combined = [...catalog, ...newStocks];
    const seen = new Set<string>();
    const filtered = combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return item.breed.toLowerCase() === breedDisplay.toLowerCase();
    });
    return filtered.slice().sort((a, b) => {
      const nA = parseInt((a.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      const nB = parseInt((b.stock_code || "").replace(/[^0-9]/g, ""), 10) || 0;
      const pA = (a.stock_code || "").replace(/[0-9-]/g, "");
      const pB = (b.stock_code || "").replace(/[0-9-]/g, "");
      if (pA === pB) return nA - nB;
      return (a.stock_code || "").localeCompare(b.stock_code || "");
    });
  }, [dbListings, breedDisplay, liveSyncTick]);

  const activeStock = useMemo(() => {
    return (
      breedListings.find((b) => b.id === selectedId) || breedListings[0] || null
    );
  }, [breedListings, selectedId]);

  const activeImages = useMemo(() => {
    if (!activeStock) return [];
    return getBuffaloSliderImages(activeStock, 0, activeStock.breed);
  }, [activeStock]);

  const getWhatsAppUrl = (stock: NewStockBuffaloRecord) => {
    const text = `Hello AK Buffaloes! I want to enquire about *${stock.stock_code}* (${stock.subtitle_label}) listed at *₹${stock.price.toLocaleString()}* (${stock.milk_yield}, ${stock.age}, ${stock.lactation}). Please share live video and availability.`;
    const targetPhone = (farmSettings.farmWhatsapp || farmSettings.farmPhone || "919022273915").replace(/\D/g, "");
    return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
  };

  const renderDetailCard = (stock: NewStockBuffaloRecord, isModal = false) => {
    const images = activeImages;
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
        <div className="bg-green-dark text-primary-foreground px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-gold/40">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg sm:text-xl font-bold text-gold tracking-wide">
              {stock.stock_code}
            </span>
            <Badge className="bg-gold text-green-dark border-0 font-sans text-[11px] font-bold px-2.5 py-0.5 shadow-sm">
              {isNewArrival ? "New Arrival" : "Purebred Breed"}
            </Badge>
            {isOut ? (
              <Badge className="bg-red-600 text-white border-0 font-sans text-[11px] font-bold px-2.5 py-0.5">
                Out of Stock
              </Badge>
            ) : isLim ? (
              <Badge className="bg-amber-500 text-green-dark border-0 font-sans text-[11px] font-bold px-2.5 py-0.5">
                Limited Stock
              </Badge>
            ) : (
              <Badge className="bg-emerald-600 text-white border-0 font-sans text-[11px] font-bold px-2.5 py-0.5">
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

        {/* Media Gallery */}
        <div className="p-3.5 sm:p-4 bg-muted/40 border-b border-border">
          <div className="grid grid-cols-12 gap-2.5">
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

        {/* Title & Price */}
        <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-border bg-card">
          <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
            {stock.subtitle_label}
          </h3>
          <p className="font-sans text-xs text-muted-foreground mt-0.5">
            Breed:{" "}
            <span className="font-semibold text-foreground">{stock.breed}</span>
          </p>
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

        {/* 8-Box Specs Grid */}
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
              <p className="text-[11px] text-muted-foreground">Stock ID:</p>
              <p className="text-xs sm:text-sm font-bold text-gold-dark">
                {stock.stock_code}
              </p>
            </div>
          </div>
        </div>

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

  return (
    <main className="pt-14 sm:pt-16 md:pt-20 min-h-screen bg-background">
      <section className="relative py-8 sm:py-12 bg-green-dark text-primary-foreground border-b border-gold/30">
        <div className="container mx-auto px-4">
          <Link
            to="/buffaloes"
            className="inline-flex items-center gap-2 font-sans text-xs sm:text-sm text-gold hover:underline mb-3 sm:mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to All 10 Buffalo Breeds
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">
            {breedDisplay} Buffaloes
          </h1>
          <p className="font-sans text-xs sm:text-sm md:text-base text-primary-foreground/80 mt-1.5 sm:mt-2">
            {breedMeta.desc} • Verified milk yields, 2-photo galleries, and farm video previews.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-3.5 sm:px-4 py-6 sm:py-8 space-y-6">
        <FestivalSectionCard section="buffaloes" />

        {loading ? (
          <p className="font-sans text-muted-foreground text-center py-12">
            Loading...
          </p>
        ) : breedListings.length === 0 ? (
          <p className="font-sans text-muted-foreground text-center py-12">
            No buffaloes available in this breed.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {breedListings.map((stock, idx) => {
                const isSelected = activeStock?.id === stock.id;
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
                    onClick={() => {
                      setSelectedId(stock.id);
                      setActiveMediaIndex(0);
                      setIsPlayingVideo(false);
                    }}
                    className={`group rounded-2xl overflow-hidden bg-card transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-2 border-gold ring-2 ring-gold/30 shadow-elevated"
                        : "border border-border hover:border-gold/60 shadow-card hover:shadow-elevated"
                    }`}
                  >
                    <div>
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

                        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-dark/95 text-gold border border-gold/50 font-sans text-[11px] font-bold shadow-md">
                            {stock.is_new_stock ? (
                              <>
                                <Sparkles className="w-3 h-3 text-gold" /> New Arrival
                              </>
                            ) : (
                              <>
                                <Layers className="w-3 h-3 text-gold" /> Purebred Breed
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

                        <div className="absolute bottom-2.5 right-2.5">
                          <span className="font-sans text-[10px] font-semibold bg-green-dark/90 text-gold px-2.5 py-0.5 rounded-full border border-gold/40">
                            {stock.calf_details}
                          </span>
                        </div>
                      </div>

                      <div className="p-4">
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
                          <span className="font-sans text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                            {stock.health_records}
                          </span>
                        </div>
                        <p className="font-sans text-xs font-medium text-muted-foreground mt-0.5 line-clamp-1">
                          {stock.subtitle_label}
                        </p>

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

                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(stock.id);
                          setActiveMediaIndex(0);
                          setIsPlayingVideo(false);
                          if (window.innerWidth < 1024) {
                            setMobileDetailOpen(true);
                          }
                        }}
                        className={`font-sans text-xs font-bold h-9 gap-1 ${
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

            {activeStock && (
              <div className="hidden lg:block lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24">
                {renderDetailCard(activeStock, false)}
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {activeStock?.stock_code} — {activeStock?.subtitle_label}
            </DialogTitle>
          </DialogHeader>
          {activeStock && renderDetailCard(activeStock, true)}
        </DialogContent>
      </Dialog>

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

export default BreedDetail;
