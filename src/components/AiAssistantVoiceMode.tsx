import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Square,
  Sparkles,
  MessageSquare,
  Volume2,
  VolumeX,
  AlertCircle,
  Globe,
  PhoneOff,
  PhoneCall,
} from "lucide-react";
import {
  speechRecognizer,
  speechPlayer,
  cleanTextForVoice,
  formatCallSpeechResponse,
  SUPPORTED_VOICE_LANGUAGES,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  type VoiceConversationState,
} from "@/lib/voiceCommunication";

interface VoiceQueryResult {
  text: string;
  voiceText?: string;
  navigateTo?: string;
}

interface AiAssistantVoiceModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSendVoiceQuery: (query: string, lang?: string) => Promise<string | VoiceQueryResult>;
  userName?: string;
  isLoggedIn?: boolean;
  defaultLanguage?: string;
}

export const AiAssistantVoiceMode = ({
  isOpen,
  onClose,
  onSendVoiceQuery,
  userName = "Farmer",
  isLoggedIn = false,
  defaultLanguage = "hi-IN",
}: AiAssistantVoiceModeProps) => {
  const [state, setState] = useState<VoiceConversationState>("idle");
  const [selectedLang, setSelectedLang] = useState<string>(defaultLanguage);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [lastUserSpeech, setLastUserSpeech] = useState("");
  const [lastAiResponse, setLastAiResponse] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  const mountedRef = useRef(true);
  const activeQueryRef = useRef(false);
  const greetingPlayedRef = useRef(false);
  const selectedLangRef = useRef(selectedLang);
  const isMutedRef = useRef(isMuted);
  const isOpenRef = useRef(isOpen);
  const startListeningTurnRef = useRef<() => void>(() => {});

  useEffect(() => {
    selectedLangRef.current = selectedLang;
    speechRecognizer.setLanguage(selectedLang);
  }, [selectedLang]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Real-time call duration timer
  useEffect(() => {
    if (!isOpen) {
      setCallSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    mountedRef.current = true;
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    if (!supported) {
      setErrorMessage(
        "Voice speech recognition requires Google Chrome, Edge, or Safari."
      );
    }
    return () => {
      mountedRef.current = false;
      speechRecognizer.stopListening();
      speechPlayer.stop();
    };
  }, []);

  // Clean stop on modal close
  useEffect(() => {
    if (!isOpen) {
      greetingPlayedRef.current = false;
      activeQueryRef.current = false;
      speechRecognizer.stopListening();
      speechPlayer.stop();
      setState("idle");
      setInterimTranscript("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  /**
   * Speak a text response in the given language and, once finished, wait 600ms acoustic cooldown
   * before opening microphone so AI never hears its own speaker output.
   */
  const speakResponseAndListen = useCallback(
    (replyText: string, langOverride?: string) => {
      if (!mountedRef.current || !isOpenRef.current) return;

      const targetLang = langOverride || selectedLangRef.current;

      // Always stop mic while AI is speaking
      speechRecognizer.stopListening();

      const cleanText = cleanTextForVoice(replyText, targetLang);
      setLastAiResponse(cleanText);

      if (isAudioMuted || !isSpeechSynthesisSupported()) {
        setState("idle");
        setTimeout(() => {
          if (mountedRef.current && isOpenRef.current && !speechPlayer.isSpeaking() && !isMutedRef.current) {
            startListeningTurnRef.current();
          }
        }, 400);
        return;
      }

      setState("speaking");

      speechPlayer.speak(cleanText, {
        lang: targetLang,
        rate: 1.0,
        onStart: () => {
          if (mountedRef.current) {
            speechRecognizer.stopListening();
            setState("speaking");
          }
        },
        onEnd: () => {
          // 600ms acoustic cooldown so speaker echo completely fades before mic opens
          setTimeout(() => {
            if (mountedRef.current && isOpenRef.current && !speechPlayer.isSpeaking() && !isMutedRef.current) {
              startListeningTurnRef.current();
            } else if (mountedRef.current) {
              setState("idle");
            }
          }, 600);
        },
        onError: () => {
          setTimeout(() => {
            if (mountedRef.current && isOpenRef.current && !speechPlayer.isSpeaking() && !isMutedRef.current) {
              startListeningTurnRef.current();
            } else if (mountedRef.current) {
              setState("idle");
            }
          }, 450);
        },
      });
    },
    [isAudioMuted]
  );

  /**
   * Process recognized user speech query through AI Assistant in the exact selected language
   */
  const handleProcessQuery = useCallback(
    async (queryText: string) => {
      const q = queryText.trim();
      if (!q || activeQueryRef.current) return;

      const currentLang = selectedLangRef.current;

      speechRecognizer.stopListening();
      activeQueryRef.current = true;
      setLastUserSpeech(q);
      setInterimTranscript("");
      setState("thinking");

      try {
        const result = await onSendVoiceQuery(q, currentLang);
        const replyText = typeof result === "string" ? result : result?.text || "";
        const preformattedVoice = typeof result === "object" ? result?.voiceText : undefined;

        if (replyText || preformattedVoice) {
          const callSpeech = formatCallSpeechResponse(
            q,
            replyText,
            currentLang,
            userName,
            preformattedVoice
          );
          speakResponseAndListen(callSpeech, currentLang);
        } else {
          setState("idle");
          setTimeout(() => {
            if (mountedRef.current && isOpenRef.current && !isMutedRef.current) {
              startListeningTurnRef.current();
            }
          }, 450);
        }
      } catch (err) {
        console.error("Voice call query failed:", err);
        setErrorMessage(
          currentLang.startsWith("mr")
            ? "आवाज समजण्यात अडचण आली. कृपया पुन्हा बोला."
            : currentLang.startsWith("hi")
            ? "आवाज समझने में समस्या आई। कृपया फिर से बोलें।"
            : "Could not process voice query. Please speak again."
        );
        setState("idle");
        setTimeout(() => {
          if (mountedRef.current && isOpenRef.current && !isMutedRef.current) {
            startListeningTurnRef.current();
          }
        }, 700);
      } finally {
        activeQueryRef.current = false;
      }
    },
    [onSendVoiceQuery, speakResponseAndListen, userName]
  );

  /**
   * Start turn of speech recognition with natural human pause detection (1.5s)
   */
  const startListeningTurn = useCallback(() => {
    if (
      !mountedRef.current ||
      !isOpenRef.current ||
      isMutedRef.current ||
      activeQueryRef.current ||
      speechPlayer.isSpeaking()
    ) {
      return;
    }

    setErrorMessage(null);
    setInterimTranscript("");
    speechRecognizer.setLanguage(selectedLangRef.current);

    const started = speechRecognizer.startListening({
      continuous: true,
      silenceTimeoutMs: 1500, // 1.5s natural conversational pause
      onStart: () => {
        if (mountedRef.current) {
          setState("listening");
        }
      },
      onInterimResult: (interim) => {
        if (mountedRef.current && !speechPlayer.isSpeaking()) {
          setInterimTranscript(interim);
        }
      },
      onFinalResult: (finalText) => {
        if (mountedRef.current && finalText && finalText.trim().length >= 2) {
          handleProcessQuery(finalText);
        }
      },
      onError: (err) => {
        if (!mountedRef.current) return;
        if (err === "no-speech" || err.includes("No speech")) {
          // Human is simply quiet on the line — stay patiently listening without talking to self!
          setState("idle");
          setTimeout(() => {
            if (
              mountedRef.current &&
              isOpenRef.current &&
              !isMutedRef.current &&
              !activeQueryRef.current &&
              !speechPlayer.isSpeaking()
            ) {
              startListeningTurnRef.current();
            }
          }, 350);
        } else {
          setErrorMessage(err);
          setState("error");
        }
      },
      onEnd: () => {
        if (!mountedRef.current) return;
        if (!activeQueryRef.current && !speechPlayer.isSpeaking()) {
          setState((prev) => (prev === "listening" ? "idle" : prev));
          // Keep phone call line open and listening if user hasn't muted
          setTimeout(() => {
            if (
              mountedRef.current &&
              isOpenRef.current &&
              !isMutedRef.current &&
              !activeQueryRef.current &&
              !speechPlayer.isSpeaking() &&
              !speechRecognizer.isCurrentlyListening()
            ) {
              startListeningTurnRef.current();
            }
          }, 400);
        }
      },
    });

    if (!started && isSpeechRecognitionSupported()) {
      setState("idle");
    }
  }, [handleProcessQuery]);

  useEffect(() => {
    startListeningTurnRef.current = startListeningTurn;
  }, [startListeningTurn]);

  /**
   * Handle live language change during an active phone call:
   * Immediately switches recognizer & voice to the chosen language (Hindi, Marathi, Indian English, or US English)
   * and confirms in that language!
   */
  const handleLanguageChange = (newLang: string) => {
    setSelectedLang(newLang);
    selectedLangRef.current = newLang;
    speechRecognizer.stopListening();
    speechPlayer.stop();
    speechRecognizer.setLanguage(newLang);
    setInterimTranscript("");
    setErrorMessage(null);

    let switchGreeting = "";
    if (newLang === "mr-IN") {
      switchGreeting = "होय, आता आपण मराठीत बोलूया. सांगा, तुम्हाला म्हशींबद्दल किंवा वेबसाईटबद्दल काय माहिती हवी आहे?";
    } else if (newLang === "hi-IN") {
      switchGreeting = "जी, अब हम हिन्दी में बात करेंगे। बताइए, आप भैंसों या वेबसाइट के बारे में क्या जानना चाहते हैं?";
    } else if (newLang === "en-IN") {
      switchGreeting = "Sure, we will now speak in Indian English. Please tell me, how can I help you today?";
    } else {
      switchGreeting = "Sure, I have switched to US English. Please tell me what you would like to know.";
    }

    speakResponseAndListen(switchGreeting, newLang);
  };

  /**
   * Initial voice welcome when user opens Voice Call (played ONCE per call session in the selected language)
   */
  useEffect(() => {
    if (!isOpen) {
      greetingPlayedRef.current = false;
      return;
    }

    if (greetingPlayedRef.current) return;
    greetingPlayedRef.current = true;

    const lang = selectedLangRef.current;
    let greeting = "";
    if (lang.startsWith("mr")) {
      greeting =
        isLoggedIn && userName && userName !== "Farmer" && userName !== "User"
          ? `नमस्कार ${userName} जी! मी एके बफेलोज़ फार्म सपोर्टवरून बोलत आहे. बोला, मी तुमची काय मदत करू शकतो?`
          : "नमस्कार! मी एके बफेलोज़ फार्म सपोर्टवरून बोलत आहे. बोला, तुम्हाला म्हशींच्या जाती, किंमत किंवा फार्मबद्दल काय विचारायचे आहे?";
    } else if (lang.startsWith("hi")) {
      greeting =
        isLoggedIn && userName && userName !== "Farmer" && userName !== "User"
          ? `नमस्ते ${userName} जी! मैं एके बफेलोज़ फार्म सपोर्ट से बोल रहा हूँ। बताइए, आज मैं आपकी क्या मदद कर सकता हूँ?`
          : "नमस्ते जी! मैं एके बफेलोज़ फार्म सपोर्ट से बोल रहा हूँ। बताइए, आप भैंसों की नस्ल, दूध या कीमत के बारे में क्या जानना चाहते हैं?";
    } else if (lang === "en-US") {
      greeting =
        isLoggedIn && userName && userName !== "Farmer" && userName !== "User"
          ? `Hello ${userName}! This is AK Buffaloes Farm support on the line. How can I help you today?`
          : "Hello! This is AK Buffaloes Farm support on the line. Ask me anything about our buffalo breeds, prices, or website.";
    } else {
      greeting =
        isLoggedIn && userName && userName !== "Farmer" && userName !== "User"
          ? `Namaste ${userName} ji! This is AK Buffaloes Farm support on the call. How can I assist you today?`
          : "Namaste! This is AK Buffaloes Farm support on the call. Please tell me what you would like to know about our buffaloes, prices, or farm.";
    }

    speakResponseAndListen(greeting, lang);
  }, [isOpen, isLoggedIn, userName, speakResponseAndListen]);

  /**
   * Interrupt AI speech immediately and listen to user (Barge-In)
   */
  const handleInterrupt = () => {
    speechPlayer.stop();
    setTimeout(() => {
      if (mountedRef.current && isOpenRef.current) {
        startListeningTurn();
      }
    }, 200);
  };

  /**
   * Toggle manual listening on/off or commit turn when user clicks 'Done Speaking'
   */
  const handleToggleMic = () => {
    if (state === "speaking") {
      handleInterrupt();
      return;
    }

    if (state === "listening") {
      const committed = speechRecognizer.commitTurn();
      if (!committed) {
        if (interimTranscript && interimTranscript.trim().length >= 2) {
          handleProcessQuery(interimTranscript);
        } else {
          speechRecognizer.stopListening();
          setState("idle");
        }
      }
    } else {
      startListeningTurn();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 z-40 bg-gradient-to-b from-[#0a1b0d] via-[#102414] to-[#08120a] text-white flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-56 h-56 sm:w-72 sm:h-72 bg-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-56 h-56 sm:w-72 sm:h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar: Compact on mobile, full on desktop */}
        <div className="relative z-10 flex items-center justify-between border-b border-gold/20 pb-2 sm:pb-3 gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-950/80 border-2 border-emerald-400 p-0.5 flex items-center justify-center relative shadow-md shrink-0">
              <img
                src="/ak-buffalo-logo-emblem.png"
                alt="AK Buffalo Farm"
                className="w-full h-full object-contain rounded-full"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="font-display text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  AK Farm Call
                </span>
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] bg-emerald-950/90 text-emerald-300 px-1.5 py-0.5 rounded font-mono font-semibold border border-emerald-500/50">
                  <PhoneCall className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                  {formatTimer(callSeconds)}
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-gold-light/90 truncate">
                {selectedLang === "mr-IN"
                  ? "मराठी कॉल सपोर्ट"
                  : selectedLang === "hi-IN"
                  ? "हिन्दी कॉल सपोर्ट"
                  : selectedLang === "en-US"
                  ? "US English Support"
                  : "Indian English Support"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* 4-Language Selector */}
            <div className="flex items-center gap-1 bg-black/50 border border-gold/40 rounded-lg px-1.5 py-1">
              <Globe className="w-3 h-3 text-gold shrink-0" />
              <select
                value={selectedLang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent text-[10px] sm:text-xs text-white font-semibold outline-none cursor-pointer max-w-[78px] sm:max-w-[125px]"
                title="Select Call Language (भाषा चुनें)"
              >
                {SUPPORTED_VOICE_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-stone-900 text-white">
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaker audio mute toggle */}
            <button
              onClick={() => {
                const next = !isAudioMuted;
                setIsAudioMuted(next);
                if (next) speechPlayer.stop();
              }}
              className="p-1 sm:p-1.5 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 border border-border/40 rounded-lg transition-colors"
              title={isAudioMuted ? "Unmute Speaker" : "Mute Speaker"}
            >
              {isAudioMuted ? (
                <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gold" />
              )}
            </button>

            {/* Switch back to text chat */}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 text-white/70 hover:text-white bg-black/30 hover:bg-black/60 border border-border/40 rounded-lg transition-colors flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2"
              title="Return to text chat"
            >
              <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden xs:inline">Chat</span>
            </button>
          </div>
        </div>

        {/* Quick 4-Language Pills Bar so user can tap any of the 4 languages with 1 click */}
        <div className="relative z-10 flex items-center justify-center gap-1 sm:gap-1.5 pt-1.5">
          {SUPPORTED_VOICE_LANGUAGES.map((langItem) => {
            const active = selectedLang === langItem.code;
            return (
              <button
                key={langItem.code}
                type="button"
                onClick={() => {
                  if (selectedLang !== langItem.code) {
                    handleLanguageChange(langItem.code);
                  }
                }}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[9px] sm:text-[11px] font-semibold transition-all border ${
                  active
                    ? "bg-gold text-green-dark border-gold shadow-sm scale-105"
                    : "bg-black/40 text-white/75 border-gold/25 hover:border-gold/60 hover:text-white"
                }`}
              >
                {langItem.flag} {langItem.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Center: Interactive Pulsing Voice Orb (Compact on mobile, large on desktop) */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-1 sm:py-3 my-auto min-h-0">
          <div className="relative w-24 h-24 sm:w-40 sm:h-40 flex items-center justify-center my-1 sm:my-2">
            {state === "listening" && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/50 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.55, 1], opacity: [0.4, 0.05, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.2, delay: 0.4, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full border border-gold/40 pointer-events-none"
                />
              </>
            )}

            {state === "speaking" && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.25, 1.05, 1.3, 1], rotate: [0, 90, 180, 270, 360] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "linear" }}
                  className="absolute -inset-2 sm:-inset-3 rounded-full border-2 border-dashed border-gold/60 pointer-events-none"
                />
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.15, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-gold/10 blur-xl pointer-events-none"
                />
              </>
            )}

            {state === "thinking" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute -inset-2 rounded-full border-2 border-t-gold border-r-emerald-400 border-b-transparent border-l-transparent pointer-events-none"
              />
            )}

            {/* Central Interactive Orb Sphere */}
            <motion.button
              onClick={handleToggleMic}
              whileTap={{ scale: 0.94 }}
              animate={
                state === "listening"
                  ? {
                      scale: [1, 1.06, 1],
                      boxShadow: [
                        "0 0 20px rgba(52,211,153,0.5)",
                        "0 0 38px rgba(212,175,55,0.7)",
                        "0 0 20px rgba(52,211,153,0.5)",
                      ],
                    }
                  : state === "speaking"
                  ? {
                      scale: [1, 1.09, 1],
                      boxShadow: [
                        "0 0 24px rgba(212,175,55,0.6)",
                        "0 0 45px rgba(212,175,55,0.85)",
                        "0 0 24px rgba(212,175,55,0.6)",
                      ],
                    }
                  : state === "thinking"
                  ? { scale: [0.98, 1.03, 0.98], boxShadow: "0 0 30px rgba(245,158,11,0.6)" }
                  : { scale: 1, boxShadow: "0 0 18px rgba(212,175,55,0.3)" }
              }
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className={`relative z-20 w-20 h-20 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center p-2 cursor-pointer transition-colors border-2 shadow-2xl ${
                state === "listening"
                  ? "bg-gradient-to-tr from-[#0f3818] via-[#1b5e20] to-[#123818] border-emerald-400 text-emerald-200"
                  : state === "speaking"
                  ? "bg-gradient-to-tr from-[#3a2e0a] via-[#5c4912] to-[#2b2106] border-gold text-gold-light"
                  : state === "thinking"
                  ? "bg-gradient-to-tr from-[#332205] via-[#4d3308] to-[#1f1503] border-amber-400 text-amber-200"
                  : "bg-gradient-to-tr from-[#122415] via-[#1b331f] to-[#0a160c] border-gold/60 text-white/90 hover:border-gold"
              }`}
            >
              {state === "listening" ? (
                <>
                  <Mic className="w-6 h-6 sm:w-9 sm:h-9 animate-pulse text-emerald-300 mb-0.5" />
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider text-emerald-300 uppercase">
                    {selectedLang.startsWith("mr")
                      ? "ऐकत आहे"
                      : selectedLang.startsWith("hi")
                      ? "सुन रहे हैं"
                      : "Listening"}
                  </span>
                </>
              ) : state === "speaking" ? (
                <>
                  <motion.div
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 0.6 }}
                    className="flex items-center gap-0.5 sm:gap-1 my-0.5"
                  >
                    <span className="w-1 h-3.5 sm:h-5 bg-gold rounded-full" />
                    <span className="w-1 h-5 sm:h-7 bg-gold rounded-full" />
                    <span className="w-1 h-4 sm:h-6 bg-gold rounded-full" />
                    <span className="w-1 h-6 sm:h-8 bg-gold rounded-full" />
                    <span className="w-1 h-3 sm:h-4 bg-gold rounded-full" />
                  </motion.div>
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider text-gold-light uppercase">
                    {selectedLang.startsWith("mr")
                      ? "बोलत आहे"
                      : selectedLang.startsWith("hi")
                      ? "बोल रहे हैं"
                      : "Speaking"}
                  </span>
                </>
              ) : state === "thinking" ? (
                <>
                  <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-amber-300 mb-0.5" />
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider text-amber-200 uppercase">
                    {selectedLang.startsWith("mr")
                      ? "थांबा..."
                      : selectedLang.startsWith("hi")
                      ? "रुकिए..."
                      : "Thinking"}
                  </span>
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6 sm:w-9 sm:h-9 text-gold mb-0.5" />
                  <span className="text-[8px] sm:text-[10px] font-bold tracking-wider text-gold-light uppercase">
                    {selectedLang.startsWith("mr")
                      ? "बोला"
                      : selectedLang.startsWith("hi")
                      ? "बोलिए"
                      : "Tap to Talk"}
                  </span>
                </>
              )}
            </motion.button>
          </div>

          {/* Live Conversation Transcript & Status */}
          <div className="text-center mt-1 sm:mt-2 px-2 sm:px-4 min-h-[48px] sm:min-h-[60px] flex flex-col items-center justify-center">
            {state === "listening" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] sm:text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    {selectedLang.startsWith("mr")
                      ? "आता बोला... मी ऐकत आहे"
                      : selectedLang.startsWith("hi")
                      ? "अब बोलिए... मैं ध्यान से सुन रहा हूँ"
                      : "Speak now... I am listening"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-white/90 italic max-w-[240px] sm:max-w-xs line-clamp-2">
                  {interimTranscript
                    ? `"${interimTranscript}"`
                    : selectedLang.startsWith("mr")
                    ? "उदा. मुर्रा म्हशीची किंमत किती आहे?"
                    : selectedLang.startsWith("hi")
                    ? "जैसे: मुर्रा भैंस की कीमत क्या है?"
                    : "e.g. What is the price of Murrah buffalo?"}
                </p>
              </motion.div>
            )}

            {state === "speaking" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-gold text-[11px] sm:text-xs font-semibold">
                  <Volume2 className="w-3.5 h-3.5 animate-bounce text-gold" />
                  <span>
                    {selectedLang.startsWith("mr")
                      ? "AK Buffalo Support उत्तर देत आहे..."
                      : selectedLang.startsWith("hi")
                      ? "AK Buffalo Support जवाब दे रहा है..."
                      : "AK Buffalo Support is replying..."}
                  </span>
                </div>
                {lastUserSpeech && (
                  <p className="text-[10px] text-emerald-300/85 max-w-[240px] sm:max-w-xs truncate">
                    {selectedLang.startsWith("mr")
                      ? "तुम्ही:"
                      : selectedLang.startsWith("hi")
                      ? "आप:"
                      : "You:"}{" "}
                    "{lastUserSpeech}"
                  </p>
                )}
                <p className="text-[11px] sm:text-xs text-white/90 line-clamp-2 max-w-[250px] sm:max-w-xs text-center">
                  {lastAiResponse}
                </p>
              </motion.div>
            )}

            {state === "thinking" && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-0.5"
              >
                <div className="flex items-center gap-1.5 text-amber-300 text-[11px] sm:text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {selectedLang.startsWith("mr")
                      ? "तुमच्या प्रश्नाचे उत्तर तयार करत आहे..."
                      : selectedLang.startsWith("hi")
                      ? "आपके सवाल का जवाब दे रहा हूँ..."
                      : "Preparing your answer..."}
                  </span>
                </div>
                {lastUserSpeech && (
                  <p className="text-[11px] text-white/80 italic max-w-[240px] sm:max-w-xs truncate">
                    "{lastUserSpeech}"
                  </p>
                )}
              </motion.div>
            )}

            {state === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[11px] sm:text-xs text-white/75 max-w-[240px] sm:max-w-xs text-center space-y-0.5"
              >
                <p className="font-semibold text-emerald-300">
                  {selectedLang.startsWith("mr")
                    ? "कॉल चालू आहे • बोलण्यासाठी माईक दाबा"
                    : selectedLang.startsWith("hi")
                    ? "कॉल चालू है • बोलने के लिए माइक दबाएं"
                    : "Call Active • Tap Mic to Speak"}
                </p>
              </motion.div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-red-300 bg-red-950/60 border border-red-800/60 px-2.5 py-1 rounded-lg mt-1 max-w-[250px] sm:max-w-xs">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="relative z-10 pt-2 sm:pt-3 border-t border-gold/20 flex items-center justify-between gap-2">
          {/* Mute Mic toggle */}
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              isMutedRef.current = next;
              if (next) {
                speechRecognizer.stopListening();
                setState("idle");
              } else {
                startListeningTurn();
              }
            }}
            className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
              isMuted
                ? "bg-red-950/60 border-red-700 text-red-400"
                : "bg-black/40 border-gold/30 text-white/80 hover:text-white"
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />}
          </button>

          {/* Central Action / Interrupt Button */}
          {state === "speaking" ? (
            <button
              onClick={handleInterrupt}
              className="flex-1 py-2 px-3 sm:py-2.5 sm:px-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-black font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black shrink-0" />
              <span className="truncate">
                {selectedLang.startsWith("mr")
                  ? "मला बोलू द्या (Interrupt)"
                  : selectedLang.startsWith("hi")
                  ? "रोकें और बोलें (Interrupt)"
                  : "Interrupt & Speak"}
              </span>
            </button>
          ) : state === "listening" ? (
            <button
              onClick={handleToggleMic}
              className="flex-1 py-2 px-3 sm:py-2.5 sm:px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all"
            >
              <Square className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
              <span className="truncate">
                {selectedLang.startsWith("mr")
                  ? "बोलणे झाले (पाठवा)"
                  : selectedLang.startsWith("hi")
                  ? "बात पूरी हुई (भेजें)"
                  : "Done Speaking"}
              </span>
            </button>
          ) : (
            <button
              onClick={startListeningTurn}
              disabled={!isSupported || isMuted}
              className="flex-1 py-2 px-3 sm:py-2.5 sm:px-4 bg-gradient-to-r from-gold via-gold-light to-gold hover:opacity-95 active:scale-95 text-green-dark font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-1.5 shadow-lg transition-all disabled:opacity-40"
            >
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">
                {selectedLang.startsWith("mr")
                  ? "बोलणे सुरू करा"
                  : selectedLang.startsWith("hi")
                  ? "बोलना शुरू करें"
                  : "Start Speaking"}
              </span>
            </button>
          )}

          {/* End Call Button */}
          <button
            onClick={() => {
              speechRecognizer.stopListening();
              speechPlayer.stop();
              onClose();
            }}
            className="p-2 sm:p-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white border border-red-500 flex items-center justify-center gap-1 px-2.5 sm:px-3.5 font-semibold text-xs transition-all shadow-md"
            title="End Voice Call"
          >
            <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">End</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
