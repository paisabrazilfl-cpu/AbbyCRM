import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, Phone, 
  FileUp, ShieldAlert, Activity, UserCheck,
  ClipboardList, Globe, Stethoscope, Scale,
  Workflow, Settings, Building, CreditCard, Shield,
  Sparkles, Wand2, Inbox, FileSignature,
  Skull, BarChart3, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; superAdminOnly?: boolean };
type NavSection = { section: string; items: NavItem[]; superAdminOnly?: boolean };

// SIMPLIFIED NAVIGATION - Removed ambiguous/unnecessary items
export const navigation: NavSection[] = [
  // ── 1. MAIN ────────────────────────────────────────────────────────────────
  {
    section: "Main",
    items: [
      { name: "Dashboard",   href: "/",            icon: LayoutDashboard },
      { name: "Pipeline",    href: "/pipeline",    icon: GitBranch       },
      { name: "Analytics",   href: "/analytics",   icon: BarChart3       },
    ],
  },

  // ── 2. INTAKE ───────────────────────────────────────────────────────────────
  {
    section: "Intake",
    items: [
      { name: "Website Forms",   href: "/web-forms",       icon: Globe         },
      { name: "Intake Forms",    href: "/intake-forms",    icon: ClipboardList },
      { name: "Leads",           href: "/leads",           icon: Users         },
      { name: "New Lead",        href: "/leads/new",       icon: FileUp        },
      { name: "Cases",           href: "/cases",           icon: Briefcase     },
    ],
  },

  // ── 3. WORK ────────────────────────────────────────────────────────────────
  {
    section: "Work",
    items: [
      { name: "Review Queue",  href: "/review-queue", icon: ShieldAlert },
      { name: "Job Queue",     href: "/job-queue",    icon: Activity    },
      { name: "Paralegals",    href: "/paralegals",   icon: UserCheck   },
      { name: "Calls",         href: "/calls",        icon: Phone       },
    ],
  },

  // ── 4. DOCUMENTS ───────────────────────────────────────────────────────────
  {
    section: "Documents",
    items: [
      { name: "All Documents",  href: "/documents",          icon: FileText      },
      { name: "OCR Inbox",      href: "/ocr-inbox",          icon: Inbox         },
      { name: "Doc Review",     href: "/doc-review",         icon: FileText     },
      { name: "AI Drafting",    href: "/drafting",           icon: Wand2         },
      { name: "Templates",      href: "/document-templates", icon: FileSignature },
    ],
  },

  // ── 5. INTELLIGENCE ────────────────────────────────────────────────────────
  {
    section: "Intelligence",
    items: [
      { name: "ABBY AI",         href: "/abby",            icon: Sparkles    },
      { name: "NPI Lookup",      href: "/npi-lookup",      icon: Stethoscope },
      { name: "Decision Engine", href: "/decision-engine", icon: Scale       },
    ],
  },

  // ── 6. AUTOMATION ─────────────────────────────────────────────────────────
  {
    section: "Automation",
    items: [
      { name: "Automations",   href: "/automations",           icon: Workflow },
    ],
  },

  // ── 7. SETTINGS ───────────────────────────────────────────────────────────
  {
    section: "Settings",
    items: [
      { name: "Firm Settings",  href: "/firm-settings",    icon: Building    },
      { name: "Team",           href: "/users",            icon: UserCheck   },
      { name: "Billing",        href: "/billing",          icon: CreditCard  },
      { name: "Compliance",     href: "/compliance",       icon: Shield      },
      { name: "Integrations",   href: "/integrations",     icon: Workflow    },
    ],
  },

  // ── 8. BOS-OMEGA ──────────────────────────────────────────────────────────
  {
    section: "BOS-OMEGA",
    superAdminOnly: true,
    items: [
      { name: "Dark Room", href: "/dark-room", icon: Skull, superAdminOnly: true },
    ],
  },

];

interface SidebarNavProps {
  onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";

  const visibleNav = navigation
    .filter((g) => !g.superAdminOnly || isSuperAdmin)
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !i.superAdminOnly || isSuperAdmin),
    }));

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-2" aria-label="Primary">
      {visibleNav.map((group) => (
          <div key={group.section} className="mb-3">
            <div className="px-2 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none",
                      "transition-[background-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      "focus-visible:ring-2 focus-visible:ring-sidebar-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
                      isActive
                        ? [
                            "text-sidebar-primary-foreground",
                            "bg-[linear-gradient(180deg,hsl(var(--sidebar-primary)/0.96),hsl(var(--sidebar-primary))_60%,hsl(var(--sidebar-primary)/0.9))]",
                            "shadow-[0_1px_0_hsl(0_0%_100%/0.18)_inset,0_1px_2px_hsl(0_0%_0%/0.18),0_4px_10px_-4px_hsl(var(--sidebar-primary)/0.5)]",
                          ].join(" ")
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-px",
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={cn(
                        "mr-2.5 h-3.5 w-3.5 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/45 group-hover:text-sidebar-accent-foreground",
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
    </nav>
  );
}
