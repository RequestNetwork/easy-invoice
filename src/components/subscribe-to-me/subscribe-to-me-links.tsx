"use client";

import { Button } from "@/components/ui/button";
import type { SubscribeToMe } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CreateSubscriptionLink } from "./blocks/create-subscription-link";
import { SubscribeToMeLink } from "./blocks/subscribe-to-me-link";

interface SubscribeToMeLinksProps {
  initialSubscribeToMeLinks: SubscribeToMe[];
}

export function SubscribeToMeLinks({
  initialSubscribeToMeLinks,
}: SubscribeToMeLinksProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: subscribeToMeLinks } = api.subscribeToMe.getAll.useQuery(
    undefined,
    {
      initialData: initialSubscribeToMeLinks,
      refetchOnMount: true,
    },
  );

  return (
    <main className="flex-grow flex flex-col max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8 gap-8">
        <div className="flex items-center ">
          <Link
            href="/dashboard"
            className="text-zinc-600 hover:text-black transition-colors mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Subscribe to me</h1>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-black text-white hover:bg-zinc-800 rounded-md px-4 py-2 text-sm font-medium"
        >
          + New Template
        </Button>
      </div>

      <div className="space-y-4">
        {subscribeToMeLinks.map((link) => (
          <SubscribeToMeLink key={link.id} link={link} />
        ))}
      </div>
      {isCreateModalOpen && (
        <CreateSubscriptionLink onClose={() => setIsCreateModalOpen(false)} />
      )}
    </main>
  );
}
