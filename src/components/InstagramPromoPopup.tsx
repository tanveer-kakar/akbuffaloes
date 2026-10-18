import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Phone,
  Calendar,
  QrCode,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { backend } from "@/lib/backendClient";
import {
  defaultPromoPopupCards,
  mergePromoPopupsWithDb,
  type PromoPopupCard,
  type PromoPopupDbRecord,
} from "@/data/promoPopupData";
import { getDefaultFestivalImage } from "@/data/festivalVisualAssets";
import { useFestivalTheme } from "@/contexts/FestivalThemeContext";

interface PromoPopupCardViewProps {
  card: PromoPopupCard;
  onClose?: () => void;
  totalActive?: number;
  currentIndex?: number;
  onPrev?: () => void;
  onNext?: () => void;
  onCloseAll?: () => void;
  isPreview?: boolean;
}

export const PromoPopupCardView = ({
  card,
  onClose,
  totalActive = 1,
  currentIndex = 0,
  onPrev,
  onNext,
  onCloseAll,
  isPreview = false,
}: PromoPopupCardViewProps) => {
  const shortDisplayUrl = useMemo(() => {
    try {
      const u = new URL(card.link_url);
      return `${u.origin}${u.pathname}`;
    } catch {
      return card.link_url;
    }
  }, [card.link_url]);

  const isInternalLink = card.link_url.startsWith("/");
  const isFestivalCard = Boolean(card.festival_id || card.festival_icon);

  const primaryColor = card.festival_primary_color || "#D97706";
  const secondaryColor = card.festival_secondary_color || "#064E3B";
  const accentColor = card.festival_accent_color || "#FDE047";
  const festivalImageUrl =
    card.banner_image_url ||
    getDefaultFestivalImage(
      card.festival_slug || card.festival_id || card.id,
      card.festival_category
    );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full ${
        isPreview
          ? "max-w-[340px] sm:max-w-[560px] md:max-w-[900px] mx-auto"
          : "max-w-[320px] xs:max-w-[340px] sm:max-w-[520px] md:max-w-[900px] mx-auto my-auto"
      } rounded-2xl sm:rounded-3xl p-1 sm:p-1.5 shadow-[0_25px_80px_rgba(0,0,0,0.75)] transition-all`}
      style={{
        background: isFestivalCard
          ? `linear-gradient(135deg, ${accentColor}99 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`
          : "linear-gradient(135deg, #f5d77f 0%, #d4a843 35%, #0f3d23 70%, #d4a843 100%)",
      }}
    >
      {/* Top-Right Circular Close Button ('×') */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close announcement popup"
          title="Close"
          className="absolute -top-2.5 -right-2.5 sm:-top-3.5 sm:-right-3.5 z-50 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white font-sans font-bold text-base sm:text-lg leading-none flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.65)] border-2 border-white/90 cursor-pointer transition-transform hover:scale-110 active:scale-95"
        >
          ×
        </button>
      )}

      {/* ===================================================================== */}
      {/* MODE 1: FULL-BLEED PROMOTIONAL GRAPHIC BANNER                         */}
      {/* ===================================================================== */}
      {card.is_full_banner && card.banner_image_url ? (
        <div className="relative overflow-hidden rounded-[14px] sm:rounded-[20px] bg-[#07160e]">
          <div className="relative w-full">
            <img
              src={card.banner_image_url}
              alt={card.title_label}
              className="w-full h-auto block object-contain select-none"
            />
            {/* Clickable Hotspot over 'ORDER NOW ->' button */}
            {isInternalLink ? (
              <Link
                to={card.link_url}
                onClick={() => {
                  if (!isPreview && onCloseAll) onCloseAll();
                  else if (!isPreview && onClose) onClose();
                }}
                aria-label={card.button_text || "Order Now"}
                title={card.button_text || "Order Now"}
                className="absolute bottom-[22%] right-[8%] w-[34%] h-[12%] cursor-pointer z-20"
              />
            ) : (
              <a
                href={card.link_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={card.button_text || "Order Now"}
                title={card.button_text || "Order Now"}
                className="absolute bottom-[22%] right-[8%] w-[34%] h-[12%] cursor-pointer z-20"
              />
            )}
            {/* Clickable Bottom Hotspots: Call/WhatsApp, Email, Instagram, Location */}
            <a
              href="tel:+919022273915"
              aria-label="Call +91-9022273915"
              title="Call +91-9022273915"
              className="absolute bottom-1 left-[2%] w-[34%] h-[12%] cursor-pointer z-20"
            />
            <a
              href="mailto:akbuffaloes540@gmail.com"
              aria-label="Email akbuffaloes540@gmail.com"
              title="Email akbuffaloes540@gmail.com"
              className="absolute bottom-1 left-[37%] w-[23%] h-[12%] cursor-pointer z-20"
            />
            <a
              href="https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow @ak_buffaloes on Instagram"
              title="Follow @ak_buffaloes on Instagram"
              className="absolute bottom-1 left-[61%] w-[18%] h-[12%] cursor-pointer z-20"
            />
            <a
              href="https://maps.app.goo.gl/exQPMJMUVzwfWdqcA"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Our Location: Lohari, Jalgaon (Maharashtra)"
              title="Open Location on Google Maps"
              className="absolute bottom-1 right-[1%] w-[19%] h-[12%] cursor-pointer z-20"
            />
          </div>

          {/* Modern Glass Footer Action Bar */}
          <div className="bg-[#07160e]/95 border-t border-gold/30 px-3 sm:px-5 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 text-white text-xs">
            <span className="font-sans font-semibold text-[10px] sm:text-xs text-white/90 truncate max-w-[165px] xs:max-w-[200px] sm:max-w-none">
              {card.footer_text}
            </span>

            <div className="flex items-center gap-2 ml-auto shrink-0">
              {totalActive > 1 && (
                <div className="inline-flex items-center gap-1 bg-white/10 border border-gold/40 rounded-full px-2 py-0.5 text-[10px] font-sans text-gold">
                  {onPrev && (
                    <button
                      type="button"
                      onClick={onPrev}
                      className="hover:text-white p-0.5"
                      title="Previous card"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  <span className="font-bold">
                    {currentIndex + 1}/{totalActive}
                  </span>
                  {onNext && (
                    <button
                      type="button"
                      onClick={onNext}
                      className="hover:text-white p-0.5"
                      title="Next card"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {isInternalLink ? (
                <Link
                  to={card.link_url}
                  onClick={() => {
                    if (!isPreview && onCloseAll) onCloseAll();
                    else if (!isPreview && onClose) onClose();
                  }}
                  className="inline-flex items-center gap-1 bg-gold hover:bg-gold-light text-green-dark font-sans font-extrabold text-[10px] sm:text-xs px-3 sm:px-4 py-1 rounded-full shadow transition-transform hover:scale-105"
                >
                  <span>{card.button_text}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-green-dark" />
                </Link>
              ) : (
                <a
                  href={card.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 bg-gold hover:bg-gold-light text-green-dark font-sans font-extrabold text-[10px] sm:text-xs px-3 sm:px-4 py-1 rounded-full shadow transition-transform hover:scale-105"
                >
                  <Instagram className="w-3 h-3 text-green-dark" />
                  <span>{card.button_text}</span>
                </a>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={totalActive > 1 && onCloseAll ? onCloseAll : onClose}
                  className="font-sans text-[10px] sm:text-xs text-white/75 hover:text-gold underline px-1.5 py-0.5 transition-colors"
                >
                  {totalActive > 1 ? "Close All" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : isFestivalCard ? (
        /* ===================================================================== */
        /* MODE 2: CHATGPT-STYLE LUXURY FESTIVAL & SPECIAL DAY STUDIO CARD       */
        /* Compact Mobile Horizontal Layout (matching 2nd Popup Card) + Desktop  */
        /* ===================================================================== */
        <div
          className="relative overflow-hidden rounded-[14px] sm:rounded-[20px] text-white"
          style={{
            background: `radial-gradient(circle at 12% 18%, ${primaryColor}55 0%, transparent 48%), radial-gradient(circle at 88% 82%, ${secondaryColor}90 0%, transparent 55%), linear-gradient(145deg, #06130c 0%, #0b1f15 52%, #07120c 100%)`,
          }}
        >
          {/* Subtle Modern Grid Pattern Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* Top Floating Glassmorphic Festival Ribbon */}
          <div
            className="relative z-10 px-2.5 sm:px-6 py-1.5 sm:py-3 border-b border-white/15 flex items-center justify-between gap-1.5 sm:gap-2 backdrop-blur-md"
            style={{
              background: `linear-gradient(90deg, ${secondaryColor}CC 0%, ${primaryColor}99 55%, ${secondaryColor}CC 100%)`,
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <img
                src="/ak-buffalo-logo-emblem.png"
                alt="AK Buffaloes"
                className="w-6 h-6 sm:w-9 sm:h-9 rounded-full border sm:border-2 bg-green-dark p-0.5 object-contain shrink-0 shadow-md"
                style={{ borderColor: accentColor }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                  <span className="font-display font-extrabold text-[10px] sm:text-sm tracking-wide text-white truncate">
                    {card.brand_title_en}
                  </span>
                  <span
                    className="font-sans text-[7.5px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full truncate"
                    style={{
                      backgroundColor: `${accentColor}25`,
                      color: accentColor,
                      border: `1px solid ${accentColor}66`,
                    }}
                  >
                    {card.brand_subtitle_en}
                  </span>
                </div>
                <p className="font-sans text-[8px] sm:text-[11px] text-white/80 truncate">
                  {card.brand_title_hi} • {card.brand_subtitle_hi}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {card.festival_date_label && (
                <span
                  className="inline-flex items-center gap-1 font-sans text-[8px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md shadow-sm"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.45)",
                    color: accentColor,
                    border: `1px solid ${accentColor}70`,
                  }}
                >
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate max-w-[85px] sm:max-w-none">{card.festival_date_label}</span>
                </span>
              )}
              <span
                className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-full text-lg shadow-inner border border-white/25 bg-black/30"
                title={card.title_label}
              >
                {card.festival_icon || card.badge_text}
              </span>
            </div>
          </div>

          {/* Main Bento Content Grid — Side-by-Side on Mobile & Desktop like 2nd Popup Card */}
          <div className="relative z-10 p-2 sm:p-5 grid grid-cols-12 gap-2 sm:gap-5 items-stretch">
            {/* Left 7 Columns: Featured Festival Image Showcase + Bilingual Greeting */}
            <div className="col-span-7 flex flex-col justify-between space-y-1.5 sm:space-y-3 text-left min-w-0">
              {/* Featured Festival & Champion Buffalo Visual Image Showcase Card */}
              <div
                className="relative rounded-xl sm:rounded-2xl overflow-hidden border sm:border-2 shadow-[0_8px_25px_rgba(0,0,0,0.5)] group min-h-[92px] sm:min-h-[210px] flex flex-col justify-between"
                style={{ borderColor: `${accentColor}80` }}
              >
                <img
                  src={festivalImageUrl}
                  alt={card.title_label || card.headline_en}
                  className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 select-none"
                />
                {/* Multi-stop Studio Cinematic Vignette */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, rgba(6,19,12,0.65) 0%, rgba(6,19,12,0.20) 40%, rgba(6,19,12,0.92) 100%)`,
                  }}
                />
                {/* Festive Color Glow Accent */}
                <div
                  className="absolute inset-0 opacity-35 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 85% 15%, ${primaryColor} 0%, transparent 55%)`,
                  }}
                />

                {/* Top Floating Badges Over Image */}
                <div className="relative z-10 p-1.5 sm:p-3.5 flex items-center justify-between gap-1 sm:gap-2 flex-wrap">
                  <div
                    className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md shadow-md border max-w-full"
                    style={{
                      backgroundColor: "rgba(6, 19, 12, 0.78)",
                      borderColor: `${accentColor}80`,
                    }}
                  >
                    <span className="text-[10px] sm:text-base leading-none shrink-0">
                      {card.festival_icon || "✨"}
                    </span>
                    <span
                      className="font-sans text-[7px] sm:text-xs font-extrabold uppercase tracking-wider truncate"
                      style={{ color: accentColor }}
                    >
                      {card.highlight_prefix_en ? `${card.highlight_prefix_en} • ` : ""}
                      {card.highlight_text_en}
                    </span>
                  </div>

                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/25 backdrop-blur-md font-sans text-[10px] font-bold text-white shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>🐃 10 Breeds • 50+ Buffaloes</span>
                  </span>
                </div>

                {/* Bottom Overlay Greeting on Image */}
                <div className="relative z-10 p-1.5 sm:p-4 pt-2 sm:pt-8 space-y-0.5 sm:space-y-1">
                  <h3
                    id="insta-promo-title"
                    className="font-display font-extrabold text-[10px] sm:text-xl md:text-2xl leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] line-clamp-2 sm:line-clamp-none"
                  >
                    {card.headline_en}
                  </h3>
                  <p className="font-sans text-[7.5px] sm:text-xs text-white/90 leading-snug sm:leading-relaxed line-clamp-1 sm:line-clamp-2 drop-shadow">
                    {card.description_en}
                  </p>
                </div>
              </div>

              {/* Glassmorphic Hindi / Marathi Greeting Card */}
              <div
                className="rounded-lg sm:rounded-xl p-1.5 sm:p-3.5 backdrop-blur-md border shadow-inner space-y-0.5 sm:space-y-1"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 100%)",
                  borderColor: `${accentColor}45`,
                }}
              >
                <div className="flex items-center justify-between gap-1 sm:gap-2">
                  <span
                    className="font-sans text-[7px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded bg-black/35 truncate"
                    style={{ color: accentColor }}
                  >
                    {card.highlight_text_hi || "हार्दिक शुभकामनाएं"}
                  </span>
                  <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" style={{ color: accentColor }} />
                </div>
                <p
                  className="font-display font-bold text-[9px] sm:text-base leading-tight sm:leading-snug line-clamp-2 sm:line-clamp-none"
                  style={{ color: accentColor }}
                >
                  {card.headline_hi}
                </p>
                <p className="font-sans text-[7.5px] sm:text-xs text-white/85 leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                  {card.description_hi}
                </p>
              </div>

              {/* 3 Farm Trust Badges (Desktop/Tablet) */}
              <div className="hidden sm:grid grid-cols-3 gap-2">
                {[
                  { label: "10 Pure Breeds", sub: "50+ Live Stock" },
                  { label: "Live Video Proof", sub: "Milking & Health" },
                  { label: "Safe Transport", sub: "Direct from Farm" },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="rounded-lg bg-white/[0.06] border border-white/10 px-2.5 py-1.5 text-left"
                  >
                    <p className="font-sans text-[10px] sm:text-[11px] font-bold text-white flex items-center gap-1">
                      <CheckCircle2
                        className="w-3 h-3 shrink-0"
                        style={{ color: accentColor }}
                      />
                      <span className="truncate">{b.label}</span>
                    </p>
                    <p className="font-sans text-[9.5px] text-white/65 truncate pl-4">
                      {b.sub}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 Columns: ChatGPT-Style Interactive QR & Instant Connect Studio Card */}
            <div className="col-span-5 flex flex-col justify-between rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/[0.12] via-white/[0.06] to-black/40 backdrop-blur-xl border border-white/20 p-2 sm:p-4 text-center shadow-2xl min-w-0">
              <div>
                <div
                  className="inline-flex items-center gap-1 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-xs font-sans font-extrabold uppercase tracking-wider shadow-sm mb-1 sm:mb-2 max-w-full"
                  style={{
                    backgroundColor: accentColor,
                    color: "#07160e",
                  }}
                >
                  <QrCode className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{card.qr_box_title}</span>
                </div>

                <p className="font-sans text-[7px] sm:text-[11px] text-white/75 mb-1 sm:mb-2.5 leading-tight line-clamp-1 sm:line-clamp-none">
                  Scan QR or connect with{" "}
                  <strong className="text-white">{card.link_label}</strong>
                </p>

                {/* High-Contrast QR Code Pod */}
                <a
                  href={card.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white p-1 sm:p-2.5 rounded-lg sm:rounded-2xl mx-auto w-14 h-14 sm:w-36 sm:h-36 flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.5)] border sm:border-2 transition-transform hover:scale-105"
                  style={{ borderColor: accentColor }}
                  title={`Open ${card.link_label}`}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&color=0c1d12&data=${encodeURIComponent(
                      card.link_url
                    )}`}
                    alt={`QR Code for ${card.link_label}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="w-4 h-4 sm:w-8 sm:h-8 rounded sm:rounded-lg bg-green-dark border sm:border-2 p-0.5 sm:p-1 shadow-md flex items-center justify-center"
                      style={{ borderColor: accentColor }}
                    >
                      <Instagram className="w-2.5 h-2.5 sm:w-4 sm:h-4" style={{ color: accentColor }} />
                    </div>
                  </div>
                </a>
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-1 sm:space-y-2 mt-1.5 sm:mt-3">
                <a
                  href={card.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1 sm:gap-1.5 font-sans font-extrabold text-[8px] sm:text-sm py-1 sm:py-2.5 px-1.5 sm:px-4 rounded-lg sm:rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
                  style={{
                    background: `linear-gradient(90deg, ${accentColor} 0%, #f59e0b 100%)`,
                    color: "#07160e",
                  }}
                >
                  <Instagram className="w-2.5 h-2.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{card.button_text}</span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 hidden xs:inline" />
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
                  <Link
                    to="/buffaloes"
                    onClick={() => {
                      if (!isPreview && onCloseAll) onCloseAll();
                      else if (!isPreview && onClose) onClose();
                    }}
                    className="inline-flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans font-bold text-[7.5px] sm:text-xs py-1 sm:py-1.5 px-1.5 sm:px-2.5 rounded-md sm:rounded-lg transition-colors"
                  >
                    <span className="truncate">View 50 Buffaloes</span>
                    <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  </Link>
                  <a
                    href="tel:+919022273915"
                    className="hidden sm:inline-flex items-center justify-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-sans font-bold text-[10px] sm:text-xs py-1.5 px-2.5 rounded-lg transition-colors"
                  >
                    <Phone className="w-3 h-3 text-emerald-400" />
                    <span>+91-9022273915</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Glass Footer Strip */}
          <div className="relative z-10 bg-black/55 border-t border-white/15 px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs">
            <span className="font-sans font-medium text-[9px] sm:text-xs text-white/85 truncate max-w-[145px] xs:max-w-[180px] sm:max-w-none">
              {card.footer_text}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
              {totalActive > 1 && (
                <div className="inline-flex items-center gap-1 bg-white/10 border border-white/25 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-sans text-white">
                  {onPrev && (
                    <button
                      type="button"
                      onClick={onPrev}
                      className="hover:text-gold p-0.5"
                      title="Previous card"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  <span className="font-bold">
                    {currentIndex + 1}/{totalActive}
                  </span>
                  {onNext && (
                    <button
                      type="button"
                      onClick={onNext}
                      className="hover:text-gold p-0.5"
                      title="Next card"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {onClose && (
                <button
                  type="button"
                  onClick={totalActive > 1 && onCloseAll ? onCloseAll : onClose}
                  className="font-sans text-[9px] sm:text-xs text-white/75 hover:text-white underline px-1 sm:px-1.5 py-0.5 transition-colors"
                >
                  {totalActive > 1 ? "Close All" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* MODE 3: REDESIGNED OFFICIAL INSTAGRAM ADVERTISEMENT STUDIO CARD       */
        /* Compact 3-Column Horizontal Layout on Mobile (same size as 2nd card)  */
        /* ===================================================================== */
        <div
          className="relative overflow-hidden rounded-[14px] sm:rounded-[20px] text-white"
          style={{
            background:
              "radial-gradient(circle at 10% 15%, rgba(212, 168, 67, 0.28) 0%, transparent 45%), radial-gradient(circle at 90% 20%, rgba(225, 48, 108, 0.22) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(16, 185, 129, 0.22) 0%, transparent 55%), linear-gradient(145deg, #05130c 0%, #0b2417 50%, #091911 100%)",
          }}
        >
          {/* Subtle Studio Dot Matrix */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            style={{
              backgroundImage: "radial-gradient(#f5d77f 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          {/* Top Verified Social Studio Header Bar */}
          <div className="relative z-10 px-2.5 sm:px-6 py-1.5 sm:py-3.5 bg-white/[0.05] border-b border-white/15 backdrop-blur-md flex items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              {/* Avatar with Instagram-style Golden/Magenta Story Ring */}
              <div className="p-0.5 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shrink-0 shadow-md">
                <img
                  src="/ak-buffalo-logo-emblem.png"
                  alt="AK Buffaloes"
                  className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-green-dark p-0.5 object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <span
                    id="insta-promo-title"
                    className="font-display font-extrabold text-[10px] sm:text-base text-white truncate"
                  >
                    {card.brand_title_en}
                  </span>
                  <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400 shrink-0" />
                  <span className="hidden xs:inline-block font-sans text-[8px] sm:text-[10px] font-bold bg-gradient-to-r from-amber-400/20 to-pink-500/20 text-amber-300 border border-amber-400/40 px-1.5 sm:px-2 py-0.5 rounded-full truncate">
                    {card.brand_subtitle_en}
                  </span>
                </div>
                <p className="font-sans text-[8px] sm:text-xs text-white/75 truncate">
                  {card.link_label} • {card.brand_title_hi} ({card.brand_subtitle_hi})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1 font-sans text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                10 Breeds • 50+ Buffaloes
              </span>
              <span className="font-display font-black text-[8.5px] sm:text-sm bg-gradient-to-r from-gold-light to-gold text-green-dark px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow">
                {card.badge_text} LIVE
              </span>
            </div>
          </div>

          {/* Optional Custom Banner Image */}
          {card.banner_image_url && (
            <div className="relative z-10 mx-2.5 sm:mx-6 mt-2 sm:mt-3 rounded-lg sm:rounded-xl overflow-hidden border border-gold/40 bg-black/50 max-h-24 sm:max-h-44 flex items-center justify-center">
              <img
                src={card.banner_image_url}
                alt={card.title_label}
                className="w-full max-h-24 sm:max-h-44 object-contain"
              />
            </div>
          )}

          {/* Main 3-Column Bento Grid — Side-by-Side 3 Columns on Both Mobile & Desktop (matching 2nd Popup Card) */}
          <div className="relative z-10 p-2 sm:p-6 grid grid-cols-12 gap-1.5 sm:gap-5 items-stretch">
            {/* LEFT BENTO CARD: English Showcase (4 Cols on Mobile & Desktop) */}
            <div className="col-span-4 rounded-xl sm:rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md p-1.5 sm:p-4 flex flex-col justify-between text-left min-w-0">
              <div className="space-y-1 sm:space-y-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 font-sans text-[6.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-400/15 border border-amber-400/30 px-1.5 sm:px-2.5 py-0.5 rounded-full max-w-full truncate">
                  <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">Official Feed</span>
                </span>

                <h3 className="font-display font-extrabold text-[9.5px] sm:text-xl text-white leading-tight sm:leading-snug">
                  {card.headline_en}
                </h3>

                <div className="rounded-md sm:rounded-xl bg-gradient-to-r from-gold/20 to-transparent border-l-2 border-gold px-1.5 sm:px-3 py-0.5 sm:py-1.5">
                  <p className="font-sans text-[7px] sm:text-xs font-bold text-white/90 leading-tight">
                    {card.highlight_prefix_en ? `${card.highlight_prefix_en} ` : ""}
                    <span className="text-[8px] sm:text-base font-black text-gold-light">
                      {card.highlight_text_en}
                    </span>{" "}
                    {card.highlight_suffix_en}
                  </p>
                </div>

                <p className="font-sans text-[7px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {card.description_en}
                </p>
              </div>

              <div className="pt-1.5 mt-1.5 sm:pt-3 sm:mt-3 border-t border-white/10 space-y-1 sm:space-y-2">
                <div className="hidden sm:flex flex-wrap gap-1">
                  {["Murrah", "Nili-Ravi", "Jaffarabadi", "Surti", "Mehsana"].map((b) => (
                    <span
                      key={b}
                      className="font-sans text-[10px] font-semibold bg-white/10 text-white/90 px-2 py-0.5 rounded-md"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <p className="font-sans text-[6.5px] sm:text-[11px] font-semibold text-amber-300/95 leading-tight line-clamp-2 sm:line-clamp-none">
                  {card.subnote_en}
                </p>
              </div>
            </div>

            {/* CENTER BENTO CARD: Interactive QR Code & Follow Pod (4 Cols on Mobile & Desktop) */}
            <div className="col-span-4 rounded-xl sm:rounded-2xl bg-gradient-to-b from-gold/20 via-[#0d291a] to-[#06140c] border sm:border-2 border-gold/60 p-1.5 sm:p-4 flex flex-col items-center justify-between text-center shadow-[0_8px_25px_rgba(0,0,0,0.5)] min-w-0">
              <div className="w-full">
                <div className="bg-gradient-to-r from-gold-light via-gold to-amber-500 text-green-dark font-sans font-extrabold text-[6.5px] sm:text-xs py-0.5 sm:py-1 px-1.5 sm:px-3 rounded-full shadow-sm inline-flex items-center justify-center gap-0.5 sm:gap-1.5 mb-1 sm:mb-2 max-w-full">
                  <QrCode className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span className="truncate">{card.qr_box_title}</span>
                </div>

                <p className="hidden sm:block font-sans text-[10px] text-white/75 truncate px-2 mb-2.5">
                  {shortDisplayUrl}
                </p>

                {/* Scannable QR Code with Instagram Center Badge */}
                <a
                  href={card.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white p-1 sm:p-2.5 rounded-lg sm:rounded-2xl mx-auto w-14 h-14 sm:w-36 sm:h-36 flex items-center justify-center shadow-xl border sm:border-2 border-gold transition-transform hover:scale-105"
                  title={`Scan or click to open ${card.link_label}`}
                >
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&color=0c1d12&data=${encodeURIComponent(
                      card.link_url
                    )}`}
                    alt={`Scan QR Code for ${card.link_label}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4 h-4 sm:w-8 sm:h-8 rounded sm:rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-0.5 shadow-md flex items-center justify-center">
                      <div className="w-full h-full rounded-[3px] sm:rounded-[10px] bg-green-dark flex items-center justify-center">
                        <Instagram className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gold-light" />
                      </div>
                    </div>
                  </div>
                </a>
              </div>

              <div className="w-full mt-1.5 sm:mt-3 space-y-1 sm:space-y-2">
                <a
                  href={card.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1 sm:gap-1.5 bg-gradient-to-r from-gold-light via-gold to-amber-500 hover:brightness-110 text-green-dark font-sans font-extrabold text-[7.5px] sm:text-sm py-1 sm:py-2 px-1.5 sm:px-4 rounded-md sm:rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Instagram className="w-2.5 h-2.5 sm:w-4 sm:h-4 shrink-0" />
                  <span className="truncate">{card.button_text}</span>
                  <ExternalLink className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 shrink-0 hidden sm:inline" />
                </a>
                <p className="font-sans text-[6px] sm:text-[10px] text-gold-light/90 font-semibold leading-tight">
                  Scan QR or Tap to Follow
                </p>
              </div>
            </div>

            {/* RIGHT BENTO CARD: Hindi Showcase (4 Cols on Mobile & Desktop) */}
            <div className="col-span-4 rounded-xl sm:rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-md p-1.5 sm:p-4 flex flex-col justify-between text-left min-w-0">
              <div className="space-y-1 sm:space-y-2">
                <span className="inline-flex items-center gap-0.5 sm:gap-1 font-sans text-[6.5px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 px-1.5 sm:px-2.5 py-0.5 rounded-full max-w-full truncate">
                  <CheckCircle2 className="w-2 h-2 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">{card.brand_subtitle_hi}</span>
                </span>

                <h3 className="font-display font-extrabold text-[9.5px] sm:text-xl text-white leading-tight sm:leading-snug">
                  {card.headline_hi}
                </h3>

                <div className="rounded-md sm:rounded-xl bg-gradient-to-r from-emerald-500/20 to-transparent border-l-2 border-emerald-400 px-1.5 sm:px-3 py-0.5 sm:py-1.5">
                  <p className="font-sans text-[7px] sm:text-xs font-bold text-white/90 leading-tight">
                    अंतर्गत{" "}
                    <span className="text-[8px] sm:text-base font-black text-gold-light">
                      {card.highlight_text_hi}
                    </span>{" "}
                    अपडेट
                  </p>
                </div>

                <p className="font-sans text-[7px] sm:text-xs text-white/80 leading-tight sm:leading-relaxed line-clamp-3 sm:line-clamp-none">
                  {card.description_hi}
                </p>
              </div>

              <div className="pt-1.5 mt-1.5 sm:pt-3 sm:mt-3 border-t border-white/10 space-y-1 sm:space-y-2">
                <p className="font-sans text-[6.5px] sm:text-[11px] font-semibold text-emerald-300 leading-tight line-clamp-2 sm:line-clamp-none">
                  {card.subnote_hi}
                </p>
                <div className="hidden sm:flex items-center justify-between gap-2 pt-0.5">
                  <a
                    href="tel:+919022273915"
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-white/90 hover:text-gold"
                  >
                    <Phone className="w-3 h-3 text-gold" /> +91-9022273915
                  </a>
                  <Link
                    to="/buffaloes"
                    onClick={() => {
                      if (!isPreview && onCloseAll) onCloseAll();
                      else if (!isPreview && onClose) onClose();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-sans font-bold text-gold hover:underline"
                  >
                    <span>View Catalog</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Studio Action Footer */}
          <div className="relative z-10 bg-black/50 border-t border-white/15 px-2.5 sm:px-6 py-1.5 sm:py-2.5 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-white text-xs">
            <span className="font-sans font-medium text-[9px] sm:text-xs text-white/85 truncate max-w-[130px] xs:max-w-[165px] sm:max-w-none">
              {card.footer_text}
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
              {totalActive > 1 && (
                <div className="inline-flex items-center gap-1 bg-white/10 border border-gold/40 rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-sans text-gold">
                  {onPrev && (
                    <button
                      type="button"
                      onClick={onPrev}
                      className="hover:text-white p-0.5"
                      title="Previous card"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                  )}
                  <span className="font-bold">
                    {currentIndex + 1}/{totalActive}
                  </span>
                  {onNext && (
                    <button
                      type="button"
                      onClick={onNext}
                      className="hover:text-white p-0.5"
                      title="Next card"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              <a
                href={card.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-gold hover:bg-gold-light text-green-dark font-sans font-extrabold text-[9.5px] sm:text-xs px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow transition-transform hover:scale-105"
              >
                <Instagram className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-dark" />
                <span>{card.button_text}</span>
              </a>

              {onClose && (
                <button
                  type="button"
                  onClick={totalActive > 1 && onCloseAll ? onCloseAll : onClose}
                  className="font-sans text-[9px] sm:text-xs text-white/75 hover:text-gold underline px-1 sm:px-1.5 py-0.5 transition-colors"
                >
                  {totalActive > 1 ? "Close All" : "Close"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface InstagramPromoPopupProps {
  /** Wait until initial buffalo loader completes before showing the popup */
  ready?: boolean;
}

const InstagramPromoPopup = ({ ready = true }: InstagramPromoPopupProps) => {
  const [allCards, setAllCards] = useState<PromoPopupCard[]>(defaultPromoPopupCards);
  const [dbRecords, setDbRecords] = useState<PromoPopupDbRecord[]>([]);
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasShownOnLoad, setHasShownOnLoad] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const location = useLocation();
  const { activeOccasion } = useFestivalTheme();

  // Do not auto-pop over the /admin portal screen
  const isAdminRoute = location.pathname.startsWith("/admin");

  const loadPromoPopups = useCallback(async () => {
    try {
      const { data, error } = await backend.from("promo_popups").select("*");
      if (!error && data && Array.isArray(data)) {
        const records = data as PromoPopupDbRecord[];
        setDbRecords(records);
        setAllCards(mergePromoPopupsWithDb(records));
      }
    } catch {
      // Fallback to defaultPromoPopupCards if offline
    } finally {
      setLoadedFromDb(true);
    }
  }, []);

  useEffect(() => {
    void loadPromoPopups();
    const handleCustomUpdate = () => {
      void loadPromoPopups();
    };
    window.addEventListener("ak-promo-popups-updated", handleCustomUpdate);
    window.addEventListener("focus", handleCustomUpdate);
    return () => {
      window.removeEventListener("ak-promo-popups-updated", handleCustomUpdate);
      window.removeEventListener("focus", handleCustomUpdate);
    };
  }, [loadPromoPopups]);

  // Show cards where ON/OFF switch is ON (is_active === true),
  // OR the festival popup card for today's active occasion (unless explicitly turned OFF in DB)
  const activeCards = useMemo(() => {
    return allCards.filter((card) => {
      const explicitDb = dbRecords.find((r) => r.id === card.id && !r.is_deleted);
      if (explicitDb && explicitDb.is_active !== undefined) {
        return Boolean(explicitDb.is_active);
      }
      if (
        card.festival_id &&
        activeOccasion &&
        card.festival_id === activeOccasion.id &&
        activeOccasion.theme.show_in_popup !== false
      ) {
        return true;
      }
      return card.is_active === true;
    });
  }, [allCards, dbRecords, activeOccasion]);

  useEffect(() => {
    if (!ready || !loadedFromDb || isAdminRoute || hasShownOnLoad) return;
    if (activeCards.length === 0) {
      setHasShownOnLoad(true);
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex(0);
      setIsOpen(true);
      setHasShownOnLoad(true);
    }, 150);
    return () => clearTimeout(timer);
  }, [ready, loadedFromDb, isAdminRoute, hasShownOnLoad, activeCards.length]);

  // Handle top-right 'x' button: if multiple active cards exist, advance to next card or close after last
  const handleCloseCurrentOrAdvance = useCallback(() => {
    if (currentIndex + 1 < activeCards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsOpen(false);
    }
  }, [currentIndex, activeCards.length]);

  const handleCloseAll = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseAll();
      if (e.key === "ArrowRight" && activeCards.length > 1) {
        setCurrentIndex((prev) => (prev + 1) % activeCards.length);
      }
      if (e.key === "ArrowLeft" && activeCards.length > 1) {
        setCurrentIndex((prev) => (prev - 1 + activeCards.length) % activeCards.length);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, handleCloseAll, activeCards.length]);

  if (isAdminRoute || activeCards.length === 0) return null;

  const currentCard = activeCards[Math.min(currentIndex, activeCards.length - 1)];

  return (
    <AnimatePresence>
      {isOpen && currentCard && (
        <motion.div
          key="instagram-promo-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleCloseAll}
          className="fixed inset-0 z-[9990] bg-black/65 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="insta-promo-title"
        >
          <motion.div
            key={currentCard.id}
            initial={{ scale: 0.9, opacity: 0, y: 14 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[320px] xs:max-w-[340px] sm:max-w-[520px] md:max-w-[900px] my-auto mx-auto"
          >
            {activeOccasion &&
              activeOccasion.theme.show_in_popup &&
              currentCard.festival_id !== activeOccasion.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="mb-1.5 sm:mb-2.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border sm:border-2 shadow-xl flex items-center justify-between gap-2 text-[10px] sm:text-sm"
                  style={{
                    background: `linear-gradient(95deg, ${activeOccasion.theme.primary_color}, ${activeOccasion.theme.secondary_color})`,
                    borderColor: `${activeOccasion.theme.accent_color}90`,
                    color: activeOccasion.theme.banner_text_color,
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="relative w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl overflow-hidden border shrink-0 shadow"
                      style={{
                        borderColor:
                          activeOccasion.theme.accent_color ||
                          activeOccasion.theme.primary_color,
                      }}
                    >
                      <img
                        src={
                          activeOccasion.theme.banner_image_url ||
                          getDefaultFestivalImage(
                            activeOccasion.slug || activeOccasion.id,
                            activeOccasion.category
                          )
                        }
                        alt={activeOccasion.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] sm:text-[10px] px-0.5 rounded-tl">
                        {activeOccasion.theme.icon}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-display font-bold text-[10px] sm:text-sm truncate"
                        style={{ color: activeOccasion.theme.accent_color }}
                      >
                        {activeOccasion.theme.greeting_en}
                      </p>
                      <p className="font-sans text-[8.5px] sm:text-[11px] opacity-90 truncate">
                        {activeOccasion.theme.subtitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className="hidden sm:inline-block shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${activeOccasion.theme.accent_color}25`,
                      color: activeOccasion.theme.accent_color,
                      border: `1px solid ${activeOccasion.theme.accent_color}60`,
                    }}
                  >
                    {activeOccasion.theme.badge_text}
                  </span>
                </div>
              )}
            <PromoPopupCardView
              card={currentCard}
              onClose={handleCloseCurrentOrAdvance}
              onCloseAll={handleCloseAll}
              totalActive={activeCards.length}
              currentIndex={currentIndex}
              onPrev={
                activeCards.length > 1
                  ? () =>
                      setCurrentIndex(
                        (prev) => (prev - 1 + activeCards.length) % activeCards.length
                      )
                  : undefined
              }
              onNext={
                activeCards.length > 1
                  ? () => setCurrentIndex((prev) => (prev + 1) % activeCards.length)
                  : undefined
              }
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstagramPromoPopup;
