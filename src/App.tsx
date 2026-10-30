import { Suspense, lazy, useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FestivalThemeProvider } from "@/contexts/FestivalThemeContext";
import Navbar from "./components/Navbar";
import FestivalThemeBanner from "./components/FestivalThemeBanner";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import BuffaloLoader from "./components/BuffaloLoader";
import AiAssistantChat from "./components/AiAssistantChat";
import ScrollNavigation from "./components/ScrollNavigation";
import ErrorBoundary from "./components/ErrorBoundary";
import InstagramPromoPopup from "./components/InstagramPromoPopup";
function retryLazy<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return await componentImport();
      } catch (retryError) {
        console.error("Chunk load error, attempting page recovery:", retryError);
        const reloaded = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("ak_chunk_err") : null;
        if (!reloaded && typeof window !== "undefined") {
          try { sessionStorage.setItem("ak_chunk_err", "true"); } catch {}
          window.location.reload();
        }
        throw retryError;
      }
    }
  });
}

const Index = retryLazy(() => import("./pages/Index"));
const About = retryLazy(() => import("./pages/About"));
const Gallery = retryLazy(() => import("./pages/Gallery"));
const Contact = retryLazy(() => import("./pages/Contact"));
const AuthPage = retryLazy(() => import("./pages/AuthPage"));
const AdminPanel = retryLazy(() => import("./pages/AdminPanel"));
const Dashboard = retryLazy(() => import("./pages/Dashboard"));
const DashboardHome = retryLazy(() => import("./pages/DashboardHome"));
const BookInquiry = retryLazy(() => import("./pages/BookInquiry"));
const MyInquiries = retryLazy(() => import("./pages/MyInquiries"));
const UserProfile = retryLazy(() => import("./pages/UserProfile"));
const MyHistory = retryLazy(() => import("./pages/MyHistory"));
const Settings = retryLazy(() => import("./pages/Settings"));
const NotFound = retryLazy(() => import("./pages/NotFound"));
const Buffaloes = retryLazy(() => import("./pages/Buffaloes"));
const BreedDetail = retryLazy(() => import("./pages/BreedDetail"));
const ResetPassword = retryLazy(() => import("./pages/ResetPassword"));

import { voiceAnnouncer } from "@/lib/voiceAnnouncer";

const queryClient = new QueryClient();

const App = () => {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Welcome first-time visitors with AI voice: "Welcome to AK Buffaloes"
    try {
      voiceAnnouncer.welcomeFirstTimeUser();
    } catch {
      // speech synthesis unavailable in this browser
    }

    // Show buffalo preloader on page refresh / initial load
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 600);

    // Guaranteed fallback: ensures no browser or mobile device ever stays stuck on loader
    const fallbackTimer = setTimeout(() => {
      setPageLoading(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <AnimatePresence>
          {pageLoading && (
            <motion.div
              key="buffalo-initial-loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
              className="fixed inset-0 z-[99999]"
            >
              <BuffaloLoader isFullPage message="Loading AK Buffaloes..." />
            </motion.div>
          )}
        </AnimatePresence>

        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <FestivalThemeProvider>
                <InstagramPromoPopup ready={!pageLoading} />
                <Navbar />
                <FestivalThemeBanner />
                <Suspense fallback={<BuffaloLoader isFullPage={false} message="Loading page..." />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/gallery" element={<Gallery />} />
                    <Route path="/buffaloes" element={<Buffaloes />} />
                    <Route path="/buffaloes/:breed" element={<BreedDetail />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/login" element={<AuthPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/admin-login" element={<AuthPage />} />
                    <Route path="/register" element={<AuthPage />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/forgot-password" element={<ResetPassword />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/dashboard" element={<Dashboard />} >
                      <Route index element={<DashboardHome />} />
                      <Route path="book-inquiry" element={<BookInquiry />} />
                      <Route path="my-inquiries" element={<MyInquiries />} />
                      <Route path="my-history" element={<MyHistory />} />
                      <Route path="profile" element={<UserProfile />} />
                      <Route path="settings" element={<Settings />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Footer />
                <ScrollNavigation />
                <WhatsAppButton />
                <AiAssistantChat />
              </FestivalThemeProvider>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
