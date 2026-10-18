import { describe, it, expect, vi, beforeEach } from "vitest";
import { voiceAnnouncer } from "@/lib/voiceAnnouncer";

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1;
  pitch = 1;
  volume = 1;
  voice = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

describe("VoiceAnnouncer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;
    (window as unknown as { SpeechSynthesisUtterance: typeof MockSpeechSynthesisUtterance }).SpeechSynthesisUtterance =
      MockSpeechSynthesisUtterance;
  });

  it("handles text cleaning and speech synthesis invocation", () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: vi.fn().mockReturnValue([
          { name: "Google US English", lang: "en-US", default: true },
        ]),
      },
      writable: true,
      configurable: true,
    });

    voiceAnnouncer.speak("Consultation Requested!", "Your request is pending. Confirmation has been emailed to you.");

    expect(cancelMock).toHaveBeenCalled();
    expect(speakMock).toHaveBeenCalled();

    const utterance = speakMock.mock.calls[0][0];
    expect(utterance.text).toBe(
      "Consultation Requested!. Your request is pending. Confirmation has been emailed to you."
    );
  });

  it("cleans markdown and html tags before speaking", () => {
    const speakMock = vi.fn();
    const cancelMock = vi.fn();

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: vi.fn().mockReturnValue([]),
      },
      writable: true,
      configurable: true,
    });

    voiceAnnouncer.speak("<b>Welcome!</b>", "Check out **Murrah** buffalo");

    expect(speakMock).toHaveBeenCalled();
    const utterance = speakMock.mock.calls[0][0];
    expect(utterance.text).toBe("Welcome!. Check out Murrah buffalo");
  });

  it("welcomes first-time user with 'Welcome to AK Buffaloes'", () => {
    localStorage.clear();
    const speakMock = vi.fn();
    const cancelMock = vi.fn();

    Object.defineProperty(window, "speechSynthesis", {
      value: {
        speak: speakMock,
        cancel: cancelMock,
        getVoices: vi.fn().mockReturnValue([]),
      },
      writable: true,
      configurable: true,
    });

    voiceAnnouncer.welcomeFirstTimeUser();

    // Trigger click event on window
    window.dispatchEvent(new MouseEvent("click"));

    expect(localStorage.getItem("ak_has_visited")).toBe("true");
    expect(speakMock).toHaveBeenCalled();
    const utterance = speakMock.mock.calls[0][0];
    expect(utterance.text).toBe("Welcome to AK Buffaloes");
  });
});
