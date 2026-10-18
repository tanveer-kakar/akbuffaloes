import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useLanguage, languageNames, type Language } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";

const languages: Language[] = ["en", "hi", "mr"];

const LanguageSwitcher = ({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) => {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (variant === "mobile") {
    return (
      <div className="px-4 py-2">
        <p className="font-sans text-xs text-primary-foreground/50 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Language
        </p>
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`font-sans text-sm px-3 py-1.5 rounded-md transition-colors ${
                language === lang
                  ? "bg-gold text-green-dark font-semibold"
                  : "text-primary-foreground/70 hover:bg-green-medium"
              }`}
            >
              {languageNames[lang]}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-primary-foreground/80 hover:text-gold transition-colors font-sans text-sm"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="font-medium text-xs uppercase">{language}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 bg-background border border-border rounded-lg shadow-lg overflow-hidden z-50 min-w-[140px]"
          >
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => { setLanguage(lang); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 font-sans text-sm transition-colors ${
                  language === lang
                    ? "bg-gold/10 text-gold font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;
