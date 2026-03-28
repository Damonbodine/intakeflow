import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DemoMode } from "@/components/demo-mode";

export const dynamic = 'force-dynamic';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          {children}
          <DemoMode />
        </main>
      </div>
    </SidebarProvider>
  );
}
