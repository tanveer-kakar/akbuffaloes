import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Leaf, Users, TrendingUp, MapPin, Award, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";
import galleryHerd from "@/assets/gallery/gallery-herd.jpg";
import galleryFarm from "@/assets/farm/gallery-farm.jpg";
import galleryFarm2 from "@/assets/farm/gallery-farm-2.jpg";
import founderPhoto from "@/assets/farm/Professional Founder Photo.png";
import coFounderPhoto from "@/assets/farm/Professional co-founder photo.png";

const storyFarmSlides = [
  { src: galleryFarm, alt: "AK Buffaloes Farm Aerial View" },
  { src: galleryFarm2, alt: "AK Buffaloes Grazing at Our Dairy Farm" },
];

const About = () => {
  const { t } = useLanguage();
  const [currentFarmSlide, setCurrentFarmSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);

  const goToNextSlide = () => {
    setSlideDirection(1);
    setCurrentFarmSlide((prev) => (prev + 1) % storyFarmSlides.length);
  };

  const goToPrevSlide = () => {
    setSlideDirection(-1);
    setCurrentFarmSlide((prev) => (prev - 1 + storyFarmSlides.length) % storyFarmSlides.length);
  };

  const goToSlide = (index: number) => {
    if (index === currentFarmSlide) return;
    setSlideDirection(index > currentFarmSlide ? 1 : -1);
    setCurrentFarmSlide(index);
  };

  const values = [
    { icon: Shield, title: t("about.val1Title"), desc: t("about.val1Desc") },
    { icon: Leaf, title: t("about.val2Title"), desc: t("about.val2Desc") },
    { icon: Users, title: t("about.val3Title"), desc: t("about.val3Desc") },
    { icon: TrendingUp, title: t("about.val4Title"), desc: t("about.val4Desc") },
  ];

  return (
    <main className="pt-14 sm:pt-16 md:pt-20 overflow-x-hidden">
      {/* Hero */}
      <section className="relative py-12 sm:py-20 md:py-32">
        <img src={galleryHerd} alt="Buffalo herd" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block font-sans text-gold font-semibold tracking-[0.2em] uppercase mb-2 sm:mb-3 text-xs sm:text-sm">
              {t("about.subtitle")}
            </span>
            <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-3 sm:mb-4">
              {t("about.title")}
            </h1>
            <div className="w-16 sm:w-20 h-1 bg-gold mx-auto rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-8 sm:py-14 bg-cream">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <FestivalSectionCard section="about" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative rounded-xl sm:rounded-2xl shadow-xl w-full h-52 sm:h-80 overflow-hidden group select-none bg-neutral-900">
                <AnimatePresence initial={false} custom={slideDirection}>
                  <motion.img
                    key={currentFarmSlide}
                    src={storyFarmSlides[currentFarmSlide].src}
                    alt={storyFarmSlides[currentFarmSlide].alt}
                    custom={slideDirection}
                    initial={{ x: slideDirection > 0 ? "100%" : "-100%", opacity: 0.6 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: slideDirection > 0 ? "-100%" : "100%", opacity: 0.6 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_e, info) => {
                      if (info.offset.x < -40) goToNextSlide();
                      else if (info.offset.x > 40) goToPrevSlide();
                    }}
                    className="absolute inset-0 w-full h-full object-cover cursor-grab active:cursor-grabbing"
                  />
                </AnimatePresence>

                {/* Left / Right Slider Buttons */}
                <button
                  type="button"
                  onClick={goToPrevSlide}
                  aria-label="Previous farm image"
                  className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/25 backdrop-blur-sm flex items-center justify-center transition-all shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  aria-label="Next farm image"
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/55 hover:bg-black/80 text-white border border-white/25 backdrop-blur-sm flex items-center justify-center transition-all shadow-md"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Bottom Slider Dots Indicator */}
                <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/15">
                  {storyFarmSlides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      aria-label={`Show farm image ${idx + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        currentFarmSlide === idx
                          ? "w-6 bg-gold shadow-sm"
                          : "w-2 bg-white/65 hover:bg-white"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-display text-xl sm:text-3xl md:text-4xl font-bold text-foreground mt-1 sm:mt-2 mb-3 sm:mb-6">{t("about.storyTitle")}</h2>
              <p className="font-sans text-muted-foreground leading-relaxed text-sm sm:text-lg">
                {t("about.storyDesc")}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-8 mt-5 sm:mt-8 bg-background/70 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-border/50 sm:border-0">
                <div className="text-center">
                  <p className="font-display text-xl sm:text-3xl font-bold text-primary">25+</p>
                  <p className="font-sans text-[11px] sm:text-sm text-muted-foreground">{t("trust.stat1")}</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl sm:text-3xl font-bold text-primary">2000+</p>
                  <p className="font-sans text-[11px] sm:text-sm text-muted-foreground">{t("trust.stat4")}</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl sm:text-3xl font-bold text-primary">10+</p>
                  <p className="font-sans text-[11px] sm:text-sm text-muted-foreground">{t("trust.stat2")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Owner Section */}
      <section className="py-10 sm:py-14 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-10"
          >
            <span className="font-sans text-gold font-semibold tracking-widest uppercase text-sm mb-3 block">
              {t("about.ownerSubtitle")}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
              {t("about.ownerTitle")}
            </h2>
            <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-br from-primary/20 to-gold/20 rounded-xl sm:rounded-2xl rotate-3" />
                <img
                  src={founderPhoto}
                  alt="Akil Bhai - Founder"
                  className="relative rounded-xl sm:rounded-2xl shadow-xl w-56 h-64 sm:w-72 sm:h-80 object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("about.ownerName")}
              </h3>
              <p className="font-sans text-gold font-semibold mb-3 sm:mb-4">{t("about.ownerRole")}</p>
              <p className="font-sans text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                {t("about.ownerDesc")}
              </p>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">{t("about.ownerAchieve1")}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">{t("about.ownerAchieve2")}</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">{t("about.ownerAchieve3")}</span>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2">
                {t("about.coFounderName")}
              </h3>
              <p className="font-sans text-gold font-semibold mb-3 sm:mb-4">{t("about.coFounderRole")}</p>
              <p className="font-sans text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                {t("about.coFounderDesc")}
              </p>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">Field operations & farm management</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">Customer experience from inquiry to delivery</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <span className="font-sans text-foreground text-sm sm:text-base">Supporting premium buffalo farming across Maharashtra</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2 flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-br from-gold/20 to-primary/20 rounded-xl sm:rounded-2xl -rotate-3" />
                <img
                  src={coFounderPhoto}
                  alt="Salim Bhai - Co-Founder"
                  className="relative rounded-xl sm:rounded-2xl shadow-xl w-56 h-64 sm:w-72 sm:h-80 object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-10 sm:py-14 bg-cream">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-14"
          >
            <span className="font-sans text-gold font-semibold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
              {t("about.valuesSubtitle")}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">{t("about.valuesTitle")}</h2>
            <div className="w-16 h-1 bg-gold mx-auto rounded-full" />
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-background border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-5 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <v.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-display text-sm sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">{v.title}</h3>
                <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;

