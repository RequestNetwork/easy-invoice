import { TableHead } from "@/components/ui/table/table";
import { cn } from "@/lib/utils";

interface TableHeadCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeadCell = ({ children, className }: TableHeadCellProps) => (
  <TableHead className={cn("text-zinc-500 font-medium", className)}>
    {children}
  </TableHead>
);
