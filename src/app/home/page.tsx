import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DollarSign,
  FileText,
  Globe,
  Plus,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="bg-card rounded-lg p-8 border shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Welcome to Request Dashboard
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-3xl">
          Your journey to integrating seamless crypto payments starts here. This
          is a white-label application built on the power and reliability of
          Request Network.
        </p>
        <div className="mt-6">
          <Link href="/invoice/create">
            <Button className="bg-highlight hover:bg-highlight/90 text-[hsl(var(--highlight-foreground))]">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Invoice
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gradient-to-r from-highlight/10 to-blue-500/10 rounded-lg p-6 border border-highlight/20">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-7 w-7 text-highlight" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Powered by Request Network
            </h2>
            <p className="text-muted-foreground">
              A proven payment infrastructure trusted by thousands of
              businesses.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="text-center bg-card/50 backdrop-blur border-highlight/20 hover:border-highlight/40 transition-colors">
            <CardContent className="pt-6">
              <Globe className="h-8 w-8 text-highlight mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">2017</div>
              <p className="text-sm text-muted-foreground">Operating Since</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card/50 backdrop-blur border-highlight/20 hover:border-highlight/40 transition-colors">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-highlight mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">1B+</div>
              <p className="text-sm text-muted-foreground">
                Payments Processed
              </p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card/50 backdrop-blur border-highlight/20 hover:border-highlight/40 transition-colors">
            <CardContent className="pt-6">
              <DollarSign className="h-8 w-8 text-highlight mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">$30M</div>
              <p className="text-sm text-muted-foreground">Monthly Volume</p>
            </CardContent>
          </Card>
          <Card className="text-center bg-card/50 backdrop-blur border-highlight/20 hover:border-highlight/40 transition-colors">
            <CardContent className="pt-6">
              <Zap className="h-8 w-8 text-highlight mx-auto mb-2" />
              <div className="text-3xl font-bold text-foreground">20K</div>
              <p className="text-sm text-muted-foreground">
                Transactions/Month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg hover:shadow-highlight/20 transition-all border-highlight/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-highlight" />
              Create Invoice
            </CardTitle>
            <CardDescription>
              Generate a new invoice for your clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoice/create">
              <Button className="w-full bg-highlight hover:bg-highlight/90 text-highlight-foreground">
                Create New Invoice
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:shadow-highlight/20 transition-all border-highlight/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-highlight" />
              View Invoices
            </CardTitle>
            <CardDescription>
              Manage and track all your invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/invoice">
              <Button
                variant="outline"
                className="w-full border-highlight/30 hover:bg-highlight/10"
              >
                View All Invoices
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:shadow-highlight/20 transition-all border-highlight/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-highlight" />
              Payments
            </CardTitle>
            <CardDescription>Track payments and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/payments">
              <Button
                variant="outline"
                className="w-full border-highlight/30 hover:bg-highlight/10"
              >
                Manage Payments
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
