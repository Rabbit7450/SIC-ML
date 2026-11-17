import { Sidebar } from "@/components/layout/sidebar";
import { getAppRole } from "@/lib/current-role";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = await getAppRole();
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar role={role} />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
