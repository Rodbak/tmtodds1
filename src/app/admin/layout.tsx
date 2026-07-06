import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/session";

// Every /admin/* route is covered by this one server-side check --
// there's no client-side "if admin" branch to accidentally get wrong
// on a page added later, since a non-admin never gets HTML for any
// page under here in the first place.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAdmin();
  if (!access.ok) redirect("/");

  return <div className="min-h-dvh bg-bg-primary text-text-primary font-archivo">{children}</div>;
}
