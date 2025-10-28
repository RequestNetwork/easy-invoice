import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const { user } = await getCurrentSession();
  if (!user) redirect("/signin");
  return user;
}
