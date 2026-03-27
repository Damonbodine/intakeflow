"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ReactNode } from "react";

export function RoleGuard({ allowedRoles, children, fallback }: {
  allowedRoles: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const user = useQuery(api.users.getCurrentUser);
  if (user === undefined) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : <div className="p-8 text-center text-muted-foreground">You do not have permission to view this page.</div>;
  }
  return <>{children}</>;
}