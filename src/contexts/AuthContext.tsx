import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { backend, type BackendSession, type BackendUser } from "@/lib/backendClient";
import { logActivity } from "@/lib/activityLogger";
import { isUserAdmin } from "@/lib/adminAuth";

interface AuthContextType {
  session: BackendSession | null;
  user: BackendUser | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (credentials: { email: string; password: string } | string, passwordArg?: string) => Promise<{ error: Error | null; user: BackendUser | null; isAdmin: boolean }>;
  signInAsAdmin: (credentials: { email: string; password: string } | string, passwordArg?: string) => Promise<{ error: Error | null; user: BackendUser | null; isAdmin: boolean }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  loading: true,
  signIn: async () => ({ error: null, user: null, isAdmin: false }),
  signInAsAdmin: async () => ({ error: null, user: null, isAdmin: false }),
  signOut: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<BackendSession | null>(null);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await backend.auth.getSession();
      if (error) {
        console.error("Session lookup failed:", error.message);
      }
      const current = data.session as BackendSession | null;
      setSession(current);
      setUser(current?.user || null);
      setIsAdmin(isUserAdmin(current?.user?.email, current?.user?.app_metadata?.role));
    } catch (e) {
      console.error("refreshSession error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      await refreshSession();
    };
    void init();

    const { data: { subscription } } = backend.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      const current = nextSession as BackendSession | null;
      setSession(current);
      setUser(current?.user || null);
      setIsAdmin(isUserAdmin(current?.user?.email, current?.user?.app_metadata?.role));
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const signIn = async (credentials: { email: string; password: string } | string, passwordArg?: string) => {
    const creds = typeof credentials === "string" ? { email: credentials, password: passwordArg || "" } : credentials;
    const { data, error } = await backend.auth.signInWithPassword(creds);
    if (!error && data?.user) {
      const admin = isUserAdmin(data.user.email, data.user.app_metadata?.role);
      const sess: BackendSession = data.session || {
        user: data.user,
        access_token: "cookie-session",
        token_type: "bearer",
      };
      setSession(sess);
      setUser(data.user);
      setIsAdmin(admin);
      setLoading(false);
      return { error: null, user: data.user, isAdmin: admin };
    }
    return {
      error: error ? new Error(error.message) : new Error("Login failed"),
      user: null,
      isAdmin: false,
    };
  };

  const signInAsAdmin = async (credentials: { email: string; password: string } | string, passwordArg?: string) => {
    const creds = typeof credentials === "string" ? { email: credentials, password: passwordArg || "" } : credentials;
    const { data, error } = await backend.auth.signInAsAdmin(creds);
    if (!error && data?.user) {
      const sess: BackendSession = data.session || {
        user: data.user,
        access_token: "cookie-session",
        token_type: "bearer",
      };
      setSession(sess);
      setUser(data.user);
      setIsAdmin(true);
      setLoading(false);
      return { error: null, user: data.user, isAdmin: true };
    }
    return {
      error: error ? new Error(error.message) : new Error("Admin login failed"),
      user: null,
      isAdmin: false,
    };
  };

  const signOut = async () => {
    if (user) {
      await logActivity({ action: "logout", entityType: "auth", details: "User signed out" });
    }
    const { error } = await backend.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    setLoading(false);
    if (error) throw new Error(error.message);
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, loading, signIn, signInAsAdmin, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
