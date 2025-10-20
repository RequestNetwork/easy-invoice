import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const { user } = await getCurrentSession();

  if (user) {
    return redirect("/home");
  }

  return redirect("/signin");
}
