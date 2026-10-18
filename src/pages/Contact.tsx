import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/lib/backendClient";
import { Phone, Mail, MapPin, Send, LogIn, ExternalLink, Navigation, Instagram } from "lucide-react";
import galleryHerd from "@/assets/gallery/gallery-herd.jpg";
import { contactSchema, getValidationErrors, type ValidationErrors } from "@/lib/validation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { FARM_GOOGLE_MAPS_URL, FARM_GOOGLE_MAPS_EMBED_URL } from "@/components/Footer";
import { useFarmSettings } from "@/lib/farmSettings";
import { useUserPreferences } from "@/lib/userPreferences";

const Contact = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const farmSettings = useFarmSettings();
  const userPrefs = useUserPreferences();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      name: current.name || userPrefs.fullName || user.user_metadata?.full_name || "",
      phone: current.phone || userPrefs.whatsappNumber || user.user_metadata?.phone || "",
      email: user.email || "",
    }));
  }, [user, userPrefs.fullName, userPrefs.whatsappNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please register and sign in before sending us a message.",
        variant: "destructive",
      });
      return;
    }
    setErrors({});
    const result = contactSchema.safeParse(form);
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }
    setLoading(true);
    const { error } = await backend
      .from("contact_messages")
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim(),
        message: form.message.trim(),
        status: "pending",
      })
      .select()
      .single();
    setLoading(false);
    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      backend.functions.invoke("send-notification", {
        body: {
          type: "contact_submitted",
          record: {
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim(),
            message: form.message.trim(),
          },
        },
      });
      toast({
        title: t("contact.success"),
        description: "Your message is pending review. Confirmation has been emailed to you.",
      });
      setForm({ name: "", phone: "", email: "", message: "" });
    }
  };

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs font-sans mt-0.5">{msg}</p> : null;

  return (
    <main className="pt-14 sm:pt-16 md:pt-20 overflow-x-hidden">
      <section className="relative py-12 sm:py-16 md:py-20">
        <img
          src={galleryHerd}
          alt="Buffalo farm"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-sans text-gold font-semibold tracking-widest uppercase mb-1.5 sm:mb-2 text-xs sm:text-sm">
              {t("contact.subtitle")}
            </p>
            <h1 className="font-display text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-bold text-primary-foreground">
              {t("contact.title")}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-8 sm:py-12 md:py-14 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-10 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6 sm:space-y-8"
            >
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2.5 sm:mb-4">
                  {t("contact.getInTouch")}
                </h2>
                <p className="font-sans text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("contact.desc")}
                </p>
              </div>
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-foreground">
                      {t("contact.location")}
                    </h3>
                    <a
                      href={FARM_GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-sans text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors block"
                    >
                      {farmSettings.farmAddress}
                    </a>
                    <a
                      href={FARM_GOOGLE_MAPS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-xs font-sans font-semibold text-primary hover:text-gold transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-foreground">
                      {t("contact.phone")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                      <a
                        href={`tel:${(farmSettings.farmPhone || "+91-9022273915").replace(/[\s-]+/g, "")}`}
                        className="font-sans text-xs sm:text-sm font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {farmSettings.farmPhone || "+91-9022273915"}
                      </a>
                      <span className="text-muted-foreground/40">•</span>
                      <a
                        href={`https://wa.me/${(farmSettings.farmWhatsapp || "919022273915").replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-sans text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {farmSettings.farmWhatsapp || "+91-9022273915"} (WhatsApp)
                      </a>
                      <span className="text-muted-foreground/40">•</span>
                      <a
                        href={`tel:${(farmSettings.farmPhoneAlternate || "+91-7499553033").replace(/[\s-]+/g, "")}`}
                        className="font-sans text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
                        title="Alternate Helpline"
                      >
                        {farmSettings.farmPhoneAlternate || "+91-7499553033"}
                      </a>
                    </div>
                    {farmSettings.businessHours && (
                      <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-1">
                        {farmSettings.businessHours}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-foreground">
                      {t("contact.email")}
                    </h3>
                    <a
                      href={`mailto:${farmSettings.supportEmail}`}
                      className="font-sans text-xs sm:text-sm text-muted-foreground hover:text-primary break-all block"
                    >
                      {farmSettings.supportEmail}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-foreground">
                      Official Instagram
                    </h3>
                    <a
                      href="https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-sans text-xs sm:text-sm text-primary hover:text-gold font-semibold transition-colors"
                    >
                      <span>@ak_buffaloes</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              onSubmit={handleSubmit}
              className="space-y-3.5 sm:space-y-4 bg-card border border-border rounded-xl p-4 sm:p-6"
            >
              {!user && (
                <div className="rounded-md border border-gold/40 bg-gold/10 p-2.5 sm:p-3 text-xs sm:text-sm font-sans text-foreground">
                  Please{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    sign in
                  </Link>{" "}
                  or{" "}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    create an account
                  </Link>{" "}
                  to send a message.
                </div>
              )}
              <div>
                <Input
                  placeholder={t("contact.yourName")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="font-sans h-11 sm:h-12 text-sm"
                  maxLength={100}
                />
                <ErrorText msg={errors.name} />
              </div>
              <div>
                <Input
                  placeholder={t("contact.phoneNumber")}
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  className="font-sans h-11 sm:h-12 text-sm"
                  maxLength={10}
                />
                <ErrorText msg={errors.phone} />
              </div>
              <div>
                <Input
                  placeholder={t("contact.emailAddress")}
                  type="email"
                  value={form.email}
                  readOnly={!!user}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="font-sans h-11 sm:h-12 text-sm"
                  maxLength={255}
                />
                <ErrorText msg={errors.email} />
              </div>
              <div>
                <Textarea
                  placeholder={t("contact.yourMessage")}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="font-sans min-h-[100px] sm:min-h-[120px] text-sm"
                  maxLength={1000}
                />
                <ErrorText msg={errors.message} />
              </div>
              <Button
                type="submit"
                disabled={loading || !user}
                className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-sm sm:text-base h-11 sm:h-12 gap-2"
              >
                {user ? <Send className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                {loading ? t("contact.sending") : user ? t("contact.send") : "Sign in to Send"}
              </Button>
            </motion.form>
          </div>

          {/* Interactive Google Map Section */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-8 sm:mt-12 max-w-5xl mx-auto rounded-2xl overflow-hidden border-2 border-gold/40 bg-card shadow-xl"
          >
            <div className="bg-green-dark text-primary-foreground px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gold/30">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gold/20 border border-gold/50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-white">
                    AK Buffaloes Farm Location Map
                  </h3>
                  <p className="font-sans text-xs text-primary-foreground/75">
                    {farmSettings.farmAddress}
                  </p>
                </div>
              </div>
              <a
                href={FARM_GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-light text-green-dark font-sans font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-colors shadow shrink-0"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions on Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="w-full h-[260px] sm:h-[360px] md:h-[420px] bg-muted relative">
              <iframe
                title="AK Buffaloes Farm Location Map - Pachora, Jalgaon"
                src={FARM_GOOGLE_MAPS_EMBED_URL}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full block"
              />
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
};

export default Contact;
