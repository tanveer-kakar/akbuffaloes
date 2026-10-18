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
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const BookInquiry = lazy(() => import("./pages/BookInquiry"));
const MyInquiries = lazy(() => import("./pages/MyInquiries"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const MyHistory = lazy(() => import("./pages/MyHistory"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Buffaloes = lazy(() => import("./pages/Buffaloes"));
const BreedDetail = lazy(() => import("./pages/BreedDetail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

import { voiceAnnouncer } from "@/lib/voiceAnnouncer";

const queryClient = new QueryClient();

const App = () => {
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    // Welcome first-time visitors with AI voice: "Welcome to AK Buffaloes"
    voiceAnnouncer.welcomeFirstTimeUser();

    // Show buffalo preloader on page refresh / initial load
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 900);
    return () => clearTimeout(timer);
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
              exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
              className="fixed inset-0 z-[99999]"
            >
              <BuffaloLoader isFullPage message="Loading AK Buffaloes..." />
            </motion.div>
          )}
        </AnimatePresence>

        <BrowserRouter>
          <AuthProvider>
            <FestivalThemeProvider>
            <InstagramPromoPopup ready={!pageLoading} />
            <Navbar />
            <FestivalThemeBanner />
            <ErrorBoundary>
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
            </ErrorBoundary>
          <Footer />
          <ScrollNavigation />
          <WhatsAppButton />
          <AiAssistantChat />
          </FestivalThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
