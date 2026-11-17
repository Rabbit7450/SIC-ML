import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function AccessDenied({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle="Esta vista no está en tu rol" />
      <div className="space-y-4 p-6">
        <EmptyState title="Sin acceso" description={description} />
        <div className="flex justify-center">
          <Link href="/dashboard">
            <Button variant="outline">Volver al dashboard</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
