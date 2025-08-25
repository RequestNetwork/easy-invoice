import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  itemsPerPage?: number;
}

export const Pagination = ({
  page,
  setPage,
  totalItems,
  itemsPerPage = 10,
}: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-border">
      <Button
        variant="outline"
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="text-sm"
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="text-sm"
      >
        Next
      </Button>
    </div>
  );
};
