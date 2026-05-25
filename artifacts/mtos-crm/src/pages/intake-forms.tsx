import { useState } from "react";
import { Link } from "wouter";
import { 
  ClipboardList, Plus, Eye, Edit, Copy, Send, 
  FileText, CheckCircle, Clock, AlertCircle,
  ChevronRight, Search, Filter, MoreVertical,
  Building2, Car, Heart, Shield, Activity,
  Stethoscope, Pill, AlertTriangle, Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Tort types with their specific intake form configurations
const TORT_INTAKE_FORMS = [
  {
    id: "mesothelioma",
    name: "Mesothelioma",
    icon: "🏥",
    description: "Asbestos-related cancer intake form",
    fields: [
      { name: "diagnosis_date", label: "Date of Diagnosis", type: "date", required: true },
      { name: "diagnosis_stage", label: "Stage of Cancer", type: "select", options: ["Stage I", "Stage II", "Stage III", "Stage IV"], required: true },
      { name: "asbestos_exposure", label: "Asbestos Exposure Details", type: "textarea", required: true },
      { name: "employer_history", label: "Employer History (Asbestos)", type: "textarea", required: true },
      { name: "work_duration", label: "Years Worked with Asbestos", type: "number", required: true },
      { name: "physician_name", label: "Treating Physician", type: "text", required: true },
      { name: "physician_npi", label: "Physician NPI", type: "text", required: false },
      { name: "hospital_name", label: "Hospital/Treatment Center", type: "text", required: false },
      { name: "treatment_start", label: "Treatment Start Date", type: "date", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 156,
    avgCompletionTime: "12 min",
  },
  {
    id: "opioid",
    name: "Opioid",
    icon: "💊",
    description: "Opioid addiction and overdose intake form",
    fields: [
      { name: "addiction_start", label: "When did addiction start?", type: "date", required: true },
      { name: "drug_name", label: "Prescribed Drug(s)", type: "text", required: true },
      { name: "prescribing_doctor", label: "Prescribing Doctor", type: "text", required: true },
      { name: "prescription_length", label: "Length of Prescription", type: "select", options: ["< 1 month", "1-3 months", "3-6 months", "6-12 months", "> 1 year"], required: true },
      { name: "overdose_event", label: "Overdose Event?", type: "boolean", required: true },
      { name: "overdose_date", label: "Date of Overdose", type: "date", required: false },
      { name: "treatment_history", label: "Treatment History", type: "textarea", required: false },
      { name: "current_treatment", label: "Currently in Treatment?", type: "boolean", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 89,
    avgCompletionTime: "8 min",
  },
  {
    id: "benzene",
    name: "Benzene",
    icon: "⚗️",
    description: "Benzene exposure intake form",
    fields: [
      { name: "exposure_date", label: "Date of Exposure", type: "date", required: true },
      { name: "exposure_location", label: "Location of Exposure", type: "text", required: true },
      { name: "exposure_duration", label: "Duration of Exposure", type: "select", options: ["< 1 month", "1-6 months", "6-12 months", "1-5 years", "> 5 years"], required: true },
      { name: "employer", label: "Employer", type: "text", required: true },
      { name: "job_title", label: "Job Title", type: "text", required: true },
      { name: "diagnosis", label: "Diagnosis", type: "select", options: ["Leukemia", "Lymphoma", "Myeloma", "Other Cancer", "None Yet"], required: true },
      { name: "diagnosis_date", label: "Date of Diagnosis", type: "date", required: false },
      { name: "physician_name", label: "Treating Physician", type: "text", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 45,
    avgCompletionTime: "10 min",
  },
  {
    id: "talc",
    name: "Talcum Powder",
    icon: "🧴",
    description: "Talcum powder ovarian cancer intake form",
    fields: [
      { name: "product_used", label: "Talc Product Used", type: "select", options: ["Johnson's Baby Powder", "Shower to Shower", "Other"], required: true },
      { name: "usage_start", label: "Start of Usage", type: "date", required: true },
      { name: "usage_duration", label: "Duration of Usage", type: "select", options: ["< 1 year", "1-5 years", "5-10 years", "10-20 years", "> 20 years"], required: true },
      { name: "usage_frequency", label: "Frequency of Use", type: "select", options: ["Daily", "Weekly", "Monthly", "Occasionally"], required: true },
      { name: "diagnosis", label: "Diagnosis", type: "select", options: ["Ovarian Cancer", "Fallopian Tube Cancer", "Peritoneal Cancer"], required: true },
      { name: "diagnosis_date", label: "Date of Diagnosis", type: "date", required: true },
      { name: "stage", label: "Cancer Stage", type: "select", options: ["Stage I", "Stage II", "Stage III", "Stage IV"], required: false },
      { name: "treatment", label: "Treatment Received", type: "textarea", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 78,
    avgCompletionTime: "9 min",
  },
  {
    id: " Roundup",
    name: "Roundup (Glyphosate)",
    icon: "🌱",
    description: "Roundup herbicide cancer intake form",
    fields: [
      { name: "first_exposure", label: "First Exposure Date", type: "date", required: true },
      { name: "exposure_years", label: "Years of Exposure", type: "number", required: true },
      { name: "exposure_frequency", label: "Frequency of Use", type: "select", options: ["Daily", "Weekly", "Monthly", "Seasonally"], required: true },
      { name: "application_method", label: "Application Method", type: "select", options: ["Professional", "DIY", "Both"], required: true },
      { name: "diagnosis", label: "Cancer Diagnosis", type: "select", options: ["Non-Hodgkin Lymphoma", "Hodgkin Lymphoma", "Multiple Myeloma", "Other"], required: true },
      { name: "diagnosis_date", label: "Date of Diagnosis", type: "date", required: true },
      { name: "physician_name", label: "Treating Physician", type: "text", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 62,
    avgCompletionTime: "8 min",
  },
  {
    id: "sexual-abuse",
    name: "Sexual Abuse",
    icon: "⚖️",
    description: "Sexual abuse survivors intake form",
    fields: [
      { name: "incident_date", label: "Date of Incident(s)", type: "date", required: true },
      { name: "incident_location", label: "Location", type: "text", required: true },
      { name: "perpetrator_name", label: "Perpetrator Name (if known)", type: "text", required: false },
      { name: "perpetrator_organization", label: "Organization/Institution", type: "text", required: false },
      { name: "incident_count", label: "Number of Incidents", type: "select", options: ["1", "2-5", "6-10", "10+"], required: true },
      { name: "reported", label: "Previously Reported?", type: "boolean", required: true },
      { name: "report_date", label: "Report Date", type: "date", required: false },
      { name: "law_enforcement", label: "Law Enforcement Involved?", type: "boolean", required: false },
      { name: "physical_injuries", label: "Physical Injuries", type: "textarea", required: false },
      { name: "psychological_treatment", label: "Psychological Treatment?", type: "boolean", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 23,
    avgCompletionTime: "15 min",
  },
  {
    id: "police-brutality",
    name: "Police Brutality",
    icon: "👮",
    description: "Police misconduct and brutality intake form",
    fields: [
      { name: "incident_date", label: "Date of Incident", type: "date", required: true },
      { name: "incident_location", label: "Location", type: "text", required: true },
      { name: "department", label: "Police Department", type: "text", required: true },
      { name: "officers_involved", label: "Number of Officers Involved", type: "number", required: true },
      { name: "incident_type", label: "Type of Misconduct", type: "select", options: ["Excessive Force", "False Arrest", "Wrongful Death", "Sexual Assault", "Other"], required: true },
      { name: "injuries", label: "Injuries Sustained", type: "textarea", required: true },
      { name: "medical_treatment", label: "Medical Treatment Received?", type: "boolean", required: true },
      { name: "hospitalized", label: "Hospitalized?", type: "boolean", required: false },
      { name: "witnesses", label: "Witnesses", type: "textarea", required: false },
      { name: "body_cam", label: "Body Camera Footage?", type: "select", options: ["Yes", "No", "Unknown"], required: false },
      { name: "complaint_filed", label: "Complaint Filed?", type: "boolean", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 34,
    avgCompletionTime: "11 min",
  },
  {
    id: "car-accident",
    name: "Car Accident",
    icon: "🚗",
    description: "Personal injury from car accident",
    fields: [
      { name: "accident_date", label: "Date of Accident", type: "date", required: true },
      { name: "accident_location", label: "Location", type: "text", required: true },
      { name: "accident_type", label: "Type of Accident", type: "select", options: ["Rear-end", "Head-on", "Side-impact", "Rollover", "Multi-vehicle", "Hit & Run"], required: true },
      { name: "police_report", label: "Police Report Filed?", type: "boolean", required: true },
      { name: "police_report_number", label: "Police Report Number", type: "text", required: false },
      { name: "injuries", label: "Injuries Sustained", type: "textarea", required: true },
      { name: "medical_treatment", label: "Medical Treatment", type: "textarea", required: true },
      { name: "er_visit", label: "ER Visit?", type: "boolean", required: true },
      { name: "hospitalized", label: "Hospitalized?", type: "boolean", required: false },
      { name: "surgery", label: "Surgery Required?", type: "boolean", required: false },
      { name: "current_treatment", label: "Currently in Treatment?", type: "boolean", required: false },
      { name: "lost_wages", label: "Lost Wages?", type: "boolean", required: false },
      { name: "vehicle_damage", label: "Vehicle Damage", type: "select", options: ["Totaled", "Major", "Minor", "None"], required: true },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 203,
    avgCompletionTime: "10 min",
  },
  {
    id: "slip-fall",
    name: "Slip & Fall",
    icon: "🏢",
    description: "Premises liability / slip and fall",
    fields: [
      { name: "incident_date", label: "Date of Incident", type: "date", required: true },
      { name: "incident_location", label: "Location (Business Name)", type: "text", required: true },
      { name: "incident_address", label: "Address", type: "text", required: true },
      { name: "hazard_type", label: "Hazard Type", type: "select", options: ["Wet floor", "Ice/Snow", "Uneven surface", "Poor lighting", "Obstruction", "Other"], required: true },
      { name: "injuries", label: "Injuries Sustained", type: "textarea", required: true },
      { name: "medical_treatment", label: "Medical Treatment", type: "textarea", required: true },
      { name: "er_visit", label: "ER Visit?", type: "boolean", required: true },
      { name: "severity", label: "Injury Severity", type: "select", options: ["Minor", "Moderate", "Severe", "Permanent"], required: true },
      { name: "property_notice", label: "Property owner notified?", type: "boolean", required: false },
      { name: "incident_report", label: "Incident Report Filed?", type: "boolean", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 87,
    avgCompletionTime: "8 min",
  },
  {
    id: "medical-malpractice",
    name: "Medical Malpractice",
    icon: "🏥",
    description: "Medical malpractice and negligence",
    fields: [
      { name: "incident_date", label: "Date of Incident", type: "date", required: true },
      { name: "facility_name", label: "Medical Facility", type: "text", required: true },
      { name: "facility_address", label: "Facility Address", type: "text", required: true },
      { name: "provider_name", label: "Provider Name", type: "text", required: true },
      { name: "provider_type", label: "Provider Type", type: "select", options: ["Doctor", "Nurse", "Surgeon", "Anesthesiologist", "Hospital", "Other"], required: true },
      { name: "procedure", label: "Procedure/Treatment", type: "textarea", required: true },
      { name: "negligence_type", label: "Type of Negligence", type: "select", options: ["Surgical Error", "Misdiagnosis", "Medication Error", "Birth Injury", "Failure to Treat", "Other"], required: true },
      { name: "injuries", label: "Injuries Resulting", type: "textarea", required: true },
      { name: "outcome", label: "Outcome", type: "select", options: ["Full Recovery", "Partial Recovery", "Permanent Damage", "Death"], required: true },
      { name: "medical_records", label: "Medical Records Available?", type: "boolean", required: true },
      { name: "second_opinion", label: "Second Opinion Obtained?", type: "boolean", required: false },
      { name: "damages_estimate", label: "Estimated Damages", type: "currency", required: true },
    ],
    status: "active",
    submissions: 41,
    avgCompletionTime: "14 min",
  },
];

export default function IntakeForms() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTort, setSelectedTort] = useState<string | null>(null);
  const [previewForm, setPreviewForm] = useState<typeof TORT_INTAKE_FORMS[0] | null>(null);

  const filteredForms = TORT_INTAKE_FORMS.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    form.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Intake Forms</h1>
          <p className="text-muted-foreground mt-1">
            Real-time intake forms for each tort type. Send to clients to fill out — automation starts after submission.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Custom Form
        </Button>
      </div>

      {/* How It Works */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardList className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">How It Works</h3>
              <ol className="mt-2 text-sm text-blue-800 space-y-1">
                <li>1. Select a tort type below to view its intake form</li>
                <li>2. Click "Send to Client" to generate a secure link</li>
                <li>3. Client fills out the form — no account needed</li>
                <li>4. On submission: NPI check, background check, and eligibility screening auto-run</li>
                <li>5. Qualified leads auto-route to paralegals</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search intake forms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Tort Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tort Types</SelectItem>
            {TORT_INTAKE_FORMS.map(form => (
              <SelectItem key={form.id} value={form.id}>{form.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredForms.map((form) => (
          <Card key={form.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setPreviewForm(form)}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{form.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{form.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5">{form.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={form.status === "active" ? "default" : "secondary"}>
                  {form.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-lg font-semibold">{form.submissions}</div>
                  <div className="text-xs text-muted-foreground">Submissions</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-lg font-semibold">{form.fields.length}</div>
                  <div className="text-xs text-muted-foreground">Fields</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-lg font-semibold">{form.avgCompletionTime}</div>
                  <div className="text-xs text-muted-foreground">Avg Time</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setPreviewForm(form); }}>
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
              <Button size="sm" className="flex-1" onClick={(e) => e.stopPropagation()}>
                <Send className="mr-1 h-3 w-3" />
                Send to Client
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{previewForm?.icon}</span>
              {previewForm?.name} Intake Form
            </DialogTitle>
            <DialogDescription>
              This form will be sent to the client. All fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          
          {previewForm && (
            <div className="space-y-4 mt-4">
              {previewForm.fields.map((field, index) => (
                <div key={field.name} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "select" && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === "textarea" && (
                    <Textarea placeholder={`Enter ${field.label.toLowerCase()}...`} disabled />
                  )}
                  {field.type === "boolean" && (
                    <Select disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {field.type === "date" && (
                    <Input type="date" disabled />
                  )}
                  {field.type === "number" && (
                    <Input type="number" placeholder="0" disabled />
                  )}
                  {field.type === "currency" && (
                    <Input type="text" placeholder="$0.00" disabled />
                  )}
                  {field.type === "text" && (
                    <Input type="text" placeholder={`Enter ${field.label.toLowerCase()}...`} disabled />
                  )}
                </div>
              ))}
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setPreviewForm(null)}>
                  Cancel
                </Button>
                <Button className="flex-1">
                  <Send className="mr-2 h-4 w-4" />
                  Generate Client Link
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
