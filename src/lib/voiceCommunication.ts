/**
 * Voice Communication Engine for AK Buffaloes AI Assistant
 * Provides Human-like 2-Way Phone Call Voice Communication:
 * 1. Speech Recognition (Speech-to-Text / STT): Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * 2. Speech Synthesis (Text-to-Speech / TTS): Web Speech API (SpeechSynthesis)
 * 3. Strict 4-Language Support: Hindi (hi-IN), Marathi (mr-IN), Indian English (en-IN), US English (en-US)
 * 4. Anti-Echo & Single-Commit Turn Guard: Prevents AI from talking to itself or picking up speaker echo
 */

export interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: { error: string; message?: string }) => void) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionResultEvent) => void) | null;
}

export interface SpeechRecognitionResultEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export type VoiceConversationState = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface VoiceLanguage {
  code: "hi-IN" | "mr-IN" | "en-IN" | "en-US";
  name: string;
  shortLabel: string;
  flag: string;
}

export const SUPPORTED_VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: "hi-IN", name: "हिन्दी (Hindi)", shortLabel: "हिन्दी", flag: "🇮🇳" },
  { code: "mr-IN", name: "मराठी (Marathi)", shortLabel: "मराठी", flag: "🚩" },
  { code: "en-IN", name: "Indian English", shortLabel: "EN (IN)", flag: "🇮🇳" },
  { code: "en-US", name: "US English", shortLabel: "EN (US)", flag: "🇺🇸" },
];

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  const win = window as unknown as {
    SpeechRecognition?: new () => IWindowSpeechRecognition;
    webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
  };
  return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Strips markdown, emojis, URLs, and code tokens for natural voice pronunciation
 * Expands currency symbol in the user's selected language
 */
export function cleanTextForVoice(text: string, lang?: string): string {
  if (!text) return "";
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const isDevanagariLang = lang
    ? (lang.startsWith("hi") || lang.startsWith("mr")) && hasDevanagari
    : hasDevanagari;
  const currencyWord = isDevanagariLang ? "रुपये" : "Rupees";

  return text
    // Replace markdown links [label](url) with just the label
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, "")
    // Remove markdown headers & bullet points
    .replace(/^[#*•-]+\s+/gm, "")
    // Remove bold, italic, code formatting
    .replace(/[*_#`~[\]()]/g, " ")
    // Strip emojis
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u{2600}-\u{26FF}]/gu, "")
    .replace(/[\u{2700}-\u{27BF}]/gu, "")
    // Replace arrows and symbols
    .replace(/→|➔|←|↓|↑|•|★|✔|✅|❌|📍|📞|🐃|🥛|💰|🎬|📸/g, " ")
    // Expand currency for natural speech
    .replace(/₹\s*(\d[\d,]*)/g, `$1 ${currencyWord}`)
    // Collapse multiple whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Formats AI response into a natural two-way phone call reply in the exact selected language.
 * If preformattedVoiceText is provided by the multilingual AI engine, uses it directly!
 */
export function formatCallSpeechResponse(
  query: string,
  rawReply: string,
  lang = "hi-IN",
  userName?: string,
  preformattedVoiceText?: string
): string {
  if (preformattedVoiceText && preformattedVoiceText.trim().length > 0) {
    return cleanTextForVoice(preformattedVoiceText, lang);
  }

  const q = (query || "").toLowerCase().trim();
  const isMarathi = lang.toLowerCase().startsWith("mr");
  const isEnglish = lang.toLowerCase().startsWith("en");

  // When called standalone without preformattedVoiceText, handle core phone call turns concisely:
  if (/^(hello|hi|hey|namaste|namaskar|salam|ram ram)\b/.test(q) && q.split(/\s+/).length <= 4) {
    if (isMarathi) {
      const namePart = userName ? ` ${userName} जी` : "";
      return `नमस्कार${namePart}! मी AK Buffaloes सपोर्टवरून बोलत आहे. बोला, आज मी आपली काय मदत करू शकतो?`;
    }
    if (isEnglish) {
      const namePart = userName ? ` ${userName}` : "";
      return `Hello${namePart}! Welcome to AK Buffalo farm support. How can I help you today?`;
    }
    const namePart = userName ? ` ${userName} ji` : " ji";
    return `Namaste${namePart}! Main AK Buffaloes support se bol raha hoon. Kahiye, main aapki kya madad kar sakta hoon?`;
  }

  if (q.includes("account") || q.includes("register") || q.includes("khate") || q.includes("खाते")) {
    if (isMarathi) {
      return "नवीन खाते उघडण्यासाठी Register पेजवर आपले नाव, मोबाईल आणि ईमेल टाका, मग ६-अंकी OTP टाकून व्हेरिफाय करा. मी Register पेज उघडू का?";
    }
    if (isEnglish) {
      return "To create an account, open the Register page, enter your details, and verify with the 6-digit email OTP. Shall I open the Register page for you?";
    }
    return "Naya account banane ke liye Register page par naam, phone aur email dalein, phir 6-digit email OTP se verify karein. Kya main Register page khol doon?";
  }

  if (q.includes("password") || q.includes("visarlo") || q.includes("पासवर्ड")) {
    if (isMarathi) {
      return "पासवर्ड बदलण्यासाठी Forgot Password पेजवर आपला ईमेल टाका आणि ईमेलवर आलेल्या OTP ने नवीन पासवर्ड सेट करा. आपल्याला आणखी काही मदत हवी आहे का?";
    }
    if (isEnglish) {
      return "You can reset your password on the Forgot Password page using your email and 6-digit OTP verification code. Would you like me to open that page?";
    }
    return "Password reset karne ke liye Forgot Password page par apna email dalein aur 6-digit OTP verify karke naya password set karein. Kya main madad karoon?";
  }

  if (q.includes("murrah") && (q.includes("doodh") || q.includes("milk") || q.includes("दूध"))) {
    if (isMarathi) {
      return "आमच्या फार्मवरील मुर्रा म्हैस दररोज १० ते १४ लिटरपेक्षा जास्त घट्ट दूध देते. आपल्याला मुर्रा म्हशी पाहिल्या आहेत का?";
    }
    if (isEnglish) {
      return "Our Murrah buffaloes produce 10 to 16 litres of rich milk daily with 7 to 8 percent fat. Would you like to view our Murrah listings?";
    }
    return "Hamare farm ki Murrah bhains rozana 10 se 16 litre doodh deti hai. Kya aap Murrah bhains dekhna chahenge?";
  }

  if (q.includes("price") || q.includes("kimat") || q.includes("keemat") || q.includes("किंमत") || q.includes("कीमत")) {
    if (isMarathi) {
      return "आमच्या फार्मवर म्हशींची किंमत ७०,००० ते २ लाखांपर्यंत आहे. आपले बजेट किती आहे?";
    }
    if (isEnglish) {
      return "Our buffalo prices range from 70,000 to 2,00,000 Rupees across 10 purebred breeds. What is your target budget?";
    }
    return "Hamare farm par bhainson ki keemat 70,000 se 2,00,000 Rupees tak hai. Aapka budget kitna hai?";
  }

  if (q.includes("kuthe") || q.includes("location") || q.includes("address") || q.includes("pachora") || q.includes("कुठे")) {
    if (isMarathi) {
      return "आमचा फार्म नुराणी नगर, लोहारी खुर्द, तालुका पाचोरा, जिल्हा जळगाव येथे आहे. तिथे तुम्ही थेट मिल्किंग टेस्ट करून म्हैस निवडू शकता. तुम्ही कधी येणार आहात?";
    }
  }

  const cleaned = cleanTextForVoice(rawReply, lang);
  // Split on standard and Devanagari sentence terminators (। . ! ?)
  const sentences = cleaned.split(/(?<=[.!?।])\s+/).filter(Boolean);
  let shortSpeech = sentences.slice(0, 2).join(" ").trim();

  const words = shortSpeech.split(/\s+/);
  if (words.length > 26) {
    shortSpeech = words.slice(0, 24).join(" ") + ".";
  }

  if (!shortSpeech) {
    if (isMarathi) return "होय, मी ऐकत आहे. कृपया सांगा.";
    if (lang.startsWith("hi")) return "जी, मैं सुन रहा हूँ। बताइए।";
    return "Yes, I am listening. Please go ahead.";
  }

  if (!shortSpeech.endsWith("?")) {
    if (isMarathi) {
      shortSpeech = `${shortSpeech} बोला, याबद्दल आपल्याला आणखी काय माहिती हवी आहे?`;
    } else if (!isEnglish) {
      shortSpeech = `${shortSpeech} Kahiye, iske baare me aap aur kya janna chahte hain?`;
    }
  }

  return shortSpeech;
}

// Track last AI spoken text & timestamp to filter out speaker-to-mic acoustic echo
let lastAiSpokenText = "";
let lastAiSpeechEndedAt = 0;

function isLikelySpeakerEcho(transcript: string): boolean {
  const cleanTranscript = transcript.toLowerCase().trim();
  if (!cleanTranscript) return true;

  // If AI just finished speaking < 400ms ago and transcript is very short noise, ignore
  if (Date.now() - lastAiSpeechEndedAt < 400 && cleanTranscript.length < 4) {
    return true;
  }

  if (!lastAiSpokenText) return false;
  const aiLower = lastAiSpokenText.toLowerCase();

  // Direct substring match of 12+ chars against what the AI just spoke
  if (cleanTranscript.length >= 12 && aiLower.includes(cleanTranscript)) {
    return true;
  }

  // Word overlap check for multi-word echo
  const userWords = cleanTranscript.split(/\s+/).filter((w) => w.length > 2);
  if (userWords.length >= 4) {
    const matchedWords = userWords.filter((w) => aiLower.includes(w));
    if (matchedWords.length / userWords.length >= 0.75) {
      return true;
    }
  }

  return false;
}

export interface SpeechRecognitionHandlers {
  onStart?: () => void;
  onInterimResult?: (transcript: string) => void;
  onFinalResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  continuous?: boolean;
  silenceTimeoutMs?: number;
}

/**
 * Speech Recognition Wrapper with Human Turn-Taking & Echo Protection
 */
export class SpeechRecognizer {
  private recognition: IWindowSpeechRecognition | null = null;
  private isListening = false;
  private currentLanguage = "hi-IN";
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private accumulatedText = "";
  private currentInterim = "";
  private turnCommitted = false;
  private currentHandlers: SpeechRecognitionHandlers | null = null;

  constructor(defaultLang = "hi-IN") {
    this.currentLanguage = defaultLang;
  }

  public setLanguage(lang: string) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /**
   * Commits the recognized speech immediately (guaranteed once per turn)
   */
  public commitTurn(): boolean {
    this.clearSilenceTimer();
    if (this.turnCommitted) return false;

    const fullText = (this.accumulatedText + " " + this.currentInterim).trim();
    if (fullText.length >= 2 && !isLikelySpeakerEcho(fullText) && this.currentHandlers?.onFinalResult) {
      this.turnCommitted = true;
      const handler = this.currentHandlers.onFinalResult;
      this.accumulatedText = "";
      this.currentInterim = "";
      this.stopListening();
      handler(fullText);
      return true;
    }
    return false;
  }

  public startListening(handlers: SpeechRecognitionHandlers): boolean {
    if (!isSpeechRecognitionSupported()) {
      handlers.onError?.("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return false;
    }

    try {
      this.stopListening();
      this.currentHandlers = handlers;
      this.accumulatedText = "";
      this.currentInterim = "";
      this.turnCommitted = false;
      this.clearSilenceTimer();

      const win = window as unknown as {
        SpeechRecognition?: new () => IWindowSpeechRecognition;
        webkitSpeechRecognition?: new () => IWindowSpeechRecognition;
      };
      const RecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (!RecognitionConstructor) return false;

      const rec = new RecognitionConstructor();
      const isContinuous = handlers.continuous ?? true;
      const silenceMs = handlers.silenceTimeoutMs ?? 1500; // 1.5s natural human pause

      rec.continuous = isContinuous;
      rec.interimResults = true;
      rec.lang = this.currentLanguage;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        this.isListening = true;
        handlers.onStart?.();
      };

      rec.onresult = (event: SpeechRecognitionResultEvent) => {
        if (this.turnCommitted) return;

        // Ignore mic input if AI speaker is currently active
        if (speechPlayer.isSpeaking()) {
          this.accumulatedText = "";
          this.currentInterim = "";
          return;
        }

        let interimText = "";
        let newFinalText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            newFinalText += " " + item[0].transcript;
          } else {
            interimText += " " + item[0].transcript;
          }
        }

        if (newFinalText.trim()) {
          const candidate = newFinalText.trim();
          if (!isLikelySpeakerEcho(candidate)) {
            this.accumulatedText = (this.accumulatedText + " " + candidate).trim();
          }
        }
        this.currentInterim = interimText.trim();

        const combinedTranscript = (this.accumulatedText + " " + this.currentInterim).trim();

        if (!combinedTranscript || isLikelySpeakerEcho(combinedTranscript)) {
          return;
        }

        if (handlers.onInterimResult) {
          handlers.onInterimResult(combinedTranscript);
        }

        // Natural Human Turn-Taking: Wait for user to finish their sentence (1.5s pause)
        if (isContinuous && silenceMs > 0 && combinedTranscript.length >= 2) {
          this.clearSilenceTimer();
          this.silenceTimer = setTimeout(() => {
            if (this.turnCommitted) return;
            const finalQuery = (this.accumulatedText + " " + this.currentInterim).trim();
            if (finalQuery.length >= 2 && !isLikelySpeakerEcho(finalQuery) && handlers.onFinalResult) {
              this.turnCommitted = true;
              const onFinal = handlers.onFinalResult;
              this.accumulatedText = "";
              this.currentInterim = "";
              this.stopListening();
              onFinal(finalQuery);
            }
          }, silenceMs);
        } else if (!isContinuous && newFinalText.trim() && handlers.onFinalResult && !this.turnCommitted) {
          const finalQuery = this.accumulatedText.trim();
          if (finalQuery.length >= 2 && !isLikelySpeakerEcho(finalQuery)) {
            this.turnCommitted = true;
            const onFinal = handlers.onFinalResult;
            this.accumulatedText = "";
            this.currentInterim = "";
            onFinal(finalQuery);
          }
        }
      };

      rec.onerror = (event: { error: string; message?: string }) => {
        this.clearSilenceTimer();
        this.isListening = false;
        if (event.error === "no-speech") {
          handlers.onError?.("no-speech");
        } else if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          handlers.onError?.("Microphone permission denied. Please allow microphone access in your browser settings.");
        } else if (event.error !== "aborted") {
          handlers.onError?.(`Voice input error: ${event.error}`);
        }
      };

      rec.onend = () => {
        this.clearSilenceTimer();
        this.isListening = false;

        // Commit only if user had spoken valid text and turn was not yet committed
        if (!this.turnCommitted) {
          const pendingText = (this.accumulatedText + " " + this.currentInterim).trim();
          if (pendingText.length >= 2 && !isLikelySpeakerEcho(pendingText) && handlers.onFinalResult) {
            this.turnCommitted = true;
            const onFinal = handlers.onFinalResult;
            this.accumulatedText = "";
            this.currentInterim = "";
            onFinal(pendingText);
            return;
          }
        }

        handlers.onEnd?.();
      };

      this.recognition = rec;
      rec.start();
      return true;
    } catch (err) {
      console.warn("Speech recognition start failed:", err);
      handlers.onError?.("Could not start microphone. Please check permissions.");
      return false;
    }
  }

  public stopListening() {
    this.clearSilenceTimer();
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      try {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.abort();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
    this.accumulatedText = "";
    this.currentInterim = "";
    this.currentHandlers = null;
  }

  public isCurrentlyListening(): boolean {
    return this.isListening;
  }
}

/**
 * Text-to-Speech Player for AI Assistant responses with strict 4-Language Voice Matching
 */
export class SpeechPlayer {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState = false;

  public isSpeaking(): boolean {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      return Boolean(this.isSpeakingState || window.speechSynthesis.speaking);
    }
    return this.isSpeakingState;
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    if (this.isSpeakingState) {
      lastAiSpeechEndedAt = Date.now();
    }
    this.isSpeakingState = false;
    this.activeUtterance = null;
  }

  private selectBestVoice(voices: SpeechSynthesisVoice[], targetLang: string): SpeechSynthesisVoice | undefined {
    if (!voices || voices.length === 0) return undefined;
    const norm = targetLang.toLowerCase();

    // 1. Marathi (mr-IN)
    if (norm.startsWith("mr")) {
      const marathiVoice =
        voices.find((v) => v.lang.toLowerCase() === "mr-in" && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Microsoft"))) ||
        voices.find((v) => v.lang.toLowerCase().startsWith("mr") || v.name.toLowerCase().includes("marathi") || v.name.toLowerCase().includes("aarohi") || v.name.toLowerCase().includes("manohar"));
      if (marathiVoice) return marathiVoice;

      // Fallback for Marathi Devanagari script: Hindi (hi-IN) voice reads Devanagari cleanly if OS lacks dedicated Marathi pack
      const devanagariFallback =
        voices.find((v) => v.lang.toLowerCase() === "hi-in") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("hi") || v.name.toLowerCase().includes("hindi"));
      if (devanagariFallback) return devanagariFallback;
    }

    // 2. Hindi (hi-IN)
    if (norm.startsWith("hi")) {
      const hindiVoice =
        voices.find((v) => v.lang.toLowerCase() === "hi-in" && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Swara") || v.name.includes("Madhur"))) ||
        voices.find((v) => v.lang.toLowerCase() === "hi-in") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("hi") || v.name.toLowerCase().includes("hindi"));
      if (hindiVoice) return hindiVoice;
    }

    // 3. Indian English (en-IN)
    if (norm === "en-in") {
      const indianEngVoice =
        voices.find((v) => v.lang.toLowerCase() === "en-in" && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Neerja") || v.name.includes("Prabhat"))) ||
        voices.find((v) => v.lang.toLowerCase() === "en-in") ||
        voices.find((v) => v.lang.toLowerCase().includes("in") && v.lang.toLowerCase().startsWith("en")) ||
        voices.find((v) => v.name.toLowerCase().includes("india"));
      if (indianEngVoice) return indianEngVoice;
    }

    // 4. US English (en-US)
    if (norm === "en-us") {
      const usEngVoice =
        voices.find((v) => v.lang.toLowerCase() === "en-us" && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Aria") || v.name.includes("Jenny") || v.name.includes("Guy"))) ||
        voices.find((v) => v.lang.toLowerCase() === "en-us") ||
        voices.find((v) => v.lang.toLowerCase().startsWith("en"));
      if (usEngVoice) return usEngVoice;
    }

    // Generic fallback
    return (
      voices.find((v) => v.lang.toLowerCase() === norm) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(norm.slice(0, 2))) ||
      voices[0]
    );
  }

  public speak(
    text: string,
    options?: {
      lang?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    }
  ) {
    if (!isSpeechSynthesisSupported()) {
      options?.onError?.(new Error("Speech synthesis not supported"));
      return;
    }

    try {
      this.stop();

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const requestedLang = options?.lang || "hi-IN";
      const cleanText = cleanTextForVoice(text, requestedLang);
      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      lastAiSpokenText = cleanText;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = 1.0;
      utterance.lang = requestedLang;

      const voices = window.speechSynthesis.getVoices?.() || [];
      const selectedVoice = this.selectBestVoice(voices, requestedLang);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // If Marathi was requested and we fell back to a Hindi Devanagari voice, keep voice.lang so synthesizer pronounces Devanagari
        if (requestedLang.toLowerCase().startsWith("mr") && selectedVoice.lang.toLowerCase().startsWith("hi")) {
          utterance.lang = selectedVoice.lang;
        }
      }

      utterance.onstart = () => {
        this.isSpeakingState = true;
        options?.onStart?.();
      };

      utterance.onend = () => {
        this.isSpeakingState = false;
        this.activeUtterance = null;
        lastAiSpeechEndedAt = Date.now();
        options?.onEnd?.();
      };

      utterance.onerror = (ev) => {
        this.isSpeakingState = false;
        this.activeUtterance = null;
        lastAiSpeechEndedAt = Date.now();
        if (ev.error !== "canceled" && ev.error !== "interrupted") {
          console.warn("Speech synthesis playback error:", ev.error);
          options?.onError?.(ev);
        } else {
          options?.onEnd?.();
        }
      };

      this.activeUtterance = utterance;
      (window as unknown as { __ak_active_voice?: SpeechSynthesisUtterance | null }).__ak_active_voice = utterance;

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      this.isSpeakingState = false;
      this.activeUtterance = null;
      lastAiSpeechEndedAt = Date.now();
      console.warn("Failed to speak text:", error);
      options?.onError?.(error);
    }
  }
}

export const speechRecognizer = new SpeechRecognizer();
export const speechPlayer = new SpeechPlayer();

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
