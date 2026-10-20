import { redirect } from "next/navigation";
import AdminDashboard from "./dashboard";
import { getCurrentAuthUser } from "@/lib/auth-server";

export default async function AdminPage() {
  const user = await getCurrentAuthUser();
  if (!user || !user.emailVerified || user.role === "customer") {
    redirect("/login?next=%2Fadmin");
  }

  return <AdminDashboard role={user.role} name={user.name || user.email} />;
}
