import { motion } from "framer-motion";
import { Shield, Award, Droplets, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TrustSection = () => {
  const { t } = useLanguage();

  const stats = [
    { icon: Shield, label: t("trust.stat1"), value: "25+", color: "from-primary/20 to-primary/5" },
    { icon: Award, label: t("trust.stat2"), value: "10+", color: "from-primary/20 to-primary/5" },
    { icon: Droplets, label: t("trust.stat3"), value: "5000+", color: "from-primary/20 to-primary/5" },
    { icon: Heart, label: t("trust.stat4"), value: "2000+", color: "from-primary/20 to-primary/5" },
  ];

  return (
    <section className="py-10 sm:py-16 bg-cream relative overflow-hidden">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.08), transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--gold) / 0.08), transparent 50%)" }} />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <span className="inline-block font-sans text-gold font-semibold tracking-widest uppercase mb-2 sm:mb-3 text-xs sm:text-sm">
            {t("trust.subtitle")}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            {t("trust.title")}
          </h2>
          <div className="w-14 sm:w-20 h-1 bg-gold mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, type: "spring" }}
              className="group bg-background rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50"
            >
              <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <p className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-primary mb-1 sm:mb-2">{stat.value}</p>
              <p className="font-sans text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
