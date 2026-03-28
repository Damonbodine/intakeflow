export const dynamic = 'force-dynamic';

import { EnrollmentDataTable } from "@/components/enrollment-data-table";
export default function EnrollmentsPage() {
  return (
    <div data-demo="enrollments-workspace">
      <h1 className="mb-6 text-2xl font-bold">Enrollments</h1>
      <EnrollmentDataTable />
    </div>
  );
}
