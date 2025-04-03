import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { BankAccountsSection } from "../../components/bank-accounts-section";

export default async function AccountPage() {
  const session = await getCurrentSession();

  if (!session.user) {
    redirect("/auth/signin");
  }

  return (
    <>
      <Header user={session.user} />
      <main className="flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>

        <Tabs defaultValue="payment-details">
          <TabsList className="mb-6">
            <TabsTrigger value="payment-details">Payment Details</TabsTrigger>
          </TabsList>

          <TabsContent value="payment-details">
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>
                  Manage your bank account details for receiving payments from
                  crypto to fiat invoices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BankAccountsSection user={session.user} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </>
  );
}
