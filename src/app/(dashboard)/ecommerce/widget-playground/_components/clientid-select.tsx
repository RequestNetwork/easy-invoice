"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";

interface ClientIdSelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function ClientIdSelect({ value, onChange }: ClientIdSelectProps) {
  const { data: clients = [], isLoading } = api.ecommerce.getAll.useQuery();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (clients.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No client IDs found - create one first" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a client ID..." />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.id} value={client.id}>
            {client.domain} - {client.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
