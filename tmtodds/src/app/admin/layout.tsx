import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getSessionProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-bg-primary text-text-primary font-archivo">
      {children}
    </div>
  );
}
