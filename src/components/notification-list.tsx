"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, CheckCheck, Info, AlertTriangle, UserPlus, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  warning: AlertTriangle,
  application: FileText,
  enrollment: UserPlus,
  default: Bell,
};

const typeBadgeColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-amber-100 text-amber-800",
  application: "bg-indigo-100 text-indigo-800",
  enrollment: "bg-green-100 text-green-800",
  default: "bg-gray-100 text-gray-800",
};

export function NotificationList() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const notifications = useQuery(api.notifications.listByUser, user?._id ? { userId: user._id } : "skip");
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  if (!notifications) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const handleMarkAsRead = async (id: Id<"notifications">) => {
    try {
      await markAsRead({ id });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      if (user?._id) await markAllAsRead({ userId: user._id });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
        <p>No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
          <CheckCheck className="h-4 w-4" />
          Mark All as Read
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map((notification: any) => {
          const notifType = notification.type ?? "default";
          const IconComponent = typeIcons[notifType] ?? typeIcons.default;
          const badgeColor = typeBadgeColors[notifType] ?? typeBadgeColors.default;

          return (
            <Card
              key={notification._id}
              className={cn(
                "cursor-pointer rounded-lg transition-colors hover:bg-muted/50",
                !notification.isRead && "border-l-4 border-l-primary bg-primary/5"
              )}
              onClick={() => handleClick(notification)}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <IconComponent className="mt-0.5 h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <Badge className={cn("text-xs", badgeColor)}>
                      {notifType}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification._creationTime
                      ? new Date(notification._creationTime).toLocaleString()
                      : ""}
                  </p>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification._id);
                    }}
                    className="shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
