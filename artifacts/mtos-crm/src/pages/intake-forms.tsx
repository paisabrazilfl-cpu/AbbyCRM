import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetFormConfigs,
  useValidateEmail,
  useValidateAddress,
  useRunBackgroundCheck,
  useRunLeadBackgroundCheck,
  useUpdateFormConfig,
  useAddCustomField,
  useRemoveCustomField,
  getGetFormConfigsQueryKey,
  type FormConfig,
  type CustomField,
} from "@workspace/api-client-react";
import {
  ClipboardCheck, ShieldCheck, Shield, Wrench, User, Scale, Stethoscope, FileText,
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Clock, Sparkles, ArrowRight,
  Mail, MapPin, Search, XCircle, Info, Copy, Download, Play, Plus, Trash2,
  Pencil, RefreshCw, ExternalLink, Lock, FileCheck2, UserCheck2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StateCombobox } from "@/components/state-combobox";
import { useToast } from "@/hooks/use-toast";
import { apiFetchRaw } from "@/lib/api-fetch";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

// ─── Helper badges ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    clean:     "bg-green-500/10 text-green-600 border-green-500/20",
    flagged:   "bg-red-500/10   text-red-600   border-red-500/20",
    not_found: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    error:     "bg-gray-500/10  text-gray-600  border-gray-500/20",
  };
  return <Badge variant="outline" className={map[status ?? ""] ?? ""}>{status ?? "Unknown"}</Badge>;
}

function SeverityBadge({ severity }: { severity?: string }) {
  const map: Record<string, string> = {
    low:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    medium: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    high:   "bg-red-500/10   text-red-600   border-red-500/20",
  };
  return <Badge variant="outline" className={map[severity ?? ""] ?? ""}>{severity ?? "Unknown"}</Badge>;
}

function SearchScopeBadge({ result }: { result: any }) {
  const scope = result?.search_scope as string | undefined;
  const stateLabel = result?.searched_state_label as string | null | undefined;
  const stateCode  = result?.searched_state as string | null | undefined;
  const courts = ((result?.searched_courts as string[] | undefined) || []);
  if (!scope) return null;
  let label: string; let tone: string;
  if (scope === "state" && stateLabel) {
    label = `Searched: ${stateLabel} federal courts (${courts.length})`;
    tone  = "bg-blue-500/10 text-blue-700 border-blue-500/20";
  } else if (scope === "national-fallback") {
    label = `Nationwide search (state filter "${stateCode ?? ""}" unavailable)`;
    tone  = "bg-amber-500/10 text-amber-700 border-amber-500/20";
  } else {
    label = "Searched: nationwide federal courts";
    tone  = "bg-muted text-muted-foreground border";
  }
  return <Badge variant="outline" className={tone}><MapPin className="h-3 w-3 mr-1" />{label}</Badge>;
}

// ─── PACER result block ────────────────────────────────────────────────────────

interface PacerCase {
  caseNumberFull?: string | null; caseTitle?: string | null; caseYear?: number | null;
  courtId?: string | null; dateFiled?: string | null; jurisdictionType?: string | null;
  natureOfSuit?: string | null; docketUrl?: string | null;
}
interface PacerOutcome { ok: boolean; reason?: string | null; message?: string | null; cases?: PacerCase[]; truncated?: boolean; }

function PacerBlock({ pacer }: { pacer?: PacerOutcome | null }) {
  if (!pacer) return null;
  const row = "flex items-center gap-2 px-4 py-2.5 border-t bg-slate-50 text-sm font-medium";
  if (!pacer.ok) {
    if (pacer.reason === "NOT_CONFIGURED")
      return <div className={`${row} text-muted-foreground`}><Scale className="h-4 w-4" />PACER Federal Courts — Not configured. Add credentials in <strong>Settings → Integrations</strong>.</div>;
    return <div className={`${row} text-amber-700 bg-amber-50`}><AlertCircle className="h-4 w-4" />PACER — {pacer.reason === "AUTH_FAILED" ? "Credentials rejected" : "Service unreachable"}{pacer.message ? `: ${pacer.message}` : ""}.</div>;
  }
  const cases = pacer.cases ?? [];
  if (!cases.length)
    return <div className={`${row} text-emerald-700 bg-emerald-50`}><Scale className="h-4 w-4" />PACER — No federal cases found.</div>;
  return (
    <div className="border-t">
      <div className={`${row} text-amber-800 bg-amber-50`}><Scale className="h-4 w-4" /><strong>{cases.length}{pacer.truncated ? "+" : ""} federal case{cases.length !== 1 ? "s" : ""} found.</strong> Confirm identity before treating as a match.</div>
      <div className="divide-y">
        {cases.map((c, i) => (
          <div key={i} className="px-4 py-2.5 bg-white text-xs flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate text-amber-900">{c.caseTitle || "(untitled)"}</div>
              <div className="font-mono text-muted-foreground mt-0.5">{c.caseNumberFull ?? "—"}</div>
              <div className="text-muted-foreground mt-0.5">
                {[c.courtId ? `Court: ${c.courtId}` : null, c.jurisdictionType, c.dateFiled ? `Filed: ${c.dateFiled}` : null, c.natureOfSuit ? `Nature: ${c.natureOfSuit}` : null].filter(Boolean).join(" · ")}
              </div>
            </div>
            {c.docketUrl && <a href={c.docketUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-1 text-blue-700 hover:underline font-medium">Docket <ExternalLink className="h-3 w-3" /></a>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tort catalog ─────────────────────────────────────────────────────────────

const TORTS = [
  { id: "mesothelioma",     label: "Mesothelioma / Asbestos",   icon: "🫁", tier: 1, description: "Asbestos-related cancer" },
  { id: "camp_lejeune",     label: "Camp Lejeune",              icon: "🎖️", tier: 1, description: "Military base water contamination" },
  { id: "roundup",          label: "Roundup / Glyphosate",      icon: "🌿", tier: 1, description: "Herbicide-linked cancer" },
  { id: "cpap",             label: "CPAP / Philips Recall",     icon: "😴", tier: 1, description: "Recalled CPAP injuries" },
  { id: "talcum",           label: "Talcum Powder",             icon: "🧴", tier: 1, description: "Ovarian cancer / mesothelioma" },
  { id: "hair_relaxer",     label: "Hair Relaxer",              icon: "💇", tier: 1, description: "Uterine & ovarian cancer" },
  { id: "3m_earplug",       label: "3M Earplugs",               icon: "🎧", tier: 2, description: "Military hearing loss" },
  { id: "paraquat",         label: "Paraquat / Parkinson's",    icon: "🚜", tier: 1, description: "Herbicide-linked Parkinson's" },
  { id: "nec_baby_formula", label: "NEC Baby Formula",          icon: "👶", tier: 1, description: "Premature infant bowel disease" },
  { id: "ozempic",          label: "Ozempic / GLP-1 Drugs",     icon: "💊", tier: 2, description: "GLP-1 drug side effects" },
  { id: "sexual_abuse",     label: "Sexual Abuse / Assault",    icon: "⚖️", tier: 1, description: "Institutional abuse claims" },
  { id: "car_accident",     label: "Auto Accident",             icon: "🚗", tier: 2, description: "Vehicle collision injury" },
  { id: "zantac",           label: "Zantac / Ranitidine",       icon: "💊", tier: 1, description: "Cancer-linked medication" },
  { id: "afff",             label: "AFFF / Firefighting Foam",  icon: "🔥", tier: 1, description: "PFAS chemical exposure" },
  { id: "paragard",         label: "Paragard IUD",              icon: "⚕️", tier: 2, description: "IUD device fracture" },
] as const;
type TortId = typeof TORTS[number]["id"];

const TIER_STYLE: Record<number, string> = {
  1: "bg-green-500/10 text-green-700 border-green-500/20",
  2: "bg-blue-500/10  text-blue-700  border-blue-500/20",
};

const CONTACT_QS = [
  { key: "first_name",    label: "First Name",        type: "text",   required: true,  placeholder: "John" },
  { key: "last_name",     label: "Last Name",         type: "text",   required: true,  placeholder: "Smith" },
  { key: "phone_primary", label: "Best Phone Number", type: "tel",    required: true,  placeholder: "(555) 555-5555" },
  { key: "email",         label: "Email Address",     type: "email",  required: false, placeholder: "john@example.com" },
  { key: "dob",           label: "Date of Birth",     type: "date",   required: false },
  { key: "state",         label: "State",             type: "select", required: true,  options: US_STATES },
] as const;

interface Q {
  key: string; label: string;
  type: "text"|"select"|"radio"|"date"|"tel"|"email"|"textarea"|"number";
  options?: string[]; required?: boolean; placeholder?: string; hint?: string;
}

const QUESTIONS: Record<TortId, Q[][]> = {
  mesothelioma: [
    [
      { key: "diagnosed",      label: "Diagnosed with mesothelioma or asbestos-related cancer?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "diagnosis_type", label: "Diagnosis type", type: "select", options: ["Mesothelioma","Lung Cancer","Asbestosis","Pleural Plaques","Other"], required: true },
      { key: "diagnosis_date", label: "Approximate diagnosis date", type: "date" },
      { key: "still_living",   label: "Is the claimant still living?", type: "radio", options: ["Yes","No – Estate filing"], required: true },
    ],
    [
      { key: "exposure_type",  label: "Primary asbestos exposure source", type: "select", options: ["Occupational","Secondhand / Family Member","Military","Home Renovation","Other"], required: true },
      { key: "industry",       label: "Industry / occupation at time of exposure", type: "text", placeholder: "e.g. Shipyard, Navy, Construction" },
      { key: "exposure_years", label: "Years of exposure", type: "select", options: ["Less than 1 year","1–5 years","5–10 years","10–20 years","20+ years"] },
      { key: "employer",       label: "Employer or company name", type: "text", placeholder: "e.g. Johns Manville, Owens Corning" },
    ],
    [
      { key: "has_pathology",  label: "Pathology / biopsy reports available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor",label: "Treating oncologist / pulmonologist", type: "text", placeholder: "Dr. Name" },
      { key: "prior_claims",   label: "Prior asbestos claim or settlement?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Special circumstances, additional facts…" },
    ],
  ],
  camp_lejeune: [
    [
      { key: "served",        label: "Lived or worked at Camp Lejeune between 1953–1987?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "duration",      label: "Duration at Camp Lejeune", type: "select", options: ["Less than 30 days","30 days to 6 months","6–12 months","1–3 years","3+ years"], required: true, hint: "Must be 30+ days to qualify" },
      { key: "claimant_type", label: "Claimant is a…", type: "radio", options: ["Veteran","Family Member / Dependent","Civilian Worker"], required: true },
    ],
    [
      { key: "condition",      label: "Diagnosed condition linked to exposure", type: "select", required: true, options: ["Bladder Cancer","Breast Cancer","Esophageal Cancer","Kidney Cancer","Leukemia","Lung Cancer","Multiple Myeloma","Non-Hodgkin Lymphoma","Parkinson's Disease","Rectal Cancer","Neurobehavioral Effects","Other"] },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "va_claim",       label: "VA disability claim filed?", type: "radio", options: ["Yes","No","Unknown"] },
    ],
    [
      { key: "dd214",          label: "DD-214 or service records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor",label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  roundup: [
    [
      { key: "used_roundup",   label: "Personally used Roundup or Ranger Pro?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",    label: "Years of use", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"], required: true },
      { key: "diagnosed_nhl",  label: "Diagnosed with Non-Hodgkin Lymphoma or cancer?", type: "radio", options: ["Yes","No"], required: true },
    ],
    [
      { key: "cancer_type",    label: "Cancer type", type: "select", options: ["Non-Hodgkin Lymphoma","DLBCL","Mantle Cell Lymphoma","Follicular Lymphoma","Other"] },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "usage_context",  label: "Where was Roundup used?", type: "select", options: ["Farm / Agricultural","Residential / Home","Golf Course","Public Spaces","Employment"] },
    ],
    [
      { key: "treating_doctor",label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional details", type: "textarea", placeholder: "Any relevant facts…" },
    ],
  ],
  cpap: [
    [
      { key: "used_philips",   label: "Used a Philips CPAP, BiPAP, or ventilator?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "device_model",   label: "Device model (if known)", type: "text", placeholder: "e.g. DreamStation, SystemOne" },
      { key: "use_dates",      label: "Approximate dates of use", type: "text", placeholder: "e.g. 2015–2021" },
    ],
    [
      { key: "injury_type",    label: "Injury or condition experienced", type: "select", options: ["Cancer","Respiratory Issues","Headaches / Dizziness","Liver Damage","Other"], required: true },
      { key: "diagnosis_date", label: "Diagnosis / onset date", type: "date" },
      { key: "recall_notice",  label: "Received a recall notice?", type: "radio", options: ["Yes","No","Unknown"] },
    ],
    [
      { key: "has_device",     label: "Does the claimant still have the device?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor",label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  talcum: [
    [
      { key: "used_talcum",    label: "Used talcum powder products regularly?", type: "radio", options: ["Yes","No"], required: true },
      { key: "brand",          label: "Brand(s) used", type: "select", options: ["Johnson & Johnson Baby Powder","Shower to Shower","Both","Other"] },
      { key: "usage_years",    label: "Years of use", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"] },
    ],
    [
      { key: "diagnosis",      label: "Diagnosis", type: "select", options: ["Ovarian Cancer","Mesothelioma","Fallopian Tube Cancer","Peritoneal Cancer","Other"], required: true },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "gender",         label: "Claimant gender", type: "radio", options: ["Female","Male","Non-binary / Other"] },
    ],
    [
      { key: "treating_doctor",label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "prior_claims",   label: "Prior talcum claims filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  hair_relaxer: [
    [
      { key: "used_relaxer",   label: "Used chemical hair relaxers?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",    label: "Years of use", type: "select", options: ["1–5","5–10","10–20","20+"] },
      { key: "brands",         label: "Brand(s) used", type: "text", placeholder: "e.g. Dark & Lovely, ORS, Just For Me" },
    ],
    [
      { key: "diagnosis",      label: "Diagnosis", type: "select", options: ["Uterine Cancer","Uterine Fibroids","Ovarian Cancer","Endometrial Cancer","Other"], required: true },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "hysterectomy",   label: "Had a hysterectomy?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "treating_doctor",label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  "3m_earplug": [
    [
      { key: "served_military",label: "Served in the U.S. military?", type: "radio", options: ["Yes","No"], required: true },
      { key: "service_dates",  label: "Dates of service", type: "text", placeholder: "e.g. 2003–2015" },
      { key: "used_3m",        label: "3M Combat Arms Earplugs (CAEv2) issued?", type: "radio", options: ["Yes","No","Unknown"], required: true },
    ],
    [
      { key: "hearing_loss",   label: "Does the claimant have hearing loss?", type: "radio", options: ["Yes","No"], required: true },
      { key: "tinnitus",       label: "Does the claimant have tinnitus?", type: "radio", options: ["Yes","No"], required: true },
      { key: "va_rating",      label: "VA disability rating (if any)", type: "select", options: ["None","0–10%","10–30%","30–50%","50–70%","70–100%","Unknown"] },
    ],
    [
      { key: "audiologist",    label: "Seen an audiologist?", type: "radio", options: ["Yes","No"] },
      { key: "prior_claim",    label: "Prior 3M earplug claim filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  paraquat: [
    [
      { key: "exposed",        label: "Exposed to paraquat or paraquat dichloride?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "context",        label: "Exposure context", type: "select", options: ["Farm Worker","Agricultural Worker","Residential Neighbor","Licensed Applicator","Other"] },
      { key: "exposure_years", label: "Years of exposure", type: "select", options: ["Less than 1","1–5","5–10","10+"] },
    ],
    [
      { key: "diagnosed",      label: "Diagnosed with Parkinson's Disease?", type: "radio", options: ["Yes","No"], required: true },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
      { key: "neurologist",    label: "Treating neurologist", type: "text", placeholder: "Dr. Name" },
    ],
    [
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "prior_claims",   label: "Prior claims filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  nec_baby_formula: [
    [
      { key: "premature",      label: "Was the infant born premature (before 37 weeks)?", type: "radio", options: ["Yes","No","Unknown"], required: true },
      { key: "formula_brand",  label: "Formula brand(s) used", type: "select", options: ["Similac (Abbott)","Enfamil (Mead Johnson)","Both","Unknown"], required: true },
      { key: "nec_diagnosis",  label: "Diagnosed with NEC (Necrotizing Enterocolitis)?", type: "radio", options: ["Yes","No"], required: true },
    ],
    [
      { key: "diagnosis_date", label: "NEC diagnosis date / year", type: "date" },
      { key: "outcome",        label: "Outcome", type: "select", options: ["Death","Surgeries required","Ongoing medical issues","Full recovery","Unknown"] },
      { key: "hospital",       label: "Hospital where treated", type: "text", placeholder: "Hospital name and city" },
    ],
    [
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor",label: "Treating neonatologist / surgeon", type: "text", placeholder: "Dr. Name" },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  ozempic: [
    [
      { key: "used_glp1",      label: "Used Ozempic, Wegovy, Mounjaro, or another GLP-1 drug?", type: "radio", options: ["Yes","No"], required: true },
      { key: "drug_name",      label: "Which drug(s)?", type: "select", options: ["Ozempic (semaglutide)","Wegovy (semaglutide)","Mounjaro (tirzepatide)","Trulicity (dulaglutide)","Other / Multiple"] },
      { key: "use_duration",   label: "How long used?", type: "select", options: ["Less than 3 months","3–6 months","6–12 months","1–2 years","2+ years"] },
    ],
    [
      { key: "injury_type",    label: "Injury or condition", type: "select", options: ["Gastroparesis","Ileus","Bowel Obstruction","Pancreatitis","Aspiration Pneumonia","Other"], required: true },
      { key: "diagnosis_date", label: "Injury / diagnosis date", type: "date" },
      { key: "hospitalized",   label: "Was the claimant hospitalized?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "treating_doctor",label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  sexual_abuse: [
    [
      { key: "institution",    label: "Institution / perpetrator context", type: "select", required: true, options: ["Catholic Diocese / Church","Boy Scouts","School / University","Juvenile Detention","Foster Care","Military","Employer","Other"] },
      { key: "abuse_period",   label: "Approximate period when abuse occurred", type: "text", placeholder: "e.g. 1985–1992" },
      { key: "state_of_abuse", label: "State where abuse occurred", type: "select", options: US_STATES },
    ],
    [
      { key: "perpetrator_id", label: "Perpetrator identified by name?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "age_at_abuse",   label: "Claimant's approximate age at time of abuse", type: "select", options: ["Under 12","12–17","18–25","Over 25"] },
      { key: "reported_police",label: "Reported to law enforcement?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "therapy",        label: "Receiving therapy / mental health treatment?", type: "radio", options: ["Yes","No"] },
      { key: "prior_action",   label: "Prior civil or criminal action?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes (handle with care)", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  car_accident: [
    [
      { key: "accident_date",  label: "Date of accident", type: "date", required: true },
      { key: "state",          label: "State where accident occurred", type: "select", options: US_STATES, required: true },
      { key: "claimant_role",  label: "Claimant was a…", type: "radio", options: ["Driver","Passenger","Pedestrian","Cyclist","Other"], required: true },
    ],
    [
      { key: "injury_type",    label: "Primary injury", type: "select", options: ["TBI / Head Injury","Spinal Injury","Broken Bones","Soft Tissue","Internal Injuries","Death","Multiple / Other"], required: true },
      { key: "hospitalized",   label: "Hospitalized?", type: "radio", options: ["Yes","No"] },
      { key: "fault",          label: "Who was at fault?", type: "select", options: ["Other driver","Commercial vehicle / Trucking","Government vehicle","Rideshare","Unknown"] },
    ],
    [
      { key: "police_report",  label: "Police report filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "insurance_claim",label: "Insurance claim already filed?", type: "radio", options: ["Yes","No"] },
      { key: "notes",          label: "Additional details", type: "textarea", placeholder: "Any relevant facts…" },
    ],
  ],
  zantac: [
    [
      { key: "used_zantac",    label: "Used Zantac (ranitidine) regularly?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",    label: "Years of use", type: "select", options: ["Less than 1","1–3","3–5","5–10","10+"] },
      { key: "rx_or_otc",      label: "Prescription or OTC?", type: "radio", options: ["Prescription","Over-the-Counter","Both","Unknown"] },
    ],
    [
      { key: "cancer_type",    label: "Cancer diagnosed", type: "select", required: true, options: ["Bladder Cancer","Breast Cancer","Colorectal Cancer","Esophageal Cancer","Kidney Cancer","Liver Cancer","Lung Cancer","Ovarian Cancer","Pancreatic Cancer","Prostate Cancer","Stomach Cancer","Other"] },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
    ],
    [
      { key: "treating_doctor",label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical / pharmacy records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  afff: [
    [
      { key: "exposed",        label: "Exposed to AFFF (firefighting foam)?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "context",        label: "Context of exposure", type: "select", options: ["Military Base","Airport","Civilian Firefighter","Industrial Site","Drinking Water","Other"] },
      { key: "exposure_years", label: "Years of exposure", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"] },
    ],
    [
      { key: "condition",      label: "Cancer or condition diagnosed", type: "select", required: true, options: ["Kidney Cancer","Testicular Cancer","Bladder Cancer","Thyroid Disease","Ulcerative Colitis","Liver Cancer","Breast Cancer","Other"] },
      { key: "diagnosis_date", label: "Diagnosis date", type: "date" },
    ],
    [
      { key: "treating_doctor",label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  paragard: [
    [
      { key: "used_paragard",  label: "Used the Paragard IUD?", type: "radio", options: ["Yes","No"], required: true },
      { key: "insertion_date", label: "Approximate insertion date", type: "date" },
      { key: "removal_date",   label: "Approximate removal date", type: "date" },
    ],
    [
      { key: "fracture",       label: "Did the device break during removal?", type: "radio", options: ["Yes","No","Unknown"], required: true },
      { key: "injury",         label: "Injuries sustained", type: "select", options: ["Broken device fragment remaining","Perforation of uterus","Pelvic inflammatory disease","Infertility","Hysterectomy required","Other"] },
    ],
    [
      { key: "treating_doctor",label: "OB/GYN or treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",    label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",          label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
};

const TIER_TITLES = ["Eligibility Screening","Exposure & Injury Details","Documentation & Notes"];
const TIER_ICONS  = [Scale, Stethoscope, FileText];
type WizStep = "select_tort"|"contact"|"questions"|"done";

// ─── Form Builder helpers ─────────────────────────────────────────────────────

const FIELD_TYPES: CustomField["type"][] = ["text","email","tel","date","number","select","textarea","checkbox"];

function FormPreviewDialog({ config }: { config: FormConfig }) {
  const [open, setOpen] = useState(false);
  const [reload, setReload] = useState(0);
  const base = (import.meta.env.VITE_API_URL as string | undefined) || `${window.location.origin}/api`;
  const src  = `${base.replace(/\/$/, "")}/forms-public/preview/${config.id}?k=${reload}`;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1"><Play className="h-3.5 w-3.5 mr-1.5" />Preview</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[680px] h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 shrink-0 flex-row items-center justify-between space-y-0">
          <div><DialogTitle>Live Preview: {config.label}</DialogTitle><DialogDescription>Submissions made here are not saved.</DialogDescription></div>
          <Button size="sm" variant="ghost" onClick={() => setReload(k => k + 1)}><RefreshCw className="h-4 w-4 mr-1" />Reload</Button>
        </DialogHeader>
        <div className="flex-1 p-6 pt-0 min-h-0">
          {open && <iframe key={reload} src={src} title={`Preview: ${config.label}`} className="w-full h-full border rounded-md bg-white" sandbox="allow-forms allow-scripts" referrerPolicy="no-referrer" />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormEditDialog({ config }: { config: FormConfig }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [diagnoses, setDiagnoses] = useState<string[]>(config.valid_diagnoses || []);
  const [diagInput, setDiagInput] = useState("");
  const [introText, setIntroText] = useState(config.intro_text || "");
  const [active, setActive] = useState(config.active !== false);
  const [settleLow, setSettleLow]   = useState(config.avg_settlement_low?.toString()  ?? "");
  const [settleHigh, setSettleHigh] = useState(config.avg_settlement_high?.toString() ?? "");
  const [mdlStatus, setMdlStatus]   = useState(config.mdl_status ?? "");
  const [solMonths, setSolMonths]   = useState(config.sol_months?.toString() ?? "");
  const [customFields, setCustomFields] = useState<CustomField[]>(config.custom_fields || []);
  const [newField, setNewField] = useState<CustomField>({ key: "", label: "", type: "text", required: false });

  const updateConfig = useUpdateFormConfig();
  const addField     = useAddCustomField();
  const removeField  = useRemoveCustomField();
  const invalidate   = () => qc.invalidateQueries({ queryKey: getGetFormConfigsQueryKey() });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full"><Pencil className="h-3.5 w-3.5 mr-1.5" />Edit Campaign Settings</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px] max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit: {config.label}</DialogTitle>
          <DialogDescription>Update intake form settings, valid diagnoses, deal economics, and custom fields.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Active toggle */}
          <div className="flex items-center justify-between rounded-md border p-3">
            <div><Label>Active</Label><p className="text-xs text-muted-foreground">Inactive campaigns return 404 on embed.</p></div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          {/* Intro text */}
          <div className="space-y-2">
            <Label>Form Intro Text</Label>
            <Textarea value={introText} onChange={e => setIntroText(e.target.value)} placeholder="Optional intro shown at top of embedded form." rows={2} />
          </div>

          {/* Deal economics */}
          <div className="rounded-md border p-3 space-y-3 bg-muted/10">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deal Economics (feeds Case Value Analyzer)</div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Avg Settlement Low ($)</Label><Input type="number" value={settleLow} onChange={e => setSettleLow(e.target.value)} placeholder="e.g. 50000" /></div>
              <div><Label>Avg Settlement High ($)</Label><Input type="number" value={settleHigh} onChange={e => setSettleHigh(e.target.value)} placeholder="e.g. 250000" /></div>
              <div>
                <Label>MDL Status</Label>
                <Select value={mdlStatus || "_none"} onValueChange={v => setMdlStatus(v === "_none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Unset —</SelectItem>
                    <SelectItem value="pre_mdl">Pre-MDL</SelectItem>
                    <SelectItem value="active_bellwether">Active bellwether</SelectItem>
                    <SelectItem value="settling">Settling</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Statute of Limitations (months)</Label><Input type="number" value={solMonths} onChange={e => setSolMonths(e.target.value)} placeholder="e.g. 24" /></div>
            </div>
            <p className="text-xs text-muted-foreground">Used by the Lead Quality Predictor and Case Value Analyzer.</p>
          </div>

          {/* Diagnosis whitelist */}
          <div className="space-y-2">
            <Label>Accepted Diagnoses (Intake Qualification Filter)</Label>
            <p className="text-xs text-muted-foreground">Only leads matching these diagnoses will be auto-qualified. Leave empty to accept all.</p>
            <div className="flex gap-2">
              <Input value={diagInput} onChange={e => setDiagInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = diagInput.trim().toLowerCase(); if (v && !diagnoses.includes(v)) { setDiagnoses([...diagnoses, v]); setDiagInput(""); } }}} placeholder="e.g. non-hodgkin lymphoma" />
              <Button type="button" variant="outline" onClick={() => { const v = diagInput.trim().toLowerCase(); if (v && !diagnoses.includes(v)) { setDiagnoses([...diagnoses, v]); setDiagInput(""); } }}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {diagnoses.map(d => (
                <Badge key={d} variant="secondary" className="gap-1.5">{d}
                  <button type="button" onClick={() => setDiagnoses(diagnoses.filter(x => x !== d))} className="hover:text-red-500"><XCircle className="h-3 w-3" /></button>
                </Badge>
              ))}
              {!diagnoses.length && <span className="text-xs text-muted-foreground">No diagnoses configured — all accepted.</span>}
            </div>
          </div>

          {/* Custom fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between"><Label>Custom Fields</Label><Badge variant="outline">{customFields.length} field(s)</Badge></div>
            <div className="space-y-2">
              {customFields.map(f => (
                <div key={f.key} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div><div className="font-medium">{f.label} {f.required && <span className="text-red-500">*</span>}</div><div className="text-xs text-muted-foreground font-mono">{f.key} · {f.type}{f.options ? ` (${f.options.length} opts)` : ""}</div></div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => removeField.mutate({ tortId: config.id, key: f.key }, { onSuccess: d => { invalidate(); const s = (d as any)?.custom_fields; if (s) setCustomFields(s); else setCustomFields(p => p.filter(x => x.key !== f.key)); toast({ title: "Field removed" }); } })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </div>
              ))}
              {!customFields.length && <p className="text-xs text-muted-foreground">No custom fields yet.</p>}
            </div>
            <div className="rounded-md border bg-muted/20 p-3 space-y-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Custom Field</div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Key (snake_case)" value={newField.key} onChange={e => setNewField({ ...newField, key: e.target.value })} />
                <Input placeholder="Label" value={newField.label} onChange={e => setNewField({ ...newField, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={newField.type} onValueChange={v => setNewField({ ...newField, type: v as CustomField["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FIELD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center justify-between rounded-md border bg-background px-3"><Label className="text-sm">Required</Label><Switch checked={newField.required} onCheckedChange={c => setNewField({ ...newField, required: c })} /></div>
              </div>
              <Input placeholder="Placeholder text (optional)" value={newField.placeholder || ""} onChange={e => setNewField({ ...newField, placeholder: e.target.value })} />
              {newField.type === "select" && <Input placeholder="Options comma-separated (e.g. Yes,No,Maybe)" value={(newField.options || []).join(",")} onChange={e => setNewField({ ...newField, options: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} />}
              <Button type="button" onClick={() => {
                const key = newField.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
                if (!key || !newField.label.trim()) { toast({ title: "Key and label are required", variant: "destructive" }); return; }
                if (customFields.some(f => f.key === key)) { toast({ title: `Key "${key}" already exists`, variant: "destructive" }); return; }
                const field: CustomField = { ...newField, key, options: newField.type === "select" ? (newField.options?.length ? newField.options : ["Option 1"]) : undefined };
                addField.mutate({ tortId: config.id, data: field }, { onSuccess: d => { invalidate(); const s = (d as any)?.custom_fields; if (s) setCustomFields(s); else setCustomFields(p => [...p, field]); setNewField({ key: "", label: "", type: "text", required: false }); toast({ title: "Field added", description: field.label }); } });
              }} disabled={addField.isPending}><Plus className="h-4 w-4 mr-2" />Add Field</Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={() => updateConfig.mutate({ tortId: config.id, data: { valid_diagnoses: diagnoses, intro_text: introText || null, active, avg_settlement_low: settleLow === "" ? null : Number(settleLow), avg_settlement_high: settleHigh === "" ? null : Number(settleHigh), mdl_status: mdlStatus || null, sol_months: solMonths === "" ? null : Number(solMonths) } }, { onSuccess: () => { invalidate(); toast({ title: "Saved", description: `${config.label} updated.` }); }, onError: (e: Error) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }) })} disabled={updateConfig.isPending}>{updateConfig.isPending ? "Saving…" : "Save Changes"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function IntakeForms() {
  const { toast } = useToast();

  // ── Wizard state ─────────────────────────────────────────────────────────────
  const [wizStep, setWizStep]       = useState<WizStep>("select_tort");
  const [selectedTort, setSelectedTort] = useState<TortId | null>(null);
  const [qTier, setQTier]           = useState(0);
  const [contact, setContact]       = useState<Record<string, string>>({});
  const [answers, setAnswers]       = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId]   = useState<string | null>(null);

  // ── Verification state ───────────────────────────────────────────────────────
  const [emailInput, setEmailInput]     = useState("");
  const [emailResult, setEmailResult]   = useState<any>(null);
  const [addrInput, setAddrInput]       = useState({ street_address: "", city: "", state: "", zip: "" });
  const [addrResult, setAddrResult]     = useState<any>(null);

  // ── Background check state ───────────────────────────────────────────────────
  const [bgInput, setBgInput]           = useState({ first_name: "", last_name: "", state: "", date_of_birth: "" });
  const [bgResult, setBgResult]         = useState<any>(null);
  const [leadIdInput, setLeadIdInput]   = useState("");
  const [leadBgResult, setLeadBgResult] = useState<any>(null);

  // ── Form Builder state ───────────────────────────────────────────────────────
  const { data: formConfigsData, isLoading: isLoadingConfigs } = useGetFormConfigs();
  const configs = formConfigsData?.tort_campaigns || [];

  // ── Mutations ────────────────────────────────────────────────────────────────
  const validateEmail   = useValidateEmail();
  const validateAddress = useValidateAddress();
  const runBgCheck      = useRunBackgroundCheck();
  const runLeadBgCheck  = useRunLeadBackgroundCheck();

  // ── Wizard helpers ────────────────────────────────────────────────────────────
  const tort    = TORTS.find(t => t.id === selectedTort);
  const qSecs   = selectedTort ? QUESTIONS[selectedTort] : [];
  const totalQ  = qSecs.length;

  const totalSteps = 1 + 1 + totalQ + 1;
  const curStep =
    wizStep === "select_tort" ? 1 :
    wizStep === "contact"     ? 2 :
    wizStep === "questions"   ? 3 + qTier : totalSteps;
  const progress = Math.round((curStep / (totalSteps - 1)) * 100);

  function setC(k: string, v: string) { setContact(p => ({ ...p, [k]: v })); }
  function setA(k: string, v: string) { setAnswers(p  => ({ ...p, [k]: v })); }

  function goBack() {
    if (wizStep === "contact") setWizStep("select_tort");
    else if (wizStep === "questions" && qTier === 0) setWizStep("contact");
    else if (wizStep === "questions") setQTier(t => t - 1);
  }

  async function advanceOrSubmit() {
    if (wizStep !== "questions") return;
    if (qTier < totalQ - 1) { setQTier(t => t + 1); return; }
    setSubmitting(true);
    try {
      const res = await apiFetchRaw("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: contact.first_name || "", last_name: contact.last_name || "", phone_primary: contact.phone_primary || "", email: contact.email || undefined, dob: contact.dob || undefined, state: contact.state || undefined, tort_type: selectedTort || "", status: "new", intake_answers: answers, source: "intake_form" }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json().catch(() => ({}));
      setCreatedId(data?.id ?? null);
      setWizStep("done");
    } catch {
      toast({ title: "Submission failed", description: "Could not create lead — please try again.", variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  function resetWizard() {
    setWizStep("select_tort"); setSelectedTort(null); setQTier(0); setContact({}); setAnswers({}); setCreatedId(null);
  }

  // ── Embed kit download ────────────────────────────────────────────────────────
  function handleDownloadEmbedKit() {
    const origin = window.location.origin;
    const date   = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const sections = configs.map((c: FormConfig) => {
      const embed = `<script src="${origin}/api/forms-public/embed/${c.id}"></script>\n<div id="mtos-form"></div>`;
      return { config: c, embed };
    });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Abby CRM Embed Kit</title></head><body><h1>Abby CRM Intake Form Embed Kit</h1><p>Generated ${date} · ${origin} · ${sections.length} form(s)</p>${sections.map(s => `<h2>${s.config.label}</h2><pre>${s.embed.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`).join("")}</body></html>`;
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([html], { type: "text/html" })); a.download = "abby-intake-embed-kit.html"; a.click();
    toast({ title: "Embed kit downloaded", description: `${configs.length} form(s) included.` });
  }

  function handleCopyEmbed(id: string) {
    navigator.clipboard.writeText(`<script src="${window.location.origin}/api/forms-public/embed/${id}"></script>\n<div id="mtos-form"></div>`);
    toast({ title: "Embed code copied" });
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" /> Intake Forms
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run claimant intake, verify contact details, check public records, and manage your intake form campaigns.
        </p>
      </div>

      {/* Trust strip */}
      <div className="flex flex-wrap gap-2">
        {[
          { icon: ShieldCheck, label: "HIPAA Safe",            cls: "border-green-500/30  bg-green-500/8  text-green-700"  },
          { icon: Lock,        label: "End-to-End Encrypted",  cls: "border-blue-500/30   bg-blue-500/8   text-blue-700"   },
          { icon: FileCheck2,  label: "TCPA Compliant",        cls: "border-purple-500/30 bg-purple-500/8 text-purple-700" },
          { icon: Shield,      label: "TrustedForm Certified", cls: "border-amber-500/30  bg-amber-500/8  text-amber-700"  },
          { icon: UserCheck2,  label: "Claimant Qualification Engine", cls: "border-slate-400/30 bg-slate-500/8 text-slate-600" },
        ].map(({ icon: Icon, label, cls }) => (
          <div key={label} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <Tabs defaultValue="intake" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="intake"   className="flex items-center gap-1.5"><ClipboardCheck className="h-3.5 w-3.5" />Run Intake</TabsTrigger>
          <TabsTrigger value="verify"   className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" />Verify Claimant</TabsTrigger>
          <TabsTrigger value="records"  className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" />Public Records</TabsTrigger>
          <TabsTrigger value="builder"  className="flex items-center gap-1.5"><Wrench className="h-3.5 w-3.5" />Form Builder</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Run Intake ─────────────────────────────────────────────── */}
        <TabsContent value="intake" className="mt-6">
          {/* DONE */}
          {wizStep === "done" && (
            <div className="max-w-lg mx-auto py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto"><CheckCircle2 className="h-8 w-8 text-green-600" /></div>
              <div>
                <h2 className="text-2xl font-bold">Intake Complete</h2>
                <p className="text-muted-foreground mt-2">Lead added. Abby will run eligibility scoring and enrichment automatically.</p>
                {createdId && <p className="mt-3 text-xs font-mono bg-muted rounded-md px-3 py-2 inline-block">Lead ID: {createdId}</p>}
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={resetWizard}>Start New Intake</Button>
                <Button asChild><a href="/leads">View All Leads <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></a></Button>
              </div>
            </div>
          )}

          {/* SELECT TORT */}
          {wizStep === "select_tort" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Select a tort type to begin the guided intake screening.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {TORTS.map(t => (
                  <button key={t.id} onClick={() => { setSelectedTort(t.id); setWizStep("contact"); }}
                    className={cn("text-left p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md hover:bg-accent/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50")}>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">{t.icon}</span>
                      <Badge variant="outline" className={cn("text-[10px] font-semibold", TIER_STYLE[t.tier])}>Tier {t.tier}</Badge>
                    </div>
                    <div className="mt-2 font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CONTACT + QUESTIONS */}
          {(wizStep === "contact" || wizStep === "questions") && (
            <div className="max-w-2xl space-y-6">
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <button onClick={goBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm">
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  {tort && <div className="flex items-center gap-2"><span className="text-lg">{tort.icon}</span><span className="font-semibold text-sm">{tort.label}</span><Badge variant="outline" className={cn("text-[10px]", TIER_STYLE[tort.tier])}>Tier {tort.tier}</Badge></div>}
                </div>
                <Progress value={progress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Step {curStep} of {totalSteps - 1} — {progress}% complete</p>
              </div>

              {/* Contact step */}
              {wizStep === "contact" && (
                <>
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-4 w-4 text-primary" />Claimant Contact Information</CardTitle><CardDescription>Basic contact details — tort-specific questions come next.</CardDescription></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CONTACT_QS.map(q => (
                          <div key={q.key} className="space-y-1.5">
                            <Label htmlFor={q.key} className="flex items-center gap-1">{q.label} {q.required && <span className="text-destructive text-xs">*</span>}</Label>
                            {q.type === "select"
                              ? <Select value={contact[q.key] || ""} onValueChange={v => setC(q.key, v)}><SelectTrigger id={q.key}><SelectValue placeholder="Select state…" /></SelectTrigger><SelectContent>{q.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>
                              : <Input id={q.key} type={q.type} placeholder={"placeholder" in q ? q.placeholder : undefined} value={contact[q.key] || ""} onChange={e => setC(q.key, e.target.value)} />}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <div className="flex justify-end">
                    <Button onClick={() => { setWizStep("questions"); setQTier(0); }} disabled={!contact.first_name || !contact.last_name || !contact.phone_primary || !contact.state}>
                      Continue to Screening <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {/* Question tiers */}
              {wizStep === "questions" && (() => {
                const TierIcon = TIER_ICONS[qTier] ?? ClipboardCheck;
                const qs = qSecs[qTier] ?? [];
                const isLast = qTier === totalQ - 1;
                return (
                  <>
                    <Card>
                      <CardHeader><CardTitle className="flex items-center gap-2"><TierIcon className="h-4 w-4 text-primary" />{TIER_TITLES[qTier] ?? `Part ${qTier + 1}`}</CardTitle><CardDescription>{qTier === 0 ? "Determines basic eligibility." : qTier === 1 ? "Exposure details and resulting injuries." : "Documentation and additional notes."}</CardDescription></CardHeader>
                      <CardContent className="space-y-5">
                        {qs.map(q => (
                          <div key={q.key} className="space-y-1.5">
                            <Label htmlFor={q.key} className="flex items-center gap-1 leading-snug">{q.label} {q.required && <span className="text-destructive text-xs ml-0.5">*</span>}</Label>
                            {q.hint && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{q.hint}</p>}
                            {q.type === "radio" && q.options && <RadioGroup value={answers[q.key] || ""} onValueChange={v => setA(q.key, v)} className="flex flex-wrap gap-x-6 gap-y-2 pt-1">{q.options.map(opt => <div key={opt} className="flex items-center gap-2"><RadioGroupItem value={opt} id={`${q.key}-${opt}`} /><Label htmlFor={`${q.key}-${opt}`} className="font-normal cursor-pointer">{opt}</Label></div>)}</RadioGroup>}
                            {q.type === "select" && q.options && <Select value={answers[q.key] || ""} onValueChange={v => setA(q.key, v)}><SelectTrigger id={q.key}><SelectValue placeholder="Select…" /></SelectTrigger><SelectContent>{q.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>}
                            {q.type === "textarea" && <Textarea id={q.key} placeholder={q.placeholder} value={answers[q.key] || ""} onChange={e => setA(q.key, e.target.value)} rows={3} />}
                            {(q.type === "text" || q.type === "date" || q.type === "tel" || q.type === "email" || q.type === "number") && <Input id={q.key} type={q.type} placeholder={q.placeholder} value={answers[q.key] || ""} onChange={e => setA(q.key, e.target.value)} />}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">{isLast ? "Last section — submit when ready." : `${totalQ - qTier - 1} section(s) remaining`}</p>
                      <Button onClick={advanceOrSubmit} disabled={submitting}>
                        {submitting ? <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 animate-spin" />Saving…</span>
                          : isLast ? <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" />Submit Intake</span>
                          : <span className="flex items-center gap-2">Next <ChevronRight className="h-4 w-4" /></span>}
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: Verify Claimant ────────────────────────────────────────── */}
        <TabsContent value="verify" className="mt-6 space-y-6">
          <p className="text-sm text-muted-foreground">Verify a claimant's email address and home address before accepting their case.</p>
          <div className="grid gap-6 md:grid-cols-2">

            {/* Email verifier */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md text-primary"><Mail className="h-5 w-5" /></div>
                  <div><CardTitle className="text-lg">Email Verifier</CardTitle><CardDescription>Real-time inbox detection + typo suggestion</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Enter email address…" type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !validateEmail.isPending && validateEmail.mutate({ data: { email: emailInput } }, { onSuccess: setEmailResult, onError: () => toast({ title: "Error", description: "Failed to validate email", variant: "destructive" }) })} />
                  <Button onClick={() => validateEmail.mutate({ data: { email: emailInput } }, { onSuccess: setEmailResult, onError: () => toast({ title: "Error", description: "Failed to validate email", variant: "destructive" }) })} disabled={validateEmail.isPending || !emailInput}>{validateEmail.isPending ? "Checking…" : "Verify"}</Button>
                </div>
                {emailResult && (
                  <div className="rounded-md border p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-muted-foreground w-16">Status:</span>
                      {emailResult.valid
                        ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Valid</Badge>
                        : <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>}
                    </div>
                    {!emailResult.valid && emailResult.errors?.length > 0 && <ul className="text-sm text-red-500/80 bg-red-500/10 p-3 rounded-md list-disc list-inside">{emailResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>}
                    {emailResult.suggestion && <div className="flex items-start gap-2 bg-blue-500/10 text-blue-600 p-3 rounded-md text-sm"><Info className="h-4 w-4 mt-0.5 shrink-0" /><span><strong>Did you mean?</strong> {emailResult.suggestion}</span></div>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Address verifier */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md text-primary"><MapPin className="h-5 w-5" /></div>
                  <div><CardTitle className="text-lg">Address Verifier</CardTitle><CardDescription>USPS CASS certification — confirms deliverability</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label className="text-xs">Street Address</Label><Input placeholder="123 Main St" value={addrInput.street_address} onChange={e => setAddrInput({ ...addrInput, street_address: e.target.value })} /></div>
                  <div className="grid grid-cols-6 gap-3">
                    <div className="col-span-3 space-y-1.5"><Label className="text-xs">City</Label><Input placeholder="City" value={addrInput.city} onChange={e => setAddrInput({ ...addrInput, city: e.target.value })} /></div>
                    <div className="col-span-1 space-y-1.5"><Label className="text-xs">State</Label><StateCombobox value={addrInput.state} onChange={v => setAddrInput({ ...addrInput, state: v })} placeholder="ST" triggerClassName="px-2" /></div>
                    <div className="col-span-2 space-y-1.5"><Label className="text-xs">ZIP</Label><Input placeholder="12345" value={addrInput.zip} onChange={e => setAddrInput({ ...addrInput, zip: e.target.value })} /></div>
                  </div>
                  <Button className="w-full" onClick={() => { if (!addrInput.street_address || !addrInput.city || !addrInput.state || !addrInput.zip) { toast({ title: "All address fields required", variant: "destructive" }); return; } validateAddress.mutate({ data: addrInput }, { onSuccess: setAddrResult, onError: () => toast({ title: "Error", description: "Failed to validate address", variant: "destructive" }) }); }} disabled={validateAddress.isPending}>{validateAddress.isPending ? "Validating…" : "Verify Address"}</Button>
                </div>
                {addrResult && (
                  <div className="rounded-md border p-4 bg-muted/20 space-y-3">
                    <div className="flex items-center gap-2"><span className="text-sm font-medium text-muted-foreground w-16">Status:</span>
                      {addrResult.valid
                        ? <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle2 className="h-3 w-3 mr-1" />Valid</Badge>
                        : <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Invalid</Badge>}
                    </div>
                    {!addrResult.valid && addrResult.errors?.length > 0 && <ul className="text-sm text-red-500/80 bg-red-500/10 p-3 rounded-md list-disc list-inside">{addrResult.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}</ul>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 3: Public Records Check ───────────────────────────────────── */}
        <TabsContent value="records" className="mt-6 space-y-6">
          <p className="text-sm text-muted-foreground">Search criminal, civil, and PACER federal court records to screen a claimant before accepting their case.</p>
          <div className="grid gap-6 md:grid-cols-2">

            {/* Manual background check */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md text-primary"><Shield className="h-5 w-5" /></div>
                  <div><CardTitle className="text-lg">Public Records Search</CardTitle><CardDescription>Search by name + state — includes PACER federal courts</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>First Name</Label><Input placeholder="First Name" value={bgInput.first_name} onChange={e => setBgInput({ ...bgInput, first_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>Last Name</Label><Input placeholder="Last Name" value={bgInput.last_name} onChange={e => setBgInput({ ...bgInput, last_name: e.target.value })} /></div>
                  <div className="space-y-1.5"><Label>State (Optional)</Label>
                    <Select value={bgInput.state || "none"} onValueChange={v => setBgInput({ ...bgInput, state: v === "none" ? "" : v })}>
                      <SelectTrigger><SelectValue placeholder="Any State" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">Any State</SelectItem>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Date of Birth (Optional)</Label><Input type="date" value={bgInput.date_of_birth} onChange={e => setBgInput({ ...bgInput, date_of_birth: e.target.value })} /></div>
                </div>
                <Button className="w-full" onClick={() => { if (!bgInput.first_name || !bgInput.last_name) { toast({ title: "First and last name required", variant: "destructive" }); return; } runBgCheck.mutate({ data: bgInput }, { onSuccess: setBgResult, onError: () => toast({ title: "Error", description: "Failed to run search", variant: "destructive" }) }); }} disabled={runBgCheck.isPending}>{runBgCheck.isPending ? "Searching…" : "Run Public Records Search"}</Button>
                {bgResult && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <div className="bg-muted/40 p-4 border-b space-y-3">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="font-medium text-sm">Result:</span><StatusBadge status={bgResult.status} /></div><span className="text-xs text-muted-foreground font-mono">Source: {bgResult.source} · {new Date(bgResult.checked_at).toLocaleDateString()}</span></div>
                      <p className="text-sm bg-background p-3 rounded border text-muted-foreground">{bgResult.summary}</p>
                      <div className="flex flex-wrap gap-2"><SearchScopeBadge result={bgResult} /></div>
                      {bgResult.notes?.length > 0 && <ul className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">{bgResult.notes.map((n: string, i: number) => <li key={i} className="flex gap-1.5"><Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />{n}</li>)}</ul>}
                    </div>
                    {bgResult.records?.length > 0 && (
                      <Table>
                        <TableHeader><TableRow className="bg-muted/20 hover:bg-muted/20"><TableHead>Type</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead>Jurisdiction</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
                        <TableBody>{bgResult.records.map((r: any, i: number) => <TableRow key={i}><TableCell className="text-xs font-medium">{r.type}</TableCell><TableCell className="text-xs">{r.description}</TableCell><TableCell className="text-xs">{r.date || "N/A"}</TableCell><TableCell className="text-xs">{r.jurisdiction || "N/A"}</TableCell><TableCell><SeverityBadge severity={r.severity} /></TableCell></TableRow>)}</TableBody>
                      </Table>
                    )}
                    <PacerBlock pacer={bgResult.pacer} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Existing lead check */}
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-md text-primary"><Search className="h-5 w-5" /></div>
                  <div><CardTitle className="text-lg">Screen an Existing Lead</CardTitle><CardDescription>Run a public records check using a Lead ID already in the system</CardDescription></div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input placeholder="Lead ID (e.g. 1234)" value={leadIdInput} onChange={e => setLeadIdInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !runLeadBgCheck.isPending && runLeadBgCheck.mutate({ id: Number(leadIdInput) }, { onSuccess: setLeadBgResult, onError: () => toast({ title: "Error", description: "Failed to screen lead", variant: "destructive" }) })} />
                  <Button onClick={() => { if (!leadIdInput || isNaN(Number(leadIdInput))) { toast({ title: "Valid Lead ID required", variant: "destructive" }); return; } runLeadBgCheck.mutate({ id: Number(leadIdInput) }, { onSuccess: setLeadBgResult, onError: () => toast({ title: "Error", description: "Failed to screen lead", variant: "destructive" }) }); }} disabled={runLeadBgCheck.isPending}>{runLeadBgCheck.isPending ? "Checking…" : "Screen Lead"}</Button>
                </div>
                {leadBgResult && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/40 p-4 border-b space-y-3">
                      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="font-medium text-sm">Result:</span><StatusBadge status={leadBgResult.status} /></div><span className="text-xs text-muted-foreground font-mono">{new Date(leadBgResult.checked_at).toLocaleDateString()}</span></div>
                      <p className="text-sm bg-background p-3 rounded border text-muted-foreground">{leadBgResult.summary}</p>
                      <SearchScopeBadge result={leadBgResult} />
                      {leadBgResult.notes?.length > 0 && <ul className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">{leadBgResult.notes.map((n: string, i: number) => <li key={i} className="flex gap-1.5"><Info className="h-3.5 w-3.5 shrink-0" />{n}</li>)}</ul>}
                    </div>
                    {leadBgResult.records?.length > 0 && (
                      <ScrollArea className="h-[200px]">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background z-10"><TableRow className="bg-muted/20 hover:bg-muted/20"><TableHead>Type</TableHead><TableHead>Severity</TableHead></TableRow></TableHeader>
                          <TableBody>{leadBgResult.records.map((r: any, i: number) => <TableRow key={i}><TableCell><div className="font-medium text-xs">{r.type}</div><div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{r.description}</div></TableCell><TableCell><SeverityBadge severity={r.severity} /></TableCell></TableRow>)}</TableBody>
                        </Table>
                      </ScrollArea>
                    )}
                    <PacerBlock pacer={leadBgResult.pacer} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 4: Form Builder ────────────────────────────────────────────── */}
        <TabsContent value="builder" className="mt-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><p className="text-sm text-muted-foreground">{configs.length > 0 ? `${configs.length} intake form campaign${configs.length !== 1 ? "s" : ""} configured` : "No campaigns configured yet"}</p></div>
            {configs.length > 0 && <Button variant="outline" onClick={handleDownloadEmbedKit} className="gap-2"><Download className="h-4 w-4" />Download All Embed Codes</Button>}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoadingConfigs
              ? Array.from({ length: 6 }).map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></CardContent></Card>)
              : configs.length === 0
              ? <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed"><p>No campaign configurations found. Contact your administrator to set up intake form campaigns.</p></div>
              : configs.map((config: FormConfig) => (
                  <Card key={config.id} className="flex flex-col border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between"><CardTitle className="text-xl">{config.label}</CardTitle></div>
                      <CardDescription><Badge variant="secondary" className="font-mono text-xs">{config.id}</Badge></CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4">
                      {config.fields?.length > 0 && <div className="space-y-2"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Fields</Label><div className="flex flex-wrap gap-1">{config.fields.map((f: string) => <Badge key={f} variant="outline" className="bg-muted/50 text-xs font-normal">{f}</Badge>)}</div></div>}
                      {config.rules?.length > 0 && <div className="space-y-2"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qualification Rules</Label><ul className="text-sm space-y-1 text-muted-foreground">{config.rules.map((rule: string, idx: number) => <li key={idx} className="flex items-start gap-2"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-primary/60 shrink-0" /><span className="leading-tight">{rule}</span></li>)}</ul></div>}
                      {config.custom_fields?.length > 0 && <div className="space-y-2"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</Label><div className="flex flex-wrap gap-1">{config.custom_fields.map((cf: CustomField) => <Badge key={cf.key} variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/30 text-xs font-normal">{cf.label}{cf.required ? "*" : ""}</Badge>)}</div></div>}
                    </CardContent>
                    <CardFooter className="bg-muted/20 border-t p-4 flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <FormPreviewDialog config={config} />
                        <Button size="sm" className="flex-1" onClick={() => handleCopyEmbed(config.id)}><Copy className="h-3.5 w-3.5 mr-1.5" />Copy Embed Code</Button>
                      </div>
                      <FormEditDialog config={config} />
                    </CardFooter>
                  </Card>
                ))
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
