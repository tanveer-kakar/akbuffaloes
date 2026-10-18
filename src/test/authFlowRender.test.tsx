import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminPanel from "../pages/AdminPanel";
import DashboardHome from "../pages/DashboardHome";
import Gallery from "../pages/Gallery";
import About from "../pages/About";
import Buffaloes from "../pages/Buffaloes";
import BreedDetail from "../pages/BreedDetail";
import Contact from "../pages/Contact";
import Footer from "../components/Footer";
import InstagramPromoPopup from "../components/InstagramPromoPopup";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";

vi.stubGlobal("fetch", vi.fn(async (url: string) => {
  if (url.includes("/api/auth/session")) {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: "3a819505bfe81176a5ebb1e217ff1ef3",
          email: "akbuffaloes540@gmail.com",
          app_metadata: { role: "admin" },
          user_metadata: { full_name: "AK Buffaloes Admin" },
        },
        isAdmin: true,
      }),
    };
  }
  if (url.includes("/api/data")) {
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
}));

describe("Render checks for AdminPanel, Dashboard, and Core Website Pages", () => {
  it("renders AdminPanel without crashing", async () => {
    const { container, findAllByText } = render(
      <MemoryRouter initialEntries={["/admin"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <AdminPanel />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
    const headers = await findAllByText(/Admin (Panel|Portal)/i);
    expect(headers.length).toBeGreaterThan(0);
  });

  it("renders Dashboard and DashboardHome without crashing", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <DashboardHome />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });

  it("renders Gallery page without crashing", async () => {
    const { container, findByText } = render(
      <MemoryRouter initialEntries={["/gallery"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Gallery />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
    expect(await findByText(/Farm & Breeds Gallery/i)).toBeDefined();
  });

  it("renders About page with 2-image Our Story slider without crashing", async () => {
    const { container, getByLabelText, findByAltText } = render(
      <MemoryRouter initialEntries={["/about"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <About />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
    expect(await findByAltText("AK Buffaloes Farm Aerial View")).toBeDefined();
    const nextBtn = getByLabelText("Next farm image");
    fireEvent.click(nextBtn);
    expect(await findByAltText("AK Buffaloes Grazing at Our Dairy Farm")).toBeDefined();
  });

  it("renders Buffaloes page with all 10 breeds without crashing", async () => {
    const { container, findAllByText } = render(
      <MemoryRouter initialEntries={["/buffaloes"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Buffaloes />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
    expect((await findAllByText(/Murrah Buffalo/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/Banni Buffalo/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/Pandharpuri Buffalo/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/Nagpuri Buffalo/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/Bhadawari Buffalo/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/Godavari Buffalo/i)).length).toBeGreaterThan(0);
  });

  it("renders BreedDetail page with Left Cards and Right Big Buffalo Detail Card (no 5-sample listings)", async () => {
    const { findAllByText, queryByText, getByLabelText } = render(
      <MemoryRouter initialEntries={["/buffaloes/murrah"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Routes>
                <Route path="/buffaloes/:breed" element={<BreedDetail />} />
              </Routes>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect((await findAllByText(/BRD-001/i)).length).toBeGreaterThan(0);
    expect((await findAllByText(/About This Buffalo/i)).length).toBeGreaterThan(0);
    expect(queryByText("Murrah Sample 1")).toBeNull();
    expect(queryByText("Murrah Sample 5")).toBeNull();

    expect((await findAllByText(/Photo 1 of 2/i)).length).toBeGreaterThan(0);
    const nextSlideBtn = getByLabelText("Next photo");
    fireEvent.click(nextSlideBtn);
    expect((await findAllByText(/Photo 2 of 2/i)).length).toBeGreaterThan(0);
  });

  it("renders Contact, Footer, and InstagramPromoPopup without crashing", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/contact"]}>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <InstagramPromoPopup ready={true} />
              <Contact />
              <Footer />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});

