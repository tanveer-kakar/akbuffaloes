import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { backend } from "@/lib/backendClient";
import { Send, Phone, Mail, User, LogIn } from "lucide-react";
import { consultationSchema, getValidationErrors, type ValidationErrors } from "@/lib/validation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const ConsultationForm = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.user_metadata?.full_name || "", phone: user.user_metadata?.phone || "", email: user.email || "" });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});
    const result = consultationSchema.safeParse(form);
    if (!result.success) {
      setErrors(getValidationErrors(result.error));
      return;
    }
    setLoading(true);
    const record = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      user_id: user.id,
      status: "pending",
    };
    const { error } = await backend.from("consultation_requests").insert(record).select().single();
    if (error) {
      setLoading(false);
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }
    setLoading(false);
    toast({ title: t("consult.success"), description: "Your request is pending. Confirmation has been emailed to you." });
    setForm({ name: "", phone: "", email: "" });
  };

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-destructive text-xs font-sans mt-0.5">{msg}</p> : null;

  return (
    <section className="py-10 sm:py-16 section-gradient relative overflow-hidden">
      <div className="absolute top-10 right-10 w-40 h-40 border border-primary-foreground/10 rounded-full hidden sm:block" />
      <div className="absolute bottom-10 left-10 w-60 h-60 border border-primary-foreground/5 rounded-full hidden sm:block" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-6 sm:mb-10"
          >
            <span className="inline-block font-sans text-gold font-semibold tracking-widest uppercase mb-2 sm:mb-3 text-xs sm:text-sm">
              {t("consult.subtitle")}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground mb-2 sm:mb-3">
              {t("consult.title")}
            </h2>
            <div className="w-12 sm:w-16 h-1 bg-gold mx-auto rounded-full" />
          </motion.div>

          {!user ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-primary-foreground/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 border border-primary-foreground/10 text-center"
            >
              <LogIn className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-primary-foreground mb-2">Sign in to Book a Consultation</h3>
              <p className="font-sans text-primary-foreground/70 text-sm mb-6">
                Please sign in or create an account to schedule your consultation call with us.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/login">
                  <Button className="w-full sm:w-auto bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-sans font-semibold gap-2">
                    Create Account
                  </Button>
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-3 sm:space-y-4 bg-primary-foreground/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-5 sm:p-8 border border-primary-foreground/10"
            >
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <Input placeholder={t("consult.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 font-sans h-11 sm:h-12 pl-10 rounded-lg sm:rounded-xl text-sm sm:text-base" maxLength={100} />
                <ErrorText msg={errors.name} />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <Input placeholder={t("consult.phone")} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 font-sans h-11 sm:h-12 pl-10 rounded-lg sm:rounded-xl text-sm sm:text-base" maxLength={10} />
                <ErrorText msg={errors.phone} />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/40" />
                <Input placeholder={t("consult.email")} type="email" value={form.email} readOnly className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 font-sans h-11 sm:h-12 pl-10 rounded-lg sm:rounded-xl text-sm sm:text-base" maxLength={255} />
                <ErrorText msg={errors.email} />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold text-sm sm:text-base h-11 sm:h-12 gap-2 rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all">
                <Send className="w-4 h-4" />
                {loading ? t("consult.submitting") : t("consult.submit")}
              </Button>
            </motion.form>
          )}
        </div>
      </div>
    </section>
  );
};

export default ConsultationForm;
