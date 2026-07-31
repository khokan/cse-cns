import { AlertCircle, FileX, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: "inbox" | "file" | "alert" | React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ICONS = {
  inbox: Inbox,
  file: FileX,
  alert: AlertCircle,
};

/**
 * Display empty state when no data is available
 * 
 * Usage:
 * <EmptyState
 *   title="No reports found"
 *   description="Create your first report to get started"
 *   icon="file"
 *   action={{
 *     label: "Create Report",
 *     onClick: () => setShowCreate(true)
 *   }}
 * />
 */
export function EmptyState({
  title = "No data found",
  description = "There are no items to display.",
  icon = "inbox",
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const IconComponent =
    typeof icon === "string" ? ICONS[icon as keyof typeof ICONS] : icon;

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 gap-4 text-center ${className}`}
      role="status"
      aria-label="No data available"
    >
      {typeof IconComponent === "function" && (
        <IconComponent className="w-16 h-16 text-gray-300" aria-hidden="true" />
      )}

      <div className="max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {title}
        </h3>
        <p className="text-gray-500 text-sm mb-6">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="flex gap-3 justify-center flex-wrap">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || "default"}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
