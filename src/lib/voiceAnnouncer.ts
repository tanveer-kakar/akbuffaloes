/**
 * Voice Announcer for AK Buffaloes
 * Uses Web Speech API (SpeechSynthesis) to speak notifications & messages aloud in a clear, natural voice.
 */

export interface SpeakOptions {
  rate?: number; // Speed: default 0.95 (crisp, pleasant, natural pace)
  pitch?: number; // Pitch: default 1.0
  lang?: string; // Language code
  volume?: number; // Volume: default 1.0
}

class VoiceAnnouncer {
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private initialized = false;
  private listeners: Set<(speaking: boolean) => void> = new Set();
  private enabledListeners: Set<(enabled: boolean) => void> = new Set();
  private speaking = false;
  private enabled = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ak_voice_enabled");
        this.enabled = saved !== "false";
      } catch {
        this.enabled = true;
      }
      if ("speechSynthesis" in window) {
        this.initVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = () => this.initVoices();
        }
      }
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ak_voice_enabled", String(val));
      } catch {
        // ignore
      }
    }
    if (!val) {
      this.stop();
    }
    this.enabledListeners.forEach((fn) => fn(val));
  }

  public subscribeEnabled(fn: (enabled: boolean) => void): () => void {
    this.enabledListeners.add(fn);
    return () => this.enabledListeners.delete(fn);
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      this.initialized = true;

      // Select high-quality, natural human voice:
      // Priority 1: Natural / Neural / Studio / Google voices
      // Priority 2: Standard English voice (US / UK / IN)
      const naturalEn = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Neural") ||
            v.name.includes("Online") ||
            v.name.includes("Google") ||
            v.name.includes("Jenny") ||
            v.name.includes("Aria") ||
            v.name.includes("Samantha") ||
            v.name.includes("Siri"))
      );

      const standardEn = voices.find((v) => v.lang.startsWith("en"));
      this.preferredVoice = naturalEn || standardEn || voices[0] || null;
    } catch {
      // Fallback silently if getVoices fails
    }
  }

  private cleanTextForSpeech(text: string): string {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, " ") // Strip HTML tags
      .replace(/[*_#`~[\]()]/g, " ") // Strip markdown characters
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Strip emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, "")
      .replace(/[\u{2700}-\u{27BF}]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private setSpeaking(state: boolean) {
    this.speaking = state;
    this.listeners.forEach((fn) => fn(state));
  }

  public subscribe(fn: (speaking: boolean) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public stop() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore
      }
    }
    this.setSpeaking(false);
  }

  /**
   * Speak title and description aloud
   */
  public speak(title?: string, description?: string, options?: SpeakOptions) {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      // Cancel any ongoing speech to avoid overlapping
      window.speechSynthesis.cancel();
      // Ensure speech synthesis is resumed if it was in a paused state (Chromium quirk)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const cleanTitle = this.cleanTextForSpeech(title || "");
      const cleanDesc = this.cleanTextForSpeech(description || "");

      // Join title and description with a natural pause
      let textToSpeak = "";
      if (cleanTitle && cleanDesc) {
        textToSpeak = `${cleanTitle}. ${cleanDesc}`;
      } else {
        textToSpeak = cleanTitle || cleanDesc;
      }

      if (!textToSpeak) return;

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = options?.rate ?? 0.96; // clear and polite cadence
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;

      if (!this.initialized || !this.preferredVoice) {
        this.initVoices();
      }

      if (this.preferredVoice) {
        utterance.voice = this.preferredVoice;
      }

      utterance.onstart = () => {
        this.setSpeaking(true);
      };

      utterance.onend = () => {
        this.setSpeaking(false);
        this.activeUtterance = null;
        const win = window as unknown as { __ak_current_utterance?: SpeechSynthesisUtterance | null };
        if (typeof window !== "undefined" && win.__ak_current_utterance === utterance) {
          win.__ak_current_utterance = null;
        }
      };

      utterance.onerror = (event) => {
        // Canceled errors are expected when user triggers another speech
        if (event.error !== "canceled" && event.error !== "interrupted") {
          console.warn("Speech synthesis error:", event.error);
        }
        this.setSpeaking(false);
        this.activeUtterance = null;
        const win = window as unknown as { __ak_current_utterance?: SpeechSynthesisUtterance | null };
        if (typeof window !== "undefined" && win.__ak_current_utterance === utterance) {
          win.__ak_current_utterance = null;
        }
      };

      this.activeUtterance = utterance;
      // Retain reference on window to prevent Chromium garbage collection cutting off audio
      if (typeof window !== "undefined") {
        (window as unknown as { __ak_current_utterance?: SpeechSynthesisUtterance | null }).__ak_current_utterance = utterance;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Failed to speak text:", err);
      this.setSpeaking(false);
    }
  }

  /**
   * Welcomes first-time visitors with AI voice: "Welcome to AK Buffaloes"
   */
  public welcomeFirstTimeUser() {
    if (!this.enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      const alreadyWelcomed = sessionStorage.getItem("ak_welcomed_visit");
      if (alreadyWelcomed) return;
      sessionStorage.setItem("ak_welcomed_visit", "true");
      try {
        localStorage.setItem("ak_has_visited", "true");
      } catch {
        // ignore localStorage errors in private mode
      }

      let hasSpoken = false;
      const doWelcome = () => {
        if (hasSpoken) return;
        hasSpoken = true;

        window.removeEventListener("click", doWelcome, true);
        window.removeEventListener("pointerdown", doWelcome, true);
        window.removeEventListener("touchstart", doWelcome, true);
        window.removeEventListener("keydown", doWelcome, true);

        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // ignore
        }

        this.speak("Welcome to AK Buffaloes");
      };

      // Listen for first interaction (ensures speech works even if browser restricts unprompted autoplay)
      window.addEventListener("click", doWelcome, { capture: true, once: true });
      window.addEventListener("pointerdown", doWelcome, { capture: true, once: true });
      window.addEventListener("touchstart", doWelcome, { capture: true, once: true });
      window.addEventListener("keydown", doWelcome, { capture: true, once: true });

      // Attempt immediate speech right after initial preloader completes (~1.1s)
      setTimeout(() => {
        if (!hasSpoken) {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
            this.speak("Welcome to AK Buffaloes");
            hasSpoken = true;
            window.removeEventListener("click", doWelcome, true);
            window.removeEventListener("pointerdown", doWelcome, true);
            window.removeEventListener("touchstart", doWelcome, true);
            window.removeEventListener("keydown", doWelcome, true);
          } catch {
            // Browser autoplay policy will be satisfied on the user's first touch/click
          }
        }
      }, 1100);
    } catch {
      // Fallback silently
    }
  }
}

export const voiceAnnouncer = new VoiceAnnouncer();
