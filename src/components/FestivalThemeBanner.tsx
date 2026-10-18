import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, EyeOff, Sparkles, Calendar, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { useFestivalTheme } from "@/contexts/FestivalThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { HOLIDAY_STATUS_LABELS, CATEGORY_LABELS } from "@/data/festivalCalendarData";
import { getDefaultFestivalImage } from "@/data/festivalVisualAssets";

/**
 * Global top announcement studio banner with visual image pod + subtle decorative border + Admin Preview floating bar.
 */
const FestivalThemeBanner = () => {
  const {
    activeOccasion,
    secondaryOccasions,
    isPreviewMode,
    stopPreview,
    istNow,
  } = useFestivalTheme();
  const { language } = useLanguage();
  const [dismissedSlug, setDismissedSlug] = useState<string | null>(null);

  if (!activeOccasion) return null;

  const isBannerDismissed = !isPreviewMode && dismissedSlug === activeOccasion.slug;
  const { theme } = activeOccasion;
  const occasionImageUrl =
    theme.banner_image_url ||
    getDefaultFestivalImage(activeOccasion.slug || activeOccasion.id, activeOccasion.category);

  const localizedGreeting =
    language === "hi" && theme.greeting_hi
      ? theme.greeting_hi
      : language === "mr" && theme.greeting_mr
      ? theme.greeting_mr
      : theme.greeting_en;

  const isTricolor = theme.decoration_style === "tricolor_patriotic";

  return (
    <>
      {/* Top announcement studio bar below fixed Navbar */}
      <AnimatePresence>
        {!isBannerDismissed && (
          <motion.div
            key={`festival-banner-${activeOccasion.id}`}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
            style={{
              background: theme.banner_bg,
              color: theme.banner_text_color,
              borderBottom: `2px solid ${theme.primary_color}`,
            }}
            className="relative z-40 mt-14 sm:mt-16 md:mt-20 shadow-xl overflow-hidden"
          >
            {/* Subtle studio dot-matrix overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Subtle tricolor top strip for national days */}
            {isTricolor && (
              <div className="h-1 w-full flex relative z-10">
                <div className="flex-1 bg-[#FF9933]" />
                <div className="flex-1 bg-white" />
                <div className="flex-1 bg-[#138808]" />
              </div>
            )}

            {/* Subtle decorative top border for non-tricolor festive themes */}
            {!isTricolor && !theme.is_respectful_observance && (
              <div
                className="h-1 w-full opacity-90 relative z-10"
                style={{
                  background: `linear-gradient(90deg, transparent, ${theme.primary_color}, ${theme.accent_color}, ${theme.primary_color}, transparent)`,
                }}
              />
            )}

            <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3.5 relative z-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {/* Framed Festival Visual Image Pod with Corner Icon Emblem */}
                  <div className="relative shrink-0">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 shadow-lg bg-black/40"
                      style={{ borderColor: theme.accent_color || theme.primary_color }}
                    >
                      <img
                        src={occasionImageUrl}
                        alt={activeOccasion.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                    <span
                      className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm shadow-md border"
                      style={{
                        backgroundColor: "#07160e",
                        borderColor: theme.accent_color || theme.primary_color,
                      }}
                      aria-hidden="true"
                    >
                      {theme.icon}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-sm"
                        style={{
                          backgroundColor: `${theme.primary_color}35`,
                          border: `1px solid ${theme.accent_color || theme.primary_color}`,
                          color: theme.banner_text_color,
                        }}
                      >
                        <Sparkles className="w-3 h-3 shrink-0" />
                        <span>{theme.badge_text}</span>
                      </span>
                      <span className="text-[10px] opacity-85 hidden sm:inline font-sans font-semibold">
                        • {HOLIDAY_STATUS_LABELS[activeOccasion.holiday_status]}
                      </span>
                      {activeOccasion.resolved_start_date && (
                        <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono bg-black/30 border border-white/20 px-2 py-0.5 rounded-full">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{activeOccasion.resolved_start_date}</span>
                        </span>
                      )}
                      {isPreviewMode && (
                        <span className="bg-amber-400 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Admin Preview Only
                        </span>
                      )}
                    </div>
                    <p className="font-display text-xs sm:text-sm md:text-base font-extrabold leading-snug mt-1 drop-shadow-sm">
                      {localizedGreeting}
                    </p>
                    <p className="font-sans text-[11px] sm:text-xs opacity-90 line-clamp-2 mt-0.5">
                      {theme.subtitle}
                    </p>
                  </div>
                </div>

                {/* Secondary Occasions (if overlapping today & main_plus_secondary enabled) + Action */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {secondaryOccasions.length > 0 && (
                    <div className="hidden lg:flex items-center gap-1.5">
                      {secondaryOccasions.slice(0, 2).map((sec) => (
                        <span
                          key={sec.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/30 border border-white/20 text-white"
                          title={sec.theme.greeting_en}
                        >
                          <span>{sec.theme.icon}</span>
                          <span>{sec.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <Link
                    to="/buffaloes"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-extrabold transition-transform hover:scale-105 shadow-md"
                    style={{
                      backgroundColor: theme.accent_color || theme.primary_color,
                      color: "#091912",
                    }}
                  >
                    <span>Explore 50 Buffaloes</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {!isPreviewMode && (
                    <button
                      type="button"
                      onClick={() => setDismissedSlug(activeOccasion.slug)}
                      className="p-1.5 rounded-full hover:bg-black/25 transition-colors opacity-80 hover:opacity-100"
                      aria-label="Dismiss occasion banner"
                      title="Hide banner"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile secondary occasions */}
              {secondaryOccasions.length > 0 && (
                <div className="flex lg:hidden flex-wrap items-center gap-1.5 mt-2 pt-1.5 border-t border-white/15">
                  <span className="text-[10px] opacity-75 font-sans">Also observing today:</span>
                  {secondaryOccasions.map((sec) => (
                    <span
                      key={sec.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/30 border border-white/20"
                    >
                      <span>{sec.theme.icon}</span>
                      <span>{sec.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Admin Manual Preview Controller Bar */}
      {isPreviewMode && (
        <div className="fixed bottom-4 left-4 z-[9999] max-w-sm bg-neutral-950/95 text-white border-2 border-amber-400 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400 shrink-0">
              <img
                src={occasionImageUrl}
                alt={activeOccasion.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 bg-black/80 text-xs px-1 rounded-tl">
                {theme.icon}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400">
                  Admin Theme Preview Mode
                </span>
              </div>
              <p className="font-sans text-xs font-bold text-white truncate mt-0.5">
                {activeOccasion.name}
              </p>
              <p className="font-sans text-[10px] text-white/70 mt-0.5">
                Public visitors still see the live {istNow.formattedDate} theme.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={stopPreview}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 font-sans text-xs font-bold transition-colors"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Exit Preview</span>
                </button>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-semibold transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Reusable ChatGPT-style studio festival callout card with Visual Image Showcase
 * for Hero, Buffaloes, About, Gallery, and Footer sections.
 */
export const FestivalSectionCard = ({
  section,
}: {
  section: "hero" | "buffaloes" | "about" | "gallery" | "footer";
}) => {
  const { activeOccasion } = useFestivalTheme();
  const { language } = useLanguage();

  if (!activeOccasion) return null;
  const { theme } = activeOccasion;
  const occasionImageUrl =
    theme.banner_image_url ||
    getDefaultFestivalImage(activeOccasion.slug || activeOccasion.id, activeOccasion.category);

  const localizedGreeting =
    language === "hi" && theme.greeting_hi
      ? theme.greeting_hi
      : language === "mr" && theme.greeting_mr
      ? theme.greeting_mr
      : theme.greeting_en;

  if (section === "hero") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mb-4 sm:mb-5 inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl backdrop-blur-xl border-2 shadow-2xl max-w-2xl text-left"
        style={{
          background: "linear-gradient(135deg, rgba(6, 19, 12, 0.88) 0%, rgba(12, 34, 22, 0.82) 100%)",
          borderColor: `${theme.accent_color || theme.primary_color}90`,
        }}
      >
        {/* Framed Festival Thumbnail Image */}
        <div className="relative shrink-0">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shadow-md"
            style={{ borderColor: theme.accent_color || theme.primary_color }}
          >
            <img
              src={occasionImageUrl}
              alt={activeOccasion.name}
              className="w-full h-full object-cover"
            />
          </div>
          <span
            className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-950 border flex items-center justify-center text-xs shadow"
            style={{ borderColor: theme.accent_color || theme.primary_color }}
          >
            {theme.icon}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${theme.primary_color}35`,
                color: theme.accent_color,
                border: `1px solid ${theme.primary_color}80`,
              }}
            >
              {theme.badge_text}
            </span>
            <span className="text-[10px] font-sans font-semibold text-white/75 hidden sm:inline">
              • {activeOccasion.name}
            </span>
          </div>
          <p className="font-display text-xs sm:text-sm font-bold text-white leading-snug mt-1">
            {localizedGreeting}
          </p>
        </div>
      </motion.div>
    );
  }

  if (section === "footer") {
    return (
      <div
        className="mb-6 rounded-2xl px-4 py-3.5 border-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
        style={{
          background: theme.banner_bg,
          borderColor: `${theme.primary_color}75`,
          color: theme.banner_text_color,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 shadow-md"
            style={{ borderColor: theme.accent_color || theme.primary_color }}
          >
            <img
              src={occasionImageUrl}
              alt={activeOccasion.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-0 right-0 bg-black/80 text-xs px-1 rounded-tl">
              {theme.icon}
            </span>
          </div>
          <div>
            <p className="font-display text-xs sm:text-sm font-bold">{theme.footer_Line}</p>
            <p className="font-sans text-[11px] opacity-90">{localizedGreeting}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shrink-0"
          style={{
            backgroundColor: `${theme.primary_color}35`,
            border: `1px solid ${theme.accent_color || theme.primary_color}`,
          }}
        >
          {theme.icon} {activeOccasion.name}
        </span>
      </div>
    );
  }

  const noteText =
    section === "buffaloes"
      ? theme.buffalo_section_note
      : section === "about"
      ? theme.about_section_note
      : theme.subtitle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-7 rounded-2xl border-2 shadow-xl overflow-hidden relative"
      style={{
        background: `radial-gradient(circle at 15% 20%, ${theme.primary_color}45 0%, transparent 50%), ${theme.banner_bg}`,
        borderColor: `${theme.accent_color || theme.primary_color}80`,
        color: theme.banner_text_color,
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
        {/* Left 4 Columns: Featured Visual Image Showcase */}
        <div className="md:col-span-4 relative min-h-[170px] sm:min-h-[190px] overflow-hidden group">
          <img
            src={occasionImageUrl}
            alt={activeOccasion.name}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(6,19,12,0.55) 0%, rgba(6,19,12,0.15) 45%, rgba(6,19,12,0.88) 100%)",
            }}
          />
          <div className="relative z-10 h-full p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-sans font-extrabold uppercase tracking-wider backdrop-blur-md border shadow"
                style={{
                  backgroundColor: "rgba(6, 19, 12, 0.8)",
                  borderColor: theme.accent_color || theme.primary_color,
                  color: theme.accent_color || "#FDE047",
                }}
              >
                <span>{theme.icon}</span>
                <span>{CATEGORY_LABELS[activeOccasion.category] || "Festival Special"}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <img
                src="/ak-buffalo-logo-emblem.png"
                alt="AK Buffaloes"
                className="w-7 h-7 rounded-full border border-gold bg-green-dark p-0.5 object-contain"
              />
              <div>
                <p className="font-display text-xs font-bold text-white leading-none">
                  AK Buffaloes Farm
                </p>
                <p className="font-sans text-[10px] text-white/80">
                  10 Pure Breeds • 50+ Live Buffaloes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 8 Columns: Festive Studio Greeting & Details */}
        <div className="md:col-span-8 p-4 sm:p-6 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm"
                style={{
                  backgroundColor: `${theme.primary_color}35`,
                  border: `1px solid ${theme.accent_color || theme.primary_color}`,
                  color: theme.accent_color || theme.banner_text_color,
                }}
              >
                {theme.icon} {theme.badge_text}
              </span>
              <span className="text-[11px] font-sans opacity-85 font-semibold">
                {activeOccasion.name}
              </span>
              {activeOccasion.resolved_start_date && (
                <span className="text-[10px] font-mono bg-black/30 border border-white/20 px-2.5 py-0.5 rounded-full ml-auto">
                  {activeOccasion.resolved_start_date}
                </span>
              )}
            </div>

            <h3 className="font-display text-base sm:text-xl font-extrabold leading-snug drop-shadow-sm">
              {localizedGreeting}
            </h3>

            {theme.greeting_hi && language !== "hi" && (
              <p
                className="font-display text-xs sm:text-sm font-bold opacity-95"
                style={{ color: theme.accent_color }}
              >
                {theme.greeting_hi}
              </p>
            )}

            <p className="font-sans text-xs sm:text-sm opacity-90 leading-relaxed">
              {noteText}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-sans opacity-90">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.accent_color }} />
                100% Pure Breed
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: theme.accent_color }} />
                Vet Certified
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:+919022273915"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-sans font-bold bg-black/35 hover:bg-black/50 border border-white/25 text-white transition-colors"
              >
                <Phone className="w-3 h-3" />
                <span>+91-9022273915</span>
              </a>
              <Link
                to="/buffaloes"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-sans font-extrabold shadow transition-transform hover:scale-105"
                style={{
                  backgroundColor: theme.accent_color || theme.primary_color,
                  color: "#07160e",
                }}
              >
                <span>View Buffaloes</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FestivalThemeBanner;
