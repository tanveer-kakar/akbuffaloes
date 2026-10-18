import { useEffect, useState } from "react";
import { useNavigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { backend } from "@/lib/backendClient";
import { FileText, PlusCircle, LogOut, User, History, Settings, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import BuffaloLoader from "@/components/BuffaloLoader";

const Dashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const sidebarItems = [
    { label: `${t("sidebar.dashboard")} & Analytics`, path: "/dashboard", icon: BarChart3, mobileLabel: "Analytics" },
    { label: t("sidebar.bookInquiry"), path: "/dashboard/book-inquiry", icon: PlusCircle, mobileLabel: t("sidebar.bookInquiry").split(" ")[0] },
    { label: t("sidebar.myInquiries"), path: "/dashboard/my-inquiries", icon: FileText, mobileLabel: t("dash.inquiries") },
    { label: t("sidebar.myHistory"), path: "/dashboard/my-history", icon: History, mobileLabel: t("sidebar.myHistory").split(" ").pop() },
    { label: t("sidebar.myProfile"), path: "/dashboard/profile", icon: User, mobileLabel: t("sidebar.myProfile").split(" ").pop() },
    { label: t("sidebar.settings"), path: "/dashboard/settings", icon: Settings, mobileLabel: t("sidebar.settings") },
  ];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const timer = setTimeout(() => {
        navigate("/login", { replace: true });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    backend
      .from("profiles")
      .select("avatar_url, full_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setAvatarUrl(data?.avatar_url || null);
        if (data?.full_name && !data.full_name.includes("@") && !data.full_name.includes(".com")) {
          setProfileName(data.full_name);
        }
      })
      .catch(() => {});
  }, [user]);

  const cleanDisplayName =
    profileName ||
    (user?.user_metadata?.full_name &&
    !user.user_metadata.full_name.includes("@") &&
    !user.user_metadata.full_name.includes(".com")
      ? user.user_metadata.full_name
      : isAdmin
      ? "Administrator"
      : "Member Account");

  if (loading) {
    return (
      <main className="pt-20 min-h-screen bg-cream flex items-center justify-center">
        <BuffaloLoader isFullPage={false} message="Loading your dashboard..." />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="pt-20 min-h-screen bg-cream flex items-center justify-center">
        <BuffaloLoader isFullPage={false} message="Verifying account session..." />
      </main>
    );
  }

  return (
    <main className="pt-20 pb-20 md:pb-0 min-h-screen bg-cream">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden md:block w-64 shrink-0">
            <div className="bg-background border border-border rounded-lg overflow-hidden sticky top-24">
              <div className="bg-green-dark p-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-gold" />
                  )}
                </div>
                <p className="font-sans text-sm font-semibold text-center text-primary-foreground truncate">
                  {cleanDisplayName}
                </p>
                <p className="text-[10px] font-medium text-center text-gold/80 mt-0.5">
                  {isAdmin ? "Admin Account" : "Registered Member"}
                </p>
              </div>

              <div className="p-3 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path}>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-md font-sans text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-gold/10 text-gold border-l-4 border-gold"
                            : "text-foreground hover:bg-muted/30"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </div>
                    </Link>
                  );
                })}
                <Button
                  onClick={() => { signOut(); navigate("/"); }}
                  variant="ghost"
                  className="w-full justify-start gap-3 px-4 py-3 font-sans text-sm font-medium text-primary-foreground bg-green-dark hover:bg-foreground hover:text-background mt-2 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  {t("sidebar.logout")}
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {isAdmin && (
              <div className="mb-4 p-3 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-between gap-3">
                <span className="text-xs font-sans text-foreground">
                  You are logged in with administrator credentials.
                </span>
                <Link to="/admin" className="text-xs font-sans font-bold text-green-dark bg-gold px-3 py-1 rounded hover:bg-gold-light shrink-0">
                  Open Admin Panel
                </Link>
              </div>
            )}
            <Outlet />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-gold" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-sans text-[10px] font-medium">{item.mobileLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
};

export default Dashboard;
