export const dynamic = 'force-dynamic';

import { AuditLogTable } from "@/components/audit-log-table";
export default function AuditLogPage() {
  return (<div><h1 className="text-2xl font-bold mb-6">Audit Log</h1><AuditLogTable /></div>);
}
