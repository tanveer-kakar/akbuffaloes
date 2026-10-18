import { motion } from "framer-motion";

interface BuffaloLoaderProps {
  message?: string;
  isFullPage?: boolean;
}

export const BuffaloSvgIcon = ({ className = "w-24 h-24" }: { className?: string }) => (
  <img
    src="/ak-buffalo-logo-emblem.png"
    alt="AK Buffaloes Logo"
    className={`${className} object-contain rounded-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]`}
  />
);

const BuffaloLoader = ({
  message = "Loading AK Buffaloes...",
  isFullPage = true,
}: BuffaloLoaderProps) => {
  const containerClasses = isFullPage
    ? "fixed inset-0 z-[9999] bg-[#0c1a0e] flex flex-col items-center justify-center p-4 select-none overflow-hidden"
    : "w-full min-h-[380px] py-12 flex flex-col items-center justify-center p-4 select-none";

  const cardClasses = isFullPage
    ? "relative z-10 flex flex-col items-center text-center max-w-sm mx-auto"
    : "relative z-10 flex flex-col items-center text-center max-w-sm mx-auto bg-[#0c1a0e] border border-gold/40 rounded-2xl p-6 sm:p-8 shadow-2xl overflow-hidden";

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      {/* Background ambient gold & green glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gold/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-green-medium/20 blur-2xl pointer-events-none" />
      </div>

      <div className={cardClasses}>
        {/* Animated Emblem Wrapper */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center mb-6">
          {/* Outer rotating dashed ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-dashed border-gold/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />

          {/* Middle counter-rotating ring */}
          <motion.div
            className="absolute inset-2 rounded-full border border-gold/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
          />

          {/* Soft inner glow ring */}
          <motion.div
            className="absolute inset-4 rounded-full bg-gradient-to-br from-gold/15 to-green-medium/30 border border-gold/50 shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            animate={{ scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Official Logo Emblem */}
          <motion.div
            className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center drop-shadow-[0_8px_20px_rgba(0,0,0,0.7)]"
            animate={{
              y: [0, -4, 0],
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="/ak-buffalo-logo-emblem.png"
              alt="AK Buffaloes Official Logo"
              className="w-full h-full object-contain rounded-full shadow-md"
            />
          </motion.div>
        </div>

        {/* Brand Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="h-px w-6 bg-gradient-to-r from-transparent to-gold" />
            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF3C4] via-gold to-[#D4AF37] uppercase">
              AK Buffaloes
            </h2>
            <span className="h-px w-6 bg-gradient-to-l from-transparent to-gold" />
          </div>

          <p className="font-sans text-xs tracking-widest uppercase text-white/70 mb-4 font-medium">
            Premium Dairy Farm & Breeds
          </p>
        </motion.div>

        {/* Animated Progress Bar */}
        <div className="w-48 sm:w-56 h-1.5 bg-black/40 rounded-full overflow-hidden border border-gold/30 shadow-inner mb-3 relative">
          <motion.div
            className="h-full bg-gradient-to-r from-green-medium via-gold to-[#FFF3C4] rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "60%" }}
          />
        </div>

        {/* Message with Animated Dots */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-sans text-gold-light/90">
          <span>{message}</span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1] }}
          >
            •
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1], delay: 0.2 }}
          >
            •
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, times: [0, 0.5, 1], delay: 0.4 }}
          >
            •
          </motion.span>
        </div>
      </div>
    </div>
  );
};

export default BuffaloLoader;
