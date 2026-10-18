import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { backend, isStaticHosting } from "@/lib/backendClient";
import {
  DEFAULT_FESTIVAL_SETTINGS,
  evaluateFestivalCalendar,
  getISTDateParts,
  mergeOccasionsWithDb,
  type FestivalGlobalSettings,
  type FestivalOccasion,
  type ISTDateParts,
  type ResolvedOccasionInstance,
} from "@/data/festivalCalendarData";

interface FestivalThemeContextType {
  istNow: ISTDateParts;
  settings: FestivalGlobalSettings;
  occasions: FestivalOccasion[];
  resolvedOccasions: ResolvedOccasionInstance[];
  /** The live active occasion for the public website (null if none or master OFF) */
  liveActiveOccasion: ResolvedOccasionInstance | null;
  /** The effective occasion currently displayed (either manual preview for Admin or liveActiveOccasion) */
  activeOccasion: ResolvedOccasionInstance | null;
  /** Secondary occasions active today when overlap_display_mode === 'main_plus_secondary' */
  secondaryOccasions: ResolvedOccasionInstance[];
  /** Next upcoming enabled occasion */
  nextOccasion: ResolvedOccasionInstance | null;
  /** True when Admin is locally previewing a theme without affecting the public website */
  isPreviewMode: boolean;
  previewOccasionId: string | null;
  loading: boolean;
  startPreview: (occasionId: string) => void;
  stopPreview: () => void;
  refreshFestivalState: () => Promise<void>;
  updateGlobalSettings: (patch: Partial<FestivalGlobalSettings>) => Promise<{ error: string | null }>;
  saveOccasionRecord: (occasion: FestivalOccasion) => Promise<{ error: string | null }>;
  deleteCustomOccasion: (occasionId: string) => Promise<{ error: string | null }>;
}

const PREVIEW_STORAGE_KEY = "ak_buffalo_festival_preview_id";
const SYNC_EVENT_NAME = "ak-festival-theme-sync";

const defaultIstNow = getISTDateParts(new Date());

const FestivalThemeContext = createContext<FestivalThemeContextType>({
  istNow: defaultIstNow,
  settings: DEFAULT_FESTIVAL_SETTINGS,
  occasions: mergeOccasionsWithDb(null),
  resolvedOccasions: [],
  liveActiveOccasion: null,
  activeOccasion: null,
  secondaryOccasions: [],
  nextOccasion: null,
  isPreviewMode: false,
  previewOccasionId: null,
  loading: true,
  startPreview: () => {},
  stopPreview: () => {},
  refreshFestivalState: async () => {},
  updateGlobalSettings: async () => ({ error: null }),
  saveOccasionRecord: async () => ({ error: null }),
  deleteCustomOccasion: async () => ({ error: null }),
});

export const useFestivalTheme = () => useContext(FestivalThemeContext);

export const FestivalThemeProvider = ({ children }: { children: ReactNode }) => {
  const [dbOccasions, setDbOccasions] = useState<Partial<FestivalOccasion>[]>([]);
  const [settings, setSettings] = useState<FestivalGlobalSettings>(DEFAULT_FESTIVAL_SETTINGS);
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [tickNow, setTickNow] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState<boolean>(true);
  const [previewOccasionId, setPreviewOccasionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(PREVIEW_STORAGE_KEY) || null;
    }
    return null;
  });

  const notifyAllTabs = useCallback(() => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME));
    try {
      const bc = new BroadcastChannel("ak_buffalo_festival_bc");
      bc.postMessage({ type: "REFRESH", ts: Date.now() });
      bc.close();
    } catch {
      // BroadcastChannel not supported in older environments
    }
  }, []);

  const refreshFestivalState = useCallback(async () => {
    if (!isStaticHosting()) {
      try {
        const response = await fetch("/api/festivals/live", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const contentType = response.headers.get("content-type") || "";
        if (response.ok && !contentType.includes("text/html")) {
          const payload = await response.json();
          if (payload.istNow?.isoNow) {
            const srvTime = new Date(payload.istNow.isoNow).getTime();
            if (!Number.isNaN(srvTime)) {
              setServerOffsetMs(srvTime - Date.now());
            }
          }
          if (payload.settings) {
            setSettings({
              ...DEFAULT_FESTIVAL_SETTINGS,
              ...payload.settings,
            });
          }
          if (Array.isArray(payload.occasions)) {
            setDbOccasions(payload.occasions);
          }
          setTickNow(new Date());
          setLoading(false);
          return;
        }
      } catch {
        // Fallback to standard /api/data queries if /api/festivals/live is unavailable
      }
    }

    try {
      const [occRes, setRes] = await Promise.all([
        backend.from("festival_occasions").select("*").limit(500),
        backend.from("festival_settings").select("*").eq("id", "global").maybeSingle(),
      ]);

      if (occRes.data && Array.isArray(occRes.data)) {
        setDbOccasions(occRes.data as unknown as Partial<FestivalOccasion>[]);
      }
      if (setRes.data) {
        setSettings({
          ...DEFAULT_FESTIVAL_SETTINGS,
          ...(setRes.data as unknown as Partial<FestivalGlobalSettings>),
        });
      }
    } catch {
      // Graceful fallback to defaults if backend is offline
    } finally {
      setTickNow(new Date());
      setLoading(false);
    }
  }, []);

  // Initial load + realtime subscription + BroadcastChannel listener
  useEffect(() => {
    void refreshFestivalState();

    const handleSync = () => {
      void refreshFestivalState();
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("ak_buffalo_festival_bc");
      bc.onmessage = () => {
        void refreshFestivalState();
      };
    } catch {
      bc = null;
    }

    const channel = backend
      .channel("festival-theme-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "festival_occasions" }, () => {
        void refreshFestivalState();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "festival_settings" }, () => {
        void refreshFestivalState();
      })
      .subscribe();

    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      if (bc) bc.close();
      void backend.removeChannel(channel);
    };
  }, [refreshFestivalState]);

  // Live IST clock ticker & midnight transition detector (checks every 15 seconds and on window focus)
  useEffect(() => {
    let lastDateStr = getISTDateParts(new Date(Date.now() + serverOffsetMs)).dateStr;

    const checkClock = () => {
      const syncedNow = new Date(Date.now() + serverOffsetMs);
      setTickNow(syncedNow);
      const currentParts = getISTDateParts(syncedNow);
      if (currentParts.dateStr !== lastDateStr) {
        lastDateStr = currentParts.dateStr;
        // Midnight crossed in Asia/Kolkata — re-fetch from server immediately
        void refreshFestivalState();
      }
    };

    const interval = setInterval(checkClock, 15000);
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === "visible") {
        checkClock();
        void refreshFestivalState();
      }
    };

    window.addEventListener("focus", onVisibilityOrFocus);
    document.addEventListener("visibilitychange", onVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onVisibilityOrFocus);
      document.removeEventListener("visibilitychange", onVisibilityOrFocus);
    };
  }, [serverOffsetMs, refreshFestivalState]);

  const occasions = useMemo(() => mergeOccasionsWithDb(dbOccasions), [dbOccasions]);

  const evaluation = useMemo(() => {
    const syncedDate = new Date(tickNow.getTime() + serverOffsetMs);
    return evaluateFestivalCalendar(occasions, settings, syncedDate);
  }, [occasions, settings, tickNow, serverOffsetMs]);

  const previewOccasion = useMemo(() => {
    if (!previewOccasionId) return null;
    return evaluation.resolvedOccasions.find((o) => o.id === previewOccasionId) || null;
  }, [previewOccasionId, evaluation.resolvedOccasions]);

  const activeOccasion = previewOccasion || evaluation.activeOccasion;
  const isPreviewMode = Boolean(previewOccasion);

  // Apply occasion-specific CSS variables to document.documentElement ONLY while activeOccasion is present;
  // restore default AK Buffaloes brand palette immediately when no occasion is active.
  useEffect(() => {
    const root = document.documentElement;
    if (activeOccasion) {
      const { theme } = activeOccasion;
      root.setAttribute("data-festival-active", activeOccasion.slug);
      root.setAttribute("data-festival-decoration", theme.decoration_style);
      root.style.setProperty("--festival-primary", theme.primary_color);
      root.style.setProperty("--festival-secondary", theme.secondary_color);
      root.style.setProperty("--festival-accent", theme.accent_color);
      if (theme.primary_hsl) {
        root.style.setProperty("--gold", theme.primary_hsl);
      } else {
        root.style.removeProperty("--gold");
      }
      if (theme.hero_overlay_hsl) {
        root.style.setProperty("--hero-overlay", theme.hero_overlay_hsl);
      } else {
        root.style.removeProperty("--hero-overlay");
      }
    } else {
      root.removeAttribute("data-festival-active");
      root.removeAttribute("data-festival-decoration");
      root.style.removeProperty("--festival-primary");
      root.style.removeProperty("--festival-secondary");
      root.style.removeProperty("--festival-accent");
      root.style.removeProperty("--gold");
      root.style.removeProperty("--hero-overlay");
    }

    return () => {
      root.removeAttribute("data-festival-active");
      root.removeAttribute("data-festival-decoration");
      root.style.removeProperty("--festival-primary");
      root.style.removeProperty("--festival-secondary");
      root.style.removeProperty("--festival-accent");
      root.style.removeProperty("--gold");
      root.style.removeProperty("--hero-overlay");
    };
  }, [activeOccasion]);

  const startPreview = useCallback((occasionId: string) => {
    setPreviewOccasionId(occasionId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(PREVIEW_STORAGE_KEY, occasionId);
    }
  }, []);

  const stopPreview = useCallback(() => {
    setPreviewOccasionId(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    }
  }, []);

  const updateGlobalSettings = useCallback(
    async (patch: Partial<FestivalGlobalSettings>): Promise<{ error: string | null }> => {
      const nextSettings: FestivalGlobalSettings = {
        ...settings,
        ...patch,
        id: "global",
        timezone: "Asia/Kolkata",
        updated_at: new Date().toISOString(),
      };
      setSettings(nextSettings);

      if (!isStaticHosting()) {
        try {
          const res = await fetch("/api/festivals/settings", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextSettings),
          });
          const contentType = res.headers.get("content-type") || "";
          if (res.ok && !contentType.includes("text/html")) {
            notifyAllTabs();
            await refreshFestivalState();
            return { error: null };
          }
        } catch {
          // Fallback to /api/data
        }
      }

      const { error } = await backend
        .from("festival_settings")
        .insert(nextSettings as unknown as Record<string, unknown>);
      if (error) {
        return { error: error.message };
      }
      notifyAllTabs();
      await refreshFestivalState();
      return { error: null };
    },
    [settings, notifyAllTabs, refreshFestivalState]
  );

  const saveOccasionRecord = useCallback(
    async (occasion: FestivalOccasion): Promise<{ error: string | null }> => {
      const payload: FestivalOccasion = {
        ...occasion,
        timezone: "Asia/Kolkata",
        updated_at: new Date().toISOString(),
      };

      const { error } = await backend
        .from("festival_occasions")
        .insert(payload as unknown as Record<string, unknown>);
      if (error) {
        return { error: error.message };
      }
      notifyAllTabs();
      await refreshFestivalState();
      return { error: null };
    },
    [notifyAllTabs, refreshFestivalState]
  );

  const deleteCustomOccasion = useCallback(
    async (occasionId: string): Promise<{ error: string | null }> => {
      const { error } = await backend
        .from("festival_occasions")
        .insert({ id: occasionId, is_deleted: true, updated_at: new Date().toISOString() });
      if (error) {
        return { error: error.message };
      }
      if (previewOccasionId === occasionId) {
        stopPreview();
      }
      notifyAllTabs();
      await refreshFestivalState();
      return { error: null };
    },
    [previewOccasionId, stopPreview, notifyAllTabs, refreshFestivalState]
  );

  return (
    <FestivalThemeContext.Provider
      value={{
        istNow: evaluation.istNow,
        settings: evaluation.settings,
        occasions,
        resolvedOccasions: evaluation.resolvedOccasions,
        liveActiveOccasion: evaluation.activeOccasion,
        activeOccasion,
        secondaryOccasions: evaluation.secondaryOccasions,
        nextOccasion: evaluation.nextOccasion,
        isPreviewMode,
        previewOccasionId,
        loading,
        startPreview,
        stopPreview,
        refreshFestivalState,
        updateGlobalSettings,
        saveOccasionRecord,
        deleteCustomOccasion,
      }}
    >
      {children}
    </FestivalThemeContext.Provider>
  );
};
