import { getCurrentSession } from "@/server/auth";
//import { api } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function SalesPage() {
  const { user } = await getCurrentSession();

  if (!user) {
    redirect("/");
  }

  // TODO fetch sales data

  return <div>Sales Page - to be implemented</div>;
}
