export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  voiceText?: string;
  navigateTo?: string;
  timestamp: string;
  quickActions?: Array<{ label: string; url?: string; action?: string }>;
}

export interface UserAiContext {
  isLoggedIn?: boolean;
  userName?: string;
  userEmail?: string;
  role?: string;
  inquiriesCount?: number;
  pendingCount?: number;
  confirmedCount?: number;
  availableBuffaloesCount?: number;
  language?: string; // "hi" | "mr" | "en" | "hi-IN" | "mr-IN" | "en-IN" | "en-US"
  isVoiceCall?: boolean;
}

export interface AiAssistantReply {
  text: string;
  voiceText: string;
  navigateTo?: string;
  quickActions?: Array<{ label: string; url?: string; action?: string }>;
}

export const initialSuggestions = [
  "मुर्रा भैंस की कीमत और दूध?",
  "Which breed gives highest milk?",
  "फार्म का पता और मैप दिखाओ",
  "How to book a buffalo inquiry?",
  "गैलरी के फोटो और वीडियो दिखाओ",
  "Tell me about Akil Bhai & Salim Bhai",
  "जाफराबादी म्हशीची माहिती द्या",
  "How do I create an account with OTP?",
];

export type SupportedLangMode = "hi-IN" | "mr-IN" | "en-IN" | "en-US";

/**
 * Resolves the exact target language mode from user's selected language code.
 * Defaults strictly to the selected language (Hindi, Marathi, Indian English, or US English).
 */
export function resolveLanguageMode(langCode?: string, query?: string): SupportedLangMode {
  const code = (langCode || "").trim().toLowerCase();
  if (code === "mr-in" || code === "mr") return "mr-IN";
  if (code === "hi-in" || code === "hi") return "hi-IN";
  if (code === "en-us") return "en-US";
  if (code === "en-in" || code === "en") return "en-IN";
  if (query && /[\u0900-\u097F]/.test(query)) return "hi-IN";
  return "en-IN";
}

/**
 * Fetches live context (user inquiries + available buffaloes) from backend if available,
 * then generates an accurate, language-matched response for both Chat and Voice Call.
 */
export async function askAiAssistant(
  question: string,
  userContext?: UserAiContext
): Promise<AiAssistantReply> {
  const enrichedContext: UserAiContext = { ...userContext };

  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: question, userContext }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.liveStats) {
        enrichedContext.inquiriesCount = data.liveStats.totalUserInquiries ?? enrichedContext.inquiriesCount;
        enrichedContext.pendingCount = data.liveStats.pendingInquiries ?? enrichedContext.pendingCount;
        enrichedContext.confirmedCount = data.liveStats.confirmedInquiries ?? enrichedContext.confirmedCount;
        enrichedContext.availableBuffaloesCount = data.liveStats.availableBuffaloes ?? enrichedContext.availableBuffaloesCount;
      }
    }
  } catch {
    // Offline or local mode — continue with local context
  }

  return generateLocalAiReply(question, enrichedContext);
}

/**
 * Helper to check if query contains any of the given keywords/phrases
 */
function hasAny(q: string, words: string[]): boolean {
  return words.some((w) => q.includes(w));
}

/**
 * Detects if the user is asking to open/navigate to a specific website page
 */
function detectNavigationCommand(q: string): string | undefined {
  const wantsToOpen = hasAny(q, [
    "open",
    "show",
    "go to",
    "take me",
    "navigate",
    "visit page",
    "dikhao",
    "dikhaiye",
    "kholo",
    "kholiye",
    "khol",
    "chalo",
    "le chalo",
    "दिखाओ",
    "दिखाइए",
    "खोलो",
    "खोलिए",
    "खोल",
    "चलो",
    "ले चलो",
    "पेज",
    "दाखवा",
    "उघडा",
    "उघड",
    "चालू करा",
  ]);

  if (!wantsToOpen) return undefined;

  if (hasAny(q, ["murrah", "mura", "मुर्रा", "मुरहा"])) return "/buffaloes/murrah";
  if (hasAny(q, ["jaffarabadi", "jafrabadi", "jafar", "जाफराबादी", "जफराबादी", "जाफराबाद"])) return "/buffaloes/jaffarabadi";
  if (hasAny(q, ["nili", "ravi", "panch kalyani", "नीली", "रावी", "पंचकल्याणी"])) return "/buffaloes/nili-ravi";
  if (hasAny(q, ["surti", "सूरती", "सुरती"])) return "/buffaloes/surti";
  if (hasAny(q, ["mehsana", "mahesana", "मेहसाणा", "महेसाणा", "मेहसाना"])) return "/buffaloes/mehsana";
  if (hasAny(q, ["banni", "kutch", "बन्नी", "कच्छ"])) return "/buffaloes/banni";
  if (hasAny(q, ["pandharpuri", "pandharpur", "पंढरपुरी", "पंढरपुर"])) return "/buffaloes/pandharpuri";
  if (hasAny(q, ["nagpuri", "nagpur", "नागपुरी", "नागपुर"])) return "/buffaloes/nagpuri";
  if (hasAny(q, ["bhadawari", "bhadawar", "भदावरी", "भदावर"])) return "/buffaloes/bhadawari";
  if (hasAny(q, ["godavari", "गोदावरी"])) return "/buffaloes/godavari";

  if (hasAny(q, ["gallery", "photo", "video", "image", "गैलरी", "गॅलरी", "फोटो", "वीडियो", "व्हिडिओ", "तस्वीर"])) {
    return "/gallery";
  }
  if (hasAny(q, ["book inquiry", "book", "booking", "बुक", "इंक्वायरी बुक", "चौकशी नोंदवा"])) {
    return "/dashboard/book-inquiry";
  }
  if (hasAny(q, ["my inquiries", "my inquiry", "track inquiry", "मेरी इंक्वायरी", "माझी चौकशी"])) {
    return "/dashboard/my-inquiries";
  }
  if (hasAny(q, ["history", "my history", "हिस्ट्री", "इतिहास"])) {
    return "/dashboard/my-history";
  }
  if (hasAny(q, ["profile", "my profile", "प्रोफाइल", "प्रोफाईल"])) {
    return "/dashboard/profile";
  }
  if (hasAny(q, ["setting", "settings", "सेटिंग", "सेटिंग्ज"])) {
    return "/dashboard/settings";
  }
  if (hasAny(q, ["dashboard", "portal", "डैशबोर्ड", "डॅशबोर्ड"])) {
    return "/dashboard";
  }
  if (hasAny(q, ["admin", "एडमिन", "ॲडमिन"])) {
    return "/admin";
  }
  if (hasAny(q, ["register", "signup", "sign up", "create account", "रजिस्टर", "नया अकाउंट", "नोंदणी", "नवीन खाते"])) {
    return "/register";
  }
  if (hasAny(q, ["forgot password", "reset password", "पासवर्ड भूल", "पासवर्ड रीसेट", "पासवर्ड विसरलो"])) {
    return "/forgot-password";
  }
  if (hasAny(q, ["login", "sign in", "लॉगिन", "लॉग इन"])) {
    return "/login";
  }
  if (hasAny(q, ["contact", "map", "address", "location", "कॉन्टैक्ट", "संपर्क", "मैप", "नक्शा", "पता", "पत्ता"])) {
    return "/contact";
  }
  if (hasAny(q, ["about", "story", "founder", "akil", "salim", "अबाउट", "हमारे बारे में", "अकील", "सलीम", "आमच्याबद्दल"])) {
    return "/about";
  }
  if (hasAny(q, ["buffalo", "breed", "catalog", "भैंस", "नस्ल", "म्हैस", "म्हशी"])) {
    return "/buffaloes";
  }
  if (hasAny(q, ["home", "मुख्य पेज", "होम पेज", "मुख्य पृष्ठ"])) {
    return "/";
  }

  return undefined;
}

interface MultilingualTopic {
  id: string;
  match: (q: string) => boolean;
  score: (q: string) => number;
  build: (
    q: string,
    lang: SupportedLangMode,
    ctx?: UserAiContext,
    navUrl?: string
  ) => AiAssistantReply;
}

const TOPICS: MultilingualTopic[] = [
  // 1. Direct Navigation / Page Opening Commands
  {
    id: "direct_page_navigation",
    match: (q) => Boolean(detectNavigationCommand(q)),
    score: (q) => {
      const nav = detectNavigationCommand(q);
      if (!nav) return 0;
      if (hasAny(q, ["page", "पेज", "open", "kholo", "खोलो", "उघडा", "le chalo", "ले चलो"])) return 14;
      return 6; // Let specific breed/topic score higher if they asked a detailed question, while still passing navUrl!
    },
    build: (_q, lang, _ctx, navUrl) => {
      const target = navUrl || "/";
      const pageNames: Record<string, { hi: string; mr: string; en: string }> = {
        "/": { hi: "होम पेज", mr: "होम पेज", en: "Home page" },
        "/buffaloes": { hi: "सभी 10 भैंसों की नस्लों का पेज", mr: "सर्व १० म्हशींच्या जातींचे पेज", en: "10 Buffalo Breeds catalog" },
        "/buffaloes/murrah": { hi: "मुर्रा भैंस का पेज", mr: "मुर्रा म्हशीचे पेज", en: "Murrah Buffaloes page" },
        "/buffaloes/jaffarabadi": { hi: "जाफराबादी भैंस का पेज", mr: "जाफराबादी म्हशीचे पेज", en: "Jaffarabadi Buffaloes page" },
        "/buffaloes/nili-ravi": { hi: "नीली-रावी भैंस का पेज", mr: "नीली-रावी म्हशीचे पेज", en: "Nili-Ravi Buffaloes page" },
        "/buffaloes/surti": { hi: "सूरती भैंस का पेज", mr: "सूरती म्हशीचे पेज", en: "Surti Buffaloes page" },
        "/buffaloes/mehsana": { hi: "मेहसाणा भैंस का पेज", mr: "मेहसाणा म्हशीचे पेज", en: "Mehsana Buffaloes page" },
        "/buffaloes/banni": { hi: "बन्नी भैंस का पेज", mr: "बन्नी म्हशीचे पेज", en: "Banni Buffaloes page" },
        "/buffaloes/pandharpuri": { hi: "पंढरपुरी भैंस का पेज", mr: "पंढरपुरी म्हशीचे पेज", en: "Pandharpuri Buffaloes page" },
        "/buffaloes/nagpuri": { hi: "नागपुरी भैंस का पेज", mr: "नागपुरी म्हशीचे पेज", en: "Nagpuri Buffaloes page" },
        "/buffaloes/bhadawari": { hi: "भदावरी भैंस का पेज", mr: "भदावरी म्हशीचे पेज", en: "Bhadawari Buffaloes page" },
        "/buffaloes/godavari": { hi: "गोदावरी भैंस का पेज", mr: "गोदावरी म्हशीचे पेज", en: "Godavari Buffaloes page" },
        "/gallery": { hi: "फोटो और वीडियो गैलरी", mr: "फोटो आणि व्हिडिओ गॅलरी", en: "Photos & Videos Gallery" },
        "/about": { hi: "हमारे बारे में (About Us) पेज", mr: "आमच्याबद्दल (About Us) पेज", en: "About Us page" },
        "/contact": { hi: "संपर्क और गूगल मैप पेज", mr: "संपर्क आणि गुगल मॅप पेज", en: "Contact & Google Map page" },
        "/dashboard": { hi: "यूजर डैशबोर्ड", mr: "युजर डॅशबोर्ड", en: "User Dashboard" },
        "/dashboard/book-inquiry": { hi: "इंक्वायरी बुकिंग फॉर्म", mr: "चौकशी बुकिंग फॉर्म", en: "Book Inquiry page" },
        "/dashboard/my-inquiries": { hi: "आपकी इंक्वायरी का पेज", mr: "तुमच्या चौकशीचे पेज", en: "My Inquiries page" },
        "/dashboard/my-history": { hi: "आपकी हिस्ट्री का पेज", mr: "तुमच्या हिस्ट्रीचे पेज", en: "My History page" },
        "/dashboard/profile": { hi: "प्रोफाइल पेज", mr: "प्रोफाईल पेज", en: "Profile page" },
        "/dashboard/settings": { hi: "सेटिंग्स पेज", mr: "सेटिंग्ज पेज", en: "Settings page" },
        "/login": { hi: "लॉगिन पेज", mr: "लॉगिन पेज", en: "Login page" },
        "/register": { hi: "अकाउंट रजिस्ट्रेशन पेज", mr: "खाते नोंदणी पेज", en: "Registration page" },
        "/forgot-password": { hi: "पासवर्ड रीसेट पेज", mr: "पासवर्ड रीसेट पेज", en: "Forgot Password page" },
        "/admin": { hi: "एडमिन पैनल", mr: "ॲडमिन पॅनल", en: "Admin Panel" },
      };
      const label = pageNames[target] || { hi: "वह पेज", mr: "ते पेज", en: "that page" };

      if (lang === "mr-IN") {
        return {
          text: `✅ **${label.mr} उघडत आहे...**\n\nमी आपल्यासाठी **${label.mr}** स्क्रीनवर उघडले आहे. आपल्याला यामध्ये अजून काही माहिती हवी असल्यास नक्की सांगा!`,
          voiceText: `हो नक्कीच! मी तुमच्यासाठी ${label.mr} उघडले आहे. बोला, यामध्ये तुम्हाला काय माहिती हवी आहे?`,
          navigateTo: target,
          quickActions: [{ label: `Open ${label.en}`, url: target }],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `✅ **${label.hi} खोला जा रहा है...**\n\nजी, मैंने आपके लिए **${label.hi}** आपकी स्क्रीन पर खोल दिया है। इसके बारे में कुछ और पूछना हो तो बताइए!`,
          voiceText: `जी बिल्कुल! मैंने आपके लिए ${label.hi} खोल दिया है। बताइए, इसमें आपको क्या जानकारी चाहिए?`,
          navigateTo: target,
          quickActions: [{ label: `Open ${label.en}`, url: target }],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `✅ **Opening ${label.en}...**\n\nI have opened the **${label.en}** on your screen. Please tell me what else you would like to know!`,
          voiceText: `Sure ji! I have opened the ${label.en} on your screen. Please tell me what else you would like to check.`,
          navigateTo: target,
          quickActions: [{ label: `Open ${label.en}`, url: target }],
        };
      }
      return {
        text: `✅ **Opening ${label.en}...**\n\nI've navigated to the **${label.en}** for you. Let me know what else I can help you with!`,
        voiceText: `Sure thing! I've opened the ${label.en} for you. What else can I help you find?`,
        navigateTo: target,
        quickActions: [{ label: `Open ${label.en}`, url: target }],
      };
    },
  },

  // 2. Murrah Buffalo Breed
  {
    id: "murrah_breed",
    match: (q) => hasAny(q, ["murrah", "mura", "black gold", "मुर्रा", "मुरहा", "मुर्रा भैंस", "मुर्रा म्हैस"]),
    score: (q) => (hasAny(q, ["murrah", "मुर्रा", "मुरहा"]) ? 12 : 8),
    build: (_q, lang, _ctx, navUrl) => {
      const navigateTo = navUrl || undefined;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **मुर्रा म्हैस (Murrah Buffalo — 'ब्लॅक गोल्ड'):**\n\n• **किंमत:** ₹८०,००० ते ₹१,६०,००० (५ श्रेणी उपलब्ध)\n• **दैनंदिन दूध क्षमता:** दररोज **१० ते १६+ लिटर** (७% ते ८% फॅट)\n• **वजन आणि वय:** ४५० ते ६०० किलो | वय ३ ते ६ वर्षे\n• **वैशिष्ट्ये:** गडद काळा रंग, लहान व गोलाकार वळलेली शिंगे, शांत स्वभाव आणि सर्वाधिक दुधाचे उत्पादन.`,
          voiceText: `आमच्या फार्मवर मुर्रा म्हैस ८० हजारांपासून १ लाख ६० हजारांपर्यंत उपलब्ध आहे. ही म्हैस दररोज १० ते १६ लिटरपर्यंत दूध देते आणि तिचा फॅट ७ ते ८ टक्के असतो. तुम्हाला मुर्रा म्हशींचे फोटो पाहायचे आहेत का?`,
          navigateTo,
          quickActions: [
            { label: "मुर्रा म्हैस पहा (Murrah)", url: "/buffaloes/murrah" },
            { label: "WhatsApp चौकशी", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **मुर्रा भैंस (Murrah Buffalo — 'ब्लैक गोल्ड'):**\n\n• **कीमत:** ₹80,000 से ₹1,60,000 (5 अलग-अलग बजट रेंज में उपलब्ध)\n• **रोज़ाना दूध:** **10 से 16+ लीटर प्रतिदिन** (7% से 8% फैट)\n• **वज़न और उम्र:** 450 से 600 किलो | उम्र 3 से 6 साल\n• **पहचान:** गहरा काला रंग, छोटे और जलेबी जैसे मुड़े हुए सींग, शांत स्वभाव और डेयरी बिजनेस के लिए सबसे ज्यादा मुनाफे वाली नस्ल।`,
          voiceText: `जी, मुर्रा भैंस हमारे फार्म की सबसे लोकप्रिय नस्ल है। इसकी कीमत अस्सी हज़ार से एक लाख साठ हज़ार रुपये तक है, और यह रोज़ाना दस से सोलह लीटर तक दूध देती है। क्या आप मुर्रा भैंस देखना या बुक करना चाहते हैं?`,
          navigateTo,
          quickActions: [
            { label: "मुर्रा भैंस देखें (Murrah)", url: "/buffaloes/murrah" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🐃 **Murrah Buffalo ("Black Gold" of Dairy):**\n\n• **Price Range:** ₹80,000 – ₹1,60,000 (5 listings available)\n• **Daily Milk Yield:** **10 to 16+ Litres/day** (7% to 8% butterfat)\n• **Weight & Age:** 450 – 600 kg | Age: 3 – 6 years\n• **Key Features:** Jet-black coat, tightly curled spiral horns, docile nature, and the highest commercial milk yield in India.`,
          voiceText: `At AK Buffaloes, our Murrah buffaloes are priced between 80,000 and 1,60,000 Rupees. They produce 10 to 16 litres of milk daily with 7 to 8 percent fat. Would you like me to open the Murrah listings for you?`,
          navigateTo,
          quickActions: [
            { label: "View Murrah Buffaloes", url: "/buffaloes/murrah" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `🐃 **Murrah Buffalo ("Black Gold" of Dairy):**\n\n• **Price Range:** ₹80,000 – ₹1,60,000 (5 listings available)\n• **Daily Milk Yield:** **10 to 16+ Liters/day** (7% to 8% butterfat)\n• **Weight & Age:** 450 – 600 kg | Age: 3 – 6 years\n• **Traits:** Jet-black skin, tightly curled horns, gentle temperament, and top milk production.`,
        voiceText: `Our Murrah buffaloes range from 80,000 to 160,000 Rupees and produce 10 to 16 liters of rich milk per day. Would you like to check out our available Murrah listings?`,
        navigateTo,
        quickActions: [
          { label: "View Murrah Buffaloes", url: "/buffaloes/murrah" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 3. Jaffarabadi Buffalo Breed
  {
    id: "jaffarabadi_breed",
    match: (q) => hasAny(q, ["jaffarabadi", "jafrabadi", "jafar", "gir buffalo", "जाफराबादी", "जफराबादी", "जाफराबाद"]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const navigateTo = navUrl || undefined;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **जाफराबादी म्हैस (Jaffarabadi — सर्वात शक्तिशाली जात):**\n\n• **किंमत:** ₹१,००,००० ते ₹२,००,०००\n• **दैनंदिन दूध:** **१० ते १४+ लिटर प्रतिदिन**\n• **फॅट प्रमाण:** **८.५% ते ९.५%** (देशी तूप आणि खव्यासाठी सर्वोत्तम!)\n• **वजन:** ५५० ते ७५० किलो (भारतातील सर्वात जास्त वजनाची म्हैस, मोठी झुकलेली शिंगे).`,
          voiceText: `जाफराबादी ही सर्वात मोठ्या आकाराची म्हैस आहे. तिची किंमत १ लाख ते २ लाख रुपयांपर्यंत आहे. ही दररोज १० ते १४ लिटर दूध देते आणि दुधात साडेआठ ते साडेनऊ टक्के फॅट मिळतो. तुम्हाला जाफराबादी म्हैस पाहायची आहे का?`,
          navigateTo,
          quickActions: [
            { label: "जाफराबादी पहा", url: "/buffaloes/jaffarabadi" },
            { label: "WhatsApp चौकशी", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **जाफराबादी भैंस (Jaffarabadi — सबसे भारी और ज्यादा फैट वाली नस्ल):**\n\n• **कीमत:** ₹1,00,000 से ₹2,00,000\n• **रोज़ाना दूध:** **10 से 14+ लीटर प्रतिदिन**\n• **फैट (Butterfat):** **8.5% से 9.5%** (देसी घी, मावा और पनीर के लिए नंबर-1!)\n• **वज़न और पहचान:** 550 से 750 किलो वज़न, चौड़ा माथा और नीचे की ओर मुड़े हुए भारी सींग।`,
          voiceText: `जी, जाफराबादी सबसे भारी नस्ल की भैंस है। हमारे फार्म पर इसकी कीमत एक लाख से दो लाख रुपये तक है। यह रोज़ाना दस से चौदह लीटर दूध देती है जिसमें नौ प्रतिशत तक गाढ़ा फैट आता है। क्या आप इसके फोटो देखना चाहेंगे?`,
          navigateTo,
          quickActions: [
            { label: "जाफराबादी भैंस देखें", url: "/buffaloes/jaffarabadi" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🐃 **Jaffarabadi Buffalo (Heaviest High-Fat Breed):**\n\n• **Price Range:** ₹1,00,000 – ₹2,00,000\n• **Daily Milk Yield:** **10 to 14+ Litres/day**\n• **Butterfat:** **8.5% to 9.5%** (highest fat among all Indian breeds, ideal for pure desi ghee)\n• **Weight:** 550 – 750 kg with broad forehead and heavy drooping horns.`,
          voiceText: `Jaffarabadi is our heaviest buffalo breed, priced from 1 lakh to 2 lakh Rupees. It gives 10 to 14 litres of milk daily with up to 9.5 percent fat, which is best for ghee. Would you like to view our Jaffarabadi buffaloes?`,
          navigateTo,
          quickActions: [
            { label: "View Jaffarabadi", url: "/buffaloes/jaffarabadi" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `🐃 **Jaffarabadi Buffalo (Heavyweight High-Fat Breed):**\n\n• **Price Range:** ₹1,00,000 – ₹2,00,000\n• **Daily Milk Yield:** **10 to 14+ Liters/day**\n• **Butterfat:** **8.5% to 9.5%** (highest butterfat, perfect for ghee and dairy sweets)\n• **Weight:** 550 – 750 kg with signature drooping horns.`,
        voiceText: `Our Jaffarabadi buffaloes are priced between 100,000 and 200,000 Rupees. They produce 10 to 14 liters of milk a day with up to 9.5 percent butterfat. Would you like to see our Jaffarabadi listings?`,
        navigateTo,
        quickActions: [
          { label: "View Jaffarabadi", url: "/buffaloes/jaffarabadi" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 4. Nili-Ravi Buffalo Breed
  {
    id: "nili_ravi_breed",
    match: (q) => hasAny(q, ["nili", "ravi", "panch kalyani", "panchkalyani", "नीली", "रावी", "पंचकल्याणी", "निली"]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const navigateTo = navUrl || undefined;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **नीली-रावी म्हैस (Nili-Ravi — 'पंचकल्याणी'):**\n\n• **किंमत:** ₹७५,००० ते ₹१,५०,०००\n• **दैनंदिन दूध:** **८ ते १३+ लिटर प्रतिदिन**\n• **वैशिष्ट्ये:** कपाळावर, पायावर आणि शेपटीवर ५ पांढरे डाग (पंचकल्याणी), अत्यंत शांत स्वभाव आणि नियमित दूध उत्पादन.`,
          voiceText: `नीली-रावी म्हशीला पंचकल्याणी म्हणतात. आमच्या फार्मवर तिची किंमत ७५ हजारांपासून १ लाख ५० हजारांपर्यंत आहे आणि ती रोज ८ ते १३ लिटर दूध देते. तुम्हाला नीली-रावी म्हैस पाहायची आहे का?`,
          navigateTo,
          quickActions: [
            { label: "नीली-रावी पहा", url: "/buffaloes/nili-ravi" },
            { label: "WhatsApp चौकशी", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **नीली-रावी भैंस (Nili-Ravi — 'पंचकल्याणी'):**\n\n• **कीमत:** ₹75,000 से ₹1,50,000\n• **रोज़ाना दूध:** **8 से 13+ लीटर प्रतिदिन**\n• **पहचान:** माथे, पैरों और पूंछ पर 5 शुभ सफेद निशान (पंचकल्याणी), बिल्लौरी आंखें और बेहद सीधा-शांत स्वभाव।`,
          voiceText: `जी, नीली-रावी भैंस को पंचकल्याणी भी कहते हैं। इसकी कीमत पचहत्तर हज़ार से डेढ़ लाख रुपये तक है और यह रोज़ाना आठ से तेरह लीटर दूध आराम से देती है। क्या आप नीली-रावी भैंस देखना चाहते हैं?`,
          navigateTo,
          quickActions: [
            { label: "नीली-रावी भैंस देखें", url: "/buffaloes/nili-ravi" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🐃 **Nili-Ravi Buffalo ("Panch Kalyani"):**\n\n• **Price Range:** ₹75,000 – ₹1,50,000\n• **Daily Milk Yield:** **8 to 13+ Litres/day**\n• **Traits:** Famous for 5 white markings on forehead, legs, and tail switch, wall eyes, and very docile temperament.`,
          voiceText: `Our Nili-Ravi buffaloes, also called Panch Kalyani, cost between 75,000 and 1,50,000 Rupees and give 8 to 13 litres of milk per day. Shall I show you our Nili-Ravi listings?`,
          navigateTo,
          quickActions: [
            { label: "View Nili-Ravi", url: "/buffaloes/nili-ravi" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `🐃 **Nili-Ravi Buffalo ("Panch Kalyani"):**\n\n• **Price Range:** ₹75,000 – ₹1,50,000\n• **Daily Milk Yield:** **8 to 13+ Liters/day**\n• **Traits:** Known for five white markings, wall eyes, gentle nature, and consistent milk output.`,
        voiceText: `Our Nili-Ravi buffaloes range from 75,000 to 150,000 Rupees and yield 8 to 13 liters of milk daily. Would you like to check out the Nili-Ravi catalog?`,
        navigateTo,
        quickActions: [
          { label: "View Nili-Ravi", url: "/buffaloes/nili-ravi" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 5. Surti Buffalo Breed
  {
    id: "surti_breed",
    match: (q) => hasAny(q, ["surti", "charottar", "सूरती", "सुरती"]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const navigateTo = navUrl || undefined;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **सूरती म्हैस (Surti — कमी खर्चात जास्त फॅट):**\n\n• **किंमत:** ₹७०,००० ते ₹१,४०,०००\n• **दैनंदिन दूध:** **६ ते १० लिटर प्रतिदिन** (७.५% ते ८.२% फॅट)\n• **वैशिष्ट्ये:** मध्यम आकार (४००-५०० किलो), विळ्यासारखी चपटी शिंगे आणि कमी चाऱ्यात उत्तम दूध देणारी किफायतशीर जात.`,
          voiceText: `सूरती म्हैस कमी चाऱ्यात घट्ट दूध देणारी जात आहे. तिची किंमत ७० हजारांपासून १ लाख ४० हजारांपर्यंत आहे आणि ती रोज ६ ते १० लिटर उच्च फॅटचे दूध देते. तुम्हाला सूरती म्हैस पाहायची आहे का?`,
          navigateTo,
          quickActions: [
            { label: "सूरती म्हैस पहा", url: "/buffaloes/surti" },
            { label: "WhatsApp चौकशी", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **सूरती भैंस (Surti — कम चारे में गाढ़ा दूध):**\n\n• **कीमत:** ₹70,000 से ₹1,40,000\n• **रोज़ाना दूध:** **6 से 10 लीटर प्रतिदिन** (7.5% से 8.2% उच्च फैट)\n• **खासियत:** मध्यम शरीर (400–500 किलो), दरांती जैसे चपटे सींग और बहुत कम चारे के खर्च में बढ़िया मुनाफा।`,
          voiceText: `जी, सूरती भैंस छोटे और मध्यम किसानों के लिए बहुत किफायती है। इसकी कीमत सत्तर हज़ार से एक लाख चालीस हज़ार रुपये तक है और यह कम चारे में छह से दस लीटर गाढ़ा दूध देती है। क्या आप सूरती भैंस देखना चाहेंगे?`,
          navigateTo,
          quickActions: [
            { label: "सूरती भैंस देखें", url: "/buffaloes/surti" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🐃 **Surti Buffalo (Economical High-Fat Breed):**\n\n• **Price Range:** ₹70,000 – ₹1,40,000\n• **Daily Milk Yield:** **6 to 10 Litres/day** (7.5% to 8.2% rich fat)\n• **Key Advantage:** Medium compact size, sickle-shaped horns, and very low fodder consumption.`,
          voiceText: `Surti buffaloes are priced between 70,000 and 1,40,000 Rupees. They consume less fodder and give 6 to 10 litres of high-fat milk daily. Would you like to view our Surti listings?`,
          navigateTo,
          quickActions: [
            { label: "View Surti Buffaloes", url: "/buffaloes/surti" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `🐃 **Surti Buffalo (Economical High-Fat Producer):**\n\n• **Price Range:** ₹70,000 – ₹1,40,000\n• **Daily Milk Yield:** **6 to 10 Liters/day** (7.5% – 8.2% butterfat)\n• **Key Advantage:** Compact body, low feed cost, and rich creamy milk.`,
        voiceText: `Our Surti buffaloes cost from 70,000 to 140,000 Rupees and produce 6 to 10 liters of high-fat milk daily with low feed costs. Would you like to see the Surti listings?`,
        navigateTo,
        quickActions: [
          { label: "View Surti Buffaloes", url: "/buffaloes/surti" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 6. Mehsana Buffalo Breed
  {
    id: "mehsana_breed",
    match: (q) => hasAny(q, ["mehsana", "mahesana", "मेहसाणा", "महेसाणा", "मेहसाना"]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const navigateTo = navUrl || undefined;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **मेहसाणा म्हैस (Mehsana — मुर्रा व सूरतीचा संगम):**\n\n• **किंमत:** ₹७५,००० ते ₹१,५०,०००\n• **दैनंदिन दूध:** **८ ते १२ लिटर प्रतिदिन** (७% ते ७.८% फॅट)\n• **वैशिष्ट्ये:** मुर्रा आणि सूरती जातीचे उत्तम गुणधर्म, जास्त काळ दूध देणारी आणि कोणत्याही हवामानात सहज टिकणारी जात.`,
          voiceText: `मेहसाणा म्हैस ही मुर्रा आणि सूरती जातीचा उत्तम संगम आहे. तिची किंमत ७५ हजारांपासून १ लाख ५० हजारांपर्यंत आहे आणि ती रोज ८ ते १२ लिटर दूध देते. तुम्हाला मेहसाणा म्हशी पाहायच्या आहेत का?`,
          navigateTo,
          quickActions: [
            { label: "मेहसाणा म्हैस पहा", url: "/buffaloes/mehsana" },
            { label: "WhatsApp चौकशी", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **मेहसाणा भैंस (Mehsana — मुर्रा और सूरती का बेहतरीन संगम):**\n\n• **कीमत:** ₹75,000 से ₹1,50,000\n• **रोज़ाना दूध:** **8 से 12 लीटर प्रतिदिन** (7% से 7.8% फैट)\n• **खासियत:** लंबे समय तक दूध देने की क्षमता, हर मौसम में ढलने वाली और नियमित ब्याने वाली नस्ल।`,
          voiceText: `जी, मेहसाणा भैंस मुर्रा और सूरती के गुणों से भरपूर होती है। इसकी कीमत पचहत्तर हज़ार से डेढ़ लाख रुपये तक है और यह रोज़ाना आठ से बारह लीटर दूध देती है। क्या आप मेहसाणा भैंस देखना चाहते हैं?`,
          navigateTo,
          quickActions: [
            { label: "मेहसाणा भैंस देखें", url: "/buffaloes/mehsana" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🐃 **Mehsana Buffalo (Murrah × Surti Crossbreed):**\n\n• **Price Range:** ₹75,000 – ₹1,50,000\n• **Daily Milk Yield:** **8 to 12 Litres/day** (7% to 7.8% fat)\n• **Traits:** Long lactation cycle, regular calving, and strong weather adaptability.`,
          voiceText: `Mehsana buffaloes combine the best traits of Murrah and Surti. They are priced between 75,000 and 1,50,000 Rupees and give 8 to 12 litres of milk per day. Shall I open the Mehsana page for you?`,
          navigateTo,
          quickActions: [
            { label: "View Mehsana Buffaloes", url: "/buffaloes/mehsana" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `🐃 **Mehsana Buffalo (Murrah × Surti Cross):**\n\n• **Price Range:** ₹75,000 – ₹1,50,000\n• **Daily Milk Yield:** **8 to 12 Liters/day** (7% – 7.8% fat)\n• **Traits:** Long lactation period, high disease resistance, and regular calving.`,
        voiceText: `Our Mehsana buffaloes cost from 75,000 to 150,000 Rupees and produce 8 to 12 liters of milk daily with long lactation cycles. Would you like to view our Mehsana listings?`,
        navigateTo,
        quickActions: [
          { label: "View Mehsana Buffaloes", url: "/buffaloes/mehsana" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 6b. Banni, Pandharpuri, Nagpuri, Bhadawari & Godavari Breeds
  {
    id: "additional_five_breeds",
    match: (q) =>
      hasAny(q, [
        "banni",
        "बन्नी",
        "pandharpuri",
        "pandharpur",
        "पंढरपुरी",
        "nagpuri",
        "नागपुरी",
        "bhadawari",
        "bhadawar",
        "भदावरी",
        "godavari",
        "गोदावरी",
      ]),
    score: () => 12,
    build: (q, lang, _ctx, navUrl) => {
      const isBanni = hasAny(q, ["banni", "बन्नी"]);
      const isPandharpuri = hasAny(q, ["pandharpuri", "pandharpur", "पंढरपुरी"]);
      const isNagpuri = hasAny(q, ["nagpuri", "नागपुरी"]);
      const isBhadawari = hasAny(q, ["bhadawari", "bhadawar", "भदावरी"]);
      const slug = isBanni
        ? "banni"
        : isPandharpuri
        ? "pandharpuri"
        : isNagpuri
        ? "nagpuri"
        : isBhadawari
        ? "bhadawari"
        : "godavari";
      const breedTitle = isBanni
        ? "Banni (बन्नी)"
        : isPandharpuri
        ? "Pandharpuri (पंढरपुरी)"
        : isNagpuri
        ? "Nagpuri (नागपुरी)"
        : isBhadawari
        ? "Bhadawari (भदावरी)"
        : "Godavari (गोदावरी)";
      const priceStr = isBanni
        ? "₹85,000 – ₹1,65,000"
        : isPandharpuri
        ? "₹70,000 – ₹1,45,000"
        : isNagpuri
        ? "₹65,000 – ₹1,35,000"
        : isBhadawari
        ? "₹70,000 – ₹1,40,000"
        : "₹75,000 – ₹1,50,000";
      const milkStr = isBanni
        ? "9 to 14 L/day"
        : isPandharpuri
        ? "7 to 11 L/day"
        : isNagpuri
        ? "6 to 10 L/day"
        : isBhadawari
        ? "6 to 9.5 L/day (up to 12.5% butterfat)"
        : "8 to 12 L/day";
      const navigateTo = navUrl || undefined;

      if (lang === "mr-IN") {
        return {
          text: `🐃 **${breedTitle} म्हैस:**\n\n• **किंमत:** ${priceStr} (५ श्रेणी उपलब्ध)\n• **दैनंदिन दूध:** ${milkStr}\n• **स्टॉक आणि माहिती:** प्रत्येक जातीमध्ये ५ उत्तम म्हशी उपलब्ध आहेत.`,
          voiceText: `आमच्या फार्मवर ${breedTitle} म्हैस ${priceStr} या किमतीत उपलब्ध आहे आणि ती दररोज ${milkStr} दूध देते. तुम्हाला या जातीच्या म्हशी पाहायच्या आहेत का?`,
          navigateTo,
          quickActions: [
            { label: `${breedTitle} पहा`, url: `/buffaloes/${slug}` },
            { label: "सर्व १० जाती पहा", url: "/buffaloes" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **${breedTitle} भैंस:**\n\n• **कीमत:** ${priceStr} (5 बजट रेंज में उपलब्ध)\n• **रोज़ाना दूध:** ${milkStr}\n• **स्टॉक:** हमारे पास इस नस्ल की 5 बेहतरीन भैंसें उपलब्ध हैं।`,
          voiceText: `जी, हमारे फार्म पर ${breedTitle} भैंस ${priceStr} की रेंज में उपलब्ध है और यह रोज़ाना ${milkStr} दूध देती है। क्या आप इसके फोटो और कीमत देखना चाहेंगे?`,
          navigateTo,
          quickActions: [
            { label: `${breedTitle} देखें`, url: `/buffaloes/${slug}` },
            { label: "सभी 10 नस्लें देखें", url: "/buffaloes" },
          ],
        };
      }
      return {
        text: `🐃 **${breedTitle} Buffalo:**\n\n• **Price Range:** ${priceStr} (5 listings available)\n• **Daily Milk Yield:** **${milkStr}**\n• **Availability:** 5 verified listings across 5 price ranges ready for direct enquiry.`,
        voiceText: `Our ${breedTitle} buffaloes are priced between ${priceStr} and produce ${milkStr}. Would you like me to open the ${breedTitle} listings for you?`,
        navigateTo,
        quickActions: [
          { label: `View ${breedTitle}`, url: `/buffaloes/${slug}` },
          { label: "View All 10 Breeds", url: "/buffaloes" },
        ],
      };
    },
  },

  // 7. All Breeds / Which Buffaloes Do You Have / Stock Overview
  {
    id: "all_breeds_overview",
    match: (q) =>
      hasAny(q, [
        "which breed",
        "what breed",
        "all breed",
        "how many breed",
        "buffalo breed",
        "kaun si bhains",
        "kon si bhains",
        "kitni nasl",
        "kaun kaun si",
        "आपके पास कौन",
        "कौन सी भैंस",
        "कौन-कौन सी",
        "कितनी नस्ल",
        "भैंस की जानकारी",
        "भैंस के बारे में",
        "कोणत्या म्हशी",
        "किती जाती",
        "म्हशींची माहिती",
        "available buffalo",
        "kitni bhains hai",
        "स्टॉक",
        "उपलब्ध",
      ]),
    score: () => 10,
    build: (_q, lang, ctx, navUrl) => {
      const count = ctx?.availableBuffaloesCount || 50;
      if (lang === "mr-IN") {
        return {
          text: `🐃 **AK Buffaloes कडील १० प्रमुख म्हशींच्या जाती (${count} म्हशी उपलब्ध):**\n\n1. **मुर्रा (Murrah):** ₹८०,००० – ₹१,६०,०००\n2. **नीली-रावी (Nili-Ravi):** ₹७५,००० – ₹१,५०,०००\n3. **जाफराबादी (Jaffarabadi):** ₹१,००,००० – ₹२,००,०००\n4. **सूरती (Surti):** ₹७०,००० – ₹१,४०,०००\n5. **मेहसाणा (Mehsana):** ₹७५,००० – ₹१,५०,०००\n6. **बन्नी (Banni):** ₹८५,००० – ₹१,६५,०००\n7. **पंढरपुरी (Pandharpuri):** ₹७०,००० – ₹१,४५,०००\n8. **नागपुरी (Nagpuri):** ₹६५,००० – ₹१,३५,०००\n9. **भदावरी (Bhadawari):** ₹७०,००० – ₹१,४०,०००\n10. **गोदावरी (Godavari):** ₹७५,००० – ₹१,५०,०००`,
          voiceText: `आमच्या फार्मवर मुर्रा, नीली-रावी, जाफराबादी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी आणि गोदावरी अशा एकूण १० उच्च जातींच्या ${count} म्हशी उपलब्ध आहेत. तुम्हाला कोणत्या जातीबद्दल माहिती हवी आहे?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "सर्व १० जाती पहा", url: "/buffaloes" },
            { label: "मुर्रा म्हैस", url: "/buffaloes/murrah" },
            { label: "पंढरपुरी म्हैस", url: "/buffaloes/pandharpuri" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🐃 **AK Buffaloes पर उपलब्ध 10 प्रीमियम नस्लें (अभी ${count} भैंसें उपलब्ध हैं):**\n\n1. **मुर्रा (Murrah):** ₹80,000 – ₹1,60,000\n2. **नीली-रावी (Nili-Ravi):** ₹75,000 – ₹1,50,000\n3. **जाफराबादी (Jaffarabadi):** ₹1,00,000 – ₹2,00,000\n4. **सूरती (Surti):** ₹70,000 – ₹1,40,000\n5. **मेहसाणा (Mehsana):** ₹75,000 – ₹1,50,000\n6. **बन्नी (Banni):** ₹85,000 – ₹1,65,000\n7. **पंढरपुरी (Pandharpuri):** ₹70,000 – ₹1,45,000\n8. **नागपुरी (Nagpuri):** ₹65,000 – ₹1,35,000\n9. **भदावरी (Bhadawari):** ₹70,000 – ₹1,40,000\n10. **गोदावरी (Godavari):** ₹75,000 – ₹1,50,000`,
          voiceText: `जी, हमारे फार्म पर दस सबसे बेहतरीन नस्ल की भैंसें उपलब्ध हैं — मुर्रा, नीली-रावी, जाफराबादी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी और गोदावरी। अभी हमारे कैटलॉग में पचास भैंसें उपलब्ध हैं। आप किस नस्ल के बारे में जानना चाहेंगे?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "सभी 10 नस्लें देखें", url: "/buffaloes" },
            { label: "मुर्रा भैंस", url: "/buffaloes/murrah" },
            { label: "बन्नी भैंस", url: "/buffaloes/banni" },
          ],
        };
      }
      return {
        text: `🐃 **10 Premium Buffalo Breeds at AK Buffaloes (${count} Available Now):**\n\n1. **Murrah:** ₹80,000 – ₹1,60,000 (8–14 L/day)\n2. **Nili-Ravi:** ₹75,000 – ₹1,50,000 (7–12 L/day)\n3. **Jaffarabadi:** ₹1,00,000 – ₹2,00,000 (8–12 L/day, highest fat)\n4. **Surti:** ₹70,000 – ₹1,40,000 (6–9 L/day)\n5. **Mehsana:** ₹75,000 – ₹1,50,000 (7–11 L/day)\n6. **Banni:** ₹85,000 – ₹1,65,000 (9–14 L/day)\n7. **Pandharpuri:** ₹70,000 – ₹1,45,000 (7–11 L/day)\n8. **Nagpuri:** ₹65,000 – ₹1,35,000 (6–10 L/day)\n9. **Bhadawari:** ₹70,000 – ₹1,40,000 (6–9.5 L/day, 12.5% fat)\n10. **Godavari:** ₹75,000 – ₹1,50,000 (8–12 L/day)`,
        voiceText: `We have 10 top buffalo breeds at AK Buffaloes: Murrah, Nili-Ravi, Jaffarabadi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari, and Godavari, with ${count} buffaloes in stock. Which breed would you like to explore?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Browse All 10 Breeds", url: "/buffaloes" },
          { label: "Murrah", url: "/buffaloes/murrah" },
          { label: "Banni", url: "/buffaloes/banni" },
        ],
      };
    },
  },

  // 8. Highest Milk Yield / Milk Capacity
  {
    id: "highest_milk_yield",
    match: (q) =>
      hasAny(q, [
        "highest milk",
        "most milk",
        "best milk",
        "maximum milk",
        "milk yield",
        "milk capacity",
        "jyada doodh",
        "zyada doodh",
        "kitna doodh",
        "doodh kitna",
        "dudh kitna",
        "दूध कितना",
        "कितना दूध",
        "सबसे ज्यादा दूध",
        "ज्यादा दूध",
        "दूध क्षमता",
        "किती दूध",
        "दूध किती",
        "जास्त दूध",
        "सर्वाधिक दूध",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🥛 **सर्वाधिक दूध देणाऱ्या म्हशींच्या जाती:**\n\n1. 🥇 **मुर्रा (Murrah):** दररोज **१० ते १६+ लिटर** दूध (सर्वाधिक दूध उत्पादन).\n2. 🥈 **जाफराबादी (Jaffarabadi):** दररोज **१० ते १४+ लिटर** दूध (८.५%–९.५% सर्वाधिक फॅट).\n3. 🥉 **नीली-रावी (Nili-Ravi):** दररोज **८ ते १३ लिटर** दूध.\n4. **मेहसाणा (Mehsana):** दररोज **८ ते १२ लिटर** दूध.\n5. **सूरती (Surti):** दररोज **६ ते १० लिटर** घट्ट दूध.`,
          voiceText: `आमच्या फार्मवर मुर्रा म्हैस सर्वात जास्त म्हणजे रोज १० ते १६ लिटरपर्यंत दूध देते. आणि जर तुम्हाला जास्त फॅट हवे असेल, तर जाफराबादी म्हैस १० ते १४ लिटर दूध आणि ९ टक्के फॅट देते. तुम्हाला कोणती म्हैस चालेल?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "मुर्रा म्हैस पहा", url: "/buffaloes/murrah" },
            { label: "जाफराबादी पहा", url: "/buffaloes/jaffarabadi" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🥛 **सबसे ज्यादा दूध देने वाली भैंस की नस्लें:**\n\n1. 🥇 **मुर्रा (Murrah):** रोज़ाना **10 से 16+ लीटर** दूध (सबसे ज्यादा दूध उत्पादन)।\n2. 🥈 **जाफराबादी (Jaffarabadi):** रोज़ाना **10 से 14+ लीटर** दूध (8.5%–9.5% सबसे ज्यादा फैट)।\n3. 🥉 **नीली-रावी (Nili-Ravi):** रोज़ाना **8 से 13 लीटर** दूध।\n4. **मेहसाणा (Mehsana):** रोज़ाना **8 से 12 लीटर** दूध।\n5. **सूरती (Surti):** रोज़ाना **6 से 10 लीटर** गाढ़ा दूध।`,
          voiceText: `जी, सबसे ज्यादा दूध मुर्रा भैंस देती है — रोज़ाना दस से सोलह लीटर तक। और अगर आपको घी या मावे के लिए सबसे ज्यादा फैट चाहिए, तो जाफराबादी भैंस दस से चौदह लीटर दूध और नौ प्रतिशत फैट देती है। आप दोनों समय लाइव मिल्किंग टेस्ट भी देख सकते हैं!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "मुर्रा भैंस देखें", url: "/buffaloes/murrah" },
            { label: "जाफराबादी देखें", url: "/buffaloes/jaffarabadi" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🥛 **Highest Milk Producing Breeds at AK Buffaloes:**\n\n1. 🥇 **Murrah:** **10 to 16+ Litres/day** (7–8% fat, #1 commercial milk yield).\n2. 🥈 **Jaffarabadi:** **10 to 14+ Litres/day** (8.5–9.5% highest butterfat).\n3. 🥉 **Nili-Ravi:** **8 to 13 Litres/day**.\n4. **Mehsana:** **8 to 12 Litres/day**.\n5. **Surti:** **6 to 10 Litres/day** with low feed cost.`,
          voiceText: `Murrah gives the highest milk yield at our farm, producing 10 to 16 litres per day. For the highest butterfat up to 9.5 percent, Jaffarabadi is the best choice at 10 to 14 litres daily. Which one suits your dairy requirement?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Explore Murrah", url: "/buffaloes/murrah" },
            { label: "Explore Jaffarabadi", url: "/buffaloes/jaffarabadi" },
          ],
        };
      }
      return {
        text: `🥛 **Top Milk-Producing Buffalo Breeds:**\n\n1. 🥇 **Murrah:** **10 to 16+ Liters/day** (highest overall milk volume).\n2. 🥈 **Jaffarabadi:** **10 to 14+ Liters/day** (highest butterfat at 8.5–9.5%).\n3. 🥉 **Nili-Ravi:** **8 to 13 Liters/day**.\n4. **Mehsana:** **8 to 12 Liters/day**.\n5. **Surti:** **6 to 10 Liters/day**.`,
        voiceText: `Murrah is our highest milk producer at 10 to 16 liters per day, followed by Jaffarabadi at 10 to 14 liters with 9.5 percent butterfat. Would you like to see our top-yielding Murrah buffaloes?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Explore Murrah", url: "/buffaloes/murrah" },
          { label: "Explore Jaffarabadi", url: "/buffaloes/jaffarabadi" },
        ],
      };
    },
  },

  // 9. Pricing, Rates & Budget
  {
    id: "pricing_budget",
    match: (q) =>
      hasAny(q, [
        "price",
        "cost",
        "rate",
        "budget",
        "keemat",
        "kimat",
        "kitne ki",
        "kitna paisa",
        "bhav",
        "daam",
        "rupees",
        "कीमत",
        "भाव",
        "रेट",
        "दाम",
        "कितने की",
        "कितना पैसा",
        "बजट",
        "किंमत",
        "कितीला",
        "दर",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `💰 **AK Buffaloes किंमत आणि बजेट माहिती:**\n\nआमच्या फार्मवर म्हशींची किंमत **₹७०,००० ते ₹२,००,०००** दरम्यान आहे:\n• **मुर्रा:** ₹८०,००० – ₹१,६०,०००\n• **जाफराबादी:** ₹१,००,००० – ₹२,००,०००\n• **नीली-रावी:** ₹७५,००० – ₹१,५०,०००\n• **सूरती:** ₹७०,००० – ₹१,४०,०००\n• **मेहसाणा:** ₹७५,००० – ₹१,५०,०००\n\nप्रत्येक म्हशीसोबत आरोग्य प्रमाणपत्र आणि थेट मिल्किंग टेस्टची खात्री दिली जाते.`,
          voiceText: `आमच्या फार्मवर म्हशींची किंमत ७० हजारांपासून २ लाखांपर्यंत आहे. सूरती ७० हजारांपासून, नीली-रावी व मेहसाणा ७५ हजारांपासून, मुर्रा ८० हजारांपासून आणि जाफराबादी १ लाखापासून सुरू होते. तुमचे बजेट किती आहे?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "सर्व किमती पहा", url: "/buffaloes" },
            { label: "चौकशी नोंदवा", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `💰 **AK Buffaloes पर भैंसों की कीमत और बजट गाइड:**\n\nहमारे फार्म पर भैंसों की कीमत **₹70,000 से ₹2,00,000** के बीच है (दूध क्षमता और उम्र के अनुसार):\n• **मुर्रा (Murrah):** ₹80,000 – ₹1,60,000\n• **जाफराबादी (Jaffarabadi):** ₹1,00,000 – ₹2,00,000\n• **नीली-रावी (Nili-Ravi):** ₹75,000 – ₹1,50,000\n• **सूरती (Surti):** ₹70,000 – ₹1,40,000\n• **मेहसाणा (Mehsana):** ₹75,000 – ₹1,50,000\n\nहर भैंस के साथ डॉक्टर का फिटनेस सर्टिफिकेट और दोनों टाइम लाइव मिल्किंग टेस्ट की गारंटी मिलती है।`,
          voiceText: `जी, हमारे फार्म पर भैंसों की कीमत सत्तर हज़ार से दो लाख रुपये के बीच है। सूरती सत्तर हज़ार से, मुर्रा अस्सी हज़ार से, और जाफराबादी एक लाख रुपये से शुरू होती है। बताइए, आपका बजट कितना है?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "सभी कीमतें देखें", url: "/buffaloes" },
            { label: "इंक्वायरी बुक करें", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `💰 **AK Buffaloes Price & Budget Guide:**\n\nOur verified buffalo prices range from **₹70,000 to ₹2,00,000** based on milk yield and lactation:\n• **Murrah:** ₹80,000 – ₹1,60,000\n• **Jaffarabadi:** ₹1,00,000 – ₹2,00,000\n• **Nili-Ravi:** ₹75,000 – ₹1,50,000\n• **Surti:** ₹70,000 – ₹1,40,000\n• **Mehsana:** ₹75,000 – ₹1,50,000`,
          voiceText: `Our buffalo prices start from 70,000 Rupees and go up to 2 lakh Rupees depending on daily milk yield and breed. Murrah starts at 80,000 and Jaffarabadi starts at 1 lakh. What is your target budget?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "View Price Catalog", url: "/buffaloes" },
            { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
          ],
        };
      }
      return {
        text: `💰 **AK Buffaloes Pricing Overview:**\n\nPrices range from **₹70,000 to ₹2,00,000** depending on breed, age, and milk yield:\n• **Murrah:** ₹80,000 – ₹1,60,000\n• **Jaffarabadi:** ₹1,00,000 – ₹2,00,000\n• **Nili-Ravi:** ₹75,000 – ₹1,50,000\n• **Surti:** ₹70,000 – ₹1,40,000\n• **Mehsana:** ₹75,000 – ₹1,50,000`,
        voiceText: `Our buffaloes are priced between 70,000 and 200,000 Rupees depending on the breed and daily milk output. What price range are you looking for?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "View Price Catalog", url: "/buffaloes" },
          { label: "Book Inquiry", url: "/dashboard/book-inquiry" },
        ],
      };
    },
  },

  // 10. Location, Address & Google Maps
  {
    id: "location_address_map",
    match: (q) =>
      hasAny(q, [
        "location",
        "address",
        "where is",
        "map",
        "google map",
        "direction",
        "pachora",
        "jalgaon",
        "lohari",
        "nurani",
        "kaha hai",
        "kahan hai",
        "kaha par",
        "kuthe aahe",
        "pata",
        "patta",
        "पता",
        "कहाँ है",
        "कहां है",
        "लोकेशन",
        "पचोरा",
        "जलगांव",
        "मैप",
        "नक्शा",
        "पत्ता",
        "कुठे आहे",
        "जळगाव",
        "पाचोरा",
        "नकाशा",
      ]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const mapUrl = "https://maps.app.goo.gl/exQPMJMUVzwfWdqcA";
      if (lang === "mr-IN") {
        return {
          text: `📍 **AK Buffaloes फार्मचा पत्ता आणि गुगल मॅप:**\n\n• **पत्ता:** नुराणी नगर, लोहारी खुर्द, तालुका पाचोरा, जिल्हा जळगाव, महाराष्ट्र – ४२४२०१, भारत.\n• **वेळ:** सोमवार ते रविवार, सकाळी ८:०० ते रात्री ८:०० वाजेपर्यंत.\n• **रेल्वे स्टेशन:** पाचोरा जंक्शन फक्त १५ मिनिटांच्या अंतरावर आहे.\n• **गुगल मॅप लिंक:** [गुगल मॅपवर फार्म पहा](${mapUrl})`,
          voiceText: `आमचा फार्म नुराणी नगर, लोहारी खुर्द, तालुका पाचोरा, जिल्हा जळगाव, महाराष्ट्र येथे आहे. पाचोरा रेल्वे स्टेशनवरून फक्त १५ मिनिटांचे अंतर आहे. वेबसाईटच्या फुटरमध्ये आणि कॉन्टॅक्ट पेजवर गुगल मॅप सुद्धा दिला आहे. तुम्ही फार्मवर कधी येणार आहात?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Open Google Map 📍", url: mapUrl },
            { label: "Contact & Map Page", url: "/contact" },
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `📍 **AK Buffaloes फार्म का पता और गूगल मैप:**\n\n• **फार्म का पता:** नूरानी नगर, लोहारी खुर्द, तहसील पचोरा, जिला जलगांव, महाराष्ट्र – 424201, भारत।\n• **खुलने का समय:** सोमवार से रविवार, सुबह 8:00 बजे से रात 8:00 बजे तक।\n• **कैसे पहुँचें:** पचोरा जंक्शन रेलवे स्टेशन से सिर्फ 15 मिनट की दूरी पर।\n• **गूगल मैप लोकेशन:** [Google Maps पर रास्ता देखें](${mapUrl})`,
          voiceText: `जी, हमारा फार्म नूरानी नगर, लोहारी खुर्द, तहसील पचोरा, जिला जलगांव, महाराष्ट्र में है। यह पचोरा रेलवे स्टेशन से सिर्फ पंद्रह मिनट की दूरी पर है। हमारी वेबसाइट के कॉन्टैक्ट पेज और फुटर में गूगल मैप भी लगा है। क्या आप फार्म पर विजिट करने का प्लान बना रहे हैं?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Google Map खोलें 📍", url: mapUrl },
            { label: "संपर्क और मैप पेज", url: "/contact" },
            { label: "कॉल करें: +91-9022273915", url: "tel:+919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `📍 **AK Buffaloes Farm Address & Google Map:**\n\n• **Address:** Nurani Nagar Lohari Khurd, Tahsil Pachora, District Jalgaon, Maharashtra – 424201, India.\n• **Visiting Hours:** Monday – Sunday, 8:00 AM to 8:00 PM.\n• **Nearest Railway Station:** Pachora Junction (15 mins away).\n• **Google Maps Location:** [Open Farm on Google Maps](${mapUrl})`,
          voiceText: `Our farm is located at Nurani Nagar, Lohari Khurd, Tahsil Pachora, District Jalgaon, Maharashtra, just 15 minutes from Pachora railway station. You can also view the live Google Map on our Contact page and footer. Are you planning a farm visit?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Open Google Maps 📍", url: mapUrl },
            { label: "Contact & Map Page", url: "/contact" },
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
          ],
        };
      }
      return {
        text: `📍 **AK Buffaloes Farm Location & Google Map:**\n\n• **Address:** Nurani Nagar Lohari Khurd, Tahsil Pachora, District Jalgaon, Maharashtra – 424201, India.\n• **Hours:** Monday – Sunday, 8:00 AM – 8:00 PM.\n• **Google Maps:** [Open in Google Maps](${mapUrl})`,
        voiceText: `Our farm is in Nurani Nagar, Lohari Khurd, Pachora, District Jalgaon, Maharashtra. You can find the interactive Google Map right on our Contact page and in the website footer. Would you like me to open the Contact and Map page for you?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Open Google Maps 📍", url: mapUrl },
          { label: "Contact & Map Page", url: "/contact" },
        ],
      };
    },
  },

  // 11. Founders / Owners (Akil Bhai & Salim Bhai)
  {
    id: "founders_leadership",
    match: (q) =>
      hasAny(q, [
        "akil",
        "salim",
        "founder",
        "co-founder",
        "owner",
        "malik",
        "who owns",
        "who started",
        "अकील",
        "सलीम",
        "मालिक",
        "फाउंडर",
        "ओनर",
        "संस्थापक",
        "कोणाचा फार्म",
      ]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `👑 **AK Buffaloes चे संस्थापक आणि नेतृत्व:**\n\n• **संस्थापक — अकील भाई (Akil Bhai):** २५+ वर्षांचा प्रदीर्घ अनुभव असलेले तज्ज्ञ. अकील भाई स्वतः प्रत्येक म्हशीची प्रकृती, कास आणि दूध क्षमता तपासून निवड करतात.\n• **सह-संस्थापक — सलीम भाई (Salim Bhai):** फार्म व्यवस्थापन, ग्राहक सेवा आणि संपूर्ण भारतातील सुरक्षित वाहतुकीचे कामकाज पाहतात.\n• **आमची परंपरा:** २५+ वर्षांचा विश्वास आणि २०००+ समाधानी शेतकरी!`,
          voiceText: `आमच्या फार्मचे संस्थापक अकील भाई आणि सह-संस्थापक सलीम भाई आहेत. त्यांना या क्षेत्रात २५ वर्षांपेक्षा जास्त अनुभव असून दोन हजारांपेक्षा जास्त शेतकरी आमच्याशी जोडलेले आहेत. तुम्हाला त्यांच्याशी फोनवर बोलायचे आहे का?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "About Us पहा", url: "/about" },
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `👑 **AK Buffaloes के संस्थापक (Founders):**\n\n• **फाउंडर — अकील भाई (Akil Bhai):** 25+ वर्षों के अनुभवी पशु विशेषज्ञ, जो खुद हर भैंस की नस्ल, थन और दूध क्षमता की जांच करके चयन करते हैं।\n• **को-फाउंडर — सलीम भाई (Salim Bhai):** फार्म संचालन, ग्राहकों की देखभाल और पूरे भारत में सुरक्षित डिलीवरी की जिम्मेदारी संभालते हैं।\n• **हमारी पहचान:** 25+ साल का भरोसा और 2,000+ खुशहाल डेयरी किसान!`,
          voiceText: `जी, एके बफेलोज़ फार्म के फाउंडर अकील भाई हैं और को-फाउंडर सलीम भाई हैं। उन्हें पच्चीस साल से ज्यादा का तजुर्बा है और अब तक दो हज़ार से ज्यादा किसान हमारे फार्म से भैंस ले चुके हैं। क्या आप अकील भाई या सलीम भाई से बात करना चाहते हैं?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "हमारे बारे में पढ़ें", url: "/about" },
            { label: "अकील भाई को कॉल करें", url: "tel:+919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `👑 **Founders of AK Buffaloes:**\n\n• **Founder — Akil Bhai:** Over 25+ years of expertise in selecting purebred high-yield dairy buffaloes.\n• **Co-Founder — Salim Bhai:** Leads farm operations, customer care, and safe pan-India delivery across 10+ states.\n• **Our Legacy:** 25+ years of trust and 2,000+ happy dairy farmers!`,
          voiceText: `AK Buffaloes is led by Founder Akil Bhai and Co-Founder Salim Bhai. They have over 25 years of breeding experience and have served more than 2,000 happy farmers across India. Would you like their direct contact number?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "About Our Founders", url: "/about" },
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
          ],
        };
      }
      return {
        text: `👑 **Leadership Behind AK Buffaloes:**\n\n• **Founder — Akil Bhai:** 25+ years of experience personally selecting elite dairy buffaloes.\n• **Co-Founder — Salim Bhai:** Oversees farm operations, customer experience, and nationwide transport.\n• **Track Record:** 2,000+ satisfied dairy farmers across 10+ states.`,
        voiceText: `Our farm was founded by Akil Bhai and Co-Founder Salim Bhai, who bring over 25 years of hands-on dairy breeding experience and have served over 2,000 farmers. Would you like to read more on our About page?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "About Our Founders", url: "/about" },
          { label: "Contact Us", url: "/contact" },
        ],
      };
    },
  },

  // 12. Contact Numbers, WhatsApp & Email
  {
    id: "contact_phone_whatsapp",
    match: (q) =>
      hasAny(q, [
        "phone",
        "mobile",
        "number",
        "whatsapp",
        "email",
        "contact",
        "helpline",
        "sampark",
        "baat karni",
        "नंबर",
        "फोन",
        "मोबाइल",
        "व्हाट्सएप",
        "ईमेल",
        "संपर्क",
        "बात करनी",
        "कॉल",
        "क्रमांक",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `📞 **AK Buffaloes अधिकृत संपर्क माहिती:**\n\n• **मुख्य मोबाईल व WhatsApp:** [+91-9022273915](tel:+919022273915)\n• **दुसरा क्रमांक:** [+91-7499553033](tel:+917499553033)\n• **ईमेल:** [akbuffaloes540@gmail.com](mailto:akbuffaloes540@gmail.com)\n• **वेळ:** दररोज सकाळी ८:०० ते रात्री ८:००`,
          voiceText: `आमचा मुख्य मोबाईल आणि व्हॉट्सॲप नंबर ९ ० २ २ २ ७ ३ ९ १ ५ हा आहे, आणि दुसरा नंबर ७ ४ ९ ९ ५ ५ ३ ० ३ ३ आहे. तुम्ही सकाळी आठ ते रात्री आठ दरम्यान कधीही कॉल किंवा व्हॉट्सॲप करू शकता!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
            { label: "WhatsApp Chat", url: "https://wa.me/919022273915" },
            { label: "Contact Page", url: "/contact" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `📞 **AK Buffaloes के संपर्क नंबर और ईमेल:**\n\n• **मुख्य फोन और WhatsApp:** [+91-9022273915](tel:+919022273915)\n• **दूसरा फोन नंबर:** [+91-7499553033](tel:+917499553033)\n• **ईमेल:** [akbuffaloes540@gmail.com](mailto:akbuffaloes540@gmail.com)\n• **समय:** सुबह 8:00 बजे से रात 8:00 बजे तक (सातों दिन)`,
          voiceText: `जी, हमारा मुख्य फोन और व्हाट्सएप नंबर है — नब्बे बाईस सत्ताईस उنتालीस पंद्रह, यानी 9 0 2 2 2 7 3 9 1 5। और दूसरा नंबर 7 4 9 9 5 5 3 0 3 3 है। आप सुबह आठ से रात आठ बजे तक कभी भी कॉल या व्हाट्सएप कर सकते हैं!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
            { label: "WhatsApp Chat", url: "https://wa.me/919022273915" },
            { label: "संपर्क पेज", url: "/contact" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `📞 **Official Contact Details — AK Buffaloes:**\n\n• **Primary Phone & WhatsApp:** [+91-9022273915](tel:+919022273915)\n• **Alternate Phone:** [+91-7499553033](tel:+917499553033)\n• **Email:** [akbuffaloes540@gmail.com](mailto:akbuffaloes540@gmail.com)\n• **Hours:** 8:00 AM – 8:00 PM (Monday to Sunday)`,
          voiceText: `You can call or WhatsApp us directly at plus 9 1, 9 0 2 2 2, 7 3 9 1 5, or on our alternate number 7 4 9 9 5, 5 3 0 3 3. Our email is akbuffaloes540@gmail.com. How else can I help you?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Call +91-9022273915", url: "tel:+919022273915" },
            { label: "Chat on WhatsApp", url: "https://wa.me/919022273915" },
            { label: "Contact Page", url: "/contact" },
          ],
        };
      }
      return {
        text: `📞 **AK Buffaloes Contact Information:**\n\n• **Phone & WhatsApp:** [+91-9022273915](tel:+919022273915)\n• **Secondary Phone:** [+91-7499553033](tel:+917499553033)\n• **Email:** [akbuffaloes540@gmail.com](mailto:akbuffaloes540@gmail.com)\n• **Support Hours:** 8:00 AM – 8:00 PM daily`,
        voiceText: `You can reach our team by phone or WhatsApp at 9 0 2 2 2 7 3 9 1 5, or email us at akbuffaloes540@gmail.com between 8 AM and 8 PM daily.`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Call +91-9022273915", url: "tel:+919022273915" },
          { label: "Chat on WhatsApp", url: "https://wa.me/919022273915" },
        ],
      };
    },
  },

  // 13. Gallery (Photos & Videos)
  {
    id: "gallery_photos_videos",
    match: (q) =>
      hasAny(q, [
        "gallery",
        "photo",
        "video",
        "picture",
        "image",
        "footage",
        "गैलरी",
        "गॅलरी",
        "फोटो",
        "वीडियो",
        "व्हिडिओ",
        "तस्वीर",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🎬 **AK Buffaloes फोटो आणि व्हिडिओ गॅलरी:**\n\n• **१८+ अस्सल फोटो आणि २६+ HD व्हिडिओ:** आमच्या फार्मवरील म्हशी, दूध काढतानाचे व्हिडिओ आणि जनावरांच्या बाजारातील प्रत्यक्ष व्हिडिओ उपलब्ध आहेत.\n• **फुल व्ह्यू मोड:** कोणत्याही म्हशीचा चेहरा आणि शरीर न कापता पूर्ण आकारात पाहण्याची सुविधा!`,
          voiceText: `आमच्या वेबसाईटच्या गॅलरीमध्ये १८ पेक्षा जास्त अस्सल फोटो आणि २६ पेक्षा जास्त एचडी व्हिडिओ आहेत, ज्यात तुम्ही फार्मवरील म्हशी आणि दूध काढतानाचे व्हिडिओ पाहू शकता. मी गॅलरी पेज उघडू का?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "गॅलरी उघडा (Gallery)", url: "/gallery" },
            { label: "सर्व म्हशी पहा", url: "/buffaloes" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🎬 **AK Buffaloes फोटो और वीडियो गैलरी:**\n\n• **18+ असली फोटोज़ और 26+ HD वीडियोज़:** हमारे फार्म के पशुओं, लाइव मिल्किंग और पशु मंडी के असली वीडियो उपलब्ध हैं।\n• **फुल व्यू व सिनेमा मोड:** बिना किसी कटौती के पूरी भैंस देखने और एचडी में वीडियो चलाने की सुविधा!`,
          voiceText: `जी, हमारी वेबसाइट की गैलरी में अठारह से ज्यादा असली फोटोज़ और छब्बीस से ज्यादा एचडी वीडियोज़ हैं, जिनमें आप भैंसों की बनावट और लाइव मिल्किंग देख सकते हैं। क्या मैं आपके लिए गैलरी खोल दूँ?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "गैलरी देखें (Gallery)", url: "/gallery" },
            { label: "भैंस कैटलॉग", url: "/buffaloes" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🎬 **AK Buffaloes Photos & Videos Gallery:**\n\n• **18+ Authentic Photographs & 26+ HD Videos:** Watch real farm footage, milking sessions, and herd movements.\n• **Full Conformation View:** Inspect complete buffalo face and body without cropping, plus fullscreen cinema playback.`,
          voiceText: `Our Gallery features 18 plus authentic buffalo photographs and 26 plus HD farm videos showcasing milking routines and herd quality. Would you like me to open the Gallery page for you?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Open Gallery", url: "/gallery" },
            { label: "Browse Buffaloes", url: "/buffaloes" },
          ],
        };
      }
      return {
        text: `🎬 **AK Buffaloes Media Gallery:**\n\n• **18+ High-Resolution Photos & 26+ HD Videos** of our buffaloes, milking sessions, and farm life.\n• Includes filter tabs for All, Photos, and Videos with a fullscreen cinema viewer.`,
        voiceText: `Our media gallery has over 18 authentic photos and 26 HD videos of our buffaloes and daily farm operations. Would you like me to open the Gallery for you?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Open Gallery", url: "/gallery" },
          { label: "Browse Buffaloes", url: "/buffaloes" },
        ],
      };
    },
  },

  // 14. Instagram & Social Media (@ak_buffaloes)
  {
    id: "instagram_social",
    match: (q) =>
      hasAny(q, [
        "instagram",
        "insta",
        "social media",
        "reel",
        "follower",
        "ak.buffalos",
        "ak_buffaloes",
        "इंस्टाग्राम",
        "इंस्टा",
        "रील्स",
        "फॉलो",
        "सोशल मीडिया",
      ]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      const instaUrl = "https://www.instagram.com/ak_buffaloes?stkn=aWo3em81MzVseHI4";
      if (lang === "mr-IN") {
        return {
          text: `📸 **AK Buffaloes अधिकृत इंस्टाग्राम (@ak_buffaloes):**\n\n• **१४,०००+ (14K+) शेतकरी परिवार** आमच्याशी जोडलेला आहे!\n• **१.४ कोटी+ (14 Million+) व्ह्यूज** आमच्या फार्मच्या रील्स आणि व्हिडिओंना मिळाले आहेत.\n• दररोज नवीन म्हशींचे व्हिडिओ पाहण्यासाठी आम्हाला फॉलो करा: [@ak_buffaloes](${instaUrl})`,
          voiceText: `आमच्या अधिकृत इंस्टाग्राम अकाउंटवर चौदा हजारांपेक्षा जास्त शेतकरी जोडलेले आहेत आणि आमच्या व्हिडिओंना एक पूर्णांक चार कोटींपेक्षा जास्त व्ह्यूज मिळाले आहेत. तुम्ही इंस्टाग्रामवर एके बफेलोज़ला नक्की फॉलो करा!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Follow on Instagram 📸", url: instaUrl },
            { label: "Open Website Gallery", url: "/gallery" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `📸 **AK Buffaloes का ऑफिशियल इंस्टाग्राम (@ak_buffaloes):**\n\n• **14,000+ (14K+) डेयरी किसानों का परिवार** हमारे साथ जुड़ा हुआ है!\n• **1.4 करोड़+ (14M+ Views)** हमारे फार्म की रील्स और वीडियोज़ को मिल चुके हैं।\n• रोज़ाना नई भैंसों के लाइव वीडियो देखने के लिए अभी फॉलो करें: [@ak_buffaloes](${instaUrl})`,
          voiceText: `जी, हमारे ऑफिशियल इंस्टाग्राम पेज पर चौदह हज़ार से ज्यादा डेयरी किसान जुड़े हैं और हमारे वीडियोज़ पर एक करोड़ चालीस लाख से ज्यादा व्यूज़ हैं। आप इंस्टाग्राम पर एके बफेलोज़ को फॉलो करके रोज़ नए वीडियो देख सकते हैं!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Instagram पर फॉलो करें 📸", url: instaUrl },
            { label: "वेबसाइट गैलरी देखें", url: "/gallery" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `📸 **Official Instagram — @ak_buffaloes:**\n\n• **14,000+ (14K+) Dairy Farmers Community**\n• **1.4 Crore+ (14M+) Views** on our buffalo reels and farm videos!\n• Follow us for daily herd updates: [@ak_buffaloes](${instaUrl})`,
          voiceText: `Our official Instagram page has over 14,000 dairy farmer followers and more than 1.4 Crore views on our farm reels. You can follow us on Instagram at ak buffaloes for daily live updates!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Follow on Instagram 📸", url: instaUrl },
            { label: "Open Gallery", url: "/gallery" },
          ],
        };
      }
      return {
        text: `📸 **AK Buffaloes on Instagram (@ak_buffaloes):**\n\n• **14K+ Followers** and **14 Million+ (1.4 Crore+) Views** across our dairy farm videos and reels.\n• Follow us here: [@ak_buffaloes](${instaUrl})`,
        voiceText: `We have over 14,000 followers and 14 million views on our official Instagram page. You can follow us at ak buffaloes to see daily videos of our herd!`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Follow on Instagram 📸", url: instaUrl },
          { label: "Open Gallery", url: "/gallery" },
        ],
      };
    },
  },

  // 15. How to Buy / Inquiry / Booking Lifecycle
  {
    id: "how_to_buy_inquiry",
    match: (q) =>
      hasAny(q, [
        "how to buy",
        "buy",
        "purchase",
        "book",
        "booking",
        "inquiry",
        "enquiry",
        "inquire",
        "order",
        "khareed",
        "kharid",
        "kaise le",
        "कैसे खरीदें",
        "खरीदना है",
        "बुक कैसे",
        "इंक्वायरी",
        "बुकिंग",
        "ऑर्डर",
        "कशी खरेदी",
        "खरेदी करायची",
        "चौकशी",
      ]),
    score: () => 11,
    build: (_q, lang, ctx, navUrl) => {
      const userInq = ctx?.inquiriesCount ?? 0;
      if (lang === "mr-IN") {
        return {
          text: `🛒 **म्हैस खरेदी आणि चौकशी (Inquiry) प्रक्रिया:**\n\n1. **म्हैस निवडा:** [Buffaloes](/buffaloes) पेजवर जाऊन आपली पसंतीची जात निवडा.\n2. **Send Enquiry दाबा:** आपल्या पसंतीच्या म्हशीवर **'Send Enquiry'** किंवा **'Book Inquiry'** फॉर्म भरा.\n3. **थेट मिल्किंग तपासणी:** फार्मवर येऊन किंवा WhatsApp व्हिडिओ कॉलवर दोन्ही वेळचे दूध तपासा.\n4. **५-टप्पे ट्रॅकिंग:** *Pending ➔ Accepted ➔ Confirmed ➔ Completed* स्टेटस आपल्या डॅशबोर्डवर लाईव्ह पहा!${ctx?.isLoggedIn ? `\n\n📋 तुमच्या खात्यात सध्या **${userInq}** चौकशी नोंदवलेल्या आहेत.` : ""}`,
          voiceText: `म्हैस खरेदी करण्यासाठी बफेलोज पेजवर जाऊन Send Enquiry वर क्लिक करा, किंवा आम्हाला ९ ० २ २ २ ७ ३ ९ १ ५ वर कॉल करा. तुम्ही फार्मवर येऊन किंवा व्हिडिओ कॉलवर दूध तपासून म्हैस बुक करू शकता. मी बुकिंग पेज उघडू का?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Book Inquiry 📝", url: "/dashboard/book-inquiry" },
            { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
            { label: "My Inquiries 📋", url: "/dashboard/my-inquiries" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🛒 **भैंस खरीदने और बुकिंग की पूरी प्रक्रिया:**\n\n1. **नस्ल चुनें:** [Buffaloes](/buffaloes) पेज पर जाकर अपनी पसंद की भैंस चुनें।\n2. **Send Enquiry करें:** भैंस कार्ड पर **'Send Enquiry'** दबाएं या [Book Inquiry](/dashboard/book-inquiry) फॉर्म भरें।\n3. **लाइव मिल्किंग जांच:** पचोरा फार्म आकर या लाइव WhatsApp वीडियो कॉल पर सुबह-शाम का दूध खुद चेक करें।\n4. **5-स्टेज लाइव ट्रैकिंग:** अपने डैशबोर्ड में *Pending ➔ Accepted ➔ Confirmed ➔ Completed* स्टेटस लाइव ट्रैक करें और हर स्टेप पर ईमेल अलर्ट पाएं!${ctx?.isLoggedIn ? `\n\n📋 आपके अकाउंट में अभी **${userInq}** इंक्वायरी दर्ज हैं।` : ""}`,
          voiceText: `जी, भैंस खरीदने के लिए आप हमारी वेबसाइट पर किसी भी भैंस के नीचे सेंड इंक्वायरी बटन दबा सकते हैं, या सीधे हमें नब्बे बाईस सत्ताईस उنتालीस पंद्रह पर कॉल कर सकते हैं। आप फार्म पर आकर या वीडियो कॉल पर दोनों टाइम का दूध चेक करके बुकिंग कर सकते हैं। क्या मैं बुकिंग पेज खोल दूँ?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "इंक्वायरी बुक करें 📝", url: "/dashboard/book-inquiry" },
            { label: "भैंसें देखें 🐃", url: "/buffaloes" },
            { label: "मेरी इंक्वायरी 📋", url: "/dashboard/my-inquiries" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🛒 **How to Buy & Book a Buffalo at AK Buffaloes (5-Stage Inquiry Lifecycle):**\n\n1. **Select a Buffalo:** Browse our [Buffaloes](/buffaloes) catalog.\n2. **Submit Enquiry:** Click **'Send Enquiry'** on any listing or use [Book Inquiry](/dashboard/book-inquiry).\n3. **Live Milking Verification:** Inspect morning & evening milking in-person at Pachora or via live WhatsApp video call.\n4. **5-Stage Inquiry Lifecycle:** Track *Pending ➔ Accepted ➔ Confirmed ➔ Completed / Rejected* live in your Dashboard with instant email alerts!${ctx?.isLoggedIn ? `\n\n📋 You currently have **${userInq}** inquiries in your account.` : ""}`,
          voiceText: `To buy or book a buffalo, simply click Send Enquiry on any buffalo card or submit a request from the Book Inquiry section. You can verify the milk yield via live video call or by visiting our Pachora farm before dispatch. Shall I open the booking page for you?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Book Inquiry 📝", url: "/dashboard/book-inquiry" },
            { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
            { label: "Track My Inquiries 📋", url: "/dashboard/my-inquiries" },
          ],
        };
      }
      return {
        text: `🛒 **How to Purchase & Track Your Inquiry (5-Stage Inquiry Lifecycle):**\n\n1. **Browse Catalog:** Choose a buffalo from [Buffaloes](/buffaloes).\n2. **Submit Inquiry:** Click **'Send Enquiry'** or fill out [Book Inquiry](/dashboard/book-inquiry).\n3. **Verify Milking:** Witness live milking in person or over WhatsApp video call.\n4. **5-Stage Inquiry Lifecycle:** Follow your order from *Pending ➔ Accepted ➔ Confirmed ➔ Completed / Rejected* in your Dashboard.`,
        voiceText: `You can book a buffalo by clicking Send Enquiry on any listing or through the Book Inquiry page in your dashboard. We also provide live milking verification before transport. Would you like me to open the booking page?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Book Inquiry 📝", url: "/dashboard/book-inquiry" },
          { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
          { label: "Track My Inquiries 📋", url: "/dashboard/my-inquiries" },
        ],
      };
    },
  },

  // 16. Live Milking Test & Guarantee
  {
    id: "live_milking_test",
    match: (q) =>
      hasAny(q, [
        "live milking",
        "milking test",
        "milk test",
        "guarantee",
        "doodh nikal",
        "doodh check",
        "fat test",
        "मिल्किंग टेस्ट",
        "दूध निकाल",
        "दूध चेक",
        "गारंटी",
        "तपासणी",
        "दूध काढून",
      ]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🥛 **१००% पारदर्शकता — थेट मिल्किंग टेस्ट (Live Milking Guarantee):**\n\n• **फार्मवर प्रत्यक्ष तपासणी:** आपण आमच्या पाचोरा फार्मवर मुक्काम करून सकाळी ६:०० आणि संध्याकाळी ५:०० वाजता स्वतःच्या हाताने किंवा समोर दूध काढून मोजू शकता.\n• **लाईव्ह व्हिडिओ कॉल:** बाहेरगावातील शेतकऱ्यांसाठी आम्ही WhatsApp व्हिडिओ कॉलवर लाईव्ह दूध मोजून दाखवतो.\n• **डॉक्टर प्रमाणपत्र:** प्रत्येक म्हशीची पशुवैद्यकीय आरोग्य तपासणी केली जाते.`,
          voiceText: `हो १०० टक्के! तुम्ही आमच्या पाचोरा फार्मवर येऊन सकाळी आणि संध्याकाळी दोन्ही वेळेस स्वतः समोर दूध काढून आणि फॅट तपासून म्हैस घेऊ शकता. जर तुम्ही दूर असाल तर आम्ही व्हॉट्सॲप व्हिडिओ कॉलवर लाईव्ह मिल्किंग दाखवतो!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "मिल्किंग टेस्ट बुक करा", url: "/dashboard/book-inquiry" },
            { label: "WhatsApp Video Call", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🥛 **100% पारदर्शिता — लाइव मिल्किंग टेस्ट गारंटी:**\n\n• **फार्म पर आकर जांचें:** आप हमारे पचोरा फार्म पर रुककर सुबह (6:00 AM) और शाम (5:00 PM) दोनों समय अपनी आंखों के सामने या खुद अपने हाथों से दूध निकालकर लीटर और फैट नाप सकते हैं।\n• **लाइव वीडियो कॉल:** दूर के राज्यों के किसानों के लिए हम WhatsApp वीडियो कॉल पर लाइव मिल्किंग कराके दिखाते हैं।\n• **डॉक्टर सर्टिफिकेट:** हर भैंस की सरकारी पशु चिकित्सक से जांच कराई जाती है।`,
          voiceText: `जी बिल्कुल! हमारे यहाँ सौ प्रतिशत ईमानदारी से काम होता है। आप पचोरा फार्म पर आकर सुबह और शाम दोनों टाइम अपने सामने दूध निकलवाकर और फैट चेक करके भैंस ले सकते हैं। दूर रहने वाले किसानों को हम व्हाट्सएप वीडियो कॉल पर लाइव मिल्किंग दिखाते हैं!`,
          navigateTo: navUrl,
          quickActions: [
            { label: "मिल्किंग टेस्ट बुक करें", url: "/dashboard/book-inquiry" },
            { label: "WhatsApp वीडियो कॉल", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🥛 **100% Transparency — Live Milking Test Guarantee:**\n\n• **In-Person Farm Test:** Visit our Pachora farm and inspect both morning (6:00 AM) and evening (5:00 PM) milking sessions yourself.\n• **Live Video Call:** For out-of-state buyers, we conduct live WhatsApp video calls showing full milking and measurement.\n• **Veterinary Certified:** Every animal comes with a health and vaccination certificate.`,
          voiceText: `Yes ji, 100 percent! You are welcome to visit our Pachora farm and check both morning and evening milking in front of your eyes, or we can show you live milking on a WhatsApp video call before booking.`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Book Milking Test", url: "/dashboard/book-inquiry" },
            { label: "WhatsApp Video Call", url: "https://wa.me/919022273915" },
          ],
        };
      }
      return {
        text: `🥛 **Live Milking Test & Health Guarantee:**\n\n• **On-Farm Testing:** Test morning (6:00 AM) and evening (5:00 PM) milking yields and butterfat in person at our Pachora farm.\n• **Live Video Verification:** Watch real-time milking via WhatsApp video call from anywhere in India.\n• **Health Certificate:** Official veterinary clearance included with every buffalo.`,
        voiceText: `Absolutely! You can visit our farm in Pachora to inspect morning and evening milking sessions in person, or schedule a live WhatsApp video call to verify the exact milk yield before purchase.`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Book Milking Test", url: "/dashboard/book-inquiry" },
          { label: "WhatsApp Video Call", url: "https://wa.me/919022273915" },
        ],
      };
    },
  },

  // 17. Delivery & Pan-India Transport
  {
    id: "delivery_transport",
    match: (q) =>
      hasAny(q, [
        "delivery",
        "transport",
        "shipping",
        "truck",
        "gaadi",
        "bhejna",
        "all india",
        "pan-india",
        "vahatuk",
        "डिलीवरी",
        "ट्रांसपोर्ट",
        "गाड़ी",
        "भेजना",
        "कहाँ तक",
        "वाहतूक",
        "डिलिव्हरी",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🚚 **संपूर्ण भारतात सुरक्षित वाहतूक (Pan-India Transport):**\n\n• **१०+ राज्यांमध्ये डिलिव्हरी:** महाराष्ट्र, गुजरात, मध्य प्रदेश, उत्तर प्रदेश, राजस्थान, कर्नाटक, तेलंगणा, पंजाब, हरियाणा इ.\n• **विशेष गाड्या:** रबरी मॅट, मऊ गवत, चारा-पाणी आणि हवेची उत्तम सोय असलेल्या गाड्यांमधून घरपोच डिलिव्हरी.\n• **कायदेशीर परवाना:** पशुवैद्यकीय फिटनेस सर्टिफिकेट आणि ट्रान्झिट पाससह प्रवास.`,
          voiceText: `आम्ही संपूर्ण भारतामध्ये दहापेक्षा जास्त राज्यांत सुरक्षित गाड्यांमधून घरपोच डिलिव्हरी करतो. गाडीत रबरी मॅट, चारा-पाणी आणि डॉक्टरचे फिटनेस प्रमाणपत्र असते. तुम्हाला कोणत्या जिल्ह्यात किंवा राज्यात डिलिव्हरी हवी आहे?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "वाहतूक चौकशी करा", url: "/contact" },
            { label: "WhatsApp सपोर्ट", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🚚 **पूरे भारत में सुरक्षित होम डिलीवरी (Pan-India Transport):**\n\n• **10+ राज्यों में सप्लाई:** महाराष्ट्र, गुजरात, मध्य प्रदेश, उत्तर प्रदेश, राजस्थान, कर्नाटक, तेलंगाना, बिहार, पंजाब, हरियाणा आदि।\n• **सुरक्षित गाड़ियां:** एंटी-स्किड रबर मैट, नरम बिछावन, रास्ते भर चारा-पानी और हवादार पार्टिशन वाली स्पेशल गाड़ियां।\n• **सरकारी परमिट व फिटनेस:** डॉक्टर के हेल्थ सर्टिफिकेट और ट्रांजिट परमिट के साथ सुरक्षित डिलीवरी।`,
          voiceText: `जी, हम पूरे भारत में दस से ज्यादा राज्यों में सुरक्षित गाड़ियों से होम डिलीवरी करते हैं। गाड़ी में रबर मैट, चारा-पानी और डॉक्टर का फिटनेस सर्टिफिकेट साथ रहता है। आपको किस शहर या राज्य में भैंस मंगवानी है?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "ट्रांसपोर्ट कोटेशन लें", url: "/contact" },
            { label: "WhatsApp पर पूछें", url: "https://wa.me/919022273915" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🚚 **Safe Pan-India Livestock Transport:**\n\n• **10+ States Covered:** Maharashtra, Gujarat, MP, UP, Rajasthan, Karnataka, Telangana, Punjab, Haryana & more.\n• **Modified Cushioned Trucks:** Anti-skid rubber mats, straw bedding, feed & water on route, and official veterinary transit permits.`,
          voiceText: `We provide safe door-to-door delivery across more than 10 states in India using cushioned livestock trucks with veterinary health certificates and transit permits. Which district or state do you need delivery to?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Get Transport Quote", url: "/contact" },
            { label: "WhatsApp Logistics", url: "https://wa.me/919022273915" },
          ],
        };
      }
      return {
        text: `🚚 **Nationwide Livestock Delivery:**\n\n• Doorstep transport across 10+ Indian states in cushioned, ventilated livestock trucks with feed, water, and official veterinary transit certificates.`,
        voiceText: `We deliver safely across India in specialized cushioned trucks with full veterinary transit permits. Which city or state do you need delivery to?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Get Transport Quote", url: "/contact" },
          { label: "WhatsApp Logistics", url: "https://wa.me/919022273915" },
        ],
      };
    },
  },

  // 18. Account Creation & Email OTP Registration
  {
    id: "account_registration_otp",
    match: (q) =>
      hasAny(q, [
        "create account",
        "register",
        "signup",
        "sign up",
        "new account",
        "email otp",
        "otp",
        "nayi id",
        "khata",
        "रजिस्टर",
        "अकाउंट कैसे",
        "नया अकाउंट",
        "खाता",
        "ओटीपी",
        "नोंदणी",
        "नवीन खाते",
      ]),
    score: () => 12,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `📝 **AK Buffaloes वर नवीन खाते (Account) कसे उघडावे:**\n\n1. [Register](/register) पेजवर जा.\n2. आपले पूर्ण नाव, १०-अंकी मोबाईल नंबर, ईमेल आणि किमान ८ अक्षरांचा पासवर्ड टाका.\n3. आपल्या ईमेलवर आलेला **६-अंकी OTP** टाका (१५ मिनिटे वैध).\n4. पडताळणी होताच आपले खाते आणि डॅशबोर्ड लगेच सुरू होईल!`,
          voiceText: `नवीन खाते उघडण्यासाठी रजिस्टर पेजवर तुमचे नाव, मोबाईल नंबर, ईमेल आणि पासवर्ड टाका. त्यानंतर तुमच्या ईमेलवर आलेला सहा अंकी ओटीपी टाकून व्हेरिफाय करा. मी तुमच्यासाठी रजिस्टर पेज उघडू का?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "नवीन खाते उघडा (Register)", url: "/register" },
            { label: "लॉगिन करा (Login)", url: "/login" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `📝 **AK Buffaloes पर नया अकाउंट (Register) कैसे बनाएं:**\n\n1. वेबसाइट के [Register](/register) पेज पर जाएं।\n2. अपना पूरा नाम, 10-अंकों का मोबाइल नंबर, ईमेल और कम से कम 8 अक्षरों का पासवर्ड डालें।\n3. आपके ईमेल पर तुरंत एक **6-अंकों का OTP** आएगा (15 मिनट तक मान्य)।\n4. OTP डालकर वेरिफाई करते ही आपका अकाउंट चालू हो जाएगा!`,
          voiceText: `जी, नया अकाउंट बनाने के लिए रजिस्टर पेज पर जाकर अपना नाम, मोबाइल नंबर, ईमेल और पासवर्ड डालें। फिर आपके ईमेल पर छह अंकों का ओटीपी आएगा, उसे डालते ही आपका अकाउंट तुरंत चालू हो जाएगा। क्या मैं रजिस्टर पेज खोल दूँ?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "अकाउंट बनाएं (Register)", url: "/register" },
            { label: "लॉगिन करें (Login)", url: "/login" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `📝 **How to Create an Account with Email OTP:**\n\n1. Visit the [Register](/register) page.\n2. Enter your Full Name, 10-digit Phone Number, Email Address, and Password (minimum 8 characters).\n3. Enter the **6-digit OTP** sent to your email (valid for 15 minutes).\n4. Your account and User Dashboard are activated immediately!`,
          voiceText: `To create an account, go to the Register page, enter your name, phone number, email, and an 8-character password, and verify with the 6-digit OTP sent to your email. Shall I open the Register page for you?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Create Account", url: "/register" },
            { label: "Log In", url: "/login" },
          ],
        };
      }
      return {
        text: `📝 **How to Create an Account with Email OTP:**\n\n1. Go to [Register](/register).\n2. Fill in your name, 10-digit phone, email, and password (8+ characters).\n3. Verify with the 6-digit OTP sent to your email (valid for 15 minutes) to activate your dashboard.`,
        voiceText: `You can sign up on the Register page by entering your name, phone, email, and password, then verifying with the 6-digit OTP sent to your email. Would you like me to open the registration page?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Create Account", url: "/register" },
          { label: "Log In", url: "/login" },
        ],
      };
    },
  },

  // 19. Password Reset / Forgot Password
  {
    id: "password_reset_security",
    match: (q) =>
      hasAny(q, [
        "password",
        "forgot",
        "reset",
        "bhul gaya",
        "bhool gaya",
        "visarlo",
        "पासवर्ड",
        "भूल गया",
        "रीसेट",
        "विसरलो",
      ]),
    score: () => 11,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🔐 **पासवर्ड रीसेट आणि सुरक्षा माहिती:**\n\n• **पासवर्ड विसरल्यास:** [Forgot Password](/forgot-password) पेजवर तुमचा ईमेल टाका. ईमेलवर आलेल्या लिंकवर क्लिक करून नवीन पासवर्ड टाका आणि ६-अंकी OTP ने व्हेरिफाय करा.\n• **डॅशबोर्डवरून बदलणे:** **Dashboard ➔ Settings** मधूनही पासवर्ड बदलता येतो.`,
          voiceText: `जर तुम्ही पासवर्ड विसरला असाल, तर लॉगिन पेजवर फॉरगॉट पासवर्डवर क्लिक करा. तुमच्या ईमेलवर रीसेट लिंक आणि ओटीपी येईल, ज्याने तुम्ही लगेच नवीन पासवर्ड सेट करू शकता. मी फॉरगॉट पासवर्ड पेज उघडू का?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Forgot Password 🔐", url: "/forgot-password" },
            { label: "Dashboard Settings ⚙️", url: "/dashboard/settings" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🔐 **पासवर्ड रीसेट और बदलने का तरीका:**\n\n• **पासवर्ड भूल गए हैं?** [Forgot Password](/forgot-password) पेज पर अपना रजिस्टर्ड ईमेल डालें। ईमेल में आए रीसेट बटन पर क्लिक करें, नया पासवर्ड डालें और **6-अंकों के ईमेल OTP** से वेरिफाई करें।\n• **डैशबोर्ड से बदलें:** लॉगिन के बाद **Dashboard ➔ Settings** में जाकर भी पासवर्ड बदल सकते हैं।`,
          voiceText: `जी, अगर आप पासवर्ड भूल गए हैं तो फॉरगॉट पासवर्ड पेज पर अपना ईमेल डालें। आपके ईमेल पर रीसेट लिंक और छह अंकों का ओटीपी आएगा, जिससे आप तुरंत नया पासवर्ड बना सकते हैं। क्या मैं पासवर्ड रीसेट पेज खोल दूँ?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "पासवर्ड रीसेट करें 🔐", url: "/forgot-password" },
            { label: "डैशबोर्ड सेटिंग्स ⚙️", url: "/dashboard/settings" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🔐 **Password & Account Security (Password Reset):**\n\n• **Password Requirements:** Minimum **8 characters**; we never expose your real password in plain text.\n• **Forgot Password:** Go to [Forgot Password](/forgot-password), enter your email, click the reset link sent to your inbox, enter your new password, and verify with the 6-digit Email OTP.\n• **Change in Dashboard:** You can also update your password anytime from **Dashboard ➔ Settings**.`,
          voiceText: `If you forgot your password, you can reset it on the Forgot Password page using your registered email and a 6-digit OTP verification code. Shall I open the Forgot Password page for you?`,
          navigateTo: navUrl,
          quickActions: [
            { label: "Forgot Password 🔐", url: "/forgot-password" },
            { label: "Dashboard Settings ⚙️", url: "/dashboard/settings" },
          ],
        };
      }
      return {
        text: `🔐 **Password & Account Security:**\n\n• Requires a minimum of **8 characters** with encrypted storage (your real password is never exposed).\n• Visit [Forgot Password](/forgot-password) to receive a reset link and 6-digit OTP via email, or update your password under **Dashboard ➔ Settings**.`,
        voiceText: `You can easily reset your password on the Forgot Password page using your email and a 6-digit verification code. Would you like me to open that page?`,
        navigateTo: navUrl,
        quickActions: [
          { label: "Forgot Password 🔐", url: "/forgot-password" },
          { label: "Dashboard Settings ⚙️", url: "/dashboard/settings" },
        ],
      };
    },
  },

  // 20. User Dashboard, Analytics, Login Status & Admin Panel
  {
    id: "dashboard_analytics_account",
    match: (q) =>
      hasAny(q, [
        "dashboard",
        "analytics",
        "my account",
        "who am i",
        "am i logged",
        "mera account",
        "my inquiries",
        "status",
        "admin panel",
        "डैशबोर्ड",
        "एनालिटिक्स",
        "मेरा अकाउंट",
        "डॅशबोर्ड",
        "माझे खाते",
        "स्टेटस",
      ]),
    score: () => 10,
    build: (_q, lang, ctx, navUrl) => {
      const loggedIn = Boolean(ctx?.isLoggedIn);
      const name = ctx?.userName || "Farmer";
      const totalInq = ctx?.inquiriesCount ?? 0;
      const confInq = ctx?.confirmedCount ?? 0;

      if (lang === "mr-IN") {
        return {
          text: loggedIn
            ? `🖥️ **आपले खाते आणि डॅशबोर्ड (${name}):**\n\n• **लॉगिन स्थिती:** आपण **${name}** म्हणून लॉगिन आहात.\n• **एकूण चौकशी (Inquiries):** ${totalInq} (मंजूर सौदे: ${confInq})\n• **डॅशबोर्डमधील ७ विभाग:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries, My History, Profile आणि Settings.`
            : `🖥️ **AK Buffaloes युजर डॅशबोर्ड आणि ॲनालिटिक्स:**\n\n• आपण सध्या **Guest** म्हणून पाहत आहात. लॉगिन केल्यानंतर आपल्याला डॅशबोर्डमध्ये आपल्या सर्व चौकशी (Inquiries), लाईव्ह स्टेटस आणि व्यवहार दिसतील.`,
          voiceText: loggedIn
            ? `तुम्ही ${name} म्हणून लॉगिन आहात. तुमच्या खात्यात एकूण ${totalInq} चौकशी नोंदवलेल्या आहेत. तुम्ही डॅशबोर्डवर जाऊन तुमचे सर्व स्टेटस आणि हिस्ट्री पाहू शकता!`
            : `तुम्ही सध्या गेस्ट म्हणून वेबसाईट पाहत आहात. तुमचा डॅशबोर्ड आणि चौकशीचे स्टेटस पाहण्यासाठी कृपया लॉगिन किंवा रजिस्टर करा. मी लॉगिन पेज उघडू का?`,
          navigateTo: navUrl,
          quickActions: loggedIn
            ? [
                { label: "डॅशबोर्ड उघडा", url: "/dashboard" },
                { label: "माझी चौकशी पहा", url: "/dashboard/my-inquiries" },
              ]
            : [
                { label: "लॉगिन करा", url: "/login" },
                { label: "नवीन खाते उघडा", url: "/register" },
              ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: loggedIn
            ? `🖥️ **आपका अकाउंट और डैशबोर्ड (${name}):**\n\n• **लॉगिन स्टेटस:** आप **${name}** के रूप में लॉगिन हैं।\n• **कुल इंक्वायरी:** ${totalInq} (कन्फर्म डील: ${confInq})\n• **डैशबोर्ड के 7 सेक्शन:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries, My History, Profile और Settings।`
            : `🖥️ **AK Buffaloes यूजर डैशबोर्ड और एनालिटिक्स:**\n\n• आप अभी **Guest (अतिथि)** के रूप में वेबसाइट देख रहे हैं। लॉगिन करने के बाद आप अपने डैशबोर्ड में अपनी सभी बुकिंग, लाइव स्टेटस और एनालिटिक्स देख सकते हैं।`,
          voiceText: loggedIn
            ? `जी ${name} जी, आप अभी लॉगिन हैं और आपके अकाउंट में कुल ${totalInq} इंक्वायरी दर्ज हैं। आप अपने डैशबोर्ड में जाकर लाइव स्टेटस और हिस्ट्री देख सकते हैं। क्या मैं आपका डैशबोर्ड खोल दूँ?`
            : `जी, आप अभी गेस्ट मोड में हैं। अपना डैशबोर्ड और बुकिंग स्टेटस देखने के लिए आप लॉगिन या रजिस्टर कर सकते हैं। क्या मैं लॉगिन पेज खोल दूँ?`,
          navigateTo: navUrl,
          quickActions: loggedIn
            ? [
                { label: "डैशबोर्ड खोलें", url: "/dashboard" },
                { label: "मेरी इंक्वायरी देखें", url: "/dashboard/my-inquiries" },
              ]
            : [
                { label: "लॉगिन करें", url: "/login" },
                { label: "अकाउंट बनाएं", url: "/register" },
              ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: loggedIn
            ? `🖥️ **Your Account & User Dashboard (${name}):**\n\n• **Status:** **LOGGED IN** as **${name}** (${ctx?.userEmail || "Verified"})\n• **Operations Analytics & KPIs:** Total Inquiries: ${totalInq} | Pending Review: ${ctx?.pendingCount ?? 0} | Confirmed Deals: ${confInq} | Estimated Deal Value (₹)\n• **7 Core Modules:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries (/dashboard/my-inquiries), My History, Profile & Settings.`
            : `🖥️ **User Dashboard & Operations Analytics:**\n\n• **7 Core Modules:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries (/dashboard/my-inquiries), My History, Profile & Settings.\n• **Operations Analytics & KPIs:** Track Total Inquiries, Pending Review, Confirmed Deals, and Estimated Deal Value (₹) in real time.\n• You are currently browsing as a **Guest**. Log in or register to access your personal dashboard.`,
          voiceText: loggedIn
            ? `You are logged in as ${name}, and you have ${totalInq} recorded inquiries in your dashboard. Would you like me to open your User Dashboard now?`
            : `You are currently browsing as a guest. Please log in or create an account to track your inquiries and view your personal dashboard. Shall I open the Login page?`,
          navigateTo: navUrl,
          quickActions: loggedIn
            ? [
                { label: "Open Dashboard", url: "/dashboard" },
                { label: "My Inquiries", url: "/dashboard/my-inquiries" },
              ]
            : [
                { label: "User Dashboard", url: "/dashboard" },
                { label: "Log In", url: "/login" },
                { label: "Register", url: "/register" },
              ],
        };
      }
      return {
        text: loggedIn
          ? `🖥️ **Account & User Dashboard Summary (${name}):**\n\n• **LOGGED IN** as **${name}** (${ctx?.userEmail || "Verified"}) with **${totalInq}** Total Inquiries (**${confInq}** confirmed).\n• **Operations Analytics:** Track Pending Review and Estimated Deal Value.\n• **7 Core Modules:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries (/dashboard/my-inquiries), History, Profile, and Settings.`
          : `🖥️ **User Dashboard & Operations Analytics:**\n\n• **7 Core Modules:** Overview, Browse Buffaloes, Book Inquiry, My Inquiries (/dashboard/my-inquiries), History, Profile & Settings.\n• **Operations Analytics:** Track Total Inquiries, Pending Review, and Estimated Deal Value.`,
        voiceText: loggedIn
          ? `You're signed in as ${name} with ${totalInq} inquiries in your account. Would you like me to open your dashboard?`
          : `You are currently browsing as a guest. Sign in or register to access your personal dashboard and track orders.`,
        navigateTo: navUrl,
        quickActions: loggedIn
          ? [
              { label: "Open Dashboard", url: "/dashboard" },
              { label: "My Inquiries", url: "/dashboard/my-inquiries" },
            ]
          : [
              { label: "User Dashboard", url: "/dashboard" },
              { label: "Log In", url: "/login" },
              { label: "Register", url: "/register" },
            ],
      };
    },
  },

  // 21. Feed, Fodder & Nutrition
  {
    id: "feed_fodder_nutrition",
    match: (q) =>
      hasAny(q, [
        "feed",
        "fodder",
        "diet",
        "nutrition",
        "chara",
        "khurak",
        "khorak",
        "khana",
        "khal",
        "bhusa",
        "चारा",
        "खुराक",
        "खाना",
        "दाना",
        "खल",
        "भूसा",
        "आहार",
        "पशुखाद्य",
      ]),
    score: () => 10,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🌾 **म्हशींचा दैनंदिन आहार आणि चारा नियोजन:**\n\n• **हिरवा चारा:** दररोज २०–२५ किलो (नेपियर गवत, मका, लसूणघास).\n• **सुका चारा:** ५–७ किलो (गव्हाचे काड किंवा कडबा).\n• **पशुखाद्य (खुराक):** २.५ किलो मूलभूत + प्रत्येक २.५ लिटर दुधामागे १ किलो अतिरिक्त खुराक (सरकी पेंड, मका भरडा, गहू भुसा).\n• **मिनरल मिक्चर व पाणी:** दररोज ५० ग्रॅम मिनरल मिक्चर आणि ७०–१०० लिटर स्वच्छ पाणी.`,
          voiceText: `दुभत्या म्हशीला रोज २० ते २५ किलो हिरवा चारा, ५ ते ७ किलो सुका चारा आणि दुधाच्या प्रमाणानुसार ३ ते ५ किलो संतुलित खुराक व मिनरल मिक्चर द्यावे. तसेच दिवसभरात भरपूर स्वच्छ पाणी पाजावे!`,
          navigateTo: navUrl,
          quickActions: [{ label: "आहार सल्ला घ्या", url: "/dashboard/book-inquiry" }],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🌾 **दुधारू भैंस का रोज़ाना चारा और खुराक चार्ट:**\n\n• **हरा चारा (20–25 किलो):** नेपियर घास, बरसीम, मक्का या ज्वार।\n• **सूखा चारा (5–7 किलो):** गेहूं का भूसा या सूखी कुट्टी।\n• **दाना / खल (Concentrate):** 2.5 किलो बेसलाइन + हर 2.5 लीटर दूध पर 1 किलो अतिरिक्त दाना (बिनौला खल, सरसों खल, चोकर और मक्का दलिया)।\n• **मिनरल मिक्चर व पानी:** रोज़ 50 ग्राम मिनरल मिक्चर, 30 ग्राम नमक और 70–100 लीटर ताज़ा पानी।`,
          voiceText: `जी, अच्छी दुधारू भैंस को रोज़ाना बीस से पच्चीस किलो हरा चारा, पांच से सात किलो सूखा भूसा, और दूध के हिसाब से तीन से पांच किलो दाना-खल और पचास ग्राम मिनरल मिक्चर देना चाहिए। साथ ही दिन में तीन-चार बार ताज़ा पानी ज़रूर पिलाएं!`,
          navigateTo: navUrl,
          quickActions: [{ label: "खुराक परामर्श बुक करें", url: "/dashboard/book-inquiry" }],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🌾 **Daily Buffalo Feeding & Nutrition Guide:**\n\n• **Green Fodder:** 20–25 kg/day (Napier grass, Maize, Berseem).\n• **Dry Fodder:** 5–7 kg/day (Wheat straw / Bhusa).\n• **Concentrate Feed (Khal/Dalia):** 2.5 kg base + 1 kg per 2.5 litres of milk.\n• **Minerals & Water:** 50g mineral mixture + 70–100 litres of clean water daily.`,
          voiceText: `A milking buffalo needs 20 to 25 kg of green fodder, 5 to 7 kg of dry fodder, and 1 kg of concentrate feed for every 2.5 litres of milk, along with 50 grams of mineral mixture and plenty of fresh water daily.`,
          navigateTo: navUrl,
          quickActions: [{ label: "Book Consultation", url: "/dashboard/book-inquiry" }],
        };
      }
      return {
        text: `🌾 **Scientific Buffalo Nutrition Plan:**\n\n• **Green Fodder:** 20–25 kg/day\n• **Dry Fodder:** 5–7 kg/day\n• **Concentrate Feed:** 2.5 kg maintenance + 1 kg per 2.5 L of milk\n• **Supplement:** 50g mineral mixture and 70–100 L fresh water daily.`,
        voiceText: `We recommend 20 to 25 kg of green fodder, 5 to 7 kg of dry straw, and balanced concentrate feed based on daily milk yield, plus 50 grams of mineral mixture every day.`,
        navigateTo: navUrl,
        quickActions: [{ label: "Book Consultation", url: "/dashboard/book-inquiry" }],
      };
    },
  },

  // 22. Health, Vaccines, Diseases, Pregnancy & Teeth/Age
  {
    id: "health_pregnancy_teeth",
    match: (q) =>
      hasAny(q, [
        "vaccine",
        "vaccination",
        "health",
        "disease",
        "bimari",
        "mastitis",
        "thanela",
        "doctor",
        "vet",
        "pregnant",
        "pregnancy",
        "ghaban",
        "calving",
        "teeth",
        "daant",
        "age",
        "बीमारी",
        "टीका",
        "थनेला",
        "डॉक्टर",
        "गाभिन",
        "ब्याने",
        "दांत",
        "उम्र",
        "लस",
        "आजार",
        "गाभण",
        "दात",
        "वय",
      ]),
    score: () => 10,
    build: (_q, lang, _ctx, navUrl) => {
      if (lang === "mr-IN") {
        return {
          text: `🩺 **म्हशींचे आरोग्य, गाभण काळ आणि वय तपासणी:**\n\n• **लसीकरण:** लाळ्या खुरकत (FMD), घटसर्प (HS) आणि फऱ्या (BQ) लसीकरण वेळेवर केले जाते व दर ३ महिन्यांनी जंतनाशक दिले जाते.\n• **गाभण काळ:** म्हशीचा गाभण काळ सुमारे **३१० दिवसांचा (१० महिने १० दिवस)** असतो.\n• **दातांवरून वय:** २ दात (~२.५-३ वर्षे, पहिले वेत), ४ दात (~३.५ वर्षे, दुसरे वेत), ६ दात (~४.५ वर्षे).`,
          voiceText: `आमच्या फार्मवरील सर्व म्हशींचे संपूर्ण लसीकरण आणि डॉक्टरकडून तपासणी केलेली असते. म्हशीचा गाभण काळ दहा महिने दहा दिवसांचा असतो आणि आम्ही प्रत्येक म्हशीचे दात व वय तपासूनच माहिती देतो!`,
          navigateTo: navUrl,
          quickActions: [{ label: "पशुवैद्यकीय सल्ला", url: "/contact" }],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🩺 **भैंस का स्वास्थ्य, टीकाकरण, गाभिन काल और उम्र की पहचान:**\n\n• **टीकाकरण (Vaccination):** हमारे फार्म की सभी भैंसों को खुरपका-मुंहपका (FMD), गलघोटू (HS) और लंगड़ा बुखार (BQ) के टीके लगे होते हैं तथा हर 3 महीने में डीवर्मिंग की जाती है।\n• **गाभिन काल (Pregnancy):** भैंस का गर्भकाल **310 दिन (10 महीने 10 दिन)** का होता है।\n• **दांत से उम्र:** 2 दांत (~3 साल, पहला ब्यात), 4 दांत (~3.5 साल, दूसरा ब्यात), 6 दांत (~4.5 साल)।`,
          voiceText: `जी, हमारे फार्म की हर भैंस को खुरपका और गलघोटू के टीके लगे होते हैं और डॉक्टर का हेल्थ सर्टिफिकेट साथ मिलता है। भैंस का गाभिन समय दस महीने दस दिन का होता है, और हम दांत गिनकर सही उम्र और ब्यात बताकर ही भैंस देते हैं!`,
          navigateTo: navUrl,
          quickActions: [{ label: "डॉक्टर परामर्श", url: "/contact" }],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🩺 **Health, Vaccination, Mastitis (Thanela) Care, Pregnancy & Dental Age:**\n\n• **Vaccinations:** All buffaloes are vaccinated against FMD, HS, and BQ and regularly dewormed.\n• **Mastitis (Thanela Disease) Prevention:** Practice post-milking **Teat Dipping** in antiseptic solution, complete milking, and dry bedding.\n• **Pregnancy Period:** 310 days (~10 months and 10 days).\n• **Dental Age:** 2 teeth (~3 yrs, 1st lactation), 4 teeth (~3.5 yrs, 2nd lactation), 6 teeth (~4.5 yrs).`,
          voiceText: `Every buffalo at our farm is fully vaccinated, dewormed, and certified by a veterinarian. We also transparently verify dental age and lactation history for every animal.`,
          navigateTo: navUrl,
          quickActions: [{ label: "Consult Vet Team", url: "/contact" }],
        };
      }
      return {
        text: `🩺 **Veterinary Care, Mastitis Prevention, Gestation & Age Verification:**\n\n• Complete FMD, HS, and BQ vaccinations and deworming.\n• **Mastitis (Thanela) Care:** Prevent udder infection with **Teat Dipping** and clean dry flooring.\n• Buffalo gestation is ~310 days (10 months, 10 days).\n• Exact age verified via dental inspection (2, 4, 6, or 8 permanent teeth).`,
        voiceText: `All our buffaloes receive full vaccinations, regular deworming, and veterinary health checks, along with transparent dental age verification.`,
        navigateTo: navUrl,
        quickActions: [{ label: "Consult Vet Team", url: "/contact" }],
      };
    },
  },

  // 23. Greetings & Conversational Start
  {
    id: "greetings_conversational",
    match: (q) =>
      hasAny(q, [
        "hello",
        "hi",
        "hey",
        "namaste",
        "namaskar",
        "ram ram",
        "assalam",
        "salam",
        "good morning",
        "good afternoon",
        "good evening",
        "kaise ho",
        "kya haal",
        "kasa kay",
        "नमस्ते",
        "नमस्कार",
        "राम राम",
        "सलाम",
        "कैसे हो",
        "क्या हाल",
        "हेलो",
        "हाय",
        "कसा काय",
        "कसे आहात",
      ]),
    score: (q) => (q.split(/\s+/).length <= 5 ? 11 : 6),
    build: (_q, lang, ctx) => {
      const userName = ctx?.userName && ctx.userName !== "Farmer" && ctx.userName !== "User" ? ctx.userName : "";
      if (lang === "mr-IN") {
        return {
          text: `🙏 **नमस्कार ${userName ? `${userName} जी` : ""}! AK Buffaloes फार्ममध्ये आपले स्वागत आहे.**\n\nमी आपला AI फार्म असिस्टंट आहे. आपण मला खालील गोष्टींबद्दल विचारू शकता:\n• 🐃 **१० प्रमुख जाती:** मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी आणि गोदावरी\n• 💰 **किंमती आणि दूध क्षमता:** ₹६५,००० ते ₹२,००,००० (६ ते १६+ लिटर/दिवस)\n• 📍 **फार्मचा पत्ता व गुगल मॅप:** पाचोरा, जि. जळगाव\n• 📝 **म्हैस बुकिंग, गॅलरी किंवा खाते माहिती**`,
          voiceText: userName
            ? `नमस्कार ${userName} जी! मी एके बफेलोज़ फार्म सपोर्टवरून बोलत आहे. बोला, आज मी तुमची काय मदत करू शकतो?`
            : `नमस्कार! मी एके बफेलोज़ फार्म सपोर्टवरून बोलत आहे. बोला, तुम्हाला म्हशींच्या १० जाती, दूध क्षमता किंवा किमतींबद्दल काय माहिती हवी आहे?`,
          quickActions: [
            { label: "सर्व म्हशी पहा 🐃", url: "/buffaloes" },
            { label: "गॅलरी पहा 🎬", url: "/gallery" },
            { label: "संपर्क आणि मॅप 📍", url: "/contact" },
          ],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🙏 **नमस्ते ${userName ? `${userName} जी` : ""}! AK Buffaloes फार्म में आपका स्वागत है।**\n\nमैं आपका AI फार्म असिस्टेंट हूँ। आप मुझसे वेबसाइट की किसी भी जानकारी या काम के बारे में बोल सकते हैं:\n• 🐃 **10 प्रमुख नस्लें:** मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी और गोदावरी\n• 💰 **कीमत और दूध:** ₹65,000 से ₹2,00,000 (6 से 16+ लीटर रोज़ाना)\n• 📍 **फार्म का पता व मैप:** पचोरा, जिला जलगांव, महाराष्ट्र\n• 📝 **भैंस बुकिंग, गैलरी (18 फोटो, 26 वीडियो) व अकाउंट मदद**`,
          voiceText: userName
            ? `जी नमस्ते ${userName} जी! मैं एके बफेलोज़ फार्म सपोर्ट से बोल रहा हूँ। हम बिल्कुल बढ़िया हैं, बताइए आज मैं आपकी क्या सेवा कर सकता हूँ?`
            : `जी नमस्ते! मैं एके बफेलोज़ फार्म सपोर्ट से बोल रहा हूँ। बताइए भाई साहब, आपको भैंसों की 10 नस्लों, दूध, कीमत या फार्म के बारे में क्या जानकारी चाहिए?`,
          quickActions: [
            { label: "सभी भैंसें देखें 🐃", url: "/buffaloes" },
            { label: "गैलरी देखें 🎬", url: "/gallery" },
            { label: "संपर्क और मैप 📍", url: "/contact" },
          ],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🙏 **Hello ${userName || "ji"}! Welcome to AK Buffaloes Farm.**\n\nI can help you with everything on our website:\n• 🐃 **10 Premium Breeds:** Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari & Godavari\n• 💰 **Prices & Milk Yield:** ₹65,000 – ₹2,00,000 (6 to 16+ L/day)\n• 📍 **Farm Address & Google Map:** Pachora, Jalgaon, Maharashtra\n• 📝 **Bookings, Gallery (18 Photos & 26 Videos) & Account Support**`,
          voiceText: userName
            ? `Hello ${userName} ji! I am speaking from AK Buffaloes Farm support. How can I help you today?`
            : `Hello ji! Welcome to AK Buffaloes Farm support. Please tell me, what would you like to know about our 10 buffalo breeds, prices, or farm today?`,
          quickActions: [
            { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
            { label: "Open Gallery 🎬", url: "/gallery" },
            { label: "Contact & Map 📍", url: "/contact" },
          ],
        };
      }
      return {
        text: `👋 **Hello ${userName || "there"}! Welcome to AK Buffaloes Farm.**\n\nI can assist you with:\n• 🐃 **10 Buffalo Breeds:** Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari & Godavari\n• 💰 **Pricing & Milk Output:** ₹65,000 – ₹2,00,000 (6 to 16+ L/day)\n• 📍 **Location & Map:** Pachora, Jalgaon, Maharashtra\n• 📝 **Bookings, Media Gallery & Account Dashboard**`,
        voiceText: userName
          ? `Hi ${userName}! You're connected with AK Buffaloes Farm support. How can I help you today?`
          : `Hi there! You're connected with AK Buffaloes Farm support. What can I help you with today?`,
        quickActions: [
          { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
          { label: "Open Gallery 🎬", url: "/gallery" },
          { label: "Contact & Map 📍", url: "/contact" },
        ],
      };
    },
  },

  // 24. Thank You / Ok / Goodbye
  {
    id: "thanks_acknowledgment",
    match: (q) =>
      hasAny(q, [
        "thank",
        "thanks",
        "shukriya",
        "dhanyawad",
        "dhanyavad",
        "aabhar",
        "thik hai",
        "theek hai",
        "ok",
        "okay",
        "accha",
        "acha",
        "bye",
        "धन्यवाद",
        "शुक्रिया",
        "ठीक है",
        "अच्छा",
        "ओके",
        "आभार",
        "बाय",
        "छान",
      ]),
    score: (q) => (q.split(/\s+/).length <= 5 ? 10 : 4),
    build: (_q, lang) => {
      if (lang === "mr-IN") {
        return {
          text: `🙏 **आपले खूप खूप आभार!** आपल्याला अजून काही माहिती हवी असल्यास किंवा कोणतेही पेज उघडायचे असल्यास मला नक्की सांगा.`,
          voiceText: `तुमचे खूप खूप आभार! बोला, तुम्हाला अजून काही माहिती हवी आहे का?`,
          quickActions: [{ label: "सर्व म्हशी पहा", url: "/buffaloes" }],
        };
      }
      if (lang === "hi-IN") {
        return {
          text: `🙏 **बहुत-बहुत धन्यवाद जी!** अगर आपको किसी और भैंस के बारे में पूछना हो या कोई पेज खोलना हो, तो बेझिझक बताइए।`,
          voiceText: `जी बहुत-बहुत धन्यवाद! बताइए, क्या मैं आपकी कोई और मदद कर सकता हूँ?`,
          quickActions: [{ label: "सभी भैंसें देखें", url: "/buffaloes" }],
        };
      }
      if (lang === "en-IN") {
        return {
          text: `🙏 **You are most welcome ji!** Please let me know if you need any more details or want me to open any page for you.`,
          voiceText: `You are most welcome ji! Please tell me if there is anything else I can help you with.`,
          quickActions: [{ label: "Browse Buffaloes", url: "/buffaloes" }],
        };
      }
      return {
        text: `🙏 **You're very welcome!** Let me know if there's anything else I can assist you with.`,
        voiceText: `You're very welcome! Let me know if you have any other questions.`,
        quickActions: [{ label: "Browse Buffaloes", url: "/buffaloes" }],
      };
    },
  },
];

export function generateLocalAiReply(
  input: string,
  userContext?: UserAiContext
): AiAssistantReply {
  const q = input.toLowerCase().trim();
  const lang = resolveLanguageMode(userContext?.language, q);
  const navUrl = detectNavigationCommand(q);

  let bestTopic: MultilingualTopic | null = null;
  let highestScore = 0;

  for (const topic of TOPICS) {
    if (topic.match(q)) {
      const s = topic.score(q);
      if (s > highestScore) {
        highestScore = s;
        bestTopic = topic;
      }
    }
  }

  if (bestTopic && highestScore > 0) {
    return bestTopic.build(q, lang, userContext, navUrl);
  }

  // Smart Contextual Conversational Fallback in the exact selected language!
  if (lang === "mr-IN") {
    return {
      text: `🐃 **AK Buffaloes फार्म सपोर्ट:**\n\nआमच्या पाचोरा (जळगाव) येथील फार्मवर **मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी आणि गोदावरी** या १० जातींच्या म्हशी **₹६५,००० ते ₹२,००,०००** दरात उपलब्ध आहेत (रोज ६ ते १६+ लिटर दूध).\n\n• **संस्थापक:** अकील भाई आणि सलीम भाई (२५+ वर्षे अनुभव)\n• **संपर्क:** +91-9022273915\n• **गुगल मॅप:** [फार्म लोकेशन पहा](https://maps.app.goo.gl/exQPMJMUVzwfWdqcA)\n\nआपण मला कोणत्याही म्हशीची किंमत, दूध क्षमता, बुकिंग किंवा कोणतेही पेज उघडण्यास सांगू शकता!`,
      voiceText: `आमच्या एके बफेलोज़ फार्मवर मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी आणि गोदावरी या दहा जातींच्या म्हशी ६५ हजारांपासून २ लाखांपर्यंत उपलब्ध आहेत. तुम्हाला यापैकी कोणत्या म्हशीची किंमत किंवा माहिती जाणून घ्यायची आहे?`,
      navigateTo: navUrl,
      quickActions: [
        { label: "सर्व म्हशी पहा 🐃", url: "/buffaloes" },
        { label: "गॅलरी पहा 🎬", url: "/gallery" },
        { label: "संपर्क आणि मॅप 📍", url: "/contact" },
      ],
    };
  }

  if (lang === "hi-IN") {
    return {
      text: `🐃 **AK Buffaloes फार्म सहायता केंद्र:**\n\nहमारे पचोरा (जलगांव, महाराष्ट्र) फार्म पर **मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी और गोदावरी** (10 नस्लें) **₹65,000 से ₹2,00,000** में उपलब्ध हैं (रोज़ाना 6 से 16+ लीटर दूध)।\n\n• **फाउंडर:** अकील भाई और सलीम भाई (25+ साल का अनुभव)\n• **फोन / WhatsApp:** +91-9022273915\n• **गूगल मैप:** [फार्म की लोकेशन देखें](https://maps.app.goo.gl/exQPMJMUVzwfWdqcA)\n\nआप मुझसे किसी भी भैंस की कीमत, दूध, बुकिंग के बारे में पूछ सकते हैं या कोई भी पेज खोलने के लिए कह सकते हैं!`,
      voiceText: `जी, हमारे एके बफेलोज़ फार्म पर मुर्रा, जाफराबादी, नीली-रावी, सूरती, मेहसाणा, बन्नी, पंढरपुरी, नागपुरी, भदावरी और गोदावरी सहित दस नस्ल की भैंसें पैंसठ हज़ार से दो लाख रुपये में उपलब्ध हैं। बताइए, आप इनमें से किस भैंस की कीमत या दूध के बारे में जानना चाहते हैं?`,
      navigateTo: navUrl,
      quickActions: [
        { label: "सभी भैंसें देखें 🐃", url: "/buffaloes" },
        { label: "गैलरी देखें 🎬", url: "/gallery" },
        { label: "संपर्क और मैप 📍", url: "/contact" },
      ],
    };
  }

  if (lang === "en-IN") {
    return {
      text: `🐃 **AK Buffaloes Farm Support:**\n\nAt our farm in Pachora, Jalgaon (Maharashtra), we offer **10 purebred buffalo breeds** — **Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari, and Godavari** — priced from **₹65,000 to ₹2,00,000** with **6 to 16+ Litres/day** verified milk yield.\n\n• **Founders:** Akil Bhai & Salim Bhai (25+ years experience)\n• **Phone / WhatsApp:** +91-9022273915\n• **Google Maps:** [Open Farm Location](https://maps.app.goo.gl/exQPMJMUVzwfWdqcA)\n\nAsk me about any breed, milk yield, booking, account help, or ask me to open any page on the website!`,
      voiceText: `At AK Buffaloes Farm in Pachora, we have 10 purebred buffalo breeds including Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari, and Godavari from 65,000 to 2 lakh Rupees. Please tell me, which breed, price, or website section would you like me to help you with?`,
      navigateTo: navUrl,
      quickActions: [
        { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
        { label: "Open Gallery 🎬", url: "/gallery" },
        { label: "Contact & Map 📍", url: "/contact" },
      ],
    };
  }

  return {
    text: `🐃 **AK Buffaloes Farm Support:**\n\nWe raise and supply **10 purebred dairy buffalo breeds** — **Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari, and Godavari** — ranging from **₹65,000 to ₹2,00,000** with **6 to 16+ Liters/day** milk yield at our farm in Pachora, Maharashtra.\n\n• **Founders:** Akil Bhai & Salim Bhai (25+ years experience)\n• **Phone / WhatsApp:** +91-9022273915\n• **Google Maps:** [Open Farm Location](https://maps.app.goo.gl/exQPMJMUVzwfWdqcA)`,
    voiceText: `At AK Buffaloes Farm, we offer 10 purebred buffalo breeds including Murrah, Jaffarabadi, Nili-Ravi, Surti, Mehsana, Banni, Pandharpuri, Nagpuri, Bhadawari, and Godavari priced from 65,000 to 200,000 Rupees. Which breed, price range, or page can I help you with today?`,
    navigateTo: navUrl,
    quickActions: [
      { label: "Browse Buffaloes 🐃", url: "/buffaloes" },
      { label: "Open Gallery 🎬", url: "/gallery" },
      { label: "Contact & Map 📍", url: "/contact" },
    ],
  };
}

