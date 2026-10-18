import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  PhoneCall,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  askAiAssistant,
  initialSuggestions,
  type ChatMessage,
} from "@/lib/aiAssistant";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AiAssistantVoiceMode } from "./AiAssistantVoiceMode";
import { speechRecognizer, speechPlayer } from "@/lib/voiceCommunication";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-1",
  sender: "assistant",
  text: `Hello! 👋 Welcome to **AK Buffaloes**. 

I am your **AI Farm Assistant** (Hindi • Marathi • Indian English • US English). I can help you with:
• **5 Purebred Breeds & Prices** (Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana)
• **Gallery (18+ Photos & 26+ Videos) & Instagram (@ak_buffaloes)**
• **Pachora Farm Address & Google Map**
• **Account Registration, Email OTP & Password Reset**
• **User Dashboard, Inquiries & Pan-India Transport**

Ask me anything or tap **📞 Voice Call** to talk directly!`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  quickActions: [
    { label: "View All Breeds 🐃", url: "/buffaloes" },
    { label: "Open Gallery 🎬", url: "/gallery" },
    { label: "Contact & Map 📍", url: "/contact" },
  ],
};

const AiAssistantChat = () => {
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const defaultVoiceLang = language === "mr" ? "mr-IN" : language === "hi" ? "hi-IN" : "en-IN";
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const [isListeningInput, setIsListeningInput] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Stop voice and speech when chat is closed
  useEffect(() => {
    if (!isOpen) {
      setIsVoiceModeOpen(false);
      setIsListeningInput(false);
      speechRecognizer.stopListening();
      speechPlayer.stop();
      setSpeakingMessageId(null);
    }
  }, [isOpen]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  // Hide floating tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const getInitialWelcome = useCallback((): ChatMessage => {
    if (user) {
      const name = user.user_metadata?.full_name || (isAdmin ? "Administrator" : "Farmer");
      return {
        id: "welcome-auth",
        sender: "assistant",
        text: `Hello, **${name}**! 👋 Welcome back to **AK Buffaloes**. 

I am your **AI Farm Assistant** connected to your profile (${user.email}). I can help you in **Hindi, Marathi, Indian English, or US English**:
• **Your Inquiries & Live Deals** (Track status & delivery stages)
• **Breeds & Milk Yields** (Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana)
• **Gallery, Instagram (@ak_buffaloes) & Google Map**
• **Open Any Website Page via Voice or Chat**

How can I assist you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: [
          { label: "My User Dashboard", url: "/dashboard" },
          { label: "Browse Buffaloes", url: "/buffaloes" },
          { label: "Contact & Map 📍", url: "/contact" },
        ],
      };
    }
    return WELCOME_MESSAGE;
  }, [user, isAdmin]);

  useEffect(() => {
    if (user) {
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome-1") {
          return [getInitialWelcome()];
        }
        return prev;
      });
    }
  }, [user, getInitialWelcome]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const userContext = {
      isLoggedIn: !!user,
      userName: user?.user_metadata?.full_name || (isAdmin ? "Administrator" : "Farmer"),
      userEmail: user?.email,
      role: isAdmin ? "admin" : user ? "user" : "guest",
      language: defaultVoiceLang,
    };

    try {
      const response = await askAiAssistant(query, userContext);
      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        sender: "assistant",
        text: response.text,
        voiceText: response.voiceText,
        navigateTo: response.navigateTo,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: response.quickActions,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.navigateTo) {
        navigate(response.navigateTo);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: "a-" + Date.now(),
        sender: "assistant",
        text: "I am having trouble reaching the server right now, but feel free to call us at **+91-9022273915** or chat with our team on WhatsApp for immediate help!",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: [{ label: "Chat on WhatsApp", url: "https://wa.me/919022273915" }],
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    speechPlayer.stop();
    setSpeakingMessageId(null);
    setMessages([getInitialWelcome()]);
  };

  const handleSendVoice = async (
    queryText: string,
    voiceLang?: string
  ): Promise<{ text: string; voiceText?: string; navigateTo?: string }> => {
    const query = queryText.trim();
    if (!query) return { text: "" };

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);

    const selectedLanguageCode = voiceLang || defaultVoiceLang;

    const userContext = {
      isLoggedIn: !!user,
      userName: user?.user_metadata?.full_name || (isAdmin ? "Administrator" : "Farmer"),
      userEmail: user?.email,
      role: isAdmin ? "admin" : user ? "user" : "guest",
      language: selectedLanguageCode,
      isVoiceCall: true,
    };

    try {
      const response = await askAiAssistant(query, userContext);
      const assistantMsg: ChatMessage = {
        id: "a-" + Date.now(),
        sender: "assistant",
        text: response.text,
        voiceText: response.voiceText,
        navigateTo: response.navigateTo,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: response.quickActions,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (response.navigateTo) {
        navigate(response.navigateTo);
      }

      return {
        text: response.text,
        voiceText: response.voiceText,
        navigateTo: response.navigateTo,
      };
    } catch {
      const fallback = selectedLanguageCode.startsWith("mr")
        ? "सध्या सर्व्हरशी संपर्क होत नाही आहे, परंतु थेट मदतीसाठी आपण +91-9022273915 वर कॉल करू शकता."
        : selectedLanguageCode.startsWith("hi")
        ? "अभी सर्वर से जुड़ने में समस्या आ रही है, तुरंत सहायता के लिए 9022273915 पर कॉल या व्हाट्सऐप करें।"
        : "I am having trouble reaching the server right now. Please call us at 9022273915 for immediate assistance.";
      const errorMsg: ChatMessage = {
        id: "a-" + Date.now(),
        sender: "assistant",
        text: fallback,
        voiceText: fallback,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        quickActions: [{ label: "Chat on WhatsApp", url: "https://wa.me/919022273915" }],
      };
      setMessages((prev) => [...prev, errorMsg]);
      return { text: fallback, voiceText: fallback };
    }
  };

  const toggleInputSpeechRecognition = () => {
    if (isListeningInput) {
      speechRecognizer.stopListening();
      setIsListeningInput(false);
      return;
    }

    setIsListeningInput(true);
    speechRecognizer.setLanguage(defaultVoiceLang);
    speechRecognizer.startListening({
      onStart: () => setIsListeningInput(true),
      onInterimResult: (interim) => {
        setInput(interim);
      },
      onFinalResult: (finalText) => {
        setInput(finalText);
        setIsListeningInput(false);
      },
      onError: (err) => {
        console.warn("Input mic error:", err);
        setIsListeningInput(false);
      },
      onEnd: () => {
        setIsListeningInput(false);
      },
    });
  };

  const toggleSpeakMessage = (msgId: string, text: string, voiceText?: string) => {
    if (speakingMessageId === msgId) {
      speechPlayer.stop();
      setSpeakingMessageId(null);
      return;
    }

    speechPlayer.stop();
    setSpeakingMessageId(msgId);
    speechPlayer.speak(voiceText || text, {
      lang: defaultVoiceLang,
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  const formatMessageText = (content: string) => {
    return content.split("\n").map((line, idx) => {
      const tokens = line.split(/(\[.*?\]\(.*?\)|\*\*.*?\*\*)/g);
      const renderedLine = tokens.map((token, tIdx) => {
        if (token.startsWith("**") && token.endsWith("**")) {
          return (
            <strong key={tIdx} className="font-semibold text-foreground">
              {token.slice(2, -2)}
            </strong>
          );
        }
        const linkMatch = token.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          const [, label, href] = linkMatch;
          const isExternal =
            href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:");
          if (isExternal) {
            return (
              <a
                key={tIdx}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="text-primary underline font-medium hover:text-gold transition-colors inline-flex items-center gap-0.5"
              >
                {label}
              </a>
            );
          }
          return (
            <Link
              key={tIdx}
              to={href}
              onClick={() => setIsOpen(false)}
              className="text-primary underline font-medium hover:text-gold transition-colors"
            >
              {label}
            </Link>
          );
        }
        return token;
      });

      return (
        <span key={idx} className="block min-h-[1.2em]">
          {renderedLine}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Circular AI Button */}
      <div
        className={`fixed ${
          isDashboard ? "bottom-[8rem] sm:bottom-[5rem]" : "bottom-[3.85rem] sm:bottom-[5rem]"
        } right-3 sm:right-6 z-50 flex items-center`}
      >
        <AnimatePresence>
          {showTooltip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="mr-3 hidden sm:flex items-center gap-2 bg-[#0c1a0e] text-gold-light border border-gold/40 px-3 py-1.5 rounded-full shadow-xl text-xs font-medium cursor-pointer"
              onClick={() => setIsOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-gold animate-spin-slow" />
              <span>Ask AI Farm Assistant</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(false);
                }}
                className="text-white/50 hover:text-white ml-1"
                aria-label="Dismiss"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Circular Action Button */}
        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative group ${
            isOpen
              ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/30"
              : "bg-gradient-to-br from-green-dark via-[#163316] to-[#0c1a0e] border-2 border-gold/80 text-gold shadow-[0_4px_22px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_28px_rgba(212,175,55,0.65)] hover:scale-110 active:scale-95"
          }`}
          aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          title={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
          whileTap={{ scale: 0.92 }}
        >
          {isOpen ? (
            <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-90 duration-200" />
          ) : (
            <div className="relative w-full h-full p-1.5 sm:p-2 flex items-center justify-center">
              <img
                src="/ak-buffalo-logo-emblem.png"
                alt="AK Buffalo AI Assistant"
                className="w-full h-full object-contain rounded-full transition-transform group-hover:scale-105"
              />
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#FFE082] absolute top-0.5 right-0.5 animate-pulse drop-shadow" />
            </div>
          )}

          {!isOpen && (
            <span className="absolute -top-1 -right-1 bg-gold text-green-dark text-[8px] sm:text-[9px] font-extrabold px-1 sm:px-1.5 py-0.2 rounded-full shadow border border-background leading-tight">
              AI
            </span>
          )}

          {!isOpen && (
            <span className="absolute bottom-0.5 right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
          )}
        </motion.button>
      </div>

      {/* AI Chat Window Panel: Compact small size on mobile phones, standard size on desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={`fixed ${
              isDashboard ? "bottom-[10.8rem] sm:bottom-24" : "bottom-[6.5rem] sm:bottom-24"
            } right-2.5 sm:right-6 left-auto z-50 w-[290px] xs:w-[310px] sm:w-[395px] md:w-[425px] h-[380px] xs:h-[400px] sm:h-[530px] max-h-[60dvh] sm:max-h-[75vh] bg-background border-2 border-gold/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-dark via-[#132c13] to-green-dark text-white p-2.5 sm:p-3.5 flex items-center justify-between border-b border-gold/30 gap-2">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 border-2 border-gold/60 flex items-center justify-center relative overflow-hidden p-0.5 shadow-md shrink-0">
                  <img
                    src="/ak-buffalo-logo-emblem.png"
                    alt="AK Buffalo AI"
                    className="w-full h-full object-contain rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-400 rounded-full border border-black animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <h3 className="font-display text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                      AK Buffalo AI
                    </h3>
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold shrink-0" />
                  </div>
                  <p className="font-sans text-[9px] sm:text-[11px] text-gold-light/90 flex items-center gap-1 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
                    <span className="truncate">HI • MR • EN Voice &amp; Chat</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* Call-Style Voice Mode Button */}
                <button
                  onClick={() => setIsVoiceModeOpen(true)}
                  className="px-2 py-1 text-[10px] sm:text-xs bg-gold/20 hover:bg-gold/30 border border-gold/50 text-[#FFE082] hover:text-white rounded-lg transition-all flex items-center gap-1 shadow-sm font-semibold active:scale-95"
                  title="Start 2-Way Voice Call (कॉल पर बात करें)"
                  aria-label="Start Voice Call"
                >
                  <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold animate-pulse" />
                  <span>📞 Call</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-1 sm:p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset conversation"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 sm:p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Close chat"
                  aria-label="Close chat"
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Call-Style Voice Communication Overlay */}
            <AiAssistantVoiceMode
              isOpen={isVoiceModeOpen}
              onClose={() => setIsVoiceModeOpen(false)}
              onSendVoiceQuery={handleSendVoice}
              userName={user?.user_metadata?.full_name || (isAdmin ? "Administrator" : "Farmer")}
              isLoggedIn={!!user}
              defaultLanguage={defaultVoiceLang}
            />

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 space-y-2.5 sm:space-y-3 bg-cream/40 dark:bg-stone-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-end gap-1.5 sm:gap-2 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "assistant" && (
                    <img
                      src="/ak-buffalo-logo-emblem.png"
                      alt="AK Buffalo AI"
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-contain border border-gold/40 shrink-0 mb-3 bg-black/40 shadow-sm"
                    />
                  )}
                  <div
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    } max-w-[87%]`}
                  >
                    <div
                      className={`rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm font-sans ${
                        msg.sender === "user"
                          ? "bg-green-dark text-white rounded-br-xs"
                          : "bg-background border border-border text-foreground rounded-bl-xs shadow"
                      }`}
                    >
                      <div className="space-y-0.5 sm:space-y-1">{formatMessageText(msg.text)}</div>

                      {/* Quick action buttons */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div className="mt-2 sm:mt-2.5 pt-2 border-t border-border/70 flex flex-wrap gap-1">
                          {msg.quickActions.map((qa, i) => (
                            <div key={i}>
                              {qa.url?.startsWith("http") || qa.url?.startsWith("tel:") ? (
                                <a
                                  href={qa.url}
                                  target={qa.url.startsWith("http") ? "_blank" : undefined}
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gold/15 text-gold-dark dark:text-gold hover:bg-gold/25 rounded-md font-medium transition-colors border border-gold/30"
                                >
                                  {qa.label}
                                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </a>
                              ) : (
                                <Link
                                  to={qa.url || "#"}
                                  onClick={() => setIsOpen(false)}
                                  className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 bg-gold/15 text-gold-dark dark:text-gold hover:bg-gold/25 rounded-md font-medium transition-colors border border-gold/30"
                                >
                                  {qa.label}
                                  →
                                </Link>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between w-full mt-0.5 px-1 gap-2">
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">
                        {msg.timestamp}
                      </span>
                      {msg.sender === "assistant" && (
                        <button
                          type="button"
                          onClick={() => toggleSpeakMessage(msg.id, msg.text, msg.voiceText)}
                          className="text-[10px] sm:text-[11px] text-muted-foreground hover:text-gold flex items-center gap-1 transition-colors"
                          title={
                            speakingMessageId === msg.id
                              ? "Stop voice audio"
                              : "Listen to answer aloud (आवाज में सुनें)"
                          }
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 animate-pulse" />
                              <span className="text-[9px] sm:text-[10px] text-red-500 font-semibold">
                                Stop
                              </span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold" />
                              <span className="text-[9px] sm:text-[10px] text-foreground/80">
                                Listen
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] sm:text-xs p-2 bg-background border border-border rounded-xl w-fit">
                  <img
                    src="/ak-buffalo-logo-emblem.png"
                    alt="AK Buffalo"
                    className="w-4 h-4 rounded-full object-contain animate-bounce shrink-0"
                  />
                  <span>AI Assistant is typing</span>
                  <span className="flex gap-1">
                    <span
                      className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-gold rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-background border-t border-border overflow-x-auto no-scrollbar flex gap-1.5 shrink-0">
              <button
                onClick={() => setIsVoiceModeOpen(true)}
                className="text-[10px] sm:text-xs whitespace-nowrap bg-gold/20 hover:bg-gold/30 text-gold-dark dark:text-gold border border-gold/50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition-all shrink-0 flex items-center gap-1 font-semibold active:scale-95 shadow-sm"
              >
                <PhoneCall className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold animate-pulse" />
                <span>📞 Voice Call</span>
              </button>

              {initialSuggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(sug)}
                  disabled={isTyping}
                  className="text-[10px] sm:text-xs whitespace-nowrap bg-muted/60 hover:bg-gold/20 text-foreground hover:text-gold-dark border border-border/80 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full transition-colors shrink-0 disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2 sm:p-2.5 bg-background border-t border-border flex items-center gap-1.5 sm:gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in Hindi, Marathi or English..."
                className="flex-1 min-w-0 bg-muted/40 border border-border focus:border-gold rounded-xl px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs sm:text-sm outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                disabled={isTyping || isListeningInput}
              />
              {/* Quick Microphone Button */}
              <button
                type="button"
                onClick={toggleInputSpeechRecognition}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                  isListeningInput
                    ? "bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/30"
                    : "bg-muted hover:bg-gold/20 border-border hover:border-gold/50 text-foreground hover:text-gold"
                }`}
                title={isListeningInput ? "Stop microphone" : "Speak question (माइक)"}
                aria-label="Voice input"
              >
                <Mic className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isListeningInput ? "animate-bounce" : ""}`} />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gold hover:bg-gold-light text-green-dark flex items-center justify-center font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                aria-label="Send query"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiAssistantChat;
