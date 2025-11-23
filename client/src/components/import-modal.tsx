import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (loading: boolean) => void;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [selectedSource, setSelectedSource] = useState("");
  const [calendarName, setCalendarName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async ({ provider, name }: { provider: string; name: string }) => {
      return await apiRequest("POST", `/api/import/${provider}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendars'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Calendar imported successfully!",
      });
      onClose();
      onImport(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to import calendar. Please try again.",
        variant: "destructive",
      });
      onImport(false);
    },
  });

  const handleImport = () => {
    if (!selectedSource || !calendarName) {
      toast({
        title: "Error",
        description: "Please select a source and enter a calendar name.",
        variant: "destructive",
      });
      return;
    }

    onImport(true);
    importMutation.mutate({ provider: selectedSource, name: calendarName });
  };

  const handleClose = () => {
    setSelectedSource("");
    setCalendarName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="source">Select Source</Label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger>
                <SelectValue placeholder="Choose calendar source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Calendar</SelectItem>
                <SelectItem value="outlook">Outlook Calendar</SelectItem>
                <SelectItem value="icloud">iCloud Calendar</SelectItem>
                <SelectItem value="file">Upload iCal File</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="name">Calendar Name</Label>
            <Input
              id="name"
              value={calendarName}
              onChange={(e) => setCalendarName(e.target.value)}
              placeholder="Enter calendar name"
            />
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This will import all events from the selected calendar source.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importMutation.isPending}>
            {importMutation.isPending ? "Importing..." : "Import Calendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
