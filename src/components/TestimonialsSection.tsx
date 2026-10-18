import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const testimonials = [
  {
    name: "Nikhil Shelke - Bhaiya",
    feedback: "Best quality Murrah buffaloes I've ever purchased. The milk yield is exceptional and the team was very helpful throughout the process.",
    rating: 5,
  },
  {
    name: "Anna",
    feedback: "Professional service and top-notch buffalo breeds. The consultation helped me choose the right breed for my farm. Highly recommended!",
    rating: 4,
  },
  {
    name: "Sambha Appa",
    feedback: "We've been buying buffaloes from them for 5 years. Their breeds are healthy, strong, and give high-quality milk consistently.",
    rating: 5,
  },
  {
    name: "Rajesh",
    feedback: "Outstanding experience! The buffaloes are well-maintained and healthy. Their after-sale support is truly commendable.",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-10 sm:py-16 bg-background relative overflow-hidden">
      {/* Decorative elements - hidden on mobile */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2 hidden sm:block" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full translate-x-1/3 translate-y-1/3 hidden sm:block" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10"
        >
          <span className="inline-block font-sans text-gold font-semibold tracking-widest uppercase mb-2 sm:mb-3 text-xs sm:text-sm">
            {t("testimonials.subtitle")}
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            {t("testimonials.title")}
          </h2>
          <div className="w-14 sm:w-20 h-1 bg-gold mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative flex h-full min-h-[200px] sm:min-h-[290px] flex-col bg-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md border border-border hover:shadow-xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote icon */}
              <div className="absolute -top-2.5 right-3 sm:-top-3 sm:-right-3 w-8 h-8 sm:w-10 sm:h-10 bg-gold rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Quote className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-foreground" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-3 sm:mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${j < item.rating ? "text-gold fill-gold" : "text-muted"}`}
                  />
                ))}
              </div>

              {/* Feedback */}
              <p className="flex-1 font-sans text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-xs sm:text-sm italic">
                &ldquo;{item.feedback}&rdquo;
              </p>

              {/* Divider */}
              <div className="w-full h-px bg-border mb-3 sm:mb-4" />

              {/* Author */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-primary font-display font-bold text-sm sm:text-base shrink-0">
                  {item.name[0]}
                </div>
                <div>
                  <span className="font-sans font-semibold text-foreground text-xs sm:text-sm block">{item.name}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
