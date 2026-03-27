export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
export default function ReportsPage() {
  return (<div><h1 className="text-2xl font-bold mb-6">Reports</h1>
    <div className="grid grid-cols-3 gap-6">
      <Link href="/reports/utilization"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader><CardTitle>Utilization</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Program capacity and enrollment rates</p></CardContent></Card></Link>
      <Link href="/reports/demographics"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader><CardTitle>Demographics</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Client demographic breakdowns</p></CardContent></Card></Link>
      <Link href="/reports/intake-volume"><Card className="hover:shadow-md transition-shadow cursor-pointer"><CardHeader><CardTitle>Intake Volume</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Application trends over time</p></CardContent></Card></Link>
    </div>
  </div>);
}
