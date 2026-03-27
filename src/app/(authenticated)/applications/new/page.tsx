export const dynamic = 'force-dynamic';

import { ApplicationForm } from "@/components/application-form";

export default function NewApplicationPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Submit Application</h1>
      <ApplicationForm />
    </div>
  );
}
