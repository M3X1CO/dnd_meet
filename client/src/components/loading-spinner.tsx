import { Loader2 } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-4" />
        <span className="text-gray-700">Importing calendar...</span>
      </div>
    </div>
  );
}
