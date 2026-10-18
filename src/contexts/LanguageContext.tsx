import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "hi" | "mr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
});

export const useLanguage = () => useContext(LanguageContext);

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navbar
    "nav.home": "Home",
    "nav.about": "About",
    "nav.buffaloes": "Buffaloes",
    "nav.gallery": "Gallery",
    "nav.contact": "Contact Us",
    "nav.admin": "Admin",
    "nav.dashboard": "Dashboard",
    "nav.signOut": "Sign Out",
    "nav.signIn": "Sign In",
    "nav.call": "Call",
    "nav.search": "Search breeds, farm...",

    // Hero
    "hero.subtitle": "AK BUFFALOES DAIRY FARM",
    "hero.title1": "Strength, Quality &",
    "hero.title2": "Trust",
    "hero.desc": "Decades of experience in raising the finest buffalo breeds, delivering premium quality milk to families across the nation.",
    "hero.bookConsultation": "Book Consultation",
    "hero.viewBuffaloes": "View Our Buffaloes",
    "hero.callNow": "Call Now",

    // Trust Section
    "trust.subtitle": "Why Choose Us",
    "trust.title": "A Trusted Name in Dairy",
    "trust.stat1": "Years of Experience",
    "trust.stat2": "Premium Breeds",
    "trust.stat3": "Daily Milk (Liters)",
    "trust.stat4": "Happy Customers",

    // Consultation Form
    "consult.subtitle": "Get in Touch",
    "consult.title": "Schedule a Call Today!",
    "consult.name": "Your Name *",
    "consult.phone": "Phone Number (10 digits) *",
    "consult.email": "Email Address *",
    "consult.submit": "Submit Now",
    "consult.submitting": "Submitting...",
    "consult.success": "Consultation Requested!",
    "consult.successDesc": "We'll contact you soon.",

    // Testimonials
    "testimonials.subtitle": "Testimonials",
    "testimonials.title": "What Our Customers Say",

    // About
    "about.subtitle": "About Us",
    "about.title": "A Trusted Name in Dairy",
    "about.storyTitle": "Our Story",
    "about.storyDesc": "For over 25 years, AK Buffalo has been at the forefront of premium buffalo breeding. What started as a small family farm has grown into one of the region's most respected dairy operations, known for exceptional breed quality, sustainable farming practices, and unwavering commitment to customer satisfaction. Our buffaloes are raised with care on lush green pastures, producing the richest, most nutritious milk available.",
    "about.valuesSubtitle": "Our Values",
    "about.valuesTitle": "What Sets Us Apart",
    "about.val1Title": "Quality Assurance",
    "about.val1Desc": "Every buffalo undergoes rigorous health checks and breed verification.",
    "about.val2Title": "Natural Farming",
    "about.val2Desc": "Our buffaloes graze on organic pastures with no artificial supplements.",
    "about.val3Title": "Expert Team",
    "about.val3Desc": "Dedicated veterinarians and dairy specialists ensure the best care.",
    "about.val4Title": "Proven Results",
    "about.val4Desc": "Consistently high milk yields that exceed industry standards.",

    // Owner
    "about.ownerSubtitle": "Meet The Founder",
    "about.ownerTitle": "The Man Behind The Vision",
    "about.ownerName": "Akil Bhai",
    "about.ownerRole": "Founder & Managing Director",
    "about.ownerDesc": "With over 25 years of hands-on experience in buffalo breeding and dairy farming, Akil Bhai has built one of the most trusted names in the industry. His passion for quality breeds and sustainable farming practices has transformed a small family farm into a thriving enterprise serving thousands of satisfied customers.",
    "about.ownerAchieve1": "25+ Years in Buffalo Breeding",
    "about.ownerAchieve2": "Served 2000+ Happy Customers",
    "about.ownerAchieve3": "Based in Maharashtra, India",
    "about.coFounderName": "Salim Bhai",
    "about.coFounderRole": "Co-Founder & Operations Director",
    "about.coFounderDesc": "Salim Bhai brings operational discipline, farm execution expertise, and a customer-first mindset to AK Buffalo. He ensures smooth day-to-day management, efficient planning, and an experience that remains seamless from inquiry to delivery.",

    // Contact
    "contact.subtitle": "Reach Out",
    "contact.title": "Contact Us",
    "contact.getInTouch": "Get in Touch",
    "contact.desc": "We'd love to hear from you. Whether you're interested in our buffaloes, need a consultation, or have questions about dairy farming, reach out today.",
    "contact.location": "Location",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.yourName": "Your Name *",
    "contact.phoneNumber": "Phone Number (10 digits)",
    "contact.emailAddress": "Email Address *",
    "contact.yourMessage": "Your Message *",
    "contact.send": "Send Now",
    "contact.sending": "Sending...",
    "contact.success": "Message Sent!",
    "contact.successDesc": "We'll get back to you shortly.",

    // Footer
    "footer.desc": "A trusted name in the dairy industry with decades of experience raising premium buffalo breeds for quality milk production.",
    "footer.quickLinks": "Quick Links",
    "footer.contactInfo": "Contact Info",
    "footer.rights": "All rights reserved.",
    "footer.privacyPolicy": "Privacy Policy",
    "footer.termsOfService": "Terms of Service",

    // Dashboard
    "dash.welcome": "Welcome,",
    "dash.manageDesc": "Manage your buffalo enquiries and track replies from our team.",
    "dash.inquiries": "Inquiries",
    "dash.viewAll": "View All →",
    "dash.recentInquiries": "Recent Inquiries",
    "dash.yourInfo": "Your Info",
    "dash.notSet": "Not set",
    "dash.quickActions": "Quick Actions",
    "dash.newInquiry": "New Inquiry",
    "dash.myInquiries": "My Inquiries",
    "dash.noInquiries": "No inquiries yet",
    "dash.date": "Date",
    "dash.message": "Message",

    // Dashboard Sidebar
    "sidebar.dashboard": "Dashboard",
    "sidebar.bookInquiry": "Book Inquiry",
    "sidebar.myInquiries": "My Inquiries",
    "sidebar.myHistory": "My History",
    "sidebar.myProfile": "My Profile",
    "sidebar.settings": "Settings",
    "sidebar.logout": "Logout",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account preferences",
    "settings.appearance": "Appearance",
    "settings.darkMode": "Dark Mode",
    "settings.darkModeDesc": "Switch between light and dark themes",
    "settings.notifications": "Notifications",
    "settings.emailNotif": "Email Notifications",
    "settings.emailNotifDesc": "Receive updates via email",
    "settings.security": "Security",
    "settings.changePassword": "Change Password",
    "settings.newPassword": "New Password",
    "settings.confirmPassword": "Confirm Password",
    "settings.updatePassword": "Update Password",
    "settings.updating": "Updating...",
    "settings.account": "Account",
    "settings.role": "Role",
    "settings.dangerZone": "Danger Zone",
    "settings.deleteAccount": "Delete Account",
    "settings.deleteDesc": "Permanently delete your account and all data. This cannot be undone.",
    "settings.deleteBtn": "Delete My Account",
    "settings.deleteConfirmTitle": "Are you absolutely sure?",
    "settings.deleteConfirmDesc": "This will permanently delete your account, profile, inquiries, and all associated data. This action cannot be undone.",
    "settings.cancel": "Cancel",
    "settings.confirmDelete": "Yes, Delete My Account",
    "settings.deleting": "Deleting...",

    // Language
    "lang.label": "Language",

    // Gallery
    "gallery.subtitle": "Our Gallery",
    "gallery.title": "Farm & Breeds Gallery",

    // Buffaloes
    "buffaloes.subtitle": "Our Breeds",
    "buffaloes.title": "Premium Buffalo Breeds",
    "buffaloes.desc": "Explore five premium buffalo breeds and send an enquiry about a buffalo you are interested in.",
    "buffaloes.available": "Available",
    "buffaloes.milk": "Milk",
    "buffaloes.price": "Price",
    "buffaloes.viewBuy": "View Collection →",

    // Auth
    "auth.title": "Account Access",
    "auth.subtitle": "Sign in, register, or access admin panel",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.admin": "Admin",
    "auth.email": "Email Address",
    "auth.password": "Password",
    "auth.signIn": "Sign In",
    "auth.signingIn": "Signing in...",
    "auth.forgotPassword": "Forgot Password?",
    "auth.forgotTitle": "Forgot Password",
    "auth.forgotSubtitle": "Enter your registered email to receive a password reset link and OTP",
    "auth.sendResetLink": "Send Reset Link & OTP",
    "auth.sendingReset": "Sending...",
    "auth.resetTitle": "Reset Password",
    "auth.resetSubtitle": "Enter your new password below",
    "auth.otpTitle": "Verify Email OTP",
    "auth.otpSubtitle": "Enter the 6-digit code sent to your email",
    "auth.verifyAndReset": "Verify OTP & Update Password",
    "auth.verifyingOtp": "Verifying OTP...",
    "auth.resendOtp": "Resend OTP",
    "auth.resetPassword": "Reset Password",
    "auth.resetDesc": "Enter your email and set a new password",
    "auth.newPasswordPlaceholder": "New Password (min 8 characters)",
    "auth.confirmPasswordPlaceholder": "Confirm New Password",
    "auth.backToLogin": "Back to login",
    "auth.passwordUpdated": "Password Updated!",
    "auth.passwordUpdatedDesc": "Your password has been reset. You can now login with your new password.",
    "auth.goToLogin": "Go to Login",
    "auth.fullName": "Full Name *",
    "auth.phone": "Phone Number (10 digits) *",
    "auth.emailRequired": "Email Address *",
    "auth.passwordRequired": "Password *",
    "auth.confirmPassword": "Confirm Password *",
    "auth.registerBtn": "Register",
    "auth.creatingAccount": "Creating Account...",
    "auth.accountCreated": "Account Created!",
    "auth.verifyEmail": "Your account is ready. You can sign in now.",
    "auth.backToRegister": "Back to Register",
    "auth.adminWarning": "Admin access only. Unauthorized attempts will be denied.",
    "auth.adminEmail": "Admin Email",
    "auth.adminPassword": "Admin Password",
    "auth.adminLogin": "Admin Login",
    "auth.adminLoggingIn": "Logging in...",
  },
  hi: {
    // Navbar
    "nav.home": "होम",
    "nav.about": "हमारे बारे में",
    "nav.buffaloes": "भैंसें",
    "nav.gallery": "गैलरी",
    "nav.contact": "संपर्क करें",
    "nav.admin": "एडमिन",
    "nav.dashboard": "डैशबोर्ड",
    "nav.signOut": "साइन आउट",
    "nav.signIn": "साइन इन",
    "nav.call": "कॉल",
    "nav.search": "नस्लें, फार्म खोजें...",

    // Hero
    "hero.subtitle": "AK BUFFALOES DAIRY FARM",
    "hero.title1": "ताकत, गुणवत्ता और",
    "hero.title2": "विश्वास",
    "hero.desc": "बेहतरीन भैंस नस्लों को पालने का दशकों का अनुभव, देश भर के परिवारों को प्रीमियम गुणवत्ता का दूध देना।",
    "hero.bookConsultation": "परामर्श बुक करें",
    "hero.viewBuffaloes": "हमारी भैंसें देखें",
    "hero.callNow": "अभी कॉल करें",

    // Trust Section
    "trust.subtitle": "हमें क्यों चुनें",
    "trust.title": "डेयरी में एक विश्वसनीय नाम",
    "trust.stat1": "वर्षों का अनुभव",
    "trust.stat2": "प्रीमियम नस्लें",
    "trust.stat3": "दैनिक दूध (लीटर)",
    "trust.stat4": "खुश ग्राहक",

    // Consultation Form
    "consult.subtitle": "संपर्क में रहें",
    "consult.title": "आज ही कॉल शेड्यूल करें!",
    "consult.name": "आपका नाम *",
    "consult.phone": "फोन नंबर (10 अंक) *",
    "consult.email": "ईमेल पता *",
    "consult.submit": "अभी जमा करें",
    "consult.submitting": "जमा हो रहा है...",
    "consult.success": "परामर्श अनुरोध किया!",
    "consult.successDesc": "हम जल्द ही आपसे संपर्क करेंगे।",

    // Testimonials
    "testimonials.subtitle": "प्रशंसापत्र",
    "testimonials.title": "हमारे ग्राहक क्या कहते हैं",

    // About
    "about.subtitle": "हमारे बारे में",
    "about.title": "डेयरी में एक विश्वसनीय नाम",
    "about.storyTitle": "हमारी कहानी",
    "about.storyDesc": "25 से अधिक वर्षों से, AK BUFFALOES प्रीमियम भैंस प्रजनन में अग्रणी रहा है। जो एक छोटे पारिवारिक फार्म के रूप में शुरू हुआ, वह इस क्षेत्र के सबसे सम्मानित डेयरी संचालनों में से एक बन गया है, जो असाधारण नस्ल गुणवत्ता, टिकाऊ खेती प्रथाओं और ग्राहक संतुष्टि के प्रति अटूट प्रतिबद्धता के लिए जाना जाता है।",
    "about.valuesSubtitle": "हमारे मूल्य",
    "about.valuesTitle": "हमें अलग क्या बनाता है",
    "about.val1Title": "गुणवत्ता आश्वासन",
    "about.val1Desc": "हर भैंस की कठोर स्वास्थ्य जांच और नस्ल सत्यापन होता है।",
    "about.val2Title": "प्राकृतिक खेती",
    "about.val2Desc": "हमारी भैंसें बिना कृत्रिम पूरक के जैविक चरागाहों पर चरती हैं।",
    "about.val3Title": "विशेषज्ञ टीम",
    "about.val3Desc": "समर्पित पशु चिकित्सक और डेयरी विशेषज्ञ सर्वोत्तम देखभाल सुनिश्चित करते हैं।",
    "about.val4Title": "सिद्ध परिणाम",
    "about.val4Desc": "लगातार उच्च दूध उपज जो उद्योग मानकों से अधिक है।",

    // Owner
    "about.ownerSubtitle": "संस्थापक से मिलें",
    "about.ownerTitle": "विज़न के पीछे का व्यक्ति",
    "about.ownerName": "अकील भाई",
    "about.ownerRole": "संस्थापक और प्रबंध निदेशक",
    "about.ownerDesc": "भैंस प्रजनन और डेयरी फार्मिंग में 25 से अधिक वर्षों के व्यावहारिक अनुभव के साथ, अकील भाई ने उद्योग में सबसे विश्वसनीय नामों में से एक बनाया है। गुणवत्तापूर्ण नस्लों और टिकाऊ खेती प्रथाओं के प्रति उनके जुनून ने एक छोटे पारिवारिक फार्म को हजारों संतुष्ट ग्राहकों की सेवा करने वाले समृद्ध उद्यम में बदल दिया है।",
    "about.ownerAchieve1": "भैंस प्रजनन में 25+ वर्ष",
    "about.ownerAchieve2": "2000+ खुश ग्राहकों की सेवा",
    "about.ownerAchieve3": "महाराष्ट्र, भारत में स्थित",
    "about.coFounderName": "सलीम भाई",
    "about.coFounderRole": "सह-संस्थापक और संचालन निदेशक",
    "about.coFounderDesc": "सलीम भाई AK Buffalo में परिचालन अनुशासन, फार्म निष्पादन विशेषज्ञता और ग्राहक-केंद्रित दृष्टिकोण लेकर आते हैं। वे दैनिक संचालन, कुशल योजना और पूछताछ से डिलीवरी तक सहज ग्राहक अनुभव को सुचारू बनाते हैं।",

    // Contact
    "contact.subtitle": "संपर्क करें",
    "contact.title": "हमसे संपर्क करें",
    "contact.getInTouch": "संपर्क में रहें",
    "contact.desc": "हम आपसे सुनना चाहेंगे। चाहे आप हमारी भैंसों में रुचि रखते हों, परामर्श चाहिए, या डेयरी फार्मिंग के बारे में सवाल हों, आज ही संपर्क करें।",
    "contact.location": "स्थान",
    "contact.phone": "फोन",
    "contact.email": "ईमेल",
    "contact.yourName": "आपका नाम *",
    "contact.phoneNumber": "फोन नंबर (10 अंक)",
    "contact.emailAddress": "ईमेल पता *",
    "contact.yourMessage": "आपका संदेश *",
    "contact.send": "अभी भेजें",
    "contact.sending": "भेजा जा रहा है...",
    "contact.success": "संदेश भेजा गया!",
    "contact.successDesc": "हम जल्द ही आपसे संपर्क करेंगे।",

    // Footer
    "footer.desc": "दशकों के अनुभव के साथ डेयरी उद्योग में एक विश्वसनीय नाम, गुणवत्ता दूध उत्पादन के लिए प्रीमियम भैंस नस्लें पालना।",
    "footer.quickLinks": "त्वरित लिंक",
    "footer.contactInfo": "संपर्क जानकारी",
    "footer.rights": "सर्वाधिकार सुरक्षित।",
    "footer.privacyPolicy": "Privacy Policy",
    "footer.termsOfService": "Terms of Service",

    // Dashboard
    "dash.welcome": "स्वागत है,",
    "dash.manageDesc": "अपनी भैंस की पूछताछ और हमारी टीम के जवाब देखें।",
    "dash.inquiries": "पूछताछ",
    "dash.viewAll": "सभी देखें →",
    "dash.recentInquiries": "हालिया पूछताछ",
    "dash.yourInfo": "आपकी जानकारी",
    "dash.notSet": "सेट नहीं है",
    "dash.quickActions": "त्वरित कार्य",
    "dash.newInquiry": "नई पूछताछ",
    "dash.myInquiries": "मेरी पूछताछ",
    "dash.noInquiries": "अभी तक कोई पूछताछ नहीं",
    "dash.date": "तारीख",
    "dash.message": "संदेश",

    // Dashboard Sidebar
    "sidebar.dashboard": "डैशबोर्ड",
    "sidebar.bookInquiry": "पूछताछ बुक करें",
    "sidebar.myInquiries": "मेरी पूछताछ",
    "sidebar.myHistory": "मेरा इतिहास",
    "sidebar.myProfile": "मेरी प्रोफाइल",
    "sidebar.settings": "सेटिंग्स",
    "sidebar.logout": "लॉगआउट",

    // Settings
    "settings.title": "सेटिंग्स",
    "settings.subtitle": "अपनी खाता प्राथमिकताएं प्रबंधित करें",
    "settings.appearance": "दिखावट",
    "settings.darkMode": "डार्क मोड",
    "settings.darkModeDesc": "लाइट और डार्क थीम के बीच स्विच करें",
    "settings.notifications": "सूचनाएं",
    "settings.emailNotif": "ईमेल सूचनाएं",
    "settings.emailNotifDesc": "ईमेल के माध्यम से अपडेट प्राप्त करें",
    "settings.security": "सुरक्षा",
    "settings.changePassword": "पासवर्ड बदलें",
    "settings.newPassword": "नया पासवर्ड",
    "settings.confirmPassword": "पासवर्ड की पुष्टि करें",
    "settings.updatePassword": "पासवर्ड अपडेट करें",
    "settings.updating": "अपडेट हो रहा है...",
    "settings.account": "खाता",
    "settings.role": "भूमिका",
    "settings.dangerZone": "खतरे का क्षेत्र",
    "settings.deleteAccount": "खाता हटाएं",
    "settings.deleteDesc": "अपना खाता और सभी डेटा स्थायी रूप से हटाएं। यह पूर्ववत नहीं किया जा सकता।",
    "settings.deleteBtn": "मेरा खाता हटाएं",
    "settings.deleteConfirmTitle": "क्या आप बिल्कुल सुनिश्चित हैं?",
    "settings.deleteConfirmDesc": "यह आपका खाता, प्रोफाइल, पूछताछ और सभी संबंधित डेटा स्थायी रूप से हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।",
    "settings.cancel": "रद्द करें",
    "settings.confirmDelete": "हाँ, मेरा खाता हटाएं",
    "settings.deleting": "हटाया जा रहा है...",

    // Language
    "lang.label": "भाषा",

    // Gallery
    "gallery.subtitle": "हमारी गैलरी",
    "gallery.title": "फार्म और नस्ल गैलरी",

    // Buffaloes
    "buffaloes.subtitle": "हमारी नस्लें",
    "buffaloes.title": "प्रीमियम भैंस नस्लें",
    "buffaloes.desc": "पांच प्रीमियम भैंस नस्लें देखें और पसंद की भैंस के बारे में पूछताछ भेजें।",
    "buffaloes.available": "उपलब्ध",
    "buffaloes.milk": "दूध",
    "buffaloes.price": "कीमत",
    "buffaloes.viewBuy": "संग्रह देखें →",

    // Auth
    "auth.title": "खाता पहुंच",
    "auth.subtitle": "साइन इन करें, पंजीकरण करें, या एडमिन पैनल एक्सेस करें",
    "auth.login": "लॉगिन",
    "auth.register": "पंजीकरण",
    "auth.admin": "एडमिन",
    "auth.email": "ईमेल पता",
    "auth.password": "पासवर्ड",
    "auth.signIn": "साइन इन",
    "auth.signingIn": "साइन इन हो रहा है...",
    "auth.forgotPassword": "पासवर्ड भूल गए?",
    "auth.forgotTitle": "पासवर्ड भूल गए",
    "auth.forgotSubtitle": "पासवर्ड रीसेट लिंक और OTP प्राप्त करने के लिए अपना ईमेल दर्ज करें",
    "auth.sendResetLink": "रीसेट लिंक और OTP भेजें",
    "auth.sendingReset": "भेजा जा रहा है...",
    "auth.resetTitle": "पासवर्ड रीसेट करें",
    "auth.resetSubtitle": "नीचे अपना नया पासवर्ड दर्ज करें",
    "auth.otpTitle": "ईमेल OTP सत्यापित करें",
    "auth.otpSubtitle": "अपने ईमेल पर भेजा गया 6-अंकों का कोड दर्ज करें",
    "auth.verifyAndReset": "OTP सत्यापित करें और पासवर्ड बदलें",
    "auth.verifyingOtp": "OTP सत्यापित हो रहा है...",
    "auth.resendOtp": "OTP पुनः भेजें",
    "auth.resetPassword": "पासवर्ड रीसेट करें",
    "auth.resetDesc": "अपना ईमेल दर्ज करें और नया पासवर्ड सेट करें",
    "auth.newPasswordPlaceholder": "नया पासवर्ड (न्यूनतम 8 अक्षर)",
    "auth.confirmPasswordPlaceholder": "नया पासवर्ड पुष्टि करें",
    "auth.backToLogin": "लॉगिन पर वापस जाएं",
    "auth.passwordUpdated": "पासवर्ड अपडेट हो गया!",
    "auth.passwordUpdatedDesc": "आपका पासवर्ड रीसेट हो गया है। अब आप नए पासवर्ड से लॉगिन कर सकते हैं।",
    "auth.goToLogin": "लॉगिन पर जाएं",
    "auth.fullName": "पूरा नाम *",
    "auth.phone": "फोन नंबर (10 अंक) *",
    "auth.emailRequired": "ईमेल पता *",
    "auth.passwordRequired": "पासवर्ड *",
    "auth.confirmPassword": "पासवर्ड पुष्टि करें *",
    "auth.registerBtn": "पंजीकरण करें",
    "auth.creatingAccount": "खाता बनाया जा रहा है...",
    "auth.accountCreated": "खाता बनाया गया!",
    "auth.verifyEmail": "आपका खाता तैयार है। अब साइन इन करें।",
    "auth.backToRegister": "पंजीकरण पर वापस जाएं",
    "auth.adminWarning": "केवल एडमिन पहुंच। अनधिकृत प्रयास अस्वीकार किए जाएंगे।",
    "auth.adminEmail": "एडमिन ईमेल",
    "auth.adminPassword": "एडमिन पासवर्ड",
    "auth.adminLogin": "एडमिन लॉगिन",
    "auth.adminLoggingIn": "लॉगिन हो रहा है...",
  },
  mr: {
    // Navbar
    "nav.home": "मुख्यपृष्ठ",
    "nav.about": "आमच्याबद्दल",
    "nav.buffaloes": "म्हशी",
    "nav.gallery": "गॅलरी",
    "nav.contact": "संपर्क साधा",
    "nav.admin": "अॅडमिन",
    "nav.dashboard": "डॅशबोर्ड",
    "nav.signOut": "साइन आउट",
    "nav.signIn": "साइन इन",
    "nav.call": "कॉल",
    "nav.search": "जाती, फार्म शोधा...",

    // Hero
    "hero.subtitle": "AK BUFFALOES DAIRY FARM",
    "hero.title1": "ताकद, गुणवत्ता आणि",
    "hero.title2": "विश्वास",
    "hero.desc": "उत्कृष्ट म्हैस जाती वाढवण्याचा दशकांचा अनुभव, देशभरातील कुटुंबांना प्रीमियम गुणवत्तेचे दूध देणे.",
    "hero.bookConsultation": "सल्लामसलत बुक करा",
    "hero.viewBuffaloes": "आमच्या म्हशी पहा",
    "hero.callNow": "आता कॉल करा",

    // Trust Section
    "trust.subtitle": "आम्हाला का निवडा",
    "trust.title": "डेअरीतील एक विश्वासार्ह नाव",
    "trust.stat1": "वर्षांचा अनुभव",
    "trust.stat2": "प्रीमियम जाती",
    "trust.stat3": "दैनिक दूध (लिटर)",
    "trust.stat4": "आनंदी ग्राहक",

    // Consultation Form
    "consult.subtitle": "संपर्कात रहा",
    "consult.title": "आजच कॉल शेड्यूल करा!",
    "consult.name": "तुमचे नाव *",
    "consult.phone": "फोन नंबर (10 अंक) *",
    "consult.email": "ईमेल पत्ता *",
    "consult.submit": "आता सबमिट करा",
    "consult.submitting": "सबमिट होत आहे...",
    "consult.success": "सल्लामसलत विनंती केली!",
    "consult.successDesc": "आम्ही लवकरच तुमच्याशी संपर्क करू.",

    // Testimonials
    "testimonials.subtitle": "प्रशंसापत्रे",
    "testimonials.title": "आमचे ग्राहक काय म्हणतात",

    // About
    "about.subtitle": "आमच्याबद्दल",
    "about.title": "डेअरीतील एक विश्वासार्ह नाव",
    "about.storyTitle": "आमची कथा",
    "about.storyDesc": "25 वर्षांहून अधिक काळ, AK BUFFALOES प्रीमियम म्हैस प्रजननात आघाडीवर आहे. एका छोट्या कौटुंबिक फार्मपासून सुरू झालेले, हे प्रदेशातील सर्वात आदरणीय डेअरी ऑपरेशन्सपैकी एक बनले आहे, जे अपवादात्मक जातीची गुणवत्ता, शाश्वत शेती पद्धती आणि ग्राहक समाधानासाठी अटूट बांधिलकीसाठी ओळखले जाते.",
    "about.valuesSubtitle": "आमची मूल्ये",
    "about.valuesTitle": "आम्हाला वेगळे काय बनवते",
    "about.val1Title": "गुणवत्ता हमी",
    "about.val1Desc": "प्रत्येक म्हशीची कठोर आरोग्य तपासणी आणि जाती पडताळणी होते.",
    "about.val2Title": "नैसर्गिक शेती",
    "about.val2Desc": "आमच्या म्हशी कृत्रिम पूरक पदार्थांशिवाय सेंद्रिय कुरणांवर चरतात.",
    "about.val3Title": "तज्ञ टीम",
    "about.val3Desc": "समर्पित पशुवैद्य आणि डेअरी तज्ञ सर्वोत्तम काळजी घेतात.",
    "about.val4Title": "सिद्ध परिणाम",
    "about.val4Desc": "सातत्याने उच्च दूध उत्पादन जे उद्योग मानकांपेक्षा जास्त आहे.",

    // Owner
    "about.ownerSubtitle": "संस्थापकांना भेटा",
    "about.ownerTitle": "दृष्टीमागील व्यक्ती",
    "about.ownerName": "अकील भाई",
    "about.ownerRole": "संस्थापक आणि व्यवस्थापकीय संचालक",
    "about.ownerDesc": "म्हैस प्रजनन आणि डेअरी फार्मिंगमध्ये 25 वर्षांहून अधिक अनुभवासह, अकील भाई यांनी उद्योगातील सर्वात विश्वासार्ह नावांपैकी एक बनवले आहे. गुणवत्तापूर्ण जाती आणि शाश्वत शेती पद्धतींबद्दलच्या त्यांच्या उत्कटतेने एका छोट्या कौटुंबिक फार्मचे हजारो समाधानी ग्राहकांची सेवा करणाऱ्या भरभराटीच्या उद्यमात रूपांतर केले आहे.",
    "about.ownerAchieve1": "म्हैस प्रजननात 25+ वर्षे",
    "about.ownerAchieve2": "2000+ आनंदी ग्राहकांची सेवा",
    "about.ownerAchieve3": "महाराष्ट्र, भारतात स्थित",
    "about.coFounderName": "सलीम भाई",
    "about.coFounderRole": "सह-संस्थापक आणि ऑपरेशन्स डायरेक्टर",
    "about.coFounderDesc": "सलीम भाई AK Buffalo मध्ये परिचालन शिस्त, फार्म अंमलबजावणी कौशल्ये आणि ग्राहक-केंद्रित दृष्टीकोन आणतात. ते दररोजचे संचालन, कार्यक्षम नियोजन आणि चौकशीपासून डिलिव्हरीपर्यंत सहज अनुभव सुनिश्चित करतात.",

    // Contact
    "contact.subtitle": "संपर्क साधा",
    "contact.title": "आमच्याशी संपर्क साधा",
    "contact.getInTouch": "संपर्कात रहा",
    "contact.desc": "आम्हाला तुमच्याकडून ऐकायला आवडेल. तुम्हाला आमच्या म्हशींमध्ये रस असो, सल्लामसलत हवी असो किंवा डेअरी फार्मिंगबद्दल प्रश्न असो, आजच संपर्क साधा.",
    "contact.location": "स्थान",
    "contact.phone": "फोन",
    "contact.email": "ईमेल",
    "contact.yourName": "तुमचे नाव *",
    "contact.phoneNumber": "फोन नंबर (10 अंक)",
    "contact.emailAddress": "ईमेल पत्ता *",
    "contact.yourMessage": "तुमचा संदेश *",
    "contact.send": "आता पाठवा",
    "contact.sending": "पाठवत आहे...",
    "contact.success": "संदेश पाठवला!",
    "contact.successDesc": "आम्ही लवकरच तुमच्याशी संपर्क करू.",

    // Footer
    "footer.desc": "गुणवत्ता दूध उत्पादनासाठी प्रीमियम म्हैस जाती वाढवण्याचा दशकांचा अनुभव असलेले डेअरी उद्योगातील एक विश्वासार्ह नाव.",
    "footer.quickLinks": "द्रुत दुवे",
    "footer.contactInfo": "संपर्क माहिती",
    "footer.rights": "सर्व हक्क राखीव.",
    "footer.privacyPolicy": "Privacy Policy",
    "footer.termsOfService": "Terms of Service",

    // Dashboard
    "dash.welcome": "स्वागत आहे,",
    "dash.manageDesc": "तुमच्या म्हशीच्या चौकशा आणि आमच्या टीमची उत्तरे पहा.",
    "dash.inquiries": "चौकशी",
    "dash.viewAll": "सर्व पहा →",
    "dash.recentInquiries": "अलीकडील चौकशी",
    "dash.yourInfo": "तुमची माहिती",
    "dash.notSet": "सेट नाही",
    "dash.quickActions": "द्रुत क्रिया",
    "dash.newInquiry": "नवीन चौकशी",
    "dash.myInquiries": "माझ्या चौकशी",
    "dash.noInquiries": "अजून कोणतीही चौकशी नाही",
    "dash.date": "तारीख",
    "dash.message": "संदेश",

    // Dashboard Sidebar
    "sidebar.dashboard": "डॅशबोर्ड",
    "sidebar.bookInquiry": "चौकशी बुक करा",
    "sidebar.myInquiries": "माझ्या चौकशी",
    "sidebar.myHistory": "माझा इतिहास",
    "sidebar.myProfile": "माझी प्रोफाइल",
    "sidebar.settings": "सेटिंग्ज",
    "sidebar.logout": "लॉगआउट",

    // Settings
    "settings.title": "सेटिंग्ज",
    "settings.subtitle": "तुमच्या खात्याची प्राधान्ये व्यवस्थापित करा",
    "settings.appearance": "दिसणे",
    "settings.darkMode": "डार्क मोड",
    "settings.darkModeDesc": "लाइट आणि डार्क थीममध्ये बदला",
    "settings.notifications": "सूचना",
    "settings.emailNotif": "ईमेल सूचना",
    "settings.emailNotifDesc": "ईमेलद्वारे अपडेट मिळवा",
    "settings.security": "सुरक्षा",
    "settings.changePassword": "पासवर्ड बदला",
    "settings.newPassword": "नवीन पासवर्ड",
    "settings.confirmPassword": "पासवर्ड पुष्टी करा",
    "settings.updatePassword": "पासवर्ड अपडेट करा",
    "settings.updating": "अपडेट होत आहे...",
    "settings.account": "खाते",
    "settings.role": "भूमिका",
    "settings.dangerZone": "धोकादायक क्षेत्र",
    "settings.deleteAccount": "खाते हटवा",
    "settings.deleteDesc": "तुमचे खाते आणि सर्व डेटा कायमचा हटवा. हे पूर्ववत केले जाऊ शकत नाही.",
    "settings.deleteBtn": "माझे खाते हटवा",
    "settings.deleteConfirmTitle": "तुम्हाला पूर्णपणे खात्री आहे का?",
    "settings.deleteConfirmDesc": "हे तुमचे खाते, प्रोफाइल, चौकशी आणि सर्व संबंधित डेटा कायमचा हटवेल. ही क्रिया पूर्ववत केली जाऊ शकत नाही.",
    "settings.cancel": "रद्द करा",
    "settings.confirmDelete": "हो, माझे खाते हटवा",
    "settings.deleting": "हटवत आहे...",

    // Language
    "lang.label": "भाषा",

    // Gallery
    "gallery.subtitle": "आमची गॅलरी",
    "gallery.title": "फार्म आणि जाती गॅलरी",

    // Buffaloes
    "buffaloes.subtitle": "आमच्या जाती",
    "buffaloes.title": "प्रीमियम म्हैस जाती",
    "buffaloes.desc": "पाच प्रीमियम म्हशींच्या जाती पाहा आणि आवडलेल्या म्हशीबद्दल चौकशी पाठवा.",
    "buffaloes.available": "उपलब्ध",
    "buffaloes.milk": "दूध",
    "buffaloes.price": "किंमत",
    "buffaloes.viewBuy": "संग्रह पाहा →",

    // Auth
    "auth.title": "खाते प्रवेश",
    "auth.subtitle": "साइन इन करा, नोंदणी करा किंवा अॅडमिन पॅनेल ऍक्सेस करा",
    "auth.login": "लॉगिन",
    "auth.register": "नोंदणी",
    "auth.admin": "अॅडमिन",
    "auth.email": "ईमेल पत्ता",
    "auth.password": "पासवर्ड",
    "auth.signIn": "साइन इन",
    "auth.signingIn": "साइन इन होत आहे...",
    "auth.forgotPassword": "पासवर्ड विसरलात?",
    "auth.forgotTitle": "पासवर्ड विसरलात",
    "auth.forgotSubtitle": "पासवर्ड रीसेट लिंक आणि OTP मिळविण्यासाठी तुमचा ईमेल प्रविष्ट करा",
    "auth.sendResetLink": "रीसेट लिंक आणि OTP पाठवा",
    "auth.sendingReset": "पाठवले जात आहे...",
    "auth.resetTitle": "पासवर्ड रीसेट करा",
    "auth.resetSubtitle": "खाली तुमचा नवीन पासवर्ड प्रविष्ट करा",
    "auth.otpTitle": "ईमेल OTP सत्यापित करा",
    "auth.otpSubtitle": "तुमच्या ईमेलवर पाठवलेला ६ अंकी कोड प्रविष्ट करा",
    "auth.verifyAndReset": "OTP सत्यापित करा आणि पासवर्ड बदला",
    "auth.verifyingOtp": "OTP सत्यापित होत आहे...",
    "auth.resendOtp": "OTP पुन्हा पाठवा",
    "auth.resetPassword": "पासवर्ड रीसेट करा",
    "auth.resetDesc": "तुमचा ईमेल प्रविष्ट करा आणि नवीन पासवर्ड सेट करा",
    "auth.newPasswordPlaceholder": "नवीन पासवर्ड (किमान 8 अक्षरे)",
    "auth.confirmPasswordPlaceholder": "नवीन पासवर्ड पुष्टी करा",
    "auth.backToLogin": "लॉगिनवर परत जा",
    "auth.passwordUpdated": "पासवर्ड अपडेट झाला!",
    "auth.passwordUpdatedDesc": "तुमचा पासवर्ड रीसेट झाला आहे. आता तुम्ही नवीन पासवर्डने लॉगिन करू शकता.",
    "auth.goToLogin": "लॉगिनवर जा",
    "auth.fullName": "पूर्ण नाव *",
    "auth.phone": "फोन नंबर (10 अंक) *",
    "auth.emailRequired": "ईमेल पत्ता *",
    "auth.passwordRequired": "पासवर्ड *",
    "auth.confirmPassword": "पासवर्ड पुष्टी करा *",
    "auth.registerBtn": "नोंदणी करा",
    "auth.creatingAccount": "खाते तयार होत आहे...",
    "auth.accountCreated": "खाते तयार झाले!",
    "auth.verifyEmail": "तुमचे खाते तयार आहे. आता साइन इन करा.",
    "auth.backToRegister": "नोंदणीवर परत जा",
    "auth.adminWarning": "केवळ अॅडमिन प्रवेश. अनधिकृत प्रयत्न नाकारले जातील.",
    "auth.adminEmail": "अॅडमिन ईमेल",
    "auth.adminPassword": "अॅडमिन पासवर्ड",
    "auth.adminLogin": "अॅडमिन लॉगिन",
    "auth.adminLoggingIn": "लॉगिन होत आहे...",
  },
};

export const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिंदी",
  mr: "मराठी",
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem("app_language") as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
