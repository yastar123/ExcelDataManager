import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ImportProgressModalProps {
  open: boolean;
  progress: number;
  onOpenChange: (open: boolean) => void;
}

export default function ImportProgressModal({
  open,
  progress,
  onOpenChange,
}: ImportProgressModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center p-6">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
        <div className="mt-3 text-center sm:mt-5">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Processing Import
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Please wait while we process and validate your data. This may take a moment...
            </p>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2.5 bg-gray-200" />
            <p className="text-xs text-gray-500 mt-1">
              {progress < 100
                ? `Processing data... ${progress}%`
                : "Import complete!"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
