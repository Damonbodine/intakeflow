export const dynamic = 'force-dynamic';

import { NotificationList } from "@/components/notification-list";
export default function NotificationsPage() {
  return (<div><h1 className="text-2xl font-bold mb-6">Notifications</h1><NotificationList /></div>);
}
