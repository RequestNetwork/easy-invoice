import { AlertTriangle, RefreshCw } from "lucide-react";
import type { FC, ReactNode } from "react";
import { Button } from "../button";
import { Card, CardContent } from "../card";

interface ErrorStateProps {
  onRetry: () => void;
  isRetrying: boolean;
  explanation: ReactNode;
}

export const ErrorState: FC<ErrorStateProps> = ({
  onRetry,
  isRetrying,
  explanation,
}) => (
  <Card className="border border-red-100 bg-red-50/50">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-red-700 mb-6 text-center">{explanation}</p>
      <Button
        onClick={onRetry}
        disabled={isRetrying}
        variant="outline"
        className="border-red-200 text-red-700 hover:bg-red-100"
      >
        {isRetrying ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </>
        )}
      </Button>
    </CardContent>
  </Card>
);
