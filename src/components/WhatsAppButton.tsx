import { useLocation } from "react-router-dom";
import WhatsAppIcon, { WHATSAPP_URL } from "@/components/WhatsAppIcon";

const WhatsAppButton = () => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed ${
        isDashboard ? "bottom-20 sm:bottom-6" : "bottom-3.5 sm:bottom-6"
      } right-3 sm:right-6 z-50 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shadow-[0_4px_16px_rgba(37,211,102,0.4)] hover:shadow-[0_6px_24px_rgba(37,211,102,0.6)] transition-all hover:scale-110 active:scale-95 animate-bounce-slow`}
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <WhatsAppIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    </a>
  );
};

export default WhatsAppButton;
