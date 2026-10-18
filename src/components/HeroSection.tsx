import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Facebook, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WhatsAppIcon, { WHATSAPP_URL } from "@/components/WhatsAppIcon";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";

import videoV1 from "@/assets/videos/v1.mp4"; // Newly uploaded v1 video
import videoV2 from "@/assets/videos/v2.mp4"; // Newly uploaded v2 video
import galleryVideo3 from "@/assets/videos/gallery-video3.mp4"; // Buffalo Video 4
import galleryVideo7 from "@/assets/videos/gallery-video7.mp4"; // Buffalo Video 8
import galleryVideo8 from "@/assets/videos/gallery-video8.mp4"; // Buffalo Video 9
import galleryVideo9 from "@/assets/videos/gallery-video9.mp4"; // Buffalo Video 10
import galleryVideo12 from "@/assets/videos/gallery-video12.mp4"; // Buffalo Video 13
import galleryVideo15 from "@/assets/videos/gallery-video15.mp4"; // Buffalo Video 16
import galleryVideo18 from "@/assets/videos/gallery-video18.mp4"; // Buffalo Video 19
import galleryVideo22 from "@/assets/videos/gallery-video22.mp4"; // Buffalo Video 23
import galleryVideo24 from "@/assets/videos/gallery-video24.mp4"; // Buffalo Video 25
import galleryVideo25 from "@/assets/videos/gallery-video25.mp4"; // Buffalo Video 26

interface BackgroundVideo {
  id: string;
  src: string;
  title: string;
}

const backgroundVideos: BackgroundVideo[] = [
  {
    id: "buffalo-video-1",
    src: videoV1,
    title: "Buffalo Video 1",
  },
  {
    id: "buffalo-video-2",
    src: videoV2,
    title: "Buffalo Video 2",
  },
  {
    id: "buffalo-video-3",
    src: galleryVideo3,
    title: "Buffalo Video 3",
  },
  {
    id: "buffalo-video-4",
    src: galleryVideo7,
    title: "Buffalo Video 4",
  },
  {
    id: "buffalo-video-5",
    src: galleryVideo8,
    title: "Buffalo Video 5",
  },
  {
    id: "buffalo-video-6",
    src: galleryVideo9,
    title: "Buffalo Video 6",
  },
  {
    id: "buffalo-video-7",
    src: galleryVideo12,
    title: "Buffalo Video 7",
  },
  {
    id: "buffalo-video-8",
    src: galleryVideo15,
    title: "Buffalo Video 8",
  },
  {
    id: "buffalo-video-9",
    src: galleryVideo18,
    title: "Buffalo Video 9",
  },
  {
    id: "buffalo-video-10",
    src: galleryVideo22,
    title: "Buffalo Video 10",
  },
  {
    id: "buffalo-video-11",
    src: galleryVideo24,
    title: "Buffalo Video 11",
  },
  {
    id: "buffalo-video-12",
    src: galleryVideo25,
    title: "Buffalo Video 12",
  },
];

const HeroSection = () => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Background smooth auto-transition across the 10 videos (each video plays for 6s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % backgroundVideos.length);
    }, 6000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const activeVideo = backgroundVideos[currentIndex];

  return (
    <section className="relative min-h-[86svh] sm:min-h-screen flex items-center overflow-hidden">
      {/* Background Animated Videos Only (Videos 4, 8, 9, 10, 13, 16, 19, 23, 25, 26) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <AnimatePresence initial={false}>
          <motion.div
            key={activeVideo.id}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.2, ease: "easeInOut" },
              scale: { duration: 6, ease: "easeOut" },
            }}
            className="absolute inset-0 w-full h-full"
          >
            <video
              key={activeVideo.src}
              ref={(el) => {
                if (el) {
                  el.defaultMuted = true;
                  el.muted = true;
                  el.play()?.catch?.(() => {});
                }
              }}
              src={activeVideo.src}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 hero-gradient" />
      </div>

      {/* Decorative accent line */}
      <div className="absolute left-8 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent hidden lg:block z-10" />

      <div className="relative container mx-auto px-4 pt-20 pb-16 sm:pt-24 sm:pb-20 z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl"
        >
          <FestivalSectionCard section="hero" />
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="font-sans text-gold font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-3 sm:mb-5 text-xs sm:text-sm"
          >
            {t("hero.subtitle")}
          </motion.p>

          <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-[1.15] sm:leading-[1.1] mb-3.5 sm:mb-6">
            {t("hero.title1")}{" "}
            <span className="relative inline-block">
              <span className="text-gold">{t("hero.title2")}</span>
              <motion.span
                className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-1 bg-gold rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{ transformOrigin: "left" }}
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="font-sans text-sm sm:text-lg md:text-xl text-primary-foreground/85 mb-5 sm:mb-10 max-w-lg leading-relaxed"
          >
            {t("hero.desc")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-4"
          >
            <Link to="/contact" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-sm sm:text-base px-5 sm:px-8 h-11 sm:h-12 md:h-14 gap-2 rounded-xl shadow-lg hover:shadow-xl transition-all">
                {t("hero.bookConsultation")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/buffaloes" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-primary-foreground/10 backdrop-blur-sm text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/20 font-sans font-semibold text-sm sm:text-base px-5 sm:px-8 h-11 sm:h-12 md:h-14 gap-2 rounded-xl transition-all">
                {t("hero.viewBuffaloes")}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.15, duration: 0.5 }}
            className="mt-5 sm:mt-6 flex items-center gap-3"
            aria-label="Social media"
          >
            <a
              href="https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit AK Buffaloes on Instagram"
              title="Instagram"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with AK Buffaloes on WhatsApp"
              title="WhatsApp"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
            >
              <WhatsAppIcon className="w-5 h-5" />
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <ChevronDown className="w-6 h-6 text-primary-foreground/50" />
      </motion.div>

      {/* Background Video Selector Controls */}
      <div className="absolute bottom-6 right-6 z-20 hidden sm:flex items-center gap-2 bg-black/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold/30 shadow-lg">
        <span className="font-sans text-[11px] font-semibold text-gold pr-1">
          {activeVideo.title}
        </span>
        <div className="flex items-center gap-1.5">
          {backgroundVideos.map((v, idx) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                currentIndex === idx
                  ? "w-6 bg-gold"
                  : "w-2 bg-primary-foreground/40 hover:bg-gold/60"
              }`}
              aria-label={`Switch to ${v.title}`}
              title={v.title}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
