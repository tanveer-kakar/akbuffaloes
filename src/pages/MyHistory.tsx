import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import {
  Clock,
  FileText,
  LogIn,
  UserCog,
  History,
  Download,
  Filter,
  Search,
  RotateCcw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  created_at: string;
}

interface Inquiry {
  id: string;
  name: string;
  message: string;
  created_at: string;
  status?: string;
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

const iconMap: Record<string, typeof Clock> = {
  purchase_inquiry: FileText,
  auth: LogIn,
  profile: UserCog,
};

const entityTypes = [
  { value: "all", label: "All Activities" },
  { value: "purchase_inquiry", label: "Inquiries" },
  { value: "auth", label: "Logins" },
  { value: "profile", label: "Profile Updates" },
];

const dateRanges = [
  { value: "all", label: "All Time" },
  { value: "1", label: "Today (24h)" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const downloadCSV = <T extends object>(data: T[], filename: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = String((row as Record<string, unknown>)[h] ?? "").replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const MyHistory = () => {
  const { user, loading } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [fetching, setFetching] = useState(true);

  // Activity Log Filters
  const [logSearch, setLogSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [logSort, setLogSort] = useState("newest");

  // Inquiry History Filters
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("all");
  const [inquiryDateFilter, setInquiryDateFilter] = useState("all");
  const [inquirySort, setInquirySort] = useState("newest");

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [logsRes, inquiriesRes] = await Promise.all([
        backend
          .from("activity_logs")
          .select("id, action, entity_type, entity_id, details, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        backend
          .from("purchase_inquiries")
          .select("id, name, message, created_at, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);
      setLogs((logsRes.data as unknown as ActivityLog[]) || []);
      setInquiries((inquiriesRes.data as unknown as Inquiry[]) || []);
      setFetching(false);
    };
    fetchAll();
  }, [user]);

  const filterByDate = <T extends { created_at: string }>(items: T[], days: string) => {
    if (days === "all") return items;
    const cutoff = new Date(Date.now() - parseInt(days, 10) * 86400000);
    return items.filter((i) => new Date(i.created_at) >= cutoff);
  };

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    let result = logs;
    if (typeFilter !== "all") result = result.filter((l) => l.entity_type === typeFilter);
    result = filterByDate(result, dateFilter);
    if (q) {
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.entity_type.toLowerCase().includes(q) ||
          (l.details || "").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      logSort === "oldest"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [logs, logSearch, typeFilter, dateFilter, logSort]);

  const filteredInquiries = useMemo(() => {
    const q = inquirySearch.trim().toLowerCase();
    let result = filterByDate(inquiries, inquiryDateFilter);
    if (inquiryStatusFilter !== "all") {
      result = result.filter((i) => (i.status || "pending").toLowerCase() === inquiryStatusFilter);
    }
    if (q) {
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.message.toLowerCase().includes(q) ||
          (i.status || "pending").toLowerCase().includes(q)
      );
    }
    return [...result].sort((a, b) =>
      inquirySort === "oldest"
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [inquiries, inquirySearch, inquiryStatusFilter, inquiryDateFilter, inquirySort]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString();
  const formatDateTime = (d: string) => new Date(d).toLocaleString();

  if (loading || fetching) {
    return <p className="font-sans text-muted-foreground text-center py-10">Loading history...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-primary" />
        <h1 className="font-display text-xl font-bold text-foreground">My History</h1>
      </div>

      <Tabs defaultValue="inquiries" className="space-y-4">
        <TabsList className="bg-background border border-border w-full flex overflow-x-auto h-auto gap-1 p-1 scrollbar-hide">
          <TabsTrigger value="inquiries" className="font-sans text-xs gap-1.5 shrink-0 px-3 py-2">
            <FileText className="w-3.5 h-3.5" /> Inquiries ({filteredInquiries.length}/{inquiries.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="font-sans text-xs gap-1.5 shrink-0 px-3 py-2">
            <Clock className="w-3.5 h-3.5" /> Activity Log ({filteredLogs.length}/{logs.length})
          </TabsTrigger>
        </TabsList>

        {/* INQUIRIES HISTORY */}
        <TabsContent value="inquiries">
          <div className="bg-background border border-border rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={inquirySearch}
                onChange={(e) => setInquirySearch(e.target.value)}
                placeholder="Search inquiry message or name..."
                className="pl-8 h-8 font-sans text-xs"
              />
            </div>

            <Filter className="w-4 h-4 text-muted-foreground hidden sm:inline" />
            <Select value={inquiryStatusFilter} onValueChange={setInquiryStatusFilter}>
              <SelectTrigger className="w-[135px] h-8 text-xs font-sans">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem value="pending" className="text-xs">
                  Pending
                </SelectItem>
                <SelectItem value="accepted" className="text-xs">
                  Accepted
                </SelectItem>
                <SelectItem value="confirmed" className="text-xs">
                  Confirmed
                </SelectItem>
                <SelectItem value="completed" className="text-xs">
                  Completed
                </SelectItem>
                <SelectItem value="rejected" className="text-xs">
                  Rejected
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={inquiryDateFilter} onValueChange={setInquiryDateFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs font-sans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={inquirySort} onValueChange={setInquirySort}>
              <SelectTrigger className="w-[135px] h-8 text-xs font-sans">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Newest First
                </SelectItem>
                <SelectItem value="oldest" className="text-xs">
                  Oldest First
                </SelectItem>
              </SelectContent>
            </Select>

            {(inquirySearch ||
              inquiryStatusFilter !== "all" ||
              inquiryDateFilter !== "all" ||
              inquirySort !== "newest") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setInquirySearch("");
                  setInquiryStatusFilter("all");
                  setInquiryDateFilter("all");
                  setInquirySort("newest");
                }}
                className="h-8 px-2 font-sans text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="font-sans text-xs gap-1.5 ml-auto h-8"
              onClick={() =>
                downloadCSV(
                  filteredInquiries.map((i) => ({
                    Name: i.name,
                    Status: i.status || "pending",
                    Message: i.message,
                    Date: formatDate(i.created_at),
                  })),
                  "inquiry-history"
                )
              }
              disabled={filteredInquiries.length === 0}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <span className="text-[10px] text-muted-foreground font-sans">
              {filteredInquiries.length} records
            </span>
          </div>

          {filteredInquiries.length === 0 ? (
            <Card className="p-8 border border-border text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-muted-foreground">No inquiries found.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredInquiries.map((i) => (
                <Card key={i.id} className="p-4 border border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-sans text-sm font-medium text-foreground">{i.name}</p>
                        {statusBadge(i.status)}
                      </div>
                      <p className="font-sans text-xs text-muted-foreground">{i.message}</p>
                    </div>
                    <span className="font-sans text-[10px] text-muted-foreground shrink-0">
                      {formatDate(i.created_at)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ACTIVITY LOG */}
        <TabsContent value="activity">
          <div className="bg-background border border-border rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search action, activity type, or details..."
                className="pl-8 h-8 font-sans text-xs"
              />
            </div>

            <Filter className="w-4 h-4 text-muted-foreground hidden sm:inline" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs font-sans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs font-sans">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((d) => (
                  <SelectItem key={d.value} value={d.value} className="text-xs">
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={logSort} onValueChange={setLogSort}>
              <SelectTrigger className="w-[135px] h-8 text-xs font-sans">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Newest First
                </SelectItem>
                <SelectItem value="oldest" className="text-xs">
                  Oldest First
                </SelectItem>
              </SelectContent>
            </Select>

            {(logSearch || typeFilter !== "all" || dateFilter !== "all" || logSort !== "newest") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLogSearch("");
                  setTypeFilter("all");
                  setDateFilter("all");
                  setLogSort("newest");
                }}
                className="h-8 px-2 font-sans text-xs gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              className="font-sans text-xs gap-1.5 ml-auto h-8"
              onClick={() =>
                downloadCSV(
                  filteredLogs.map((l) => ({
                    Action: l.action,
                    Type: l.entity_type,
                    Details: l.details || "",
                    Date: formatDateTime(l.created_at),
                  })),
                  "activity-log"
                )
              }
              disabled={filteredLogs.length === 0}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </Button>
            <span className="text-[10px] text-muted-foreground font-sans">
              {filteredLogs.length} records
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <Card className="p-8 border border-border text-center">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-sans text-muted-foreground">No activity recorded.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((l) => {
                const Icon = iconMap[l.entity_type] || Clock;
                return (
                  <Card key={l.id} className="p-3 border border-border">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans text-xs font-medium text-foreground capitalize">
                          {l.action.replace(/_/g, " ")}
                        </p>
                        <p className="font-sans text-[10px] text-muted-foreground capitalize">
                          {l.entity_type.replace(/_/g, " ")}
                        </p>
                        {l.details && (
                          <p className="font-sans text-[10px] text-muted-foreground mt-0.5 truncate">
                            {l.details}
                          </p>
                        )}
                      </div>
                      <span className="font-sans text-[10px] text-muted-foreground shrink-0">
                        {formatDateTime(l.created_at)}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyHistory;
