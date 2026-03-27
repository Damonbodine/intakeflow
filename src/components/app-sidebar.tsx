"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  ListOrdered,
  ClipboardCheck,
  UserCog,
  Bell,
  ShieldCheck,
  BarChart3,
  Search,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Programs", href: "/programs", icon: FolderKanban },
  { label: "Applications", href: "/applications", icon: FileText },
  { label: "Waitlist", href: "/waitlist", icon: ListOrdered },
  { label: "Screening", href: "/screening", icon: ClipboardCheck },
  { label: "Enrollments", href: "/enrollments", icon: GraduationCap },
  { label: "Staff", href: "/staff", icon: UserCog },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Audit Log", href: "/audit-log", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = usePathname();
  const user = useQuery(api.users.getCurrentUser);
  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    user?._id ? { userId: user._id } : "skip"
  );

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <FolderKanban className="h-6 w-6 text-sidebar-primary" />
        <span className="text-lg font-semibold text-sidebar-foreground">IntakeFlow</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link href="/notifications">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground">
            <Bell className="h-4 w-4" />
            Notifications
            {typeof unreadCount === "number" && unreadCount > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </Link>
        <Link href="/search">
          <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground">
            <Search className="h-4 w-4" />
            Search
          </Button>
        </Link>
      </div>
    </aside>
  );
}
