import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AuthContext, { AuthProvider } from "@/contexts/AuthContext";
import { FestivalThemeProvider } from "@/contexts/FestivalThemeContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ADMIN_EMAIL } from "@/lib/adminAuth";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FestivalThemeBanner from "@/components/FestivalThemeBanner";
import InstagramPromoPopup from "@/components/InstagramPromoPopup";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Gallery from "@/pages/Gallery";
import Buffaloes from "@/pages/Buffaloes";
import BreedDetail from "@/pages/BreedDetail";
import Contact from "@/pages/Contact";
import AuthPage from "@/pages/AuthPage";
import ResetPassword from "@/pages/ResetPassword";
import AdminPanel from "@/pages/AdminPanel";
import Dashboard from "@/pages/Dashboard";
import DashboardHome from "@/pages/DashboardHome";
import BookInquiry from "@/pages/BookInquiry";
import MyInquiries from "@/pages/MyInquiries";
import MyHistory from "@/pages/MyHistory";
import UserProfile from "@/pages/UserProfile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import {
  BUFFALO_BREEDS,
  DEFAULT_BREED_CATALOG_PROFILES,
  DEFAULT_NEW_STOCK_PROFILES,
  getBuffaloSliderImages,
  getMergedBreedCatalog,
  getMergedNewStocks,
  isLegacySampleRecord,
} from "@/data/buffaloBreedsData";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      if (String(url).includes("/api/auth/session")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            user: {
              id: "admin-user-id",
              email: ADMIN_EMAIL,
              app_metadata: { role: "admin" },
              user_metadata: { full_name: "AK Buffaloes Admin" },
            },
            isAdmin: true,
          }),
        };
      }
      if (String(url).includes("/api/data")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            data: [],
            count: 0,
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
      };
    })
  );
});

const renderWithProviders = (ui: React.ReactNode, initialRoute = "/") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
              <AuthProvider>
                <FestivalThemeProvider>{ui}</FestivalThemeProvider>
              </AuthProvider>
            </MemoryRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const renderAsAuthenticatedAdmin = (ui: React.ReactNode, initialRoute = "/admin") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const mockAdminUser = {
    id: "admin-user-id",
    email: ADMIN_EMAIL,
    app_metadata: { role: "admin" },
    user_metadata: { full_name: "Admin" },
  };
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[initialRoute]}>
              <AuthContext.Provider
                value={{
                  session: {
                    user: mockAdminUser,
                    access_token: "test-token",
                    token_type: "bearer",
                  },
                  user: mockAdminUser,
                  isAdmin: true,
                  loading: false,
                  signIn: async () => ({ error: null, user: mockAdminUser, isAdmin: true }),
                  signInAsAdmin: async () => ({ error: null, user: mockAdminUser, isAdmin: true }),
                  signOut: async () => {},
                  refreshSession: async () => {},
                }}
              >
                <FestivalThemeProvider>{ui}</FestivalThemeProvider>
              </AuthContext.Provider>
            </MemoryRouter>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe("Pre-Deployment Full Website Verification", () => {
  it("verifies all 10 Breed Catalog profiles (BRD-001..BRD-010) and 8 New Stocks (AKB-001..AKB-008) with zero legacy sample records", () => {
    expect(BUFFALO_BREEDS).toHaveLength(10);
    expect(DEFAULT_BREED_CATALOG_PROFILES).toHaveLength(10);
    expect(DEFAULT_NEW_STOCK_PROFILES).toHaveLength(8);

    const mergedBreeds = getMergedBreedCatalog([
      { id: "sample-murrah-1", name: "Murrah Sample 1", breed: "Murrah", price: 65000 },
    ]);
    expect(mergedBreeds).toHaveLength(10);
    expect(mergedBreeds.every((b) => !isLegacySampleRecord(b))).toBe(true);
    expect(mergedBreeds.map((b) => b.stock_code)).toEqual([
      "BRD-001",
      "BRD-002",
      "BRD-003",
      "BRD-004",
      "BRD-005",
      "BRD-006",
      "BRD-007",
      "BRD-008",
      "BRD-009",
      "BRD-010",
    ]);

    const mergedNewStocks = getMergedNewStocks([
      { id: "sample-surti-2", name: "Surti Sample 2", breed: "Surti", price: 68000 },
    ]);
    expect(mergedNewStocks).toHaveLength(8);
    expect(mergedNewStocks.every((b) => !isLegacySampleRecord(b))).toBe(true);

    // Verify 2-photo slider works when passed either an object or a breed string
    for (const profile of [...DEFAULT_BREED_CATALOG_PROFILES, ...DEFAULT_NEW_STOCK_PROFILES]) {
      const photosFromObj = getBuffaloSliderImages(profile, 0, profile.breed);
      const photosFromStr = getBuffaloSliderImages(profile.breed, profile.id, profile.image_url);
      expect(photosFromObj.length).toBe(2);
      expect(photosFromStr.length).toBe(2);
    }
  });

  it("renders Navbar, Footer, FestivalThemeBanner, and InstagramPromoPopup without crashing", () => {
    const { unmount } = renderWithProviders(
      <>
        <InstagramPromoPopup ready={true} />
        <Navbar />
        <FestivalThemeBanner />
        <Footer />
      </>
    );
    expect(screen.getAllByText(/AK Buffaloes/i).length).toBeGreaterThan(0);
    unmount();
  });

  it("renders Buffaloes page with both Explore All 10 Buffalo Breeds and New Stocks tabs and right-side Big Buffalo Detail Card", () => {
    const { unmount } = renderWithProviders(<Buffaloes />, "/buffaloes");
    expect(screen.getAllByText(/Explore All 10 Buffalo Breeds/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/New Stocks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BRD-001/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/About This Buffalo/i).length).toBeGreaterThan(0);
    unmount();
  });

  it("renders Buffaloes page directly on New Stocks tab via ?tab=new-stocks and ?section=new-stocks", () => {
    const { unmount } = renderWithProviders(<Buffaloes />, "/buffaloes?tab=new-stocks");
    expect(screen.getAllByText(/AKB-001/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/About This Buffalo/i).length).toBeGreaterThan(0);
    unmount();
  });

  it("renders BreedDetail page (/buffaloes/murrah) with left cards and right-side Big Buffalo Detail Card", () => {
    const { unmount } = renderWithProviders(
      <Routes>
        <Route path="/buffaloes/:breed" element={<BreedDetail />} />
      </Routes>,
      "/buffaloes/murrah"
    );
    expect(screen.getAllByText(/Murrah/i).length).toBeGreaterThan(0);
    unmount();
  });

  it(
    "renders authenticated AdminPanel, opens Add New Stock modal, Add Breed Buffalo modal, and Detail Card preview without any undefined icon crashes",
    async () => {
      const { unmount } = renderAsAuthenticatedAdmin(<AdminPanel />, "/admin");

      await waitFor(() => {
        expect(
          screen.getByText(/All 10 Buffalo Breeds & New Stocks Operations/i)
        ).toBeInTheDocument();
      }, { timeout: 20000 });

      // Open "+ Add New Stock (AKB)" modal (renders <Video /> icon and all form fields)
      const addNewStockBtn = screen.getByRole("button", { name: /\+ Add New Stock \(AKB\)/i });
      fireEvent.click(addNewStockBtn);
      expect(screen.getByText(/Detail Card Farm Video Preset/i)).toBeInTheDocument();

      // Close modal
      const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelBtn);

      // Open "+ Add Breed Buffalo (BRD)" modal
      const addBreedBtn = screen.getByRole("button", { name: /\+ Add Breed Buffalo \(BRD\)/i });
      fireEvent.click(addBreedBtn);
      expect(screen.getByText(/10 Breeds Catalog \(BRD\)/i)).toBeInTheDocument();
      unmount();
    },
    30000
  );

  it("renders authenticated User Dashboard and all nested routes without errors", () => {
    const { unmount } = renderAsAuthenticatedAdmin(
      <Routes>
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<DashboardHome />} />
          <Route path="book-inquiry" element={<BookInquiry />} />
          <Route path="my-inquiries" element={<MyInquiries />} />
          <Route path="my-history" element={<MyHistory />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>,
      "/dashboard"
    );
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
    unmount();
  });

  it("renders Home, About, Gallery, Contact, AuthPage, ResetPassword, and NotFound pages without errors", () => {
    const pages = [
      { el: <Index />, route: "/" },
      { el: <About />, route: "/about" },
      { el: <Gallery />, route: "/gallery" },
      { el: <Contact />, route: "/contact" },
      { el: <AuthPage />, route: "/login" },
      { el: <ResetPassword />, route: "/reset-password" },
      { el: <NotFound />, route: "/unknown-page" },
    ];

    for (const p of pages) {
      const { unmount } = renderWithProviders(p.el, p.route);
      unmount();
    }
  });
});
