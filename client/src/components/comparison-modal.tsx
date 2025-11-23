import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Mail } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";
import type { CalendarConnection, Event } from "@shared/schema";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: CalendarConnection[];
  events: Event[];
}

export function ComparisonModal({ 
  isOpen, 
  onClose, 
  connections, 
  events 
}: ComparisonModalProps) {
  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <SiGoogle className="text-red-500" />;
      case 'outlook':
        return <Mail className="text-blue-600" />;
      case 'icloud':
        return <SiApple className="text-gray-700" />;
      default:
        return null;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'bg-blue-500';
      case 'outlook':
        return 'bg-orange-500';
      case 'icloud':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEventsByProvider = (provider: string) => {
    // For demo purposes, return sample events
    const sampleEvents = {
      google: [
        { id: 1, title: "Team Meeting", time: "9:00 AM", date: "March 1, 2024" },
        { id: 2, title: "Lunch Meeting", time: "12:00 PM", date: "March 3, 2024" }
      ],
      outlook: [
        { id: 3, title: "Client Call", time: "12:30 PM", date: "March 3, 2024" },
      ]
    };
    
    return sampleEvents[provider as keyof typeof sampleEvents] || [];
  };

  const checkConflicts = () => {
    // Simple conflict detection for demo
    const googleEvents = getEventsByProvider('google');
    const outlookEvents = getEventsByProvider('outlook');
    
    const conflicts = [];
    
    // Check if Lunch Meeting and Client Call overlap
    const lunchMeeting = googleEvents.find(e => e.title === "Lunch Meeting");
    const clientCall = outlookEvents.find(e => e.title === "Client Call");
    
    if (lunchMeeting && clientCall && lunchMeeting.date === clientCall.date) {
      conflicts.push({
        event1: lunchMeeting,
        event2: clientCall,
        type: 'Time Overlap'
      });
    }
    
    return conflicts;
  };

  const conflicts = checkConflicts();
  const connectedProviders = connections.filter(c => c.isConnected);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl h-5/6">
        <DialogHeader>
          <DialogTitle>Calendar Comparison</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {connectedProviders.slice(0, 2).map((connection) => (
            <div key={connection.id} className="border border-gray-200 rounded-lg p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 capitalize">
                  {connection.provider} Calendar
                </h4>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${getProviderColor(connection.provider)}`} />
                  <span className="text-sm text-gray-500">{connection.email}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {getEventsByProvider(connection.provider).map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-md border-l-4 ${
                      connection.provider === 'google' 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'bg-orange-50 border-orange-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${
                        connection.provider === 'google' 
                          ? 'text-blue-900' 
                          : 'text-orange-900'
                      }`}>
                        {event.title}
                      </span>
                      <span className={`text-xs ${
                        connection.provider === 'google' 
                          ? 'text-blue-700' 
                          : 'text-orange-700'
                      }`}>
                        {event.time}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      connection.provider === 'google' 
                        ? 'text-blue-600' 
                        : 'text-orange-600'
                    }`}>
                      {event.date}
                    </p>
                  </div>
                ))}
                
                {conflicts.length > 0 && connection.provider === 'outlook' && (
                  <div className="p-3 bg-red-50 rounded-md border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-red-900">
                        CONFLICT DETECTED
                      </span>
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Overlaps with Lunch Meeting
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {conflicts.length > 0 && (
            <Button>
              Resolve Conflicts
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
