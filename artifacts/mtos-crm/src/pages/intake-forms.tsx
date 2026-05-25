import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, ChevronLeft, ChevronRight, ClipboardList,
  AlertCircle, User, FileText, Stethoscope, Scale,
  Sparkles, Clock, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetchRaw } from "@/lib/api-fetch";

// ─── Tort catalog ─────────────────────────────────────────────────────────────

const TORTS = [
  { id: "mesothelioma",      label: "Mesothelioma / Asbestos",   icon: "🫁", tier: 1, description: "Asbestos-related cancer cases" },
  { id: "camp_lejeune",      label: "Camp Lejeune",              icon: "🎖️", tier: 1, description: "Military base water contamination" },
  { id: "roundup",           label: "Roundup / Glyphosate",      icon: "🌿", tier: 1, description: "Herbicide-linked cancer claims" },
  { id: "cpap",              label: "CPAP / Philips Recall",     icon: "😴", tier: 1, description: "Recalled CPAP device injuries" },
  { id: "talcum",            label: "Talcum Powder",             icon: "🧴", tier: 1, description: "Ovarian cancer / mesothelioma" },
  { id: "hair_relaxer",      label: "Hair Relaxer",              icon: "💇", tier: 1, description: "Uterine & ovarian cancer links" },
  { id: "3m_earplug",        label: "3M Earplugs",               icon: "🎧", tier: 2, description: "Military hearing loss & tinnitus" },
  { id: "paraquat",          label: "Paraquat / Parkinson's",    icon: "🚜", tier: 1, description: "Herbicide-linked Parkinson's" },
  { id: "nec_baby_formula",  label: "NEC Baby Formula",          icon: "👶", tier: 1, description: "Premature infant bowel disease" },
  { id: "ozempic",           label: "Ozempic / GLP-1 Drugs",     icon: "💊", tier: 2, description: "GLP-1 drug side effects" },
  { id: "sexual_abuse",      label: "Sexual Abuse / Assault",    icon: "⚖️", tier: 1, description: "Institutional abuse claims" },
  { id: "car_accident",      label: "Auto Accident",             icon: "🚗", tier: 2, description: "Vehicle collision injury" },
  { id: "zantac",            label: "Zantac / Ranitidine",       icon: "💊", tier: 1, description: "Cancer-linked heartburn medication" },
  { id: "afff",              label: "AFFF / Firefighting Foam",  icon: "🔥", tier: 1, description: "PFAS chemical exposure" },
  { id: "paragard",          label: "Paragard IUD",              icon: "⚕️", tier: 2, description: "IUD device fracture injuries" },
] as const;

type TortId = typeof TORTS[number]["id"];

const TIER_STYLES: Record<number, string> = {
  1: "bg-green-500/10 text-green-700 border-green-500/20",
  2: "bg-blue-500/10  text-blue-700  border-blue-500/20",
  3: "bg-amber-500/10 text-amber-700 border-amber-500/20",
};

// ─── Question types ────────────────────────────────────────────────────────────

interface Q {
  key: string;
  label: string;
  type: "text" | "select" | "radio" | "date" | "tel" | "email" | "textarea" | "number";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
}

const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const CONTACT_QUESTIONS: Q[] = [
  { key: "first_name",    label: "First Name",         type: "text",   required: true, placeholder: "John" },
  { key: "last_name",     label: "Last Name",          type: "text",   required: true, placeholder: "Smith" },
  { key: "phone_primary", label: "Best Phone Number",  type: "tel",    required: true, placeholder: "(555) 555-5555" },
  { key: "email",         label: "Email Address",      type: "email",  required: false, placeholder: "john@example.com" },
  { key: "dob",           label: "Date of Birth",      type: "date",   required: false },
  { key: "state",         label: "State of Residence", type: "select", required: true, options: STATES },
];

// 3 tiers per tort: [eligibility, exposure/injury, documentation]
const QUESTIONS: Record<TortId, Q[][]> = {
  mesothelioma: [
    [
      { key: "diagnosed",       label: "Has the claimant been diagnosed with mesothelioma or asbestos-related cancer?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "diagnosis_type",  label: "Diagnosis type", type: "select", options: ["Mesothelioma","Lung Cancer","Asbestosis","Pleural Plaques","Other"], required: true },
      { key: "diagnosis_date",  label: "Approximate diagnosis date", type: "date" },
      { key: "still_living",    label: "Is the claimant still living?", type: "radio", options: ["Yes","No – Filing on behalf of estate"], required: true },
    ],
    [
      { key: "exposure_type",   label: "Primary asbestos exposure source", type: "select", options: ["Occupational","Secondhand / Family Member","Military","Home Renovation","Other"], required: true },
      { key: "industry",        label: "Industry / Occupation at time of exposure", type: "text", placeholder: "e.g. Shipyard, Construction, Navy" },
      { key: "exposure_years",  label: "Years of exposure", type: "select", options: ["Less than 1 year","1–5 years","5–10 years","10–20 years","20+ years"] },
      { key: "employer_name",   label: "Employer or company name", type: "text", placeholder: "e.g. Johns Manville, Owens Corning" },
    ],
    [
      { key: "has_pathology",   label: "Pathology / biopsy reports available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor", label: "Treating oncologist / pulmonologist", type: "text", placeholder: "Dr. Name" },
      { key: "prior_claims",    label: "Prior asbestos claim or settlement filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Relevant facts, special circumstances…" },
    ],
  ],
  camp_lejeune: [
    [
      { key: "served",          label: "Did the claimant live or work at Camp Lejeune between 1953 and 1987?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "duration",        label: "How many months at Camp Lejeune?", type: "select", options: ["Less than 30 days","30 days to 6 months","6–12 months","1–3 years","3+ years"], required: true, hint: "Must be 30+ days to qualify" },
      { key: "claimant_type",   label: "Claimant is a…", type: "radio", options: ["Veteran","Family Member / Dependent","Civilian Worker"], required: true },
    ],
    [
      { key: "condition",       label: "Diagnosed condition linked to exposure", type: "select", required: true,
        options: ["Bladder Cancer","Breast Cancer","Esophageal Cancer","Kidney Cancer","Leukemia","Lung Cancer","Multiple Myeloma","Non-Hodgkin Lymphoma","Parkinson's Disease","Rectal Cancer","Neurobehavioral Effects","Other"] },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
      { key: "va_claim",        label: "VA disability claim filed?", type: "radio", options: ["Yes","No","Unknown"] },
    ],
    [
      { key: "dd214",           label: "DD-214 or service records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor", label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  roundup: [
    [
      { key: "used_roundup",    label: "Did the claimant personally use Roundup or Ranger Pro?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",     label: "Years of use", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"], required: true },
      { key: "diagnosed_nhl",   label: "Has the claimant been diagnosed with Non-Hodgkin Lymphoma or another cancer?", type: "radio", options: ["Yes","No"], required: true },
    ],
    [
      { key: "cancer_type",     label: "Cancer type", type: "select", options: ["Non-Hodgkin Lymphoma","Diffuse Large B-cell Lymphoma","Mantle Cell Lymphoma","Follicular Lymphoma","Other"] },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
      { key: "usage_context",   label: "Where was Roundup used?", type: "select", options: ["Farm / Agricultural","Residential / Home","Golf Course","Public Spaces","Employment"] },
    ],
    [
      { key: "treating_doctor", label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional details", type: "textarea", placeholder: "Any relevant facts…" },
    ],
  ],
  cpap: [
    [
      { key: "used_philips",    label: "Did the claimant use a Philips CPAP, BiPAP, or mechanical ventilator?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "device_model",    label: "Device model (if known)", type: "text", placeholder: "e.g. DreamStation, SystemOne" },
      { key: "use_dates",       label: "Approximate dates of use", type: "text", placeholder: "e.g. 2015–2021" },
    ],
    [
      { key: "injury_type",     label: "Injury or condition experienced", type: "select", options: ["Cancer","Respiratory Issues","Headaches / Dizziness","Liver Damage","Other"], required: true },
      { key: "diagnosis_date",  label: "Diagnosis / onset date", type: "date" },
      { key: "recall_notice",   label: "Received a recall notice?", type: "radio", options: ["Yes","No","Unknown"] },
    ],
    [
      { key: "has_device",      label: "Does the claimant still have the device?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor", label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  talcum: [
    [
      { key: "used_talcum",     label: "Did the claimant use talcum powder products regularly?", type: "radio", options: ["Yes","No"], required: true },
      { key: "brand",           label: "Brand(s) used", type: "select", options: ["Johnson & Johnson Baby Powder","Shower to Shower","Both","Other"] },
      { key: "usage_years",     label: "Years of use", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"] },
    ],
    [
      { key: "diagnosis",       label: "Diagnosis", type: "select", options: ["Ovarian Cancer","Mesothelioma","Fallopian Tube Cancer","Peritoneal Cancer","Other"], required: true },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
      { key: "gender",          label: "Claimant gender", type: "radio", options: ["Female","Male","Non-binary / Other"] },
    ],
    [
      { key: "treating_doctor", label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "prior_claims",    label: "Prior talcum claims filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  hair_relaxer: [
    [
      { key: "used_relaxer",    label: "Did the claimant use chemical hair relaxers?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",     label: "Years of use", type: "select", options: ["1–5","5–10","10–20","20+"] },
      { key: "brands",          label: "Brand(s) used", type: "text", placeholder: "e.g. Dark & Lovely, ORS, Just For Me" },
    ],
    [
      { key: "diagnosis",       label: "Diagnosis", type: "select", options: ["Uterine Cancer","Uterine Fibroids","Ovarian Cancer","Endometrial Cancer","Other"], required: true },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
      { key: "hysterectomy",    label: "Has the claimant had a hysterectomy?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "treating_doctor", label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  "3m_earplug": [
    [
      { key: "served_military", label: "Did the claimant serve in the U.S. military?", type: "radio", options: ["Yes","No"], required: true },
      { key: "service_dates",   label: "Approximate dates of service", type: "text", placeholder: "e.g. 2003–2015" },
      { key: "used_3m",         label: "Were 3M Combat Arms Earplugs (CAEv2) issued?", type: "radio", options: ["Yes","No","Unknown"], required: true },
    ],
    [
      { key: "hearing_loss",    label: "Does the claimant have hearing loss?", type: "radio", options: ["Yes","No"], required: true },
      { key: "tinnitus",        label: "Does the claimant have tinnitus (ringing in ears)?", type: "radio", options: ["Yes","No"], required: true },
      { key: "va_rating",       label: "VA disability rating (if any)", type: "select", options: ["None","0–10%","10–30%","30–50%","50–70%","70–100%","Unknown"] },
    ],
    [
      { key: "audiologist",     label: "Seen an audiologist?", type: "radio", options: ["Yes","No"] },
      { key: "prior_claim",     label: "Prior 3M earplug claim filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  paraquat: [
    [
      { key: "exposed",         label: "Was the claimant exposed to paraquat or paraquat dichloride?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "context",         label: "Exposure context", type: "select", options: ["Farm Worker","Agricultural Worker","Residential Neighbor","Licensed Applicator","Other"] },
      { key: "exposure_years",  label: "Years of exposure", type: "select", options: ["Less than 1","1–5","5–10","10+"] },
    ],
    [
      { key: "diagnosed",       label: "Has the claimant been diagnosed with Parkinson's Disease?", type: "radio", options: ["Yes","No"], required: true },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
      { key: "neurologist",     label: "Treating neurologist", type: "text", placeholder: "Dr. Name" },
    ],
    [
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "prior_claims",    label: "Prior claims filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  nec_baby_formula: [
    [
      { key: "premature",       label: "Was the infant born premature (before 37 weeks)?", type: "radio", options: ["Yes","No","Unknown"], required: true },
      { key: "formula_brand",   label: "Formula brand(s) used", type: "select", options: ["Similac (Abbott)","Enfamil (Mead Johnson)","Both","Unknown"], required: true },
      { key: "nec_diagnosis",   label: "Was the infant diagnosed with NEC (Necrotizing Enterocolitis)?", type: "radio", options: ["Yes","No"], required: true },
    ],
    [
      { key: "diagnosis_date",  label: "NEC diagnosis date / year", type: "date" },
      { key: "outcome",         label: "Outcome", type: "select", options: ["Death","Surgeries required","Ongoing medical issues","Full recovery","Unknown"] },
      { key: "hospital",        label: "Hospital where treated", type: "text", placeholder: "Hospital name and city" },
    ],
    [
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "treating_doctor", label: "Treating neonatologist / surgeon", type: "text", placeholder: "Dr. Name" },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  ozempic: [
    [
      { key: "used_glp1",       label: "Has the claimant used Ozempic, Wegovy, Mounjaro, or another GLP-1 drug?", type: "radio", options: ["Yes","No"], required: true },
      { key: "drug_name",       label: "Which drug(s)?", type: "select", options: ["Ozempic (semaglutide)","Wegovy (semaglutide)","Mounjaro (tirzepatide)","Trulicity (dulaglutide)","Other / Multiple"] },
      { key: "use_duration",    label: "How long was the drug used?", type: "select", options: ["Less than 3 months","3–6 months","6–12 months","1–2 years","2+ years"] },
    ],
    [
      { key: "injury_type",     label: "Injury or condition", type: "select", options: ["Gastroparesis","Ileus","Bowel Obstruction","Pancreatitis","Aspiration Pneumonia","Other"], required: true },
      { key: "diagnosis_date",  label: "Injury / diagnosis date", type: "date" },
      { key: "hospitalized",    label: "Was the claimant hospitalized?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "treating_doctor", label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  sexual_abuse: [
    [
      { key: "institution",     label: "Institution / perpetrator context", type: "select", required: true,
        options: ["Catholic Diocese / Church","Boy Scouts","School / University","Juvenile Detention","Foster Care","Military","Employer","Other"] },
      { key: "abuse_period",    label: "Approximate period when abuse occurred", type: "text", placeholder: "e.g. 1985–1992" },
      { key: "state_of_abuse",  label: "State where abuse occurred", type: "select", options: STATES },
    ],
    [
      { key: "perpetrator_id",  label: "Has the perpetrator been identified by name?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "age_at_abuse",    label: "Claimant's approximate age at time of abuse", type: "select", options: ["Under 12","12–17","18–25","Over 25"] },
      { key: "reported_police", label: "Was the abuse reported to law enforcement?", type: "radio", options: ["Yes","No"] },
    ],
    [
      { key: "therapy",         label: "Receiving therapy / mental health treatment?", type: "radio", options: ["Yes","No"] },
      { key: "prior_action",    label: "Any prior civil or criminal action taken?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes (please be sensitive)", type: "textarea", placeholder: "Any relevant details — handle with care…" },
    ],
  ],
  car_accident: [
    [
      { key: "accident_date",   label: "Date of accident", type: "date", required: true },
      { key: "state",           label: "State where accident occurred", type: "select", options: STATES, required: true },
      { key: "claimant_role",   label: "Claimant was a…", type: "radio", options: ["Driver","Passenger","Pedestrian","Cyclist","Other"], required: true },
    ],
    [
      { key: "injury_type",     label: "Primary injury", type: "select", options: ["TBI / Head Injury","Spinal Injury","Broken Bones","Soft Tissue","Internal Injuries","Death","Multiple / Other"], required: true },
      { key: "hospitalized",    label: "Was the claimant hospitalized?", type: "radio", options: ["Yes","No"] },
      { key: "fault",           label: "Who was at fault?", type: "select", options: ["Other driver","Commercial vehicle / Trucking","Government vehicle","Rideshare","Unknown"] },
    ],
    [
      { key: "police_report",   label: "Police report filed?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "insurance_claim", label: "Insurance claim already filed?", type: "radio", options: ["Yes","No"] },
      { key: "notes",           label: "Additional details", type: "textarea", placeholder: "Any relevant facts…" },
    ],
  ],
  zantac: [
    [
      { key: "used_zantac",     label: "Did the claimant use Zantac (ranitidine) regularly?", type: "radio", options: ["Yes","No"], required: true },
      { key: "usage_years",     label: "Years of use", type: "select", options: ["Less than 1","1–3","3–5","5–10","10+"] },
      { key: "rx_or_otc",       label: "Prescription or OTC?", type: "radio", options: ["Prescription","Over-the-Counter","Both","Unknown"] },
    ],
    [
      { key: "cancer_type",     label: "Cancer diagnosed", type: "select", required: true,
        options: ["Bladder Cancer","Breast Cancer","Colorectal Cancer","Esophageal Cancer","Kidney Cancer","Liver Cancer","Lung Cancer","Ovarian Cancer","Pancreatic Cancer","Prostate Cancer","Stomach Cancer","Other"] },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
    ],
    [
      { key: "treating_doctor", label: "Treating oncologist", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical / pharmacy records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  afff: [
    [
      { key: "exposed",         label: "Was the claimant exposed to AFFF (firefighting foam)?", type: "radio", options: ["Yes","No","Unsure"], required: true },
      { key: "context",         label: "Context of exposure", type: "select", options: ["Military Base","Airport","Civilian Firefighter","Industrial Site","Drinking Water","Other"] },
      { key: "exposure_years",  label: "Years of exposure", type: "select", options: ["Less than 1","1–5","5–10","10–20","20+"] },
    ],
    [
      { key: "condition",       label: "Cancer or condition diagnosed", type: "select", required: true,
        options: ["Kidney Cancer","Testicular Cancer","Bladder Cancer","Thyroid Disease","Ulcerative Colitis","Liver Cancer","Breast Cancer","Other"] },
      { key: "diagnosis_date",  label: "Diagnosis date", type: "date" },
    ],
    [
      { key: "treating_doctor", label: "Treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
  paragard: [
    [
      { key: "used_paragard",   label: "Did the claimant use the Paragard IUD?", type: "radio", options: ["Yes","No"], required: true },
      { key: "insertion_date",  label: "Approximate insertion date", type: "date" },
      { key: "removal_date",    label: "Approximate removal date (if removed)", type: "date" },
    ],
    [
      { key: "fracture",        label: "Did the device break during removal?", type: "radio", options: ["Yes","No","Unknown"], required: true },
      { key: "injury",          label: "Injuries sustained", type: "select",
        options: ["Broken device fragment remaining","Perforation of uterus","Pelvic inflammatory disease","Infertility","Hysterectomy required","Other"] },
    ],
    [
      { key: "treating_doctor", label: "OB/GYN or treating physician", type: "text", placeholder: "Dr. Name" },
      { key: "has_records",     label: "Medical records available?", type: "radio", options: ["Yes","No","Unknown"] },
      { key: "notes",           label: "Additional notes", type: "textarea", placeholder: "Any relevant details…" },
    ],
  ],
};

const TIER_TITLES   = ["Eligibility Screening", "Exposure & Injury Details", "Documentation & Notes"];
const TIER_ICONS    = [Scale, Stethoscope, FileText];

type Step = "select_tort" | "contact" | "questions" | "done";

// ─── Main component ────────────────────────────────────────────────────────────

export default function IntakeForms() {
  const { toast } = useToast();

  const [step, setStep]               = useState<Step>("select_tort");
  const [selectedTort, setSelectedTort] = useState<TortId | null>(null);
  const [qTier, setQTier]             = useState(0);
  const [contact, setContact]         = useState<Record<string, string>>({});
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [submitting, setSubmitting]   = useState(false);
  const [createdId, setCreatedId]     = useState<string | null>(null);

  const tort      = TORTS.find((t) => t.id === selectedTort);
  const qSections = selectedTort ? QUESTIONS[selectedTort] : [];
  const totalQ    = qSections.length;

  const totalSteps  = 1 + 1 + totalQ + 1;
  const currentStep =
    step === "select_tort" ? 1 :
    step === "contact"     ? 2 :
    step === "questions"   ? 3 + qTier :
    totalSteps;
  const progress = Math.round((currentStep / (totalSteps - 1)) * 100);

  function setC(k: string, v: string) { setContact((p) => ({ ...p, [k]: v })); }
  function setA(k: string, v: string) { setAnswers((p)  => ({ ...p, [k]: v })); }

  function goBack() {
    if (step === "contact")   setStep("select_tort");
    else if (step === "questions" && qTier === 0) { setStep("contact"); }
    else if (step === "questions") setQTier((t) => t - 1);
  }

  async function advanceOrSubmit() {
    if (step !== "questions") return;
    if (qTier < totalQ - 1) { setQTier((t) => t + 1); return; }
    // last tier — submit
    setSubmitting(true);
    try {
      const body = {
        first_name:     contact.first_name    || "",
        last_name:      contact.last_name     || "",
        phone_primary:  contact.phone_primary || "",
        email:          contact.email         || undefined,
        dob:            contact.dob           || undefined,
        state:          contact.state         || undefined,
        tort_type:      selectedTort          || "",
        status:         "new",
        intake_answers: answers,
        source:         "intake_form",
      };
      const res = await apiFetchRaw("/api/leads", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json().catch(() => ({}));
      setCreatedId(data?.id ?? null);
      setStep("done");
    } catch {
      toast({ title: "Submission failed", description: "Could not create lead — please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("select_tort"); setSelectedTort(null);
    setQTier(0); setContact({}); setAnswers({}); setCreatedId(null);
  }

  // ── STEP: select tort ────────────────────────────────────────────────────────
  if (step === "select_tort") {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" /> Intake Forms
          </h1>
          <p className="text-muted-foreground mt-1">
            Select a tort type to begin claimant intake — Abby will guide you through every screening question.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TORTS.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTort(t.id); setStep("contact"); }}
              className={cn(
                "text-left p-4 rounded-xl border bg-card",
                "hover:border-primary/50 hover:shadow-md hover:bg-accent/30",
                "transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-2xl">{t.icon}</span>
                <Badge variant="outline" className={cn("text-[10px] font-semibold", TIER_STYLES[t.tier])}>
                  Tier {t.tier}
                </Badge>
              </div>
              <div className="mt-2 font-semibold text-sm">{t.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── STEP: done ───────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Intake Complete</h2>
          <p className="text-muted-foreground mt-2">
            The claimant has been added to your leads. Abby will run eligibility scoring and enrichment automatically.
          </p>
          {createdId && (
            <p className="mt-3 text-xs font-mono bg-muted rounded-md px-3 py-2 inline-block">
              Lead ID: {createdId}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>Start New Intake</Button>
          <Button asChild>
            <a href="/leads">View All Leads <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></a>
          </Button>
        </div>
      </div>
    );
  }

  // ── Shared header ─────────────────────────────────────────────────────────────
  const header = (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        {tort && (
          <div className="flex items-center gap-2">
            <span className="text-lg">{tort.icon}</span>
            <span className="font-semibold text-sm">{tort.label}</span>
            <Badge variant="outline" className={cn("text-[10px]", TIER_STYLES[tort.tier])}>Tier {tort.tier}</Badge>
          </div>
        )}
      </div>
      <Progress value={progress} className="h-1.5" />
      <p className="text-xs text-muted-foreground">Step {currentStep} of {totalSteps - 1} — {progress}% complete</p>
    </div>
  );

  // ── STEP: contact ─────────────────────────────────────────────────────────────
  if (step === "contact") {
    const canContinue = contact.first_name && contact.last_name && contact.phone_primary && contact.state;
    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        {header}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Claimant Contact Information
            </CardTitle>
            <CardDescription>Basic contact details — tort-specific screening questions come next.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CONTACT_QUESTIONS.map((q) => (
                <div key={q.key} className="space-y-1.5">
                  <Label htmlFor={q.key} className="flex items-center gap-1">
                    {q.label} {q.required && <span className="text-destructive text-xs">*</span>}
                  </Label>
                  {q.type === "select" ? (
                    <Select value={contact[q.key] || ""} onValueChange={(v) => setC(q.key, v)}>
                      <SelectTrigger id={q.key}><SelectValue placeholder="Select state…" /></SelectTrigger>
                      <SelectContent>{q.options?.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : (
                    <Input id={q.key} type={q.type} placeholder={q.placeholder} value={contact[q.key] || ""} onChange={(e) => setC(q.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button onClick={() => { setStep("questions"); setQTier(0); }} disabled={!canContinue}>
            Continue to Screening <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP: questions ───────────────────────────────────────────────────────────
  const TierIcon        = TIER_ICONS[qTier] ?? ClipboardList;
  const currentQs       = qSections[qTier] ?? [];
  const isLast          = qTier === totalQ - 1;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {header}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TierIcon className="h-4 w-4 text-primary" />
            {TIER_TITLES[qTier] ?? `Part ${qTier + 1}`}
          </CardTitle>
          <CardDescription>
            {qTier === 0 ? "These questions determine basic eligibility for this tort type."
            : qTier === 1 ? "More detail about the exposure and resulting injuries."
            : "Documentation availability and any additional notes."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {currentQs.map((q) => (
            <div key={q.key} className="space-y-1.5">
              <Label htmlFor={q.key} className="flex items-center gap-1 leading-snug">
                {q.label} {q.required && <span className="text-destructive text-xs ml-0.5">*</span>}
              </Label>
              {q.hint && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {q.hint}
                </p>
              )}
              {q.type === "radio" && q.options && (
                <RadioGroup value={answers[q.key] || ""} onValueChange={(v) => setA(q.key, v)} className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
                  {q.options.map((opt) => (
                    <div key={opt} className="flex items-center gap-2">
                      <RadioGroupItem value={opt} id={`${q.key}-${opt}`} />
                      <Label htmlFor={`${q.key}-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {q.type === "select" && q.options && (
                <Select value={answers[q.key] || ""} onValueChange={(v) => setA(q.key, v)}>
                  <SelectTrigger id={q.key}><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>{q.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
              )}
              {q.type === "textarea" && (
                <Textarea id={q.key} placeholder={q.placeholder} value={answers[q.key] || ""} onChange={(e) => setA(q.key, e.target.value)} rows={3} />
              )}
              {(q.type === "text" || q.type === "date" || q.type === "tel" || q.type === "email" || q.type === "number") && (
                <Input id={q.key} type={q.type} placeholder={q.placeholder} value={answers[q.key] || ""} onChange={(e) => setA(q.key, e.target.value)} />
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          {isLast ? "Last section — submit when ready." : `${totalQ - qTier - 1} section(s) remaining`}
        </p>
        <Button onClick={advanceOrSubmit} disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 animate-spin" /> Saving…</span>
          ) : isLast ? (
            <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> Submit Intake</span>
          ) : (
            <span className="flex items-center gap-2">Next <ChevronRight className="h-4 w-4" /></span>
          )}
        </Button>
      </div>
    </div>
  );
}
