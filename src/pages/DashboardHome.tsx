import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { backend } from "@/lib/backendClient";
import {
  User,
  FileText,
  PlusCircle,
  Mail,
  MessageSquare,
  BarChart3,
  CheckCircle,
  Clock,
  IndianRupee,
  Tag,
  ArrowUpRight,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { BUFFALO_BREEDS } from "@/data/buffaloBreedsData";

interface Inquiry {
  id: string;
  message: string;
  name: string;
  created_at: string;
  status?: string;
  buffalo_name?: string;
  buffalo_breed?: string;
  buffalo_price?: number;
}

const statusBadge = (status?: string | null) => {
  const s = (status || "pending").toLowerCase();
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    accepted: { label: "Accepted", cls: "bg-green-100 text-green-700 border-green-300" },
    confirmed: { label: "Confirmed", cls: "bg-blue-100 text-blue-700 border-blue-300" },
    rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 border-red-300" },
    completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  };
  const { label, cls } = map[s] || map.pending;
  return <Badge className={`text-[10px] ${cls}`}>{label}</Badge>;
};

const BREED_COLORS = [
  "#1a3a1a",
  "#d4a843",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#6366f1",
];

const DashboardHome = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState("");
  const [allInquiries, setAllInquiries] = useState<Inquiry[]>([]);
  const [consultationCount, setConsultationCount] = useState(0);

  // User Dashboard Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [breedFilter, setBreedFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [profileRes, allInqRes, consultRes] = await Promise.all([
          backend.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
          backend
            .from("purchase_inquiries")
            .select(
              "id, message, name, created_at, status, buffalo_name, buffalo_breed, buffalo_price"
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          backend
            .from("consultation_requests")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id),
        ]);
        if (!isMounted) return;
        setFullName(
          profileRes.data?.full_name || user.user_metadata?.full_name || "Valued Farmer"
        );
        setAllInquiries((allInqRes.data as unknown as Inquiry[]) || []);
        setConsultationCount(consultRes.count || 0);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      }
    };
    fetchData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Filtered Inquiries for User Dashboard
  const filteredInquiries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = allInquiries.filter((inq) => {
      if (statusFilter !== "all" && (inq.status || "pending").toLowerCase() !== statusFilter) {
        return false;
      }
      if (breedFilter !== "all" && (inq.buffalo_breed || "") !== breedFilter) {
        return false;
      }
      if (periodFilter !== "all") {
        const days = parseInt(periodFilter, 10);
        const cutoff = new Date(Date.now() - days * 86400000);
        if (new Date(inq.created_at) < cutoff) return false;
      }
      if (q) {
        const match =
          (inq.buffalo_name || "").toLowerCase().includes(q) ||
          (inq.buffalo_breed || "").toLowerCase().includes(q) ||
          (inq.message || "").toLowerCase().includes(q) ||
          (inq.status || "pending").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "price_high") {
        return (Number(b.buffalo_price) || 0) - (Number(a.buffalo_price) || 0);
      }
      if (sortBy === "price_low") {
        return (Number(a.buffalo_price) || 0) - (Number(b.buffalo_price) || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [allInquiries, searchQuery, statusFilter, breedFilter, periodFilter, sortBy]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    breedFilter !== "all" ||
    periodFilter !== "all" ||
    sortBy !== "newest";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setBreedFilter("all");
    setPeriodFilter("all");
    setSortBy("newest");
  };

  // User Analytics Computations (based on filtered inquiries)
  const statusCounts = useMemo(() => {
    const counts = { pending: 0, accepted: 0, confirmed: 0, completed: 0, rejected: 0 };
    filteredInquiries.forEach((inq) => {
      const s = (inq.status || "pending").toLowerCase();
      if (counts[s as keyof typeof counts] !== undefined) {
        counts[s as keyof typeof counts]++;
      } else {
        counts.pending++;
      }
    });
    return counts;
  }, [filteredInquiries]);

  const totalInquiryValue = useMemo(() => {
    return filteredInquiries.reduce((sum, item) => sum + (Number(item.buffalo_price) || 0), 0);
  }, [filteredInquiries]);

  const breedStats = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInquiries.forEach((item) => {
      const breed = item.buffalo_breed || "Murrah";
      counts[breed] = (counts[breed] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredInquiries]);

  const activeOperations = filteredInquiries.length + consultationCount;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      <div className="bg-green-dark rounded-xl p-6 text-primary-foreground shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-gold/20 text-gold text-xs px-2.5 py-0.5 rounded-full font-sans font-semibold">
              Farmer Dashboard
            </span>
            <span className="text-xs text-primary-foreground/60">
              • Personal Activity &amp; Analytics
            </span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">
            {t("dash.welcome")}, {fullName}! 👋
          </h1>
          <p className="font-sans text-primary-foreground/75 text-sm mt-1.5 max-w-xl">
            Track your buffalo inquiries, filter by status or breed, review status milestones, and
            manage consultation requests.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 w-44 h-44 rounded-full bg-gold/10 pointer-events-none blur-2xl" />
      </div>

      {/* User Dashboard Operations Filter Bar */}
      <Card className="p-4 border border-border bg-background space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold" />
            <h2 className="font-display text-sm font-bold text-foreground">
              Filter My Dashboard Operations
            </h2>
            <Badge variant="outline" className="font-sans text-[10px]">
              Showing {filteredInquiries.length} of {allInquiries.length} Enquiries
            </Badge>
          </div>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 px-2.5 font-sans text-xs gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buffalo name, breed, message, status..."
              className="pl-8 h-9 font-sans text-xs"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[155px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {/* Breed Filter */}
          <Select value={breedFilter} onValueChange={setBreedFilter}>
            <SelectTrigger className="w-[165px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Breeds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Breeds</SelectItem>
              {BUFFALO_BREEDS.map((b) => (
                <SelectItem key={b.slug} value={b.name}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Period Filter */}
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[140px] h-9 font-sans text-xs">
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="1">Today (24h)</SelectItem>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[155px] h-9 font-sans text-xs">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Analytics KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-gold" /> My Operations Analytics Overview
          </h2>
          <span className="text-xs font-sans text-muted-foreground">Real-time stats</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 border border-border bg-background">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">Total Enquiries</p>
                <p className="font-display text-2xl font-bold text-foreground">
                  {filteredInquiries.length}
                </p>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  {hasActiveFilters ? `Filtered from ${allInquiries.length}` : "Submitted by you"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-600 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-border bg-background">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">Pending Review</p>
                <p className="font-display text-2xl font-bold text-amber-600">
                  {statusCounts.pending}
                </p>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  Awaiting farm review
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-border bg-background">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">
                  Approved &amp; Confirmed
                </p>
                <p className="font-display text-2xl font-bold text-emerald-600">
                  {statusCounts.accepted + statusCounts.confirmed + statusCounts.completed}
                </p>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  Accepted or final
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border border-border bg-background">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-sans text-xs text-muted-foreground mb-1">Total Inquired Value</p>
                <p className="font-display text-xl sm:text-2xl font-bold text-foreground">
                  {totalInquiryValue > 0 ? `₹${(totalInquiryValue / 100000).toFixed(1)}L` : "₹0"}
                </p>
                <p className="font-sans text-[10px] text-muted-foreground mt-0.5">
                  Estimated catalog value
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center text-gold shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Analytics Charts & Status Lifecycle */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Lifecycle Progress Card */}
        <Card className="p-5 border border-border bg-background">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> My Inquiry Status Breakdown
            </h3>
            <Badge variant="outline" className="font-sans text-[10px]">
              {filteredInquiries.length} Inquiries
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Status distribution of purchase inquiries matching your current filters.
          </p>

          <div className="space-y-3">
            {[
              {
                label: "Pending Farm Review",
                count: statusCounts.pending,
                color: "bg-yellow-500",
                key: "pending",
              },
              {
                label: "Accepted by Farm",
                count: statusCounts.accepted,
                color: "bg-green-500",
                key: "accepted",
              },
              {
                label: "Confirmed Deal",
                count: statusCounts.confirmed,
                color: "bg-blue-500",
                key: "confirmed",
              },
              {
                label: "Completed / Delivered",
                count: statusCounts.completed,
                color: "bg-emerald-600",
                key: "completed",
              },
              {
                label: "Rejected / Cancelled",
                count: statusCounts.rejected,
                color: "bg-red-500",
                key: "rejected",
              },
            ].map((item) => {
              const pct =
                filteredInquiries.length > 0
                  ? Math.round((item.count / filteredInquiries.length) * 100)
                  : 0;
              return (
                <div key={item.key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-sans text-foreground font-medium flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-sans text-muted-foreground font-semibold">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Consultation Requests:{" "}
              <strong className="text-foreground">{consultationCount}</strong>
            </span>
            <span>
              Total Active Operations:{" "}
              <strong className="text-foreground">{activeOperations}</strong>
            </span>
          </div>
        </Card>

        {/* Breed Preference Chart */}
        <Card className="p-5 border border-border bg-background min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" /> My Preferred Buffalo Breeds
            </h3>
            <Badge variant="outline" className="font-sans text-[10px]">
              Preferences
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Breeds you have enquired about for your dairy farm.
          </p>

          {breedStats.length > 0 ? (
            <div className="w-full h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breedStats} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(0, 0%, 85%)"
                  />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {breedStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BREED_COLORS[index % BREED_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <Tag className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="font-sans text-xs text-muted-foreground">No breed inquiries match.</p>
              <Link to="/buffaloes">
                <Button size="sm" variant="outline" className="font-sans text-xs mt-2">
                  Browse Catalog
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Inquiries List */}
      <Card className="border border-border overflow-hidden bg-background">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" /> {t("dash.recentInquiries")} (
            {filteredInquiries.slice(0, 10).length})
          </h2>
          <Link to="/dashboard/my-inquiries">
            <Button variant="ghost" size="sm" className="font-sans text-xs text-muted-foreground">
              {t("dash.viewAll")}
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="font-sans text-xs text-muted-foreground font-medium text-left px-4 py-2">
                  Buffalo / Details
                </th>
                <th className="font-sans text-xs text-muted-foreground font-medium text-left px-4 py-2">
                  {t("dash.message")}
                </th>
                <th className="font-sans text-xs text-muted-foreground font-medium text-left px-4 py-2">
                  Status
                </th>
                <th className="font-sans text-xs text-muted-foreground font-medium text-left px-4 py-2">
                  {t("dash.date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInquiries.slice(0, 10).map((inq) => (
                <tr
                  key={inq.id}
                  className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors"
                >
                  <td className="font-sans px-4 py-2.5 text-foreground">
                    <span className="font-semibold text-xs block">
                      {inq.buffalo_name || "Buffalo Inquiry"}
                    </span>
                    {inq.buffalo_breed && (
                      <span className="text-[10px] text-muted-foreground">
                        {inq.buffalo_breed}{" "}
                        {inq.buffalo_price ? `(₹${Number(inq.buffalo_price).toLocaleString()})` : ""}
                      </span>
                    )}
                  </td>
                  <td className="font-sans px-4 py-2.5 text-foreground max-w-[260px] truncate text-xs">
                    {inq.message}
                  </td>
                  <td className="font-sans px-4 py-2.5">{statusBadge(inq.status)}</td>
                  <td className="font-sans px-4 py-2.5 text-muted-foreground text-xs">
                    {new Date(inq.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredInquiries.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center font-sans text-muted-foreground py-8">
                    {allInquiries.length === 0
                      ? t("dash.noInquiries")
                      : "No inquiries match your selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Action Navigation & Account Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border border-border bg-background">
          <h2 className="font-display text-sm font-bold text-foreground mb-3">
            {t("dash.yourInfo")}
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-sans text-sm text-foreground truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-sans text-sm text-foreground">{fullName}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 border border-border bg-background">
          <h2 className="font-display text-sm font-bold text-foreground mb-3">
            {t("dash.quickActions")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/book-inquiry">
              <Button
                size="sm"
                className="bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-1.5 text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> {t("dash.newInquiry")}
              </Button>
            </Link>
            <Link to="/dashboard/my-inquiries">
              <Button
                size="sm"
                variant="outline"
                className="font-sans font-semibold gap-1.5 text-xs"
              >
                <FileText className="w-3.5 h-3.5" /> {t("dash.myInquiries")}
              </Button>
            </Link>
            <Link to="/buffaloes">
              <Button size="sm" variant="ghost" className="font-sans text-xs gap-1">
                Browse Breeds <ArrowUpRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
