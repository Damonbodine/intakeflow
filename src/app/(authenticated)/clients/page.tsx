export const dynamic = 'force-dynamic';

import { ClientDataTable } from "@/components/client-data-table";

export default function ClientsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clients</h1>
      <ClientDataTable />
    </div>
  );
}
