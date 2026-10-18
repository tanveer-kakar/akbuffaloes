import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, LogOut, Shield, LayoutDashboard, Sun, Moon, Search, ChevronDown, User, Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { backend } from "@/lib/backendClient";
import { useFarmSettings } from "@/lib/farmSettings";

interface SearchItem {
  title: string;
  subtitle: string;
  category: "Breed" | "Catalog" | "About" | "Media" | "Contact" | "Service";
  path: string;
  tags: string[];
}

const searchDatabase: SearchItem[] = [
  {
    title: "Murrah Buffalo",
    subtitle: "10–14+ L/day Milk Yield • Black Gold",
    category: "Breed",
    path: "/buffaloes/murrah",
    tags: ["murrah", "black gold", "highest milk", "milk", "haryana", "doodh", "keemat", "price", "80000", "160000"],
  },
  {
    title: "Jaffarabadi Buffalo",
    subtitle: "9–12 L/day • 8.5–9.5% Butterfat",
    category: "Breed",
    path: "/buffaloes/jaffarabadi",
    tags: ["jaffarabadi", "jafar", "fat", "ghee", "heavy", "gir", "gujarat", "100000", "200000"],
  },
  {
    title: "Nili-Ravi Buffalo",
    subtitle: "Panch Kalyani • 8–12 L/day • Docile",
    category: "Breed",
    path: "/buffaloes/nili-ravi",
    tags: ["nili", "ravi", "panch kalyani", "white markings", "docile", "75000", "150000"],
  },
  {
    title: "Surti Buffalo",
    subtitle: "6–9 L/day • Economical Feed & High Fat",
    category: "Breed",
    path: "/buffaloes/surti",
    tags: ["surti", "charottar", "low feed", "economical", "sickle horns", "70000", "140000"],
  },
  {
    title: "Mehsana Buffalo",
    subtitle: "8–11 L/day • Murrah x Surti Cross",
    category: "Breed",
    path: "/buffaloes/mehsana",
    tags: ["mehsana", "mahesana", "cross", "hybrid", "regular calving", "75000", "150000"],
  },
  {
    title: "Our Buffaloes (10 Breeds Catalog)",
    subtitle: "Explore all 10 buffalo breeds & 50 verified profiles",
    category: "Catalog",
    path: "/buffaloes?section=breeds",
    tags: ["buffaloes", "catalog", "buy", "purchase", "listings", "breeds", "available", "cost", "rates"],
  },
  {
    title: "New Stocks (Latest Arrivals)",
    subtitle: "Latest healthy arrivals (AKB-001 to AKB-008) with video & specs",
    category: "Catalog",
    path: "/buffaloes?section=new-stocks",
    tags: ["new stocks", "new arrival", "akb", "latest", "stock", "available", "calf", "pregnant"],
  },
  {
    title: "The Man Behind The Vision",
    subtitle: "Founder Akil Bhai & Co-Founder Salim Bhai",
    category: "About",
    path: "/about",
    tags: ["about", "founder", "akil bhai", "salim bhai", "owner", "malik", "vision", "leadership", "story"],
  },
  {
    title: "Photo & Video Gallery",
    subtitle: "26 authentic buffalo videos & farm footage",
    category: "Media",
    path: "/gallery",
    tags: ["gallery", "videos", "video", "photos", "photo", "26 videos", "market", "milking"],
  },
  {
    title: "Contact & Farm Location",
    subtitle: "Pachora, Jalgaon, Maharashtra • +91-9022273915",
    category: "Contact",
    path: "/contact",
    tags: ["contact", "location", "address", "pachora", "jalgaon", "phone", "mobile", "whatsapp", "email"],
  },
  {
    title: "Book Consultation / Visit",
    subtitle: "Schedule in-person milking inspection or call",
    category: "Service",
    path: "/dashboard/book-inquiry",
    tags: ["consultation", "book", "visit", "farm visit", "milking test", "inspection", "appointment"],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchDesktopRef = useRef<HTMLDivElement>(null);
  const searchMobileRef = useRef<HTMLDivElement>(null);
  const [profileName, setProfileName] = useState<string>("");
  const farmSettings = useFarmSettings();

  useEffect(() => {
    if (!user) {
      setProfileName("");
      return;
    }
    backend
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.full_name && !data.full_name.includes("@")) {
          setProfileName(data.full_name);
        }
      })
      .catch(() => {});
  }, [user]);

  // Guaranteed helper to ensure no email address or domain (@ or .com/.in) is ever displayed in the navbar
  const getCleanDisplayName = () => {
    if (isAdmin) return "Admin";
    const raw = profileName || user?.user_metadata?.full_name;
    if (typeof raw === "string") {
      const clean = raw.trim();
      if (clean && !clean.includes("@") && !clean.includes(".com") && !clean.includes(".in")) {
        return clean;
      }
    }
    return t("nav.dashboard") || "Dashboard";
  };

  const getCleanAccountTitle = () => {
    if (isAdmin) return "Administrator";
    const raw = profileName || user?.user_metadata?.full_name;
    if (typeof raw === "string") {
      const clean = raw.trim();
      if (clean && !clean.includes("@") && !clean.includes(".com") && !clean.includes(".in")) {
        return clean;
      }
    }
    return "Member Account";
  };

  const navItems = [
    { label: t("nav.home"), path: "/" },
    { label: t("nav.about"), path: "/about" },
    { label: t("nav.buffaloes") || "Buffaloes", path: "/buffaloes" },
    { label: t("nav.gallery"), path: "/gallery" },
    { label: t("nav.contact"), path: "/contact" },
  ];

  const isEmailString = (val: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    return (
      trimmed.includes("@") ||
      trimmed.toLowerCase().includes(".com") ||
      trimmed.toLowerCase().includes(".in") ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    );
  };

  const handleSearchChange = (raw: string) => {
    if (isEmailString(raw)) {
      setSearchQuery("");
      setIsSearchOpen(false);
      return;
    }
    setSearchQuery(raw);
    setIsSearchOpen(raw.trim().length > 0);
  };

  const filteredSearchResults = searchQuery.trim().length > 0 && !isEmailString(searchQuery)
    ? searchDatabase.filter((item) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      })
    : [];

  const handleSelectSearchItem = (path: string) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsOpen(false);
    navigate(path);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSearchResults.length > 0) {
        handleSelectSearchItem(filteredSearchResults[0].path);
      } else if (searchQuery.trim() && !isEmailString(searchQuery)) {
        handleSelectSearchItem("/buffaloes");
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  // Close search dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedInsideDesktop = searchDesktopRef.current?.contains(target);
      const clickedInsideMobile = searchMobileRef.current?.contains(target);
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname, location.search]);

  // Ensure searchQuery never contains email strings from browser autofill
  useEffect(() => {
    if (isEmailString(searchQuery)) {
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-green-dark/95 backdrop-blur-sm border-b border-green-medium">
      {farmSettings.announcementBannerEnabled && farmSettings.announcementBannerText && (
        <div className="bg-gradient-to-r from-gold via-amber-300 to-gold text-green-dark px-3 py-1.5 text-center text-xs font-sans font-bold flex items-center justify-center gap-2 border-b border-gold-dark/20 shadow-sm animate-fadeIn">
          <Megaphone className="w-3.5 h-3.5 text-green-dark shrink-0 animate-bounce" />
          <span className="truncate max-w-4xl">{farmSettings.announcementBannerText}</span>
        </div>
      )}
      <div className="container mx-auto px-3 sm:px-4" ref={menuRef}>
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20 gap-1">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group py-1 min-w-0" aria-label="AK Buffaloes Home">
            <img
              src="/ak-buffalo-logo-emblem.png"
              alt="AK Buffaloes"
              className="h-9 w-9 sm:h-11 sm:w-11 md:h-14 md:w-14 rounded-full border-2 border-gold/60 shadow-lg bg-black/40 p-0.5 group-hover:scale-105 group-hover:border-gold transition-all duration-300 object-contain shrink-0"
            />
            <h3 className="font-display text-base sm:text-xl md:text-2xl font-bold leading-tight text-primary-foreground group-hover:text-primary-foreground/90 transition-colors truncate">
              <span className="text-gold">AK</span> Buffaloes
            </h3>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-5">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-sans text-xs xl:text-sm font-medium tracking-wide uppercase transition-colors hover:text-gold ${
                  location.pathname === item.path ? "text-gold" : "text-primary-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {/* Small Search Bar */}
            <div className="relative" ref={searchDesktopRef}>
              <form
                role="search"
                autoComplete="off"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (filteredSearchResults.length > 0) {
                    handleSelectSearchItem(filteredSearchResults[0].path);
                  } else if (searchQuery.trim() && !isEmailString(searchQuery)) {
                    handleSelectSearchItem("/buffaloes");
                  }
                }}
                className="relative flex items-center"
              >
                <Search className="w-3.5 h-3.5 text-gold absolute left-2.5 pointer-events-none" />
                <input
                  type="search"
                  name="ak-site-search-desktop"
                  id="ak-site-search-desktop"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-form-type="other"
                  value={isEmailString(searchQuery) ? "" : searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onInput={(e) => {
                    const target = e.currentTarget;
                    if (isEmailString(target.value)) {
                      target.value = "";
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }
                  }}
                  onFocus={() => {
                    if (isEmailString(searchQuery)) {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    } else if (searchQuery.trim().length > 0) {
                      setIsSearchOpen(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={t("nav.search") || "Search breeds, farm..."}
                  className="w-28 lg:w-36 xl:w-44 transition-all duration-300 focus:w-48 xl:focus:w-56 h-8 pl-8 pr-7 text-xs bg-black/25 hover:bg-black/35 focus:bg-green-dark border border-gold/40 focus:border-gold rounded-full text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold/60"
                  aria-label="Search"
                />
                {searchQuery && !isEmailString(searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-2 text-primary-foreground/60 hover:text-gold transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Desktop Search Dropdown */}
              <AnimatePresence>
                {isSearchOpen && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-background/95 backdrop-blur-md border border-border shadow-2xl rounded-xl overflow-hidden z-50 py-2 max-h-80 overflow-y-auto"
                  >
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((item) => (
                        <button
                          key={item.title + item.path}
                          type="button"
                          onClick={() => handleSelectSearchItem(item.path)}
                          className="w-full text-left px-3.5 py-2 hover:bg-muted/80 transition-colors flex items-start gap-2.5 group"
                        >
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary group-hover:bg-gold/20 group-hover:text-gold shrink-0 mt-0.5 transition-colors">
                            {item.category}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate group-hover:text-gold transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-xs text-muted-foreground">
                        No match for &quot;{searchQuery}&quot;. Press <span className="font-semibold text-foreground">Enter</span> to browse catalog.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5 h-8 px-3 text-xs shadow-sm">
                    {isAdmin ? <Shield className="w-3.5 h-3.5" /> : <LayoutDashboard className="w-3.5 h-3.5" />}
                    <span className="max-w-[110px] truncate">{getCleanDisplayName()}</span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl border-border bg-background">
                  <div className="px-2.5 py-1.5 border-b border-border mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {getCleanAccountTitle()}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-muted-foreground">
                      {isAdmin ? "Admin Portal" : "Member Portal"}
                    </span>
                  </div>
                  {isAdmin ? (
                    <DropdownMenuItem asChild className="cursor-pointer font-sans py-2">
                      <Link to="/admin" className="flex items-center gap-2.5 w-full">
                        <Shield className="w-4 h-4 text-gold shrink-0" />
                        <span className="text-xs font-semibold">Admin Panel</span>
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild className="cursor-pointer font-sans py-2">
                        <Link to="/dashboard" className="flex items-center gap-2.5 w-full">
                          <LayoutDashboard className="w-4 h-4 text-gold shrink-0" />
                          <span className="text-xs font-semibold">{t("nav.dashboard")}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="cursor-pointer font-sans py-2">
                        <Link to="/dashboard/profile" className="flex items-center gap-2.5 w-full">
                          <User className="w-4 h-4 text-gold shrink-0" />
                          <span className="text-xs font-semibold">My Profile</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={async () => { await signOut(); navigate("/"); }}
                    className="cursor-pointer font-sans py-2 text-destructive focus:text-destructive"
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">{t("nav.signOut")}</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5 h-8 px-3 text-xs shadow-sm">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{t("nav.signIn")}</span>
                </Button>
              </Link>
            )}

            <LanguageSwitcher variant="desktop" />

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-primary-foreground/80 hover:text-gold transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile: language + theme toggle + menu toggle */}
          <div className="lg:hidden flex items-center gap-1">
            <LanguageSwitcher variant="desktop" />
            <button
              onClick={toggleTheme}
              className="text-primary-foreground/80 hover:text-gold p-2 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              className="text-primary-foreground p-2 -mr-2 active:scale-90 transition-all duration-200"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile menu with animation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="lg:hidden overflow-y-auto max-h-[calc(100dvh-3.75rem)]"
            >
              <div className="pb-6 pt-2 space-y-1">
                {/* Mobile Small Search Bar */}
                <div className="px-3 pt-1 pb-3" ref={searchMobileRef}>
                  <form
                    role="search"
                    autoComplete="off"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (filteredSearchResults.length > 0) {
                        handleSelectSearchItem(filteredSearchResults[0].path);
                      } else if (searchQuery.trim() && !isEmailString(searchQuery)) {
                        handleSelectSearchItem("/buffaloes");
                      }
                    }}
                    className="relative flex items-center"
                  >
                    <Search className="w-4 h-4 text-gold absolute left-3 pointer-events-none" />
                    <input
                      type="search"
                      name="ak-site-search-mobile"
                      id="ak-site-search-mobile"
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      value={isEmailString(searchQuery) ? "" : searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onInput={(e) => {
                        const target = e.currentTarget;
                        if (isEmailString(target.value)) {
                          target.value = "";
                          setSearchQuery("");
                          setIsSearchOpen(false);
                        }
                      }}
                      onFocus={() => {
                        if (isEmailString(searchQuery)) {
                          setSearchQuery("");
                          setIsSearchOpen(false);
                        } else if (searchQuery.trim().length > 0) {
                          setIsSearchOpen(true);
                        }
                      }}
                      onKeyDown={handleSearchKeyDown}
                      placeholder={t("nav.search") || "Search breeds, farm..."}
                      className="w-full h-10 pl-9 pr-8 text-sm bg-black/30 border border-gold/40 focus:border-gold rounded-xl text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold/60"
                      aria-label="Search"
                    />
                    {searchQuery && !isEmailString(searchQuery) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setIsSearchOpen(false);
                        }}
                        className="absolute right-2.5 text-primary-foreground/60 hover:text-gold"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </form>

                  {/* Mobile Search Dropdown */}
                  {isSearchOpen && searchQuery.trim().length > 0 && (
                    <div className="mt-2 bg-background/95 backdrop-blur-md border border-border/80 shadow-xl rounded-xl py-2 max-h-64 overflow-y-auto">
                      {filteredSearchResults.length > 0 ? (
                        filteredSearchResults.map((item) => (
                          <button
                            key={"m-" + item.title + item.path}
                            type="button"
                            onClick={() => handleSelectSearchItem(item.path)}
                            className="w-full text-left px-3.5 py-2 hover:bg-muted/80 transition-colors flex items-start gap-2.5"
                          >
                            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0 mt-0.5">
                              {item.category}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">
                                {item.title}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-center text-xs text-muted-foreground">
                          No match for &quot;{searchQuery}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {navItems.map((item, i) => (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -30, filter: "blur(4px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ delay: i * 0.05, duration: 0.25, ease: "easeOut" }}
                  >
                    <Link
                      to={item.path}
                      className={`block py-3 px-4 font-sans text-sm font-medium uppercase transition-all duration-200 rounded-lg active:scale-[0.98] active:bg-green-medium ${
                        location.pathname === item.path
                          ? "text-gold bg-green-medium/50 border-l-2 border-gold"
                          : "text-primary-foreground/80 hover:bg-green-medium hover:pl-5"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div
                  className="px-4 pt-4 space-y-2.5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  {user ? (
                    <>
                      <div className="px-3.5 py-2.5 rounded-lg bg-black/25 border border-gold/30 mb-2 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold shrink-0">
                          {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-primary-foreground truncate">
                            {getCleanAccountTitle()}
                          </p>
                          <span className="text-[10px] text-gold font-medium">
                            {isAdmin ? "Admin Portal" : "Member Account"}
                          </span>
                        </div>
                      </div>
                      {isAdmin ? (
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2 h-11 active:scale-[0.98] transition-transform">
                            <Shield className="w-4 h-4" /> Admin Panel
                          </Button>
                        </Link>
                      ) : (
                        <>
                          <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2 h-11 active:scale-[0.98] transition-transform">
                              <LayoutDashboard className="w-4 h-4" /> {t("nav.dashboard")}
                            </Button>
                          </Link>
                          <Link to="/dashboard/profile" onClick={() => setIsOpen(false)}>
                            <Button variant="outline" className="w-full border-gold/40 text-gold hover:bg-gold/10 font-sans font-medium gap-2 h-10 mt-1.5 text-xs">
                              <User className="w-3.5 h-3.5" /> My Profile
                            </Button>
                          </Link>
                        </>
                      )}
                      <Button
                        onClick={async () => { setIsOpen(false); await signOut(); navigate("/"); }}
                        variant="outline"
                        className="w-full font-sans font-semibold gap-2 h-11 mt-1 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 active:scale-[0.98] transition-transform"
                      >
                        <LogOut className="w-4 h-4" /> {t("nav.signOut")}
                      </Button>
                    </>
                  ) : (
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2 h-11 text-xs shadow-sm">
                        <LogIn className="w-4 h-4" />
                        <span>{t("nav.signIn")}</span>
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[-1] lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
