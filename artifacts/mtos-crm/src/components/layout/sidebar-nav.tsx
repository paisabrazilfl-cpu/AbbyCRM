import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, UserCog, FileText, PlusCircle, Briefcase, Inbox,
  GitBranch, UserCheck, BarChart3, Shield, Stethoscope, ShieldAlert, AppWindow,
  Building2, ShieldCheck, FileSearch, Clock, Wand2, Brain, Plug, Newspaper,
  TrendingUp, FileUp, Scale, Building, FileSignature, Grid3x3, Settings,
  Activity, CreditCard, Phone, Workflow, Wrench, Search, ListChecks, Bot,
  Skull, Sparkles, BookOpen, Library, Webhook, Eye, ClipboardCheck,
  Zap, Target, BarChart2, AlertOctagon, Package, ScanLine, Bot as BotIcon,
  History, Lock, Radio,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

type NavItem = { name: string; href: string; icon: typeof LayoutDashboard; superAdminOnly?: boolean; badge?: string };
type NavSection = { section: string; items: NavItem[]; superAdminOnly?: boolean };

export const navigation: NavSection[] = [

  // ── 1. HOME ────────────────────────────────────────────────────────────────
  {
    section: "Home",
    items: [
      { name: "Dashboard",           href: "/",            icon: LayoutDashboard },
      { name: "Lead Pipeline",       href: "/pipeline",    icon: GitBranch       },
      { name: "Conversion Analytics",href: "/analytics",   icon: BarChart3       },
      { name: "Help & Docs",         href: "/user-manual", icon: BookOpen        },
    ],
  },

  // ── 2. LEADS & CASES ───────────────────────────────────────────────────────
  {
    section: "Leads & Cases",
    items: [
      { name: "All Leads",       href: "/leads",       icon: Users      },
      { name: "Quick Add Lead",  href: "/leads/new",   icon: PlusCircle },
      { name: "Bulk Import",     href: "/lead-import", icon: FileUp     },
      { name: "Cases",           href: "/cases",       icon: Briefcase  },
      { name: "Phone Calls",     href: "/calls",       icon: Phone      },
    ],
  },

  // ── 3. DOCUMENTS ──────────────────────────────────────────────────────────
  {
    section: "Documents",
    items: [
      { name: "All Documents",     href: "/documents",          icon: FileText      },
      { name: "Fax & Doc Scanner", href: "/ocr-inbox",          icon: ScanLine      },
      { name: "Document Review",   href: "/doc-review",         icon: FileSearch    },
      { name: "Document Generator",href: "/drafting",           icon: Wand2         },
      { name: "Document Templates",href: "/document-templates", icon: FileSignature },
    ],
  },

  // ── 4. OPERATIONS ─────────────────────────────────────────────────────────
  {
    section: "Operations",
    items: [
      { name: "Conflict & Fraud Review", href: "/review-queue", icon: ShieldAlert },
      { name: "Background Tasks",        href: "/job-queue",    icon: Package     },
      { name: "Paralegal Team",          href: "/paralegals",   icon: UserCheck   },
      { name: "Case Timeline",           href: "/timeline",     icon: History     },
    ],
  },

  // ── 5. LEAD GENERATION ────────────────────────────────────────────────────
  {
    section: "Lead Generation",
    items: [
      { name: "Intake Forms",        href: "/intake-forms",      icon: ClipboardCheck },
      { name: "Website Forms",       href: "/web-forms",         icon: ListChecks     },
      { name: "Forms API",           href: "/forms-api",         icon: Library        },
      { name: "Competitor Ad Tracker",href: "/competitive-intel",icon: Eye            },
      { name: "Ad Library Search",   href: "/ads-libraries",     icon: Search         },
      { name: "Tort News",           href: "/news",              icon: Newspaper      },
      { name: "Market & Finance News",href: "/financial-news",   icon: TrendingUp     },
    ],
  },

  // ── 6. INTELLIGENCE & AI ──────────────────────────────────────────────────
  {
    section: "Intelligence & AI",
    items: [
      { name: "Abby AI Assistant",    href: "/abby",            icon: Sparkles    },
      { name: "AI Agents",            href: "/ai-agents",       icon: Bot         },
      { name: "Doctor Registry (NPI)",href: "/npi-lookup",      icon: Stethoscope },
      { name: "Case Value Analyzer",  href: "/decision-engine", icon: Scale       },
      { name: "Lead Quality Predictor",href: "/predictive",     icon: Target      },
    ],
  },

  // ── 7. AUTOMATION ─────────────────────────────────────────────────────────
  {
    section: "Automation",
    items: [
      { name: "Automations",   href: "/automations",           icon: Workflow     },
      { name: "AI Code Fixer", href: "/self-heal",             icon: Zap          },
      { name: "Delivery Log",  href: "/automation-deliveries", icon: Radio        },
      { name: "API Setup",     href: "/n8n-setup",             icon: Plug         },
    ],
  },

  // ── 8. SETTINGS ───────────────────────────────────────────────────────────
  {
    section: "Settings",
    items: [
      { name: "Firm Settings",    href: "/firm-settings",        icon: Building    },
      { name: "Team Members",     href: "/users",                icon: UserCog     },
      { name: "Vendors",          href: "/vendors",              icon: Building2   },
      { name: "Case Buyers",      href: "/buyers",               icon: Building    },
      { name: "Auto-Assignment",  href: "/template-assignments", icon: Grid3x3     },
      { name: "Workflow Rules",   href: "/workflow-settings",    icon: Settings    },
      { name: "Integrations",     href: "/integrations",         icon: Plug        },
      { name: "Billing",          href: "/billing",              icon: CreditCard  },
      { name: "Audit Trail",      href: "/compliance",           icon: Shield      },
      { name: "Security",         href: "/security",             icon: Lock        },
    ],
  },

  // ── 9. BOS-OMEGA ──────────────────────────────────────────────────────────
  {
    section: "BOS-OMEGA",
    superAdminOnly: true,
    items: [
      { name: "Admin Shortcuts", href: "/dark-room", icon: Skull, superAdminOnly: true },
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
        <div key={group.section} className="mb-1">
          <div className="px-2 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
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
