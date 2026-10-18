import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Youtube, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import WhatsAppIcon, { WHATSAPP_URL } from "@/components/WhatsAppIcon";
import { FestivalSectionCard } from "@/components/FestivalThemeBanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useFarmSettings } from "@/lib/farmSettings";

export const FARM_GOOGLE_MAPS_URL = "https://maps.app.goo.gl/exQPMJMUVzwfWdqcA";
export const FARM_GOOGLE_MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=20.653921,75.425062&hl=en&z=16&output=embed";

const Footer = () => {
  const { t } = useLanguage();
  const farmSettings = useFarmSettings();
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(null);

  const linkItems = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.about"), path: "/about" },
    { label: t("nav.buffaloes") || "Buffaloes", path: "/buffaloes" },
    { label: t("nav.gallery"), path: "/gallery" },
    { label: t("nav.contact"), path: "/contact" },
    { label: "Admin Portal 🔒", path: "/admin" },
  ];

  return (
    <footer className="bg-green-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-6 md:py-10 pb-28 sm:pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-7">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link to="/" className="flex items-center gap-2.5 group">
                <img
                  src="/ak-buffalo-logo-emblem.png"
                  alt="AK Buffaloes"
                  className="h-12 w-12 rounded-full border-2 border-gold/60 shadow-md bg-black/40 p-0.5 group-hover:border-gold transition-colors object-contain"
                />
                <div>
                  <h3 className="font-display text-xl font-bold leading-tight">
                    <span className="text-gold">AK</span> Buffaloes
                  </h3>
                </div>
              </Link>
            </div>
            <p className="font-sans text-sm text-primary-foreground/70 leading-relaxed">
              {t("footer.desc")}
            </p>
          </div>

          {/* Column 2: Business Hours */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold mb-3">Business Hours</h4>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-primary-foreground/90 font-semibold text-sm">
                  Visiting & Milking Schedule
                </p>
                <p className="font-sans text-primary-foreground/70 text-sm">
                  {farmSettings.businessHours}
                </p>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold mb-3">
              {t("footer.quickLinks")}
            </h4>
            <div className="space-y-1.5 font-sans text-sm">
              {linkItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block text-primary-foreground/70 hover:text-gold transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="font-display text-base font-semibold text-gold mb-3">
              {t("footer.contactInfo")}
            </h4>
            <div className="space-y-2.5 font-sans text-primary-foreground/70 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <a
                  href={FARM_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  {farmSettings.farmAddress}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <a href={`tel:${(farmSettings.farmPhone || "+91-9022273915").replace(/[\s-]+/g, "")}`} className="hover:text-gold transition-colors font-semibold">
                  {farmSettings.farmPhone || "+91-9022273915"}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${(farmSettings.farmWhatsapp || "919022273915").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors text-emerald-400"
                >
                  {farmSettings.farmWhatsapp || "+91-9022273915"} (WhatsApp)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold/80 shrink-0" />
                <a href={`tel:${(farmSettings.farmPhoneAlternate || "+91-7499553033").replace(/[\s-]+/g, "")}`} className="hover:text-gold transition-colors">
                  {farmSettings.farmPhoneAlternate || "+91-7499553033"} (Helpline)
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <a
                  href={`mailto:${farmSettings.supportEmail}`}
                  className="hover:text-gold transition-colors break-all"
                >
                  {farmSettings.supportEmail}
                </a>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
                <a
                  href="https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
                  aria-label="Visit @ak_buffaloes on Instagram"
                  title="Follow @ak_buffaloes on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
                >
                  <Youtube className="w-4 h-4" />
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-gold hover:text-green-dark transition-colors"
                  aria-label="Chat with AK Buffaloes on WhatsApp"
                  title="WhatsApp"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 5: Interactive Farm Location Map */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-display text-base font-semibold text-gold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Farm Map</span>
              </h4>
              <a
                href={FARM_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-gold hover:text-gold-light underline"
              >
                <span>Open Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-xl overflow-hidden border-2 border-gold/40 shadow-lg bg-black/30">
              <iframe
                title="AK Buffaloes Farm Location - Pachora, Jalgaon"
                src={FARM_GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="155"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-[145px] sm:h-[155px] block"
              />
              <a
                href={FARM_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-gold/15 hover:bg-gold text-gold hover:text-green-dark font-sans text-xs font-semibold transition-colors border-t border-gold/30"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>Get Directions on Google Maps</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <FestivalSectionCard section="footer" />
        </div>

        <div className="border-t border-green-medium mt-4 pt-4 text-center font-sans text-xs text-primary-foreground/50 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            © {new Date().getFullYear()} AK Buffaloes. {t("footer.rights")}
          </span>
          <span className="text-primary-foreground/30">•</span>
          <button
            type="button"
            onClick={() => setLegalModal("privacy")}
            className="hover:text-gold transition-colors underline-offset-4 hover:underline"
          >
            {t("footer.privacyPolicy")}
          </button>
          <span className="text-primary-foreground/30">•</span>
          <button
            type="button"
            onClick={() => setLegalModal("terms")}
            className="hover:text-gold transition-colors underline-offset-4 hover:underline"
          >
            {t("footer.termsOfService")}
          </button>
        </div>
      </div>

      <Dialog open={legalModal !== null} onOpenChange={(open) => !open && setLegalModal(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              {legalModal === "privacy" ? t("footer.privacyPolicy") : t("footer.termsOfService")}
            </DialogTitle>
            <DialogDescription className="font-sans text-xs text-muted-foreground">
              AK Buffaloes Dairy Farm • Pachora, District Jalgaon, Maharashtra
            </DialogDescription>
          </DialogHeader>
          {legalModal === "privacy" ? (
            <div className="space-y-3 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">1. Information We Collect:</strong> When you submit a consultation request, buffalo purchase inquiry, or register an account on AK Buffaloes, we collect your name, phone number, email address, and inquiry details solely to assist you with buffalo selection and dairy consultation.
              </p>
              <p>
                <strong className="text-foreground">2. How We Use Your Data:</strong> Your contact details are used exclusively by the AK Buffaloes team to respond to your inquiries, schedule farm visits or live milking inspections, and provide updates on buffalo availability.
              </p>
              <p>
                <strong className="text-foreground">3. Data Protection:</strong> We never sell, rent, or share your personal information with third-party marketers. You can update or delete your account and inquiry data at any time from your Dashboard Settings.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-sans text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">1. Breed Listings & Availability:</strong> All buffalo breed profiles, milk yield ranges, and sample listings on AK Buffaloes are provided for informational and inquiry purposes. Final pricing and availability are confirmed during farm inspection or direct consultation.
              </p>
              <p>
                <strong className="text-foreground">2. Health & Milking Inspection:</strong> Customers are encouraged to visit our farm in Lohari Khurd, Tahsil Pachora, District Jalgaon (or request a live video inspection) to verify milk yield and veterinary health certificates prior to purchase.
              </p>
              <p>
                <strong className="text-foreground">3. Contact & Support:</strong> For any questions regarding bookings, transportation, or consultations, please reach us at +91-9022273915 or akbuffaloes540@gmail.com.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </footer>
  );
};

export default Footer;
