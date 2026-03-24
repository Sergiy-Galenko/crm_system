import {
  BarChart3,
  BadgePercent,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  Workflow,
} from "lucide-react";

export const SESSION_COOKIE = "crm_session";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Vercel CRM Suite";

export const roles = ["ADMIN", "MANAGER"] as const;
export type AppRole = (typeof roles)[number];

export const clientStatuses = ["ACTIVE", "AT_RISK", "INACTIVE"] as const;
export const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "WON", "LOST"] as const;
export const leadSources = ["WEBSITE", "REFERRAL", "OUTBOUND", "PARTNER", "EVENT"] as const;
export const dealStages = ["DISCOVERY", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;
export const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"] as const;
export const taskPriorities = ["LOW", "MEDIUM", "HIGH"] as const;
export const meetingStatuses = ["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"] as const;
export const discountTypes = ["PERCENT", "FIXED"] as const;

export const dashboardNavigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Clients",
    href: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Leads",
    href: "/dashboard/leads",
    icon: Workflow,
  },
  {
    title: "Deals",
    href: "/dashboard/deals",
    icon: BriefcaseBusiness,
  },
  {
    title: "Meetings",
    href: "/dashboard/meetings",
    icon: CalendarDays,
  },
  {
    title: "Promo Codes",
    href: "/dashboard/promo-codes",
    icon: BadgePercent,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];
