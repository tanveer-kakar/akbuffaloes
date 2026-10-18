import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Search,
  Maximize2,
  Scan,
  Grid3X3,
  MessageSquare,
  Check,
} from "lucide-react";
import WhatsAppIcon, { WHATSAPP_URL } from "@/components/WhatsAppIcon";
import herd from "@/assets/gallery/gallery-herd.jpg";
import { backend } from "@/lib/backendClient";
import {
  galleryItems as defaultGalleryItems,
  mergeGalleryWithDb,
  type GalleryItem,
  type GalleryItemDbRecord,
} from "@/data/galleryData";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";

const Gallery = () => {
  const { t } = useLanguage();

  // Live merged gallery items (defaults + admin DB additions/updates/deletions)
  const [liveGalleryItems, setLiveGalleryItems] = useState<GalleryItem[]>(defaultGalleryItems);

  useEffect(() => {
    const loadGalleryFromDb = async () => {
      try {
        const { data, error } = await backend.from("gallery_items").select("*");
        if (!error && data && Array.isArray(data)) {
          setLiveGalleryItems(mergeGalleryWithDb(data as GalleryItemDbRecord[]));
        }
      } catch {
        // Fallback to defaultGalleryItems if offline
      }
    };
    void loadGalleryFromDb();
    window.addEventListener("focus", loadGalleryFromDb);
    return () => window.removeEventListener("focus", loadGalleryFromDb);
  }, []);

  // Media type tabs & controls
  const [mediaType, setMediaType] = useState<"all" | "image" | "video">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [fitMode, setFitMode] = useState<"fit" | "fill">("fit"); // 'fit' guarantees 100% visible face & body
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filtered items computation
  const filteredItems = useMemo(() => {
    return liveGalleryItems.filter((item) => {
      // Type match
      if (mediaType !== "all" && item.type !== mediaType) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) {
          return false;
        }
      }
      return true;
    });
  }, [liveGalleryItems, mediaType, searchQuery]);

  // Counts for tabs
  const totalCount = liveGalleryItems.length;
  const imageCount = useMemo(() => liveGalleryItems.filter((i) => i.type === "image").length, [liveGalleryItems]);
  const videoCount = useMemo(() => liveGalleryItems.filter((i) => i.type === "video").length, [liveGalleryItems]);

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const goNext = useCallback(() => {
    if (lightboxIndex !== null && filteredItems.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  }, [lightboxIndex, filteredItems.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex !== null && filteredItems.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  }, [lightboxIndex, filteredItems.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, closeLightbox, goNext, goPrev]);

  // Current item in lightbox
  const currentItem: GalleryItem | undefined =
    lightboxIndex !== null ? filteredItems[lightboxIndex] : undefined;

  // WhatsApp inquiry URL for current item
  const getWhatsAppEnquiryUrl = (item: GalleryItem) => {
    const msg = `Hello AK Buffaloes! I saw "${item.title}" in your gallery and would like more details.`;
    return `${WHATSAPP_URL}&text=${encodeURIComponent(msg)}`;
  };

  return (
    <main className="pt-14 sm:pt-16 md:pt-20 min-h-screen bg-background">
      {/* Hero Banner */}
      <section className="relative py-12 sm:py-16 md:py-22 overflow-hidden border-b border-border/40">
        <img
          src={herd}
          alt="AK Buffaloes herd pasture"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold-light text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-2.5 sm:mb-3 backdrop-blur-sm">
              <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-gold" />
              <span>{t("gallery.subtitle") || "Official Media Showcase"}</span>
            </div>
            <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2.5 sm:mb-3 tracking-tight">
              {t("gallery.title") || "Photos & Videos Gallery"}
            </h1>
            <p className="font-sans text-xs sm:text-base text-white/80 max-w-2xl mx-auto mb-4 sm:mb-6">
              Browse our {imageCount} authentic buffalo photographs and {videoCount} video recordings showcasing
              farm herd life, milking routines, and cattle fair showcases.
            </p>

            {/* Quick Stat Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] sm:text-xs font-medium text-white/90">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
                <span>{imageCount} Photographs</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                <VideoIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
                <span>{videoCount} Videos</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-black/40 border border-white/10 backdrop-blur-md">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                <span>Full Face & Conformation View</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Filter & Toolbar (Tabs: All, Photos, Videos + Search + Framing Toggle) */}
      <section className="sticky top-14 sm:top-16 md:top-20 z-30 bg-background/95 backdrop-blur-md border-b border-border shadow-sm py-2.5 sm:py-3 md:py-4">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3">
            {/* Media Type Tabs */}
            <div className="flex items-center p-1 bg-muted/80 rounded-xl border border-border w-full sm:w-auto">
              <button
                onClick={() => setMediaType("all")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                  mediaType === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>All ({totalCount})</span>
              </button>
              <button
                onClick={() => setMediaType("image")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                  mediaType === "image"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Photos ({imageCount})</span>
              </button>
              <button
                onClick={() => setMediaType("video")}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-xs md:text-sm font-semibold transition-all whitespace-nowrap flex-1 sm:flex-initial justify-center ${
                  mediaType === "video"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Videos ({videoCount})</span>
              </button>
            </div>

            {/* Right Controls: Fit Mode Toggle & Search Input */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-56 md:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search photo, video..."
                  className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-muted/50 border border-border focus:border-gold rounded-xl text-xs sm:text-sm outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Fit / Framing Mode Button */}
              <button
                onClick={() => setFitMode((m) => (m === "fit" ? "fill" : "fit"))}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-muted/60 hover:bg-muted text-foreground border border-border rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                title={
                  fitMode === "fit"
                    ? "Full View active (Zero face/body cropping with ambient backdrop)"
                    : "Grid Fill mode active"
                }
              >
                {fitMode === "fit" ? (
                  <>
                    <Scan className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
                    <span className="hidden md:inline">Full View (No Crop)</span>
                    <span className="md:hidden">Fit</span>
                  </>
                ) : (
                  <>
                    <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
                    <span className="hidden md:inline">Grid Fill</span>
                    <span className="md:hidden">Fill</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Media Results Status */}
      <section className="container mx-auto px-4 pt-5 sm:pt-6 pb-2">
        <FestivalSectionCard section="gallery" />
        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
          <p>
            Showing <strong className="text-foreground">{filteredItems.length}</strong> of{" "}
            {totalCount} items
            {searchQuery && (
              <span>
                {" "}
                matching &ldquo;<strong className="text-foreground">{searchQuery}</strong>&rdquo;
              </span>
            )}
          </p>

          {(searchQuery || mediaType !== "all") && (
            <button
              onClick={() => {
                setMediaType("all");
                setSearchQuery("");
              }}
              className="text-xs text-gold hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </section>

      {/* Media Grid Section */}
      <section className="container mx-auto px-3.5 sm:px-4 py-5 sm:py-6 md:py-8">
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              No Media Found
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              We couldn&apos;t find any items matching your search query.
            </p>
            <button
              onClick={() => {
                setMediaType("all");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity"
            >
              Show All Media ({totalCount})
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3.5 sm:gap-4 md:gap-5 ${
              mediaType === "video"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
                className="group relative bg-card border border-border/80 hover:border-gold/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* Media Container */}
                <div
                  className="relative h-56 sm:h-64 md:h-72 w-full overflow-hidden bg-neutral-950 flex items-center justify-center cursor-pointer"
                  onClick={() => openLightbox(index)}
                  title={`Click to view ${item.title}`}
                >
                  {item.type === "image" ? (
                    <>
                      {/* Ambient Blurred Backdrop: Fills frame smoothly so all photos look seamless */}
                      <img
                        src={item.src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-center blur-xl scale-125 opacity-35 pointer-events-none"
                      />

                      {/* Foreground Buffalo Image: Full face & body preserved with zero cutoff */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        className={`relative z-10 max-h-full max-w-full transition-transform duration-500 group-hover:scale-105 ${
                          fitMode === "fit"
                            ? "w-auto h-auto object-contain p-2"
                            : "w-full h-full object-cover object-top"
                        }`}
                        loading="lazy"
                      />

                      {/* Hover Overlay with View Icon */}
                      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gold/90 text-green-dark flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                          <Maximize2 className="w-5 h-5 font-bold" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <VideoCardPreview
                      src={item.src}
                      title={item.title}
                      fitMode={fitMode}
                    />
                  )}

                  {/* Top-Left Media Type Badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/15 shadow flex items-center gap-1">
                      {item.type === "video" ? (
                        <>
                          <VideoIcon className="w-3 h-3 text-gold" />
                          <span>Video</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-3 h-3 text-gold" />
                          <span>Photo</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Top-Right Quick Expand Icon */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(index);
                    }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-gold hover:text-green-dark text-white backdrop-blur-md border border-white/15 flex items-center justify-center transition-colors shadow"
                    aria-label="Open full preview"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Footer Info */}
                <div className="p-4 flex-1 flex flex-col justify-between bg-card">
                  <div>
                    <h3 className="font-display font-semibold text-sm sm:text-base text-foreground line-clamp-1 mb-1 group-hover:text-gold transition-colors">
                      {item.title}
                    </h3>
                    <p className="font-sans text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">
                      AK Buffaloes Farm
                    </span>

                    <button
                      onClick={() => openLightbox(index)}
                      className="text-gold hover:underline font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>{item.type === "video" ? "Watch HD" : "Inspect"}</span>
                      <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Fullscreen Cinema Lightbox Modal */}
      <AnimatePresence>
        {lightboxIndex !== null && currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6"
            onClick={closeLightbox}
          >
            {/* Modal Top Header Bar */}
            <div
              className="w-full flex items-center justify-between pb-3 border-b border-white/15 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gold text-green-dark">
                  {currentItem.type === "video" ? "Video" : "Photo"}
                </span>
                <span className="text-xs sm:text-sm font-medium text-white/70">
                  <strong className="text-white">
                    {lightboxIndex + 1} of {filteredItems.length}
                  </strong>
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={closeLightbox}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                aria-label="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Center: Media Stage + Prev/Next Controls */}
            <div
              className="relative flex-1 flex items-center justify-center py-4 w-full max-h-[76vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Previous Button */}
              <button
                onClick={goPrev}
                className="absolute left-1 sm:left-4 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-gold hover:text-green-dark text-white border border-white/20 flex items-center justify-center transition-all backdrop-blur-md shadow-xl"
                aria-label="Previous item"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {/* Active Media Container */}
              <motion.div
                key={currentItem.id}
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="max-h-full max-w-full flex items-center justify-center overflow-hidden"
              >
                {currentItem.type === "image" ? (
                  <img
                    src={currentItem.src}
                    alt={currentItem.alt}
                    className="max-h-[72vh] md:max-h-[75vh] w-auto max-w-[95vw] md:max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/10"
                  />
                ) : (
                  <video
                    src={currentItem.src}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[72vh] md:max-h-[75vh] w-auto max-w-[95vw] md:max-w-[85vw] rounded-xl shadow-2xl border border-white/10 bg-black"
                  />
                )}
              </motion.div>

              {/* Next Button */}
              <button
                onClick={goNext}
                className="absolute right-1 sm:right-4 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-gold hover:text-green-dark text-white border border-white/20 flex items-center justify-center transition-all backdrop-blur-md shadow-xl"
                aria-label="Next item"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            {/* Modal Bottom Info & Direct Actions Bar */}
            <div
              className="w-full bg-black/70 backdrop-blur-lg border-t border-white/15 rounded-xl p-3 sm:p-4 z-20 flex flex-col md:flex-row items-center justify-between gap-3 text-white max-w-5xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center md:text-left">
                <h4 className="font-display font-bold text-base sm:text-lg text-gold-light">
                  {currentItem.title}
                </h4>
                <p className="font-sans text-xs sm:text-sm text-white/80 max-w-2xl mt-0.5">
                  {currentItem.description}
                </p>
              </div>

              {/* Direct Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
                <Link
                  to="/contact"
                  onClick={closeLightbox}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-gold hover:bg-gold-light text-green-dark rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Us</span>
                </Link>

                <a
                  href={getWhatsAppEnquiryUrl(currentItem)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-105"
                >
                  <WhatsAppIcon className="w-4 h-4 text-white" />
                  <span>Ask on WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

// Video Card Component with Hover Preview
interface VideoCardPreviewProps {
  src: string;
  title: string;
  fitMode: "fit" | "fill";
}

const VideoCardPreview = ({ src, title, fitMode }: VideoCardPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Auto-play prevented or interrupted
        });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={videoRef}
        src={src}
        title={title}
        className={`w-full h-full ${
          fitMode === "fit" ? "object-contain bg-neutral-950 p-1" : "object-cover"
        } transition-transform duration-500`}
        muted
        playsInline
        preload="metadata"
      />

      <div
        className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
          isPlaying ? "opacity-0" : "opacity-100 bg-black/30"
        }`}
      >
        <div className="w-14 h-14 rounded-full bg-gold/90 hover:bg-gold text-green-dark flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
          <Play className="w-6 h-6 fill-green-dark translate-x-0.5" />
        </div>
      </div>

      {isPlaying && (
        <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 bg-black/70 text-gold text-[10px] rounded-md font-semibold backdrop-blur-sm">
          Playing Preview
        </div>
      )}
    </div>
  );
};

export default Gallery;
