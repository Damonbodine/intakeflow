export const dynamic = 'force-dynamic';

import { ProgramCardGrid } from "@/components/program-card-grid";

export default function ProgramsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Programs</h1>
      <ProgramCardGrid />
    </div>
  );
}
