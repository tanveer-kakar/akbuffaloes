import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cleanTextForVoice,
  formatCallSpeechResponse,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  SpeechRecognizer,
  SpeechPlayer,
  SUPPORTED_VOICE_LANGUAGES,
} from "@/lib/voiceCommunication";

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  voice: SpeechSynthesisVoice | null = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((ev: { error: string }) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("Voice Communication Engine (ChatGPT-style Voice Mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;
    (window as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;
  });

  describe("cleanTextForVoice", () => {
    it("strips markdown formatting, links, and bold tokens", () => {
      const input = "Please visit [Register](/register) to create **account**!";
      const cleaned = cleanTextForVoice(input);
      expect(cleaned).toBe("Please visit Register to create account !");
    });

    it("cleans bullet points, headers and arrows", () => {
      const input = "• Step 1: Pending ➔ Accepted ➔ Confirmed\n# Welcome to AK Buffaloes";
      const cleaned = cleanTextForVoice(input);
      expect(cleaned).toContain("Step 1: Pending Accepted Confirmed");
      expect(cleaned).toContain("Welcome to AK Buffaloes");
    });

    it("expands rupee symbol for natural voice speech", () => {
      const input = "Murrah price is ₹85,000 to ₹1,20,000";
      const cleaned = cleanTextForVoice(input);
      expect(cleaned).toBe("Murrah price is 85,000 Rupees to 1,20,000 Rupees");
    });

    it("strips emojis cleanly", () => {
      const input = "🐃 Murrah Buffalo 🥛 12 Litres 💰 Price";
      const cleaned = cleanTextForVoice(input);
      expect(cleaned).toBe("Murrah Buffalo 12 Litres Price");
    });
  });

  describe("Voice Languages & Capabilities", () => {
    it("supports Hindi, Indian English, and Marathi", () => {
      const langCodes = SUPPORTED_VOICE_LANGUAGES.map((l) => l.code);
      expect(langCodes).toContain("hi-IN");
      expect(langCodes).toContain("en-IN");
      expect(langCodes).toContain("mr-IN");
    });

    it("detects speech synthesis availability", () => {
      Object.defineProperty(window, "speechSynthesis", {
        value: { speak: vi.fn(), cancel: vi.fn() },
        writable: true,
        configurable: true,
      });
      expect(isSpeechSynthesisSupported()).toBe(true);
    });

    it("checks speech recognition support gracefully", () => {
      // In JSDOM without SpeechRecognition
      const supported = isSpeechRecognitionSupported();
      expect(typeof supported).toBe("boolean");
    });
  });

  describe("SpeechRecognizer", () => {
    it("allows switching language between Hindi and English", () => {
      const recognizer = new SpeechRecognizer("hi-IN");
      expect(recognizer.getLanguage()).toBe("hi-IN");
      recognizer.setLanguage("en-IN");
      expect(recognizer.getLanguage()).toBe("en-IN");
    });

    it("calls onError gracefully when Web Speech API is missing in test environment", () => {
      const recognizer = new SpeechRecognizer();
      const onErrorMock = vi.fn();
      recognizer.startListening({ onError: onErrorMock });
      expect(onErrorMock).toHaveBeenCalled();
    });

    it("handles commitTurn cleanly when speech is not started or empty", () => {
      const recognizer = new SpeechRecognizer();
      const committed = recognizer.commitTurn();
      expect(committed).toBe(false);
    });

    it("safely stops listening and clears timers on stopListening()", () => {
      const recognizer = new SpeechRecognizer();
      recognizer.stopListening();
      expect(recognizer.isCurrentlyListening()).toBe(false);
    });
  });

  describe("SpeechPlayer", () => {
    it("speaks cleaned text and manages speaking state", () => {
      const speakMock = vi.fn();
      const cancelMock = vi.fn();

      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak: speakMock,
          cancel: cancelMock,
          getVoices: vi.fn().mockReturnValue([
            { name: "Google Hindi", lang: "hi-IN", default: true },
          ]),
          paused: false,
          resume: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const player = new SpeechPlayer();
      player.speak("Hello from **AK Buffaloes**!", { lang: "hi-IN" });

      expect(cancelMock).toHaveBeenCalled();
      expect(speakMock).toHaveBeenCalled();

      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.text).toBe("Hello from AK Buffaloes !");
      expect(utterance.voice?.lang).toBe("hi-IN");

      player.stop();
      expect(player.isSpeaking()).toBe(false);
    });
  });

  describe("formatCallSpeechResponse (Turn-Taking Phone Call Formatter)", () => {
    it("returns short conversational greeting under 35 words ending with question", () => {
      const resHindi = formatCallSpeechResponse("namaste", "Detailed raw response...", "hi-IN", "Tanveer");
      expect(resHindi).toContain("Namaste Tanveer ji!");
      expect(resHindi).toContain("Kahiye, main aapki kya madad kar sakta hoon?");
      expect(resHindi.split(/\s+/).length).toBeLessThan(35);

      const resEng = formatCallSpeechResponse("hello", "Raw text...", "en-IN");
      expect(resEng).toContain("AK Buffalo farm support");
      expect(resEng.endsWith("?")).toBe(true);
      expect(resEng.split(/\s+/).length).toBeLessThan(35);
    });

    it("gives concise phone call turn for account creation and registration", () => {
      const res = formatCallSpeechResponse("how to create account", "Raw instructions...", "hi-IN");
      expect(res).toContain("Register page");
      expect(res).toContain("OTP");
      expect(res.endsWith("?")).toBe(true);
      expect(res.split(/\s+/).length).toBeLessThan(35);
    });

    it("gives concise phone call turn for passwords", () => {
      const res = formatCallSpeechResponse("i forgot my password", "Raw instructions...", "hi-IN");
      expect(res).toContain("Forgot Password");
      expect(res.endsWith("?")).toBe(true);
      expect(res.split(/\s+/).length).toBeLessThan(40);
    });

    it("gives concise phone call turn for Murrah buffalo milk capacity", () => {
      const res = formatCallSpeechResponse("murrah bhains kitna doodh deti hai", "Long text...", "hi-IN");
      expect(res).toContain("Murrah");
      expect(res).toContain("litre");
      expect(res.endsWith("?")).toBe(true);
      expect(res.split(/\s+/).length).toBeLessThan(35);
    });

    it("gives concise phone call turn for buffalo prices", () => {
      const res = formatCallSpeechResponse("buffalo price kya hai", "Long price list...", "hi-IN");
      expect(res).toContain("70,000");
      expect(res).toContain("Aapka budget kitna hai?");
      expect(res.split(/\s+/).length).toBeLessThan(35);
    });

    it("truncates generic long answers to avoid long monologues on phone call", () => {
      const longEssay =
        "AK Buffalo Farm is an elite agricultural institution in Maharashtra. It operates across hundreds of acres. The animals are fed high protein silage and dry fodder every single morning at six AM. Furthermore veterinary doctors examine every single livestock twice a week. We also provide Pan-India transportation in cushioned vehicles with health passes and fitness clearance certificates.";
      const res = formatCallSpeechResponse("tell me about random topic", longEssay, "hi-IN");
      expect(res.split(/\s+/).length).toBeLessThan(45);
      expect(res).toContain("Kahiye, iske baare me aap aur kya janna chahte hain?");
    });

    it("communicates in authentic Marathi when user selects Marathi language (mr-IN)", () => {
      // 1. Marathi Greeting
      const marathiGreeting = formatCallSpeechResponse("namaskar", "Raw info...", "mr-IN", "संजय");
      expect(marathiGreeting).toContain("नमस्कार संजय जी!");
      expect(marathiGreeting).toContain("मी AK Buffaloes सपोर्टवरून बोलत आहे");
      expect(marathiGreeting.endsWith("?")).toBe(true);
      expect(marathiGreeting.split(/\s+/).length).toBeLessThan(35);

      // 2. Marathi Account Creation
      const marathiAccount = formatCallSpeechResponse("khate kase ughdayche", "Raw...", "mr-IN");
      expect(marathiAccount).toContain("नवीन खाते उघडण्यासाठी");
      expect(marathiAccount).toContain("OTP");
      expect(marathiAccount.endsWith("?")).toBe(true);

      // 3. Marathi Password Reset
      const marathiPassword = formatCallSpeechResponse("password visarlo", "Raw...", "mr-IN");
      expect(marathiPassword).toContain("Forgot Password");
      expect(marathiPassword).toContain("नवीन पासवर्ड");
      expect(marathiPassword.endsWith("?")).toBe(true);

      // 4. Marathi Murrah Milk Capacity
      const marathiMilk = formatCallSpeechResponse("murrah mhains kiti doodh dete", "Raw...", "mr-IN");
      expect(marathiMilk).toContain("मुर्रा म्हैस");
      expect(marathiMilk).toContain("१० ते १४ लिटर");
      expect(marathiMilk.endsWith("?")).toBe(true);

      // 5. Marathi Pricing
      const marathiPrice = formatCallSpeechResponse("mhasi chi kimat kay aahe", "Raw...", "mr-IN");
      expect(marathiPrice).toContain("७०,००० ते २ लाखांपर्यंत");
      expect(marathiPrice).toContain("आपले बजेट किती आहे?");

      // 6. Marathi Farm Location
      const marathiLocation = formatCallSpeechResponse("farm kuthe aahe", "Raw...", "mr-IN");
      expect(marathiLocation).toContain("पाचोरा, जिल्हा जळगाव");
      expect(marathiLocation).toContain("मिल्किंग टेस्ट");

      // 7. Marathi Fallback Truncation & Prompt
      const marathiFallback = formatCallSpeechResponse("kahihi sanga", "Detailed farming text here...", "mr-IN");
      expect(marathiFallback).toContain("बोला, याबद्दल आपल्याला आणखी काय माहिती हवी आहे?");
    });

    it("synthesizes Marathi speech with mr-IN language and voice", () => {
      const speakMock = vi.fn();
      Object.defineProperty(window, "speechSynthesis", {
        value: {
          speak: speakMock,
          cancel: vi.fn(),
          getVoices: vi.fn().mockReturnValue([
            { name: "Google Marathi", lang: "mr-IN", default: true },
            { name: "Google Hindi", lang: "hi-IN", default: false },
          ]),
          paused: false,
          resume: vi.fn(),
        },
        writable: true,
        configurable: true,
      });

      const player = new SpeechPlayer();
      player.speak("नमस्कार, AK Buffaloes मध्ये आपले स्वागत आहे!", { lang: "mr-IN" });

      expect(speakMock).toHaveBeenCalled();
      const utterance = speakMock.mock.calls[0][0];
      expect(utterance.lang).toBe("mr-IN");
      expect(utterance.voice?.lang).toBe("mr-IN");
    });
  });
});
