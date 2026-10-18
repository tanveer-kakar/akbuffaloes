import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { backend } from "@/lib/backendClient";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  Save,
  Download,
  Filter,
  Search,
  RotateCcw,
} from "lucide-react";
import { BUFFALO_BREEDS } from "@/data/buffaloBreedsData";

interface Inquiry {
  id: string;
  message: string;
  name: string;
  phone: string;
  email: string;
  created_at: string;
  status?: string;
  admin_note?: string | null;
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

const dateRanges = [
  { value: "all", label: "All Time" },
  { value: "1", label: "Today (24h)" },
  { value: "7", label: "Last 7 Days" },
  { value: "30", label: "Last 30 Days" },
  { value: "90", label: "Last 90 Days" },
];

const downloadCSV = (data: Inquiry[]) => {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Buffalo",
    "Breed",
    "Listed Price",
    "Status",
    "Admin Note",
    "Message",
    "Date",
  ];
  const rows = data.map((i) => [
    i.name,
    i.email,
    i.phone,
    i.buffalo_name || "",
    i.buffalo_breed || "",
    i.buffalo_price ?? "",
    i.status || "pending",
    `"${(i.admin_note || "").replace(/"/g, '""')}"`,
    `"${i.message.replace(/"/g, '""')}"`,
    new Date(i.created_at).toLocaleString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const MyInquiries = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editInquiry, setEditInquiry] = useState<Inquiry | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewInquiry, setViewInquiry] = useState<Inquiry | null>(null);

  // Comprehensive Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [breedFilter, setBreedFilter] = useState("all");
  const [replyFilter, setReplyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await backend
        .from("purchase_inquiries")
        .select(
          "id, message, name, phone, email, created_at, buffalo_name, buffalo_breed, buffalo_price, status, admin_note"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setInquiries((data as unknown as Inquiry[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = inquiries.filter((i) => {
      if (statusFilter !== "all" && (i.status || "pending").toLowerCase() !== statusFilter) {
        return false;
      }
      if (breedFilter !== "all" && (i.buffalo_breed || "") !== breedFilter) {
        return false;
      }
      if (replyFilter === "with_reply" && !i.admin_note?.trim()) {
        return false;
      }
      if (replyFilter === "awaiting_reply" && Boolean(i.admin_note?.trim())) {
        return false;
      }
      if (dateFilter !== "all") {
        const days = parseInt(dateFilter, 10);
        const cutoff = new Date(Date.now() - days * 86400000);
        if (new Date(i.created_at) < cutoff) return false;
      }
      if (q) {
        const match =
          (i.buffalo_name || "").toLowerCase().includes(q) ||
          (i.buffalo_breed || "").toLowerCase().includes(q) ||
          (i.message || "").toLowerCase().includes(q) ||
          (i.admin_note || "").toLowerCase().includes(q) ||
          (i.status || "pending").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortOrder === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortOrder === "price_high") {
        return (Number(b.buffalo_price) || 0) - (Number(a.buffalo_price) || 0);
      }
      if (sortOrder === "price_low") {
        return (Number(a.buffalo_price) || 0) - (Number(b.buffalo_price) || 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [inquiries, searchQuery, statusFilter, breedFilter, replyFilter, dateFilter, sortOrder]);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    breedFilter !== "all" ||
    replyFilter !== "all" ||
    dateFilter !== "all" ||
    sortOrder !== "newest";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setBreedFilter("all");
    setReplyFilter("all");
    setDateFilter("all");
    setSortOrder("newest");
  };

  const handleEdit = (inq: Inquiry) => {
    setEditInquiry(inq);
    setEditMessage(inq.message);
  };

  const handleSaveEdit = async () => {
    if (!editInquiry || !editMessage.trim()) return;
    setSaving(true);
    const { error } = await backend
      .from("purchase_inquiries")
      .update({ message: editMessage.trim() })
      .eq("id", editInquiry.id);
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setInquiries((prev) =>
        prev.map((i) => (i.id === editInquiry.id ? { ...i, message: editMessage.trim() } : i))
      );
      toast({ title: "Inquiry updated!" });
      setEditInquiry(null);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await backend.from("purchase_inquiries").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      toast({ title: "Inquiry deleted" });
    }
  };

  if (loading) return <p className="font-sans text-muted-foreground p-6">Loading...</p>;

  return (
    <div className="space-y-4">
      <div className="bg-background border border-border rounded-lg">
        {/* Top Header */}
        <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl font-bold text-foreground">My Inquiries</h2>
            <Badge variant="outline" className="font-sans text-xs">
              {filtered.length} / {inquiries.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="font-sans text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="font-sans text-xs gap-1.5 h-8"
              onClick={() => downloadCSV(filtered)}
              disabled={filtered.length === 0}
            >
              <Download className="w-3.5 h-3.5" /> Export ({filtered.length})
            </Button>
          </div>
        </div>

        {/* Multi-Criteria Filter Bar */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buffalo, breed, message, or farm reply..."
              className="pl-8 h-8 font-sans text-xs bg-background"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground hidden sm:inline" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs font-sans bg-background">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-sans">
                  All Statuses
                </SelectItem>
                <SelectItem value="pending" className="text-xs font-sans">
                  Pending
                </SelectItem>
                <SelectItem value="accepted" className="text-xs font-sans">
                  Accepted
                </SelectItem>
                <SelectItem value="confirmed" className="text-xs font-sans">
                  Confirmed
                </SelectItem>
                <SelectItem value="completed" className="text-xs font-sans">
                  Completed
                </SelectItem>
                <SelectItem value="rejected" className="text-xs font-sans">
                  Rejected
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={breedFilter} onValueChange={setBreedFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs font-sans bg-background">
              <SelectValue placeholder="All Breeds" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-sans">
                All Breeds
              </SelectItem>
              {BUFFALO_BREEDS.map((b) => (
                <SelectItem key={b.slug} value={b.name} className="text-xs font-sans">
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={replyFilter} onValueChange={setReplyFilter}>
            <SelectTrigger className="w-[155px] h-8 text-xs font-sans bg-background">
              <SelectValue placeholder="Farm Replies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-sans">
                All Inquiries
              </SelectItem>
              <SelectItem value="with_reply" className="text-xs font-sans">
                With Farm Reply
              </SelectItem>
              <SelectItem value="awaiting_reply" className="text-xs font-sans">
                Awaiting Reply
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs font-sans bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs font-sans">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[150px] h-8 text-xs font-sans bg-background">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs font-sans">
                Newest First
              </SelectItem>
              <SelectItem value="oldest" className="text-xs font-sans">
                Oldest First
              </SelectItem>
              <SelectItem value="price_high" className="text-xs font-sans">
                Price: High → Low
              </SelectItem>
              <SelectItem value="price_low" className="text-xs font-sans">
                Price: Low → High
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-sans">Buffalo &amp; Message</TableHead>
                <TableHead className="font-sans w-28">Status</TableHead>
                <TableHead className="font-sans w-32">Date</TableHead>
                <TableHead className="font-sans w-28">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inq) => (
                <TableRow key={inq.id}>
                  <TableCell className="font-sans text-sm max-w-[260px]">
                    {inq.buffalo_name && (
                      <span className="block font-semibold">
                        {inq.buffalo_name}
                        {inq.buffalo_breed ? ` (${inq.buffalo_breed})` : ""}
                        {inq.buffalo_price ? ` · ₹${inq.buffalo_price.toLocaleString()}` : ""}
                      </span>
                    )}
                    <span className="block truncate">{inq.message}</span>
                    {inq.admin_note && (
                      <span className="inline-block mt-1 text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
                        Farm Reply: {inq.admin_note}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{statusBadge(inq.status)}</TableCell>
                  <TableCell className="font-sans text-sm">
                    {new Date(inq.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewInquiry(inq)}
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(inq)}
                      >
                        <Edit className="w-3.5 h-3.5 text-gold" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(inq.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center font-sans text-muted-foreground py-8">
                    {inquiries.length === 0
                      ? "No inquiries yet. Book your first inquiry!"
                      : "No inquiries match the selected filters."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editInquiry} onOpenChange={() => setEditInquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Inquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editMessage}
              onChange={(e) => setEditMessage(e.target.value)}
              className="font-sans min-h-[120px]"
            />
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full bg-gold text-green-dark hover:bg-gold-light font-sans font-semibold gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewInquiry} onOpenChange={() => setViewInquiry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Inquiry Details</DialogTitle>
          </DialogHeader>
          {viewInquiry && (
            <div className="space-y-2.5 font-sans text-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-xs text-muted-foreground">Status:</span>
                {statusBadge(viewInquiry.status)}
              </div>
              <p>
                <span className="text-muted-foreground">Name:</span> {viewInquiry.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span> {viewInquiry.email}
              </p>
              <p>
                <span className="text-muted-foreground">Phone:</span> {viewInquiry.phone}
              </p>
              {viewInquiry.buffalo_name && (
                <p>
                  <span className="text-muted-foreground">Buffalo:</span> {viewInquiry.buffalo_name}{" "}
                  ({viewInquiry.buffalo_breed}) — ₹{viewInquiry.buffalo_price?.toLocaleString()}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Date:</span>{" "}
                {new Date(viewInquiry.created_at).toLocaleString()}
              </p>
              {viewInquiry.admin_note && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2.5">
                  <p className="text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    Message from AK Buffaloes
                  </p>
                  <p className="text-xs mt-0.5">{viewInquiry.admin_note}</p>
                </div>
              )}
              <div className="bg-muted/10 border border-border rounded p-3 mt-2">
                <p className="text-muted-foreground text-xs mb-1">Message</p>
                <p className="whitespace-pre-wrap">{viewInquiry.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyInquiries;
