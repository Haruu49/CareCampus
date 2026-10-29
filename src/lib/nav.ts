import { BarChart3, CalendarDays, LayoutDashboard, Settings, Users, type LucideIcon } from "lucide-react";
import type { Role } from "./mock/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  title: string;
  /** Roles that see this item. Step 1 shows everything; a later step filters by role and enforces it server-side. */
  roles: Role[];
}

const ALL: Role[] = ["counsellor", "admin", "advisor", "frontdesk"];

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard", roles: ALL },
  { href: "/caseload", label: "Caseload", icon: Users, title: "Caseload", roles: ALL },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, title: "Calendar", roles: ALL },
  { href: "/reports", label: "Reports", icon: BarChart3, title: "Reports", roles: ALL },
  { href: "/settings", label: "Settings", icon: Settings, title: "Settings", roles: ALL },
];
