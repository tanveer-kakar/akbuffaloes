import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const ScrollNavigation = () => {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(true);
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      // Show "go upper" if scrolled down more than 150px
      setShowTop(scrollTop > 150);

      // Show "go down" if not at the bottom (margin of 150px)
      setShowBottom(scrollTop + clientHeight < scrollHeight - 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className={`fixed ${
        isDashboard ? "bottom-[11rem] sm:bottom-[8.5rem]" : "bottom-[6.75rem] sm:bottom-[8.5rem]"
      } right-3 sm:right-6 z-40 flex flex-col items-center gap-1.5 sm:gap-2 select-none`}
      role="navigation"
      aria-label="Page scroll navigation"
    >
      {/* Go Upper Arrow */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            key="scroll-top"
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-dark/95 backdrop-blur-md border-2 border-gold/70 text-gold hover:bg-gold hover:text-green-dark shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Go Upper (Scroll to Top)"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:-translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Go Down Arrow */}
      <AnimatePresence>
        {showBottom && (
          <motion.button
            key="scroll-bottom"
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -10 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToBottom}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-dark/95 backdrop-blur-md border-2 border-gold/70 text-gold hover:bg-gold hover:text-green-dark shadow-[0_4px_16px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.6)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
            title="Go Down (Scroll to Bottom)"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-y-0.5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrollNavigation;
