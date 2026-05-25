import { useState } from "react";
import { Link } from "wouter";
import { useListLeads, getListLeadsQueryKey, ListLeadsStatus } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Search, Plus, Download, Upload, Sparkles, Users, CheckCircle2, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiFetchRaw } from "@/lib/api-fetch";

// ─── Export Dialog ─────────────────────────────────────────────────────────────

function ExportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [exportStatus, setExportStatus] = useState("all");
  const [tortType, setTortType]         = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [selectedFields, setSelectedFields] = useState("all");

  const handleExport = () => {
    const p = new URLSearchParams();
    if (exportStatus !== "all") p.set("status", exportStatus);
    if (tortType)  p.set("tort_type", tortType);
    if (dateFrom)  p.set("date_from", dateFrom);
    if (dateTo)    p.set("date_to", dateTo);
    if (selectedFields !== "all") p.set("fields", selectedFields);
    window.open(`/api/leads/export?${p.toString()}`, "_blank");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Leads</DialogTitle>
          <DialogDescription>Configure filters and download leads as CSV.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={exportStatus} onValueChange={setExportStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="review_required">Review Required</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tort Type</Label>
              <Input placeholder="e.g. Camp Lejeune" value={tortType} onChange={(e) => setTortType(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Date From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Date To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Fields</Label>
            <Select value={selectedFields} onValueChange={setSelectedFields}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="id,name,email,phone,tort_type,status,created_at">Basic Info</SelectItem>
                <SelectItem value="id,name,email,phone,tort_type,status,vendor_id,law_firm,client_id,created_at">With Vendor Info</SelectItem>
                <SelectItem value="id,first_name,last_name,email,phone_primary,tort_type,status,diagnosis,diagnosis_date,created_at">Clinical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" />Download CSV</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Status badge helper ───────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    signed:          "bg-green-500/10 text-green-700 border-green-500/20",
    qualified:       "bg-blue-500/10  text-blue-700  border-blue-500/20",
    rejected:        "bg-red-500/10   text-red-700   border-red-500/20",
    review_required: "bg-amber-500/10 text-amber-700 border-amber-500/20",
    new:             "bg-muted        text-muted-foreground",
  };
  const label = status === "review_required" ? "REVIEW" : status.toUpperCase();
  return <Badge variant="outline" className={map[status] ?? ""}>{label}</Badge>;
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Leads() {
  const { toast } = useToast();
  const [search, setSearch]       = useState("");
  const [status, setStatus]       = useState<ListLeadsStatus | "all">("all");
  const [exportOpen, setExportOpen] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const params = {
    ...(search ? { search } : {}),
    ...(status !== "all" ? { status: status as ListLeadsStatus } : {}),
    limit: 500,
  };

  const { data: leads, isLoading, refetch } = useListLeads(params, {
    query: { queryKey: getListLeadsQueryKey(params) }
  });

  const total      = leads?.length ?? 0;
  const qualified  = leads?.filter((l) => l.status === "qualified" || l.status === "signed").length ?? 0;
  const newCount   = leads?.filter((l) => l.status === "new").length ?? 0;
  const needReview = leads?.filter((l) => l.status === "review_required").length ?? 0;

  async function runEnrichment(leadId: string) {
    setEnrichingId(leadId);
    try {
      const res = await apiFetchRaw(`/api/leads/${leadId}/enrich`, { method: "POST" });
      if (!res.ok) throw new Error(`${res.status}`);
      toast({ title: "Enrichment complete", description: "Lead data has been updated." });
      refetch();
    } catch {
      toast({ title: "Enrichment failed", description: "Could not run enrichment — check integrations.", variant: "destructive" });
    } finally {
      setEnrichingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Leads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? "Loading…" : `${total} lead${total !== 1 ? "s" : ""} in your CRM`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/lead-import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Import
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button asChild>
            <Link href="/intake-forms" className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Intake
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Leads",  value: total,      icon: Users,        color: "text-foreground" },
          { label: "Qualified",    value: qualified,   icon: CheckCircle2, color: "text-green-600"  },
          { label: "New / Pending",value: newCount,    icon: Clock,        color: "text-blue-600"   },
          { label: "Needs Review", value: needReview,  icon: AlertTriangle,color: "text-amber-600"  },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 bg-muted/40">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
              <div>
                <div className="text-2xl font-bold">{isLoading ? "…" : value}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input type="search" placeholder="Search by name, email, phone…" className="pl-8"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={(val: any) => setStatus(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="signed">Signed</SelectItem>
            <SelectItem value="review_required">Review Required</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Tort Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : leads?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-8 w-8 opacity-30" />
                    <span>No leads found. <Link href="/lead-import" className="text-primary underline underline-offset-2">Import leads</Link> or <Link href="/intake-forms" className="text-primary underline underline-offset-2">run a new intake</Link>.</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads?.map((lead) => {
                const c = (lead as any).convexity_score as string | null | undefined;
                const flags = (((lead as any).convexity_ruin_flags ?? []) as string[]).length;
                return (
                  <TableRow key={lead.id} className="group">
                    <TableCell className="font-medium">
                      <Link href={`/leads/${lead.id}`} className="hover:underline">
                        {lead.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{lead.phone}</div>
                      {lead.email && <div className="text-xs">{lead.email}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{lead.tort_type || "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      {flags > 0
                        ? <Badge className="bg-rose-100 text-rose-800 border-rose-300">RUIN</Badge>
                        : c === "convex"  ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Convex</Badge>
                        : c === "concave" ? <Badge className="bg-amber-100 text-amber-800 border-amber-300">Concave</Badge>
                        : c === "neutral" ? <Badge variant="secondary">Neutral</Badge>
                        : <Badge variant="outline" className="text-muted-foreground">—</Badge>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">
                      {format(new Date(lead.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost" size="sm"
                          onClick={() => runEnrichment(lead.id)}
                          disabled={enrichingId === lead.id}
                          title="Run enrichment on this lead"
                        >
                          {enrichingId === lead.id
                            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            : <Sparkles className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/leads/${lead.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && leads && leads.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Showing {leads.length} lead{leads.length !== 1 ? "s" : ""}
          {status !== "all" ? ` with status "${status}"` : ""}
          {search ? ` matching "${search}"` : ""}
        </p>
      )}
    </div>
  );
}
