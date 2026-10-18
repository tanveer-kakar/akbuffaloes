import { useMemo, useState, useRef } from "react";
import {
  XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  CartesianGrid, AreaChart, Area, BarChart, Bar, Cell
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CalendarDays, Activity, CheckCircle, Clock, ShieldCheck, IndianRupee, Tag,
  BarChart3, Layers, ArrowUpRight, Camera, Image as ImageIcon, Video as VideoIcon,
  Plus, Upload
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, TrendingDown, Users, Eye, MessageSquare, Phone, type LucideIcon,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  galleryItems as defaultGalleryItems,
  isDefaultGalleryItem,
  type GalleryItem,
  type GalleryItemDbRecord,
} from "@/data/galleryData";

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  avatar_url?: string | null;
}

interface PurchaseInquiry {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  message?: string;
  status?: string;
  created_at: string;
  user_id: string | null;
  buffalo_name?: string;
  buffalo_breed?: string;
  buffalo_price?: number;
}

interface ConsultationRequest {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name?: string;
  email?: string;
  message?: string;
  status?: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

interface BuffaloListingAdmin {
  id: string;
  name: string;
  breed: string;
  price: number;
  image_url?: string | null;
  status: string;
  is_available: boolean;
  created_at?: string;
}

interface AnalyticsSectionProps {
  profiles: Profile[];
  purchaseInquiries: PurchaseInquiry[];
  consultations: ConsultationRequest[];
  contacts: ContactMessage[];
  activityLogs?: ActivityLog[];
  buffaloListings?: BuffaloListingAdmin[];
  galleryItems?: GalleryItem[];
  galleryDbRecords?: GalleryItemDbRecord[];
  onManageGallery?: () => void;
  onManageBuffaloes?: () => void;
  onAddGalleryPhoto?: () => void;
  onAddGalleryVideo?: () => void;
  onBulkUploadGallery?: () => void;
}

const filterByDate = <T extends { created_at: string }>(data: T[], dateRange: string) => {
  if (dateRange === "all") return data;
  const cutoff = new Date(Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000);
  return data.filter((item) => new Date(item.created_at) >= cutoff);
};

const StatCarousel = ({ children }: { children: React.ReactNode }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "prev" | "next") => {
    scrollRef.current?.scrollBy({ left: dir === "next" ? 220 : -220, behavior: "smooth" });
  };
  return (
    <div className="relative flex items-stretch gap-1">
      <button
        type="button"
        onClick={() => scroll("prev")}
        className="shrink-0 self-center bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:border-gold/60 transition-all z-10"
      >
        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
      </button>
      <div ref={scrollRef} className="overflow-x-auto flex-1" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-3 w-max">
          {children}
        </div>
      </div>
      <button
        type="button"
        onClick={() => scroll("next")}
        className="shrink-0 self-center bg-background border border-border rounded-full w-7 h-7 flex items-center justify-center shadow-md hover:border-gold/60 transition-all z-10"
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, trend, color, onClick }: {
  icon: LucideIcon; label: string; value: string | number; sub?: string; trend?: "up" | "down" | "neutral"; color: string; onClick?: () => void;
}) => (
  <Card
    onClick={onClick}
    className={`flex-none w-[200px] sm:w-[220px] p-4 border border-border bg-background transition-all ${onClick ? "cursor-pointer hover:border-gold/60 hover:shadow-sm" : ""}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="font-sans text-xs text-muted-foreground mb-1">{label}</p>
        <p className="font-display text-xl sm:text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="font-sans text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 mt-2">
        {trend === "up" ? <TrendingUp className="w-3 h-3 text-green-600" /> : trend === "down" ? <TrendingDown className="w-3 h-3 text-red-500" /> : null}
        <span className={`font-sans text-[10px] ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
          {trend === "up" ? "Growing" : trend === "down" ? "Declining" : "Stable"}
        </span>
      </div>
    )}
  </Card>
);

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
const MEDIA_COLORS = ["#d4a843", "#3b82f6", "#10b981", "#8b5cf6"];

const AnalyticsSection = ({
  profiles: allProfiles,
  purchaseInquiries: allInquiries,
  consultations: allConsultations,
  contacts: allContacts,
  activityLogs: allActivityLogs = [],
  buffaloListings: allBuffaloListings = [],
  galleryItems: allGalleryItems = defaultGalleryItems,
  galleryDbRecords = [],
  onManageGallery,
  onManageBuffaloes,
  onAddGalleryPhoto,
  onAddGalleryVideo,
  onBulkUploadGallery,
}: AnalyticsSectionProps) => {

  const [dateRange, setDateRange] = useState("all");

  const profiles = useMemo(() => filterByDate(allProfiles, dateRange), [allProfiles, dateRange]);
  const purchaseInquiries = useMemo(() => filterByDate(allInquiries, dateRange), [allInquiries, dateRange]);
  const consultations = useMemo(() => filterByDate(allConsultations, dateRange), [allConsultations, dateRange]);
  const contacts = useMemo(() => filterByDate(allContacts, dateRange), [allContacts, dateRange]);
  const activityLogs = useMemo(() => filterByDate(allActivityLogs, dateRange), [allActivityLogs, dateRange]);

  // Photos & Videos Analytics Calculations
  const galleryPhotos = useMemo(
    () => allGalleryItems.filter((item) => item.type === "image"),
    [allGalleryItems]
  );
  const galleryVideos = useMemo(
    () => allGalleryItems.filter((item) => item.type === "video"),
    [allGalleryItems]
  );
  const customAddedGalleryCount = useMemo(
    () => allGalleryItems.filter((item) => !isDefaultGalleryItem(item.id)).length,
    [allGalleryItems]
  );
  const editedDefaultGalleryCount = useMemo(
    () =>
      allGalleryItems.filter(
        (item) =>
          isDefaultGalleryItem(item.id) &&
          galleryDbRecords.some((r) => r.id === item.id && !r.is_deleted)
      ).length,
    [allGalleryItems, galleryDbRecords]
  );
  const buffaloPhotosCount = useMemo(
    () => allBuffaloListings.length,
    [allBuffaloListings]
  );
  const totalPhotosAndVideos = useMemo(
    () => allGalleryItems.length + buffaloPhotosCount,
    [allGalleryItems, buffaloPhotosCount]
  );

  // Media Chart Data (Photos vs Videos Breakdown)
  const mediaAnalyticsChartData = useMemo(
    () => [
      { name: "Gallery Photos", count: galleryPhotos.length },
      { name: "Gallery Videos", count: galleryVideos.length },
      { name: "Buffalo Photos", count: buffaloPhotosCount },
      { name: "Admin Updates", count: customAddedGalleryCount + editedDefaultGalleryCount },
    ],
    [galleryPhotos.length, galleryVideos.length, buffaloPhotosCount, customAddedGalleryCount, editedDefaultGalleryCount]
  );

  // Overall Operations Count
  const totalOperations = useMemo(() => {
    return (
      purchaseInquiries.length +
      consultations.length +
      contacts.length +
      activityLogs.length +
      profiles.length +
      galleryDbRecords.length
    );
  }, [purchaseInquiries, consultations, contacts, activityLogs, profiles, galleryDbRecords]);

  // Total Estimated Inquired Value
  const totalInquiredValue = useMemo(() => {
    return purchaseInquiries.reduce((sum, pi) => sum + (Number(pi.buffalo_price) || 0), 0);
  }, [purchaseInquiries]);

  // Inquiries Status Breakdown
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, accepted: 0, confirmed: 0, completed: 0, rejected: 0 };
    purchaseInquiries.forEach((pi) => {
      const s = (pi.status || "pending").toLowerCase();
      if (counts[s] !== undefined) counts[s]++;
      else counts.pending++;
    });
    return counts;
  }, [purchaseInquiries]);

  // Resolution / Processing Rate
  const resolutionRate = useMemo(() => {
    if (purchaseInquiries.length === 0) return 100;
    const processed = purchaseInquiries.length - statusCounts.pending;
    return Math.round((processed / purchaseInquiries.length) * 100);
  }, [purchaseInquiries, statusCounts]);

  // Breed Demand Breakdown
  const breedDemand = useMemo(() => {
    const counts: Record<string, number> = {};
    purchaseInquiries.forEach((pi) => {
      const breed = pi.buffalo_breed || "Murrah";
      counts[breed] = (counts[breed] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      inquiries: count,
    })).sort((a, b) => b.inquiries - a.inquiries);
  }, [purchaseInquiries]);

  // User Signups Timeline
  const userSignups = useMemo(() => {
    const months: Record<string, number> = {};
    profiles.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).sort().slice(-12).map(([month, count]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
      users: count,
    }));
  }, [profiles]);

  // Combined Operations Timeline
  const operationsTimeline = useMemo(() => {
    const months: Record<string, { inquiries: number; consultations: number; messages: number; total: number }> = {};
    const recordMonth = (dateStr: string, type: "inquiries" | "consultations" | "messages") => {
      const d = new Date(dateStr);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!months[key]) months[key] = { inquiries: 0, consultations: 0, messages: 0, total: 0 };
      months[key][type]++;
      months[key].total++;
    };

    purchaseInquiries.forEach(pi => recordMonth(pi.created_at, "inquiries"));
    consultations.forEach(c => recordMonth(c.created_at, "consultations"));
    contacts.forEach(cm => recordMonth(cm.created_at, "messages"));

    return Object.entries(months).sort().slice(-12).map(([month, data]) => ({
      month: new Date(month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" }),
      ...data,
    }));
  }, [purchaseInquiries, consultations, contacts]);

  // Activity Log Entity Breakdown
  const activityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      purchase_inquiries: 0,
      consultation_requests: 0,
      contact_messages: 0,
      buffalo_listings: 0,
      gallery_items: 0,
      users: 0,
    };
    activityLogs.forEach((log) => {
      if (counts[log.entity_type] !== undefined) counts[log.entity_type]++;
      else if (log.entity_type.includes("user")) counts.users++;
    });
    return [
      { name: "Purchase Inquiries", count: counts.purchase_inquiries || purchaseInquiries.length },
      { name: "Consultations", count: counts.consultation_requests || consultations.length },
      { name: "Contact Messages", count: counts.contact_messages || contacts.length },
      { name: "Buffalo Photos & Stock", count: counts.buffalo_listings + allBuffaloListings.length },
      { name: "Gallery Photos & Videos", count: counts.gallery_items + allGalleryItems.length },
      { name: "User Operations", count: counts.users + profiles.length },
    ];
  }, [activityLogs, purchaseInquiries, consultations, contacts, profiles, allBuffaloListings.length, allGalleryItems.length]);

  return (
    <div className="space-y-6">
      {/* Date Range Filter Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold" /> Website Operations, Photos & Videos Analytics
          </h2>
          <p className="font-sans text-xs text-muted-foreground">
            Complete real-time intelligence on gallery photos & videos, buffalo catalog photos, user inquiries, and platform operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-muted-foreground" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 w-[150px] font-sans text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
              <SelectItem value="7" className="text-xs">Last 7 Days</SelectItem>
              <SelectItem value="30" className="text-xs">Last 30 Days</SelectItem>
              <SelectItem value="90" className="text-xs">Last 90 Days</SelectItem>
              <SelectItem value="180" className="text-xs">Last 6 Months</SelectItem>
              <SelectItem value="365" className="text-xs">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* All KPI Cards — single scrollable row */}
      <StatCarousel>
        <StatCard icon={Layers} label="Total Operations" value={totalOperations} sub="Platform user & admin events" trend="up" color="bg-primary" />
        <StatCard icon={IndianRupee} label="Inquiry Deal Volume" value={totalInquiredValue > 0 ? `₹${(totalInquiredValue / 100000).toFixed(1)}L` : "₹0"} sub={`${purchaseInquiries.length} total purchase leads`} trend="up" color="bg-amber-600" />
        <StatCard icon={CheckCircle} label="Resolution Rate" value={`${resolutionRate}%`} sub={`${purchaseInquiries.length - statusCounts.pending} of ${purchaseInquiries.length} processed`} trend="neutral" color="bg-emerald-600" />
        <StatCard icon={Tag} label="Buffalo Photos & Stock" value={allBuffaloListings.length} sub={`${allBuffaloListings.filter(b => b.is_available !== false).length} in active stock`} color="bg-blue-600" onClick={onManageBuffaloes} />
        <StatCard icon={Camera} label="Total Photos & Videos" value={totalPhotosAndVideos} sub={`${allGalleryItems.length} Gallery + ${buffaloPhotosCount} Buffalo photos`} trend="up" color="bg-emerald-600" onClick={onManageGallery} />
        <StatCard icon={ImageIcon} label="Gallery Photos" value={galleryPhotos.length} sub="High-resolution farm & breed photos" trend="up" color="bg-amber-600" onClick={onManageGallery} />
        <StatCard icon={VideoIcon} label="Gallery Videos" value={galleryVideos.length} sub="Live farm & dairy video showcases" trend="up" color="bg-blue-600" onClick={onManageGallery} />
        <StatCard icon={Tag} label="Admin Media Updates" value={customAddedGalleryCount + editedDefaultGalleryCount} sub={`${customAddedGalleryCount} added • ${editedDefaultGalleryCount} updated`} trend="up" color="bg-purple-600" onClick={onManageGallery} />
        <StatCard icon={Users} label="Total Users" value={profiles.length} color="bg-indigo-600" />
        <StatCard icon={Eye} label="Buffalo Enquiries" value={purchaseInquiries.length} color="bg-blue-600" />
        <StatCard icon={Phone} label="Consultations" value={consultations.length} color="bg-green-600" />
        <StatCard icon={MessageSquare} label="Contact Messages" value={contacts.length} color="bg-pink-600" />
      </StatCarousel>

      {/* Photos & Videos Media Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Media Composition & Distribution */}
        <Card className="p-4 border border-border bg-background">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
                <Camera className="w-4 h-4 text-gold" /> Photos & Videos Media Composition
              </h3>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                Live breakdown of gallery photos, farm videos, and buffalo breed images.
              </p>
            </div>
            <Badge variant="outline" className="font-sans text-[10px] border-gold/40 text-foreground">
              {totalPhotosAndVideos} Total Media Assets
            </Badge>
          </div>

          <div className="space-y-3 mt-4">
            {[
              {
                label: "Gallery Photos (Images)",
                count: galleryPhotos.length,
                total: totalPhotosAndVideos,
                color: "bg-amber-500",
                key: "gallery-photos",
              },
              {
                label: "Gallery Videos (MP4 / WebM)",
                count: galleryVideos.length,
                total: totalPhotosAndVideos,
                color: "bg-blue-500",
                key: "gallery-videos",
              },
              {
                label: "Buffalo Breed Listing Photos",
                count: buffaloPhotosCount,
                total: totalPhotosAndVideos,
                color: "bg-emerald-600",
                key: "buffalo-photos",
              },
              {
                label: "Admin Added / Updated Media",
                count: customAddedGalleryCount + editedDefaultGalleryCount,
                total: Math.max(allGalleryItems.length, 1),
                color: "bg-purple-500",
                key: "admin-custom",
              },
            ].map((item) => {
              const pct = item.total > 0 ? Math.min(100, Math.round((item.count / item.total) * 100)) : 0;
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

          {(onAddGalleryPhoto || onAddGalleryVideo || onBulkUploadGallery || onManageGallery || onManageBuffaloes) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
              {onAddGalleryPhoto && (
                <Button
                  size="sm"
                  onClick={onAddGalleryPhoto}
                  className="bg-gold text-green-dark hover:bg-gold-light font-sans font-bold text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Add More Photos</span>
                </Button>
              )}
              {onAddGalleryVideo && (
                <Button
                  size="sm"
                  onClick={onAddGalleryVideo}
                  className="bg-primary text-primary-foreground hover:opacity-90 font-sans font-bold text-xs h-8 gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <VideoIcon className="w-3.5 h-3.5" />
                  <span>Add More Videos</span>
                </Button>
              )}
              {onBulkUploadGallery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBulkUploadGallery}
                  className="font-sans font-semibold text-xs h-8 gap-1.5 border-gold/50 hover:bg-gold/10"
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  <span>Upload Multiple Photos / Videos</span>
                </Button>
              )}
              {onManageGallery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onManageGallery}
                  className="font-sans text-xs h-8 gap-1.5 border-border"
                >
                  <Camera className="w-3.5 h-3.5 text-gold" />
                  <span>Manage All ({allGalleryItems.length})</span>
                </Button>
              )}
              {onManageBuffaloes && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onManageBuffaloes}
                  className="font-sans text-xs h-8 gap-1.5 border-border"
                >
                  <Tag className="w-3.5 h-3.5 text-gold" />
                  <span>Buffalo Photos ({allBuffaloListings.length})</span>
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Photos & Videos Visual Bar Chart */}
        <Card className="p-4 border border-border bg-background min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <VideoIcon className="w-4 h-4 text-primary" /> Photos & Videos Inventory Chart
            </h3>
            <Badge variant="outline" className="font-sans text-[10px]">
              {galleryPhotos.length} Photos • {galleryVideos.length} Videos
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Comparison of active gallery photos, gallery videos, buffalo listing photos, and admin customizations.
          </p>

          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mediaAnalyticsChartData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(0, 0%, 85%)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Media Count" radius={[4, 4, 0, 0]}>
                  {mediaAnalyticsChartData.map((_, index) => (
                    <Cell key={`media-cell-${index}`} fill={MEDIA_COLORS[index % MEDIA_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Operations Breakdown: Inquiry Lifecycle & Breed Demand */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Inquiry Lifecycle Funnel */}
        <Card className="p-4 border border-border bg-background">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> Inquiry Status Lifecycle
            </h3>
            <Badge variant="outline" className="font-sans text-[10px]">
              {purchaseInquiries.length} Leads
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Live progression of user inquiries across all stages of fulfillment.
          </p>

          <div className="space-y-3">
            {[
              { label: "Pending Review", count: statusCounts.pending, color: "bg-yellow-500", key: "pending" },
              { label: "Accepted", count: statusCounts.accepted, color: "bg-green-500", key: "accepted" },
              { label: "Confirmed Deals", count: statusCounts.confirmed, color: "bg-blue-500", key: "confirmed" },
              { label: "Completed / Delivered", count: statusCounts.completed, color: "bg-emerald-600", key: "completed" },
              { label: "Rejected / Cancelled", count: statusCounts.rejected, color: "bg-red-500", key: "rejected" },
            ].map((item) => {
              const pct = purchaseInquiries.length > 0 ? Math.round((item.count / purchaseInquiries.length) * 100) : 0;
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
        </Card>

        {/* Breed Demand Chart */}
        <Card className="p-4 border border-border bg-background min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Most Inquired Buffalo Breeds
            </h3>
            <Badge variant="outline" className="font-sans text-[10px]">
              Top Inquiries
            </Badge>
          </div>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            User preference across dairy breeds on the platform.
          </p>

          {breedDemand.length > 0 ? (
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breedDemand} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(0, 0%, 85%)" />
                  <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="inquiries" radius={[0, 4, 4, 0]}>
                    {breedDemand.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={BREED_COLORS[index % BREED_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="font-sans text-xs text-muted-foreground text-center py-12">No breed inquiry data yet</p>
          )}
        </Card>
      </div>

      {/* Timelines: Combined Operations & User Signups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4 border border-border bg-background min-w-0 overflow-hidden">
          <h3 className="font-display text-sm font-bold text-foreground mb-1">Total Operations Timeline</h3>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            Monthly volume of user inquiries, consultation calls, and messages.
          </p>
          {operationsTimeline.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={operationsTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 85%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" name="Total Operations" stroke="hsl(161, 93%, 30%)" fill="hsl(161, 93%, 30%)" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="hsl(210, 80%, 50%)" fill="hsl(210, 80%, 50%)" fillOpacity={0.1} strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="font-sans text-xs text-muted-foreground text-center py-12">No operations logged yet</p>
          )}
        </Card>

        <Card className="p-4 border border-border bg-background min-w-0 overflow-hidden">
          <h3 className="font-display text-sm font-bold text-foreground mb-1">User Growth & Signups</h3>
          <p className="font-sans text-xs text-muted-foreground mb-4">
            New farmer accounts registered over time.
          </p>
          {userSignups.length > 0 ? (
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={userSignups}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 85%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="users" name="New Users" stroke="hsl(280, 60%, 50%)" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="font-sans text-xs text-muted-foreground text-center py-12">No user registration data yet</p>
          )}
        </Card>
      </div>

      {/* Operations by Category Matrix */}
      <Card className="p-5 border border-border bg-background">
        <h3 className="font-display text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Platform Operations Breakdown
        </h3>
        <p className="font-sans text-xs text-muted-foreground mb-4">
          Distribution of user and administrator actions performed across all system collections, including buffalo photos and gallery photos & videos.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {activityBreakdown.map((item) => (
            <div key={item.name} className="p-3 bg-muted/20 border border-border/80 rounded-lg text-center">
              <p className="font-sans text-[11px] text-muted-foreground font-medium truncate">{item.name}</p>
              <p className="font-display text-xl font-bold text-foreground mt-1">{item.count}</p>
              <span className="inline-flex items-center text-[10px] text-primary font-medium mt-1">
                Active <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsSection;

