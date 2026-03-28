import {
  BarChart3,
  BadgePercent,
  BriefcaseBusiness,
  CalendarDays,
  LayoutDashboard,
  MessageSquareMore,
  Settings,
  Users,
  Workflow,
} from "lucide-react";
export { APP_NAME } from "@backend/common/constants/app.constants";
export {
  clientStatuses,
  dealStages,
  discountTypes,
  leadSources,
  leadStatuses,
  meetingStatuses,
  roles,
  taskPriorities,
  taskStatuses,
} from "@backend/common/constants/crm.constants";

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
    title: "Chat",
    href: "/dashboard/chat",
    icon: MessageSquareMore,
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
] as const;
