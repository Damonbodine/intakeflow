export const dynamic = 'force-dynamic';

import { EnrollmentDataTable } from "@/components/enrollment-data-table";
export default function EnrollmentsPage() {
  return (<div><h1 className="text-2xl font-bold mb-6">Enrollments</h1><EnrollmentDataTable /></div>);
}
